import { z } from 'zod'

const DISPLAY_NAME_KEY = 'poker-planning:display-name'
const ROOM_SESSION_PREFIX = 'poker-planning:room:'

const roomSessionSchema = z
  .object({
    roomId: z.string().min(1),
    participantId: z.string().min(1),
    displayName: z.string().trim().min(1).max(80),
    role: z.enum(['host', 'participant']),
    joinedAt: z.number().int().nonnegative(),
  })
  .strict()

export type RoomSession = z.infer<typeof roomSessionSchema>

interface CreateRoomSessionInput {
  roomId: string
  displayName: string
  role: RoomSession['role']
}

export function createRoomSession({
  roomId,
  displayName,
  role,
}: CreateRoomSessionInput): RoomSession {
  const session = roomSessionSchema.parse({
    roomId,
    participantId: crypto.randomUUID(),
    displayName: normalizeDisplayName(displayName),
    role,
    joinedAt: Date.now(),
  })

  sessionStorage.setItem(getRoomSessionKey(roomId), JSON.stringify(session))
  rememberDisplayName(session.displayName)

  return session
}

export function getRoomSession(roomId: string): RoomSession | null {
  const storedSession = sessionStorage.getItem(getRoomSessionKey(roomId))

  if (!storedSession) {
    return null
  }

  try {
    const result = roomSessionSchema.safeParse(JSON.parse(storedSession))

    if (result.success && result.data.roomId === roomId) {
      return result.data
    }
  } catch {
    // Invalid local state is discarded and recreated through the join form.
  }

  sessionStorage.removeItem(getRoomSessionKey(roomId))
  return null
}

export function getRememberedDisplayName(): string {
  return sessionStorage.getItem(DISPLAY_NAME_KEY) ?? ''
}

export function normalizeDisplayName(displayName: string): string {
  return displayName.trim().replace(/\s+/g, ' ')
}

export function isValidDisplayName(displayName: string): boolean {
  const normalizedName = normalizeDisplayName(displayName)
  return normalizedName.length > 0 && normalizedName.length <= 80
}

function rememberDisplayName(displayName: string): void {
  sessionStorage.setItem(DISPLAY_NAME_KEY, displayName)
}

function getRoomSessionKey(roomId: string): string {
  return `${ROOM_SESSION_PREFIX}${roomId}`
}
