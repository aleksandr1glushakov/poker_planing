import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createRoomSession,
  getRememberedDisplayName,
  getRoomSession,
  isValidDisplayName,
  normalizeDisplayName,
} from './room-session'

describe('room session', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('creates and restores an identity for a specific room', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(
      '22222222-2222-4222-8222-222222222222',
    )

    const created = createRoomSession({
      roomId: '11111111-1111-4111-8111-111111111111',
      displayName: '  Alex   Developer ',
      role: 'host',
    })

    expect(created).toMatchObject({
      participantId: '22222222-2222-4222-8222-222222222222',
      displayName: 'Alex Developer',
      role: 'host',
    })
    expect(typeof created.joinedAt).toBe('number')
    expect(getRoomSession(created.roomId)).toEqual(created)
    expect(getRememberedDisplayName()).toBe('Alex Developer')
  })

  it('discards malformed stored state', () => {
    const roomId = '11111111-1111-4111-8111-111111111111'
    sessionStorage.setItem(`poker-planning:room:${roomId}`, '{broken')

    expect(getRoomSession(roomId)).toBeNull()
    expect(sessionStorage.getItem(`poker-planning:room:${roomId}`)).toBeNull()
  })

  it('normalizes and validates display names', () => {
    expect(normalizeDisplayName('  Alex   Developer ')).toBe('Alex Developer')
    expect(isValidDisplayName('  ')).toBe(false)
    expect(isValidDisplayName('Alex')).toBe(true)
    expect(isValidDisplayName('a'.repeat(81))).toBe(false)
  })
})
