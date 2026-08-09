import { describe, expect, it } from 'vitest'

import { parseRealtimeEvent, realtimeEventSchema } from './events'

const baseEvent = {
  eventId: 'event-1',
  roomId: 'room-1',
  senderId: 'user-1',
  sentAt: 10,
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
})
