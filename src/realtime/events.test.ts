import { describe, expect, it } from 'vitest'

import type { RoomSnapshot } from '../domain/room/types'
import {
  createRequestStateEvent,
  createRoomStateEvent,
  isAuthoritativeRoomStateEvent,
  parseRealtimeEvent,
  realtimeEventSchema,
} from './events'

const baseEvent = {
  eventId: 'event-1',
  roomId: 'room-1',
  senderId: 'user-1',
  sentAt: 10,
}

const snapshot: RoomSnapshot = {
  roomId: 'room-1',
  hostId: 'user-1',
  phase: 'lobby',
  currentTask: null,
  participants: [
    {
      id: 'user-1',
      name: 'Alex Host',
      role: 'host',
      joinedAt: 1,
      isOnline: true,
    },
  ],
  voteStatuses: [],
  revealedVotes: null,
  approvedEstimate: null,
  history: [],
  revision: 0,
}

describe('realtimeEventSchema', () => {
  it('parses a supported event as a discriminated union member', () => {
    expect(
      realtimeEventSchema.parse({
        ...baseEvent,
        type: 'vote_submitted',
        estimate: 8,
      }),
    ).toMatchObject({ type: 'vote_submitted', estimate: 8 })
  })

  it('rejects unsupported voting values and extra properties', () => {
    expect(
      realtimeEventSchema.safeParse({
        ...baseEvent,
        type: 'vote_submitted',
        estimate: 10,
      }).success,
    ).toBe(false)

    expect(
      realtimeEventSchema.safeParse({
        ...baseEvent,
        type: 'request_state',
        unexpected: true,
      }).success,
    ).toBe(false)
  })

  it('accepts a custom positive final estimate from the host', () => {
    expect(
      realtimeEventSchema.safeParse({
        ...baseEvent,
        type: 'estimate_approved',
        estimate: 10,
      }).success,
    ).toBe(true)
  })

  it('returns null for malformed external payloads', () => {
    expect(parseRealtimeEvent({ type: 'not-supported' })).toBeNull()
    expect(parseRealtimeEvent(null)).toBeNull()
  })

  it('creates state request and response events', () => {
    const request = createRequestStateEvent({
      roomId: 'room-1',
      senderId: 'user-2',
    })
    const response = createRoomStateEvent(
      { roomId: 'room-1', senderId: 'user-1' },
      snapshot,
    )

    expect(request).toMatchObject({
      type: 'request_state',
      roomId: 'room-1',
      senderId: 'user-2',
    })
    expect(response).toMatchObject({
      type: 'room_state',
      roomId: 'room-1',
      senderId: 'user-1',
      snapshot,
    })
    expect(request.eventId.length).toBeGreaterThan(0)
    expect(response.eventId.length).toBeGreaterThan(0)
  })

  it('accepts room state only from the host declared by the snapshot', () => {
    const hostEvent = createRoomStateEvent(
      { roomId: 'room-1', senderId: 'user-1' },
      snapshot,
    )
    const forgedEvent = createRoomStateEvent(
      { roomId: 'room-1', senderId: 'user-2' },
      snapshot,
    )

    expect(isAuthoritativeRoomStateEvent(hostEvent)).toBe(true)
    expect(isAuthoritativeRoomStateEvent(forgedEvent)).toBe(false)
  })
})
