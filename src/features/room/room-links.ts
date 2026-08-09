const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function createRoomId(): string {
  return crypto.randomUUID()
}

export function isValidRoomId(roomId: string): boolean {
  return UUID_PATTERN.test(roomId)
}

export function createInviteUrl(roomId: string, origin = window.location.origin): string {
  return new URL(`/room/${encodeURIComponent(roomId)}`, origin).toString()
}

export function extractRoomId(value: string): string | null {
  const normalizedValue = value.trim()

  if (isValidRoomId(normalizedValue)) {
    return normalizedValue
  }

  try {
    const url = new URL(normalizedValue, 'https://poker-planning.local')
    const pathParts = url.pathname.split('/').filter(Boolean)

    if (pathParts.length !== 2 || pathParts[0] !== 'room') {
      return null
    }

    const roomId = decodeURIComponent(pathParts[1] ?? '')
    return isValidRoomId(roomId) ? roomId : null
  } catch {
    return null
  }
}
