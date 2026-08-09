import { beforeEach, describe, expect, it } from 'vitest'

import type { Participant } from '../../domain/room/types'
import type { RoomSession } from '../identity/room-session'
import {
  createHostRoomState,
  getHostRoomState,
  saveHostRoomState,
  synchronizeRoomParticipants,
} from './host-room-state'

const hostSession: RoomSession = {
  roomId: 'room-1',
  participantId: 'host-1',
  displayName: 'Alex Host',
  role: 'host',
  joinedAt: 10,
}

describe('host room state', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('creates, persists, and restores authoritative state', () => {
    const state = {
      ...createHostRoomState('room-1', hostSession),
      revision: 4,
    }

    saveHostRoomState(state)

    expect(getHostRoomState('room-1', hostSession)).toMatchObject({
      roomId: 'room-1',
      hostId: 'host-1',
      phase: 'lobby',
      revision: 4,
    })
  })

  it('ignores state belonging to a different host', () => {
    const state = createHostRoomState('room-1', hostSession)
    saveHostRoomState({ ...state, hostId: 'another-host', revision: 10 })

    expect(getHostRoomState('room-1', hostSession)).toMatchObject({
      hostId: 'host-1',
      revision: 0,
    })
  })

  it('updates the live roster once and preserves the revision when unchanged', () => {
    const initialState = createHostRoomState('room-1', hostSession)
    const participant: Participant = {
      id: 'participant-1',
      name: 'Sam',
      role: 'participant',
      joinedAt: 20,
      isOnline: true,
    }

    const synchronizedState = synchronizeRoomParticipants(initialState, [
      initialState.participants[0],
      participant,
    ])

    expect(synchronizedState.revision).toBe(1)
    expect(synchronizeRoomParticipants(synchronizedState, synchronizedState.participants)).toBe(
      synchronizedState,
    )
  })
})
