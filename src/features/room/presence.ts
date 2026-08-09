import { z } from 'zod'

import type { Participant } from '../../domain/room/types'
import type { RoomSession } from '../identity/room-session'

const presencePayloadSchema = z
  .object({
    participantId: z.string().min(1).max(128),
    displayName: z.string().trim().min(1).max(80),
    role: z.enum(['host', 'participant']),
    joinedAt: z.number().int().nonnegative(),
  })
  .passthrough()

export interface PresencePayload {
  participantId: string
  displayName: string
  role: RoomSession['role']
  joinedAt: number
}

export function createPresencePayload(session: RoomSession): PresencePayload {
  return {
    participantId: session.participantId,
    displayName: session.displayName,
    role: session.role,
    joinedAt: session.joinedAt,
  }
}

export function parsePresenceState(state: unknown): Participant[] {
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    return []
  }

  const participantsById = new Map<string, Participant>()

  for (const presences of Object.values(state)) {
    if (!Array.isArray(presences)) {
      continue
    }

    for (const presence of presences) {
      const result = presencePayloadSchema.safeParse(presence)

      if (!result.success) {
        continue
      }

      const existingParticipant = participantsById.get(result.data.participantId)
      const participant: Participant = {
        id: result.data.participantId,
        name: result.data.displayName,
        role: result.data.role,
        joinedAt: result.data.joinedAt,
        isOnline: true,
      }

      if (!existingParticipant || participant.joinedAt < existingParticipant.joinedAt) {
        participantsById.set(participant.id, participant)
      }
    }
  }

  return [...participantsById.values()].sort(
    (left, right) => left.joinedAt - right.joinedAt || left.name.localeCompare(right.name),
  )
}
