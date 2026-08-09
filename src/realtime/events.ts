import { z } from 'zod'

import type { RoomSnapshot } from '../domain/room/types'

const identifierSchema = z.string().trim().min(1).max(128)
const timestampSchema = z.number().int().nonnegative()

export const estimateSchema = z.union([
  z.literal(0.5),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(6),
  z.literal(8),
  z.literal(12),
  z.literal(16),
  z.literal(24),
  z.literal(32),
  z.literal(40),
  z.literal('?'),
])

export const participantSchema = z
  .object({
    id: identifierSchema,
    name: z.string().trim().min(1).max(80),
    role: z.enum(['host', 'participant']),
    joinedAt: timestampSchema,
    isOnline: z.boolean(),
  })
  .strict()

export const currentTaskSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    title: z.string().trim().min(1).max(300),
    jiraUrl: z.url().optional(),
  })
  .strict()

export const voteSchema = z
  .object({
    participantId: identifierSchema,
    estimate: estimateSchema,
    submittedAt: timestampSchema,
  })
  .strict()

export const roundStatisticsSchema = z
  .object({
    min: z.number().nullable(),
    max: z.number().nullable(),
    average: z.number().nullable(),
    median: z.number().nullable(),
    numericVoteCount: z.number().int().nonnegative(),
    unknownVoteCount: z.number().int().nonnegative(),
    totalVoteCount: z.number().int().nonnegative(),
  })
  .strict()

export const historyItemSchema = z
  .object({
    task: currentTaskSchema,
    approvedEstimate: z.number().positive().finite(),
    statistics: roundStatisticsSchema,
    completedAt: timestampSchema,
  })
  .strict()

export const roomSnapshotSchema: z.ZodType<RoomSnapshot> = z
  .object({
    roomId: identifierSchema,
    hostId: identifierSchema,
    phase: z.enum(['lobby', 'discussion', 'voting', 'revealed', 'approved']),
    currentTask: currentTaskSchema.nullable(),
    participants: z.array(participantSchema).max(30),
    voteStatuses: z
      .array(
        z
          .object({
            participantId: identifierSchema,
            hasVoted: z.boolean(),
          })
          .strict(),
      )
      .max(30),
    revealedVotes: z.array(voteSchema).max(30).nullable(),
    approvedEstimate: z.number().positive().finite().nullable(),
    history: z.array(historyItemSchema).max(200),
    revision: z.number().int().nonnegative(),
  })
  .strict()

const eventBase = {
  eventId: identifierSchema,
  roomId: identifierSchema,
  senderId: identifierSchema,
  sentAt: timestampSchema,
}

export const realtimeEventSchema = z.discriminatedUnion('type', [
  z.object({ ...eventBase, type: z.literal('request_state') }).strict(),
  z
    .object({
      ...eventBase,
      type: z.literal('room_state'),
      snapshot: roomSnapshotSchema,
    })
    .strict(),
  z
    .object({
      ...eventBase,
      type: z.literal('task_changed'),
      task: currentTaskSchema,
    })
    .strict(),
  z.object({ ...eventBase, type: z.literal('voting_started') }).strict(),
  z
    .object({
      ...eventBase,
      type: z.literal('vote_submitted'),
      estimate: estimateSchema,
    })
    .strict(),
  z.object({ ...eventBase, type: z.literal('voting_revealed') }).strict(),
  z
    .object({
      ...eventBase,
      type: z.literal('estimate_approved'),
      estimate: z.number().positive().finite(),
    })
    .strict(),
  z.object({ ...eventBase, type: z.literal('round_reset') }).strict(),
  z.object({ ...eventBase, type: z.literal('room_finished') }).strict(),
])

export type RealtimeEvent = z.infer<typeof realtimeEventSchema>

export function parseRealtimeEvent(payload: unknown): RealtimeEvent | null {
  const result = realtimeEventSchema.safeParse(payload)

  return result.success ? result.data : null
}
