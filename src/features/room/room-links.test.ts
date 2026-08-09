import { describe, expect, it, vi } from 'vitest'

import { createInviteUrl, createRoomId, extractRoomId, isValidRoomId } from './room-links'

const roomId = '11111111-1111-4111-8111-111111111111'

describe('room links', () => {
  it('creates room identifiers through Web Crypto', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(roomId)

    expect(createRoomId()).toBe(roomId)
  })

  it('accepts a room id or invite URL', () => {
    expect(isValidRoomId(roomId)).toBe(true)
    expect(extractRoomId(roomId)).toBe(roomId)
    expect(extractRoomId(`https://example.com/room/${roomId}`)).toBe(roomId)
    expect(extractRoomId(`/room/${roomId}`)).toBe(roomId)
  })

  it('rejects malformed room references', () => {
    expect(extractRoomId('not-a-room')).toBeNull()
    expect(extractRoomId(`https://example.com/team/${roomId}`)).toBeNull()
  })

  it('creates an invite URL for the current room', () => {
    expect(createInviteUrl(roomId, 'https://example.com')).toBe(
      `https://example.com/room/${roomId}`,
    )
  })
})
