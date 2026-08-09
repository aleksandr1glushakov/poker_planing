import { describe, expect, it } from 'vitest'

import { createInitialRoomState, createRoomSnapshot, roomReducer } from './state'
import type { Participant, RoomState } from './types'

const host: Participant = {
  id: 'host-1',
  name: 'QA Lead',
  role: 'host',
  joinedAt: 1,
  isOnline: true,
}

const estimator: Participant = {
  id: 'user-1',
  name: 'Developer',
  role: 'participant',
  joinedAt: 2,
  isOnline: true,
}

function createRoomWithEstimator(): RoomState {
  const initialState = createInitialRoomState({ roomId: 'room-1', host })

  return roomReducer(initialState, {
    type: 'participant_upserted',
    participant: estimator,
  })
}

describe('roomReducer', () => {
  it('runs a complete estimation round and adds its result to history', () => {
    let state = createRoomWithEstimator()

    state = roomReducer(state, {
      type: 'task_set',
      actorId: host.id,
      task: { id: 'BUG-42', title: 'Checkout fails' },
    })
    state = roomReducer(state, { type: 'voting_started', actorId: host.id })
    state = roomReducer(state, {
      type: 'vote_submitted',
      participantId: estimator.id,
      estimate: 8,
      submittedAt: 10,
    })
    state = roomReducer(state, { type: 'votes_revealed', actorId: host.id })
    state = roomReducer(state, {
      type: 'estimate_approved',
      actorId: host.id,
      estimate: 8,
      completedAt: 20,
    })

    expect(state.phase).toBe('approved')
    expect(state.approvedEstimate).toBe(8)
    expect(state.history).toHaveLength(1)
    expect(state.history[0]).toMatchObject({
      task: { id: 'BUG-42' },
      approvedEstimate: 8,
      statistics: { median: 8, totalVoteCount: 1 },
    })
  })

  it('ignores invalid phase transitions and non-host commands', () => {
    const initialState = createRoomWithEstimator()

    const startedWithoutTask = roomReducer(initialState, {
      type: 'voting_started',
      actorId: host.id,
    })
    const taskSetByParticipant = roomReducer(initialState, {
      type: 'task_set',
      actorId: estimator.id,
      task: { id: 'BUG-42', title: 'Checkout fails' },
    })

    expect(startedWithoutTask).toBe(initialState)
    expect(taskSetByParticipant).toBe(initialState)
  })

  it('does not accept a vote from the host', () => {
    let state = createRoomWithEstimator()
    state = roomReducer(state, {
      type: 'task_set',
      actorId: host.id,
      task: { id: 'BUG-42', title: 'Checkout fails' },
    })
    state = roomReducer(state, { type: 'voting_started', actorId: host.id })

    const afterHostVote = roomReducer(state, {
      type: 'vote_submitted',
      participantId: host.id,
      estimate: 4,
      submittedAt: 10,
    })

    expect(afterHostVote).toBe(state)
    expect(afterHostVote.votes).toEqual({})
  })

  it('keeps an existing participant offline instead of deleting them', () => {
    const state = createRoomWithEstimator()
    const disconnected = roomReducer(state, {
      type: 'participant_disconnected',
      participantId: estimator.id,
    })

    expect(disconnected.participants).toContainEqual({
      ...estimator,
      isOnline: false,
    })
  })
})

describe('createRoomSnapshot', () => {
  it('hides estimates while exposing voting status before reveal', () => {
    let state = createRoomWithEstimator()
    state = roomReducer(state, {
      type: 'task_set',
      actorId: host.id,
      task: { id: 'BUG-42', title: 'Checkout fails' },
    })
    state = roomReducer(state, { type: 'voting_started', actorId: host.id })
    state = roomReducer(state, {
      type: 'vote_submitted',
      participantId: estimator.id,
      estimate: 12,
      submittedAt: 10,
    })

    expect(createRoomSnapshot(state)).toMatchObject({
      phase: 'voting',
      voteStatuses: [{ participantId: estimator.id, hasVoted: true }],
      revealedVotes: null,
    })

    const revealed = roomReducer(state, {
      type: 'votes_revealed',
      actorId: host.id,
    })

    expect(createRoomSnapshot(revealed).revealedVotes).toEqual([
      {
        participantId: estimator.id,
        estimate: 12,
        submittedAt: 10,
      },
    ])
  })
})
