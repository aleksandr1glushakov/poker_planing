export const ESTIMATE_OPTIONS = [
  0.5,
  1,
  2,
  3,
  4,
  6,
  8,
  12,
  16,
  24,
  32,
  40,
  '?',
] as const

export type Estimate = (typeof ESTIMATE_OPTIONS)[number]
export type NumericEstimate = Exclude<Estimate, '?'>

export type RoomPhase =
  | 'lobby'
  | 'discussion'
  | 'voting'
  | 'revealed'
  | 'approved'

export type ParticipantRole = 'host' | 'participant'

export interface Participant {
  id: string
  name: string
  role: ParticipantRole
  joinedAt: number
  isOnline: boolean
}

export interface CurrentTask {
  id: string
  title: string
  jiraUrl?: string
}

export interface Vote {
  participantId: string
  estimate: Estimate
  submittedAt: number
}

export interface VoteStatus {
  participantId: string
  hasVoted: boolean
}

export interface RoundStatistics {
  min: number | null
  max: number | null
  average: number | null
  median: number | null
  numericVoteCount: number
  unknownVoteCount: number
  totalVoteCount: number
}

export interface RoundResult {
  task: CurrentTask
  approvedEstimate: number
  statistics: RoundStatistics
  completedAt: number
}

export type HistoryItem = RoundResult

export interface RoomState {
  roomId: string
  hostId: string
  phase: RoomPhase
  currentTask: CurrentTask | null
  participants: Participant[]
  votes: Record<string, Vote>
  approvedEstimate: number | null
  history: HistoryItem[]
  revision: number
}

export interface RoomSnapshot {
  roomId: string
  hostId: string
  phase: RoomPhase
  currentTask: CurrentTask | null
  participants: Participant[]
  voteStatuses: VoteStatus[]
  revealedVotes: Vote[] | null
  approvedEstimate: number | null
  history: HistoryItem[]
  revision: number
}
