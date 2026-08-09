import { calculateRoundStatistics } from '../voting/statistics'
import type {
  CurrentTask,
  Estimate,
  Participant,
  RoomSnapshot,
  RoomState,
} from './types'

export type RoomAction =
  | { type: 'participant_upserted'; participant: Participant }
  | { type: 'participant_disconnected'; participantId: string }
  | { type: 'task_set'; actorId: string; task: CurrentTask }
  | { type: 'voting_started'; actorId: string }
  | {
      type: 'vote_submitted'
      participantId: string
      estimate: Estimate
      submittedAt: number
    }
  | { type: 'votes_revealed'; actorId: string }
  | {
      type: 'estimate_approved'
      actorId: string
      estimate: number
      completedAt: number
    }

interface CreateRoomStateInput {
  roomId: string
  host: Participant
}

export function createInitialRoomState({
  roomId,
  host,
}: CreateRoomStateInput): RoomState {
  if (host.role !== 'host') {
    throw new Error('The initial participant must have the host role')
  }

  return {
    roomId,
    hostId: host.id,
    phase: 'lobby',
    currentTask: null,
    participants: [host],
    votes: {},
    approvedEstimate: null,
    history: [],
    revision: 0,
  }
}

export function roomReducer(state: RoomState, action: RoomAction): RoomState {
  switch (action.type) {
    case 'participant_upserted': {
      const participantIndex = state.participants.findIndex(
        (participant) => participant.id === action.participant.id,
      )
      const participants = [...state.participants]

      if (participantIndex === -1) {
        participants.push(action.participant)
      } else {
        participants[participantIndex] = action.participant
      }

      return withRevision(state, { participants })
    }

    case 'participant_disconnected': {
      const participant = state.participants.find(
        (candidate) => candidate.id === action.participantId,
      )

      if (!participant || !participant.isOnline) {
        return state
      }

      return withRevision(state, {
        participants: state.participants.map((candidate) =>
          candidate.id === action.participantId
            ? { ...candidate, isOnline: false }
            : candidate,
        ),
      })
    }

    case 'task_set': {
      if (
        !isHostAction(state, action.actorId) ||
        !['lobby', 'discussion', 'approved'].includes(state.phase)
      ) {
        return state
      }

      return withRevision(state, {
        phase: 'discussion',
        currentTask: action.task,
        votes: {},
        approvedEstimate: null,
      })
    }

    case 'voting_started': {
      if (
        !isHostAction(state, action.actorId) ||
        !state.currentTask ||
        !['discussion', 'revealed'].includes(state.phase)
      ) {
        return state
      }

      return withRevision(state, {
        phase: 'voting',
        votes: {},
        approvedEstimate: null,
      })
    }

    case 'vote_submitted': {
      if (state.phase !== 'voting') {
        return state
      }

      const participant = state.participants.find(
        (candidate) => candidate.id === action.participantId,
      )

      if (!participant || participant.role !== 'participant') {
        return state
      }

      return withRevision(state, {
        votes: {
          ...state.votes,
          [action.participantId]: {
            participantId: action.participantId,
            estimate: action.estimate,
            submittedAt: action.submittedAt,
          },
        },
      })
    }

    case 'votes_revealed': {
      if (!isHostAction(state, action.actorId) || state.phase !== 'voting') {
        return state
      }

      return withRevision(state, { phase: 'revealed' })
    }

    case 'estimate_approved': {
      if (
        !isHostAction(state, action.actorId) ||
        state.phase !== 'revealed' ||
        !state.currentTask ||
        !Number.isFinite(action.estimate) ||
        action.estimate <= 0
      ) {
        return state
      }

      const statistics = calculateRoundStatistics(
        Object.values(state.votes).map((vote) => vote.estimate),
      )

      return withRevision(state, {
        phase: 'approved',
        approvedEstimate: action.estimate,
        history: [
          ...state.history,
          {
            task: state.currentTask,
            approvedEstimate: action.estimate,
            statistics,
            completedAt: action.completedAt,
          },
        ],
      })
    }
  }
}

export function createRoomSnapshot(state: RoomState): RoomSnapshot {
  const canRevealVotes = ['revealed', 'approved'].includes(state.phase)

  return {
    roomId: state.roomId,
    hostId: state.hostId,
    phase: state.phase,
    currentTask: state.currentTask,
    participants: state.participants,
    voteStatuses: state.participants
      .filter((participant) => participant.role === 'participant')
      .map((participant) => ({
        participantId: participant.id,
        hasVoted: Boolean(state.votes[participant.id]),
      })),
    revealedVotes: canRevealVotes ? Object.values(state.votes) : null,
    approvedEstimate: state.approvedEstimate,
    history: state.history,
    revision: state.revision,
  }
}

function isHostAction(state: RoomState, actorId: string): boolean {
  return state.hostId === actorId
}

function withRevision(
  state: RoomState,
  update: Partial<Omit<RoomState, 'roomId' | 'hostId' | 'revision'>>,
): RoomState {
  return {
    ...state,
    ...update,
    revision: state.revision + 1,
  }
}
