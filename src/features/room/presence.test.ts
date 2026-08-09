import { describe, expect, it } from 'vitest'

import { createPresencePayload, parsePresenceState } from './presence'

describe('room presence', () => {
  it('creates a minimal public payload from a room session', () => {
    expect(
      createPresencePayload({
        roomId: 'room-1',
        participantId: 'user-1',
        displayName: 'Alex',
        role: 'participant',
        joinedAt: 10,
      }),
    ).toEqual({
      participantId: 'user-1',
      displayName: 'Alex',
      role: 'participant',
      joinedAt: 10,
    })
  })

  it('parses, sorts, and deduplicates Supabase presence state', () => {
    expect(
      parsePresenceState({
        'user-2': [
          {
            participantId: 'user-2',
            displayName: 'Sam',
            role: 'participant',
            joinedAt: 20,
            presence_ref: 'ref-2',
          },
        ],
        'user-1': [
          {
            participantId: 'user-1',
            displayName: 'Alex',
            role: 'host',
            joinedAt: 10,
            presence_ref: 'ref-1',
          },
          {
            participantId: 'user-1',
            displayName: 'Alex duplicate tab',
            role: 'host',
            joinedAt: 11,
            presence_ref: 'ref-3',
          },
        ],
      }),
    ).toEqual([
      {
        id: 'user-1',
        name: 'Alex',
        role: 'host',
        joinedAt: 10,
        isOnline: true,
      },
      {
        id: 'user-2',
        name: 'Sam',
        role: 'participant',
        joinedAt: 20,
        isOnline: true,
      },
    ])
  })

  it('ignores malformed presence entries', () => {
    expect(parsePresenceState({ broken: [{ displayName: 'Missing id' }] })).toEqual([])
    expect(parsePresenceState(null)).toEqual([])
  })
})
