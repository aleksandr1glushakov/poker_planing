import {
  createInitialRoomState,
  createRoomSnapshot,
} from '../../domain/room/state'
import type {
  Participant,
  RoomSnapshot,
  RoomState,
} from '../../domain/room/types'
import { roomStateSchema } from '../../realtime/events'
import type { RoomSession } from '../identity/room-session'

const HOST_STATE_KEY_PREFIX = 'poker-planning:host-state:'

export function createHostRoomState(
  roomId: string,
  session: RoomSession,
): RoomState {
  if (session.role !== 'host') {
    throw new Error('Only a host session can create authoritative room state')
  }

  return createInitialRoomState({
    roomId,
    host: participantFromSession(session),
  })
}

export function getHostRoomState(
  roomId: string,
  session: RoomSession,
): RoomState {
  if (session.role !== 'host') {
    throw new Error('Only a host session can restore authoritative room state')
  }

  const storageKey = getHostStateStorageKey(roomId)
  const storedState = sessionStorage.getItem(storageKey)

  if (!storedState) {
    return createHostRoomState(roomId, session)
  }

  try {
    const parsedState = roomStateSchema.safeParse(JSON.parse(storedState))

    if (
      !parsedState.success ||
      parsedState.data.roomId !== roomId ||
      parsedState.data.hostId !== session.participantId
    ) {
      sessionStorage.removeItem(storageKey)
      return createHostRoomState(roomId, session)
    }

    return synchronizeRoomParticipants(parsedState.data, [
      participantFromSession(session),
    ])
  } catch {
    sessionStorage.removeItem(storageKey)
    return createHostRoomState(roomId, session)
  }
}

export function saveHostRoomState(state: RoomState): void {
  sessionStorage.setItem(
    getHostStateStorageKey(state.roomId),
    JSON.stringify(state),
  )
}

export function synchronizeRoomParticipants(
  state: RoomState,
  participants: Participant[],
): RoomState {
  const normalizedParticipants = [...participants].sort(compareParticipants)
  const currentParticipants = [...state.participants].sort(compareParticipants)

  if (
    JSON.stringify(currentParticipants) === JSON.stringify(normalizedParticipants)
  ) {
    return state
  }

  return {
    ...state,
    participants: normalizedParticipants,
    revision: state.revision + 1,
  }
}

export function getPublicRoomSnapshot(state: RoomState): RoomSnapshot {
  return createRoomSnapshot(state)
}

function getHostStateStorageKey(roomId: string): string {
  return `${HOST_STATE_KEY_PREFIX}${roomId}`
}

function participantFromSession(session: RoomSession): Participant {
  return {
    id: session.participantId,
    name: session.displayName,
    role: session.role,
    joinedAt: session.joinedAt,
    isOnline: true,
  }
}

function compareParticipants(left: Participant, right: Participant): number {
  return left.joinedAt - right.joinedAt || left.id.localeCompare(right.id)
}
