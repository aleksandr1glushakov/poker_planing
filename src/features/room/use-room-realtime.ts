import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  Participant,
  RoomSnapshot,
  RoomState,
} from '../../domain/room/types'
import {
  createRequestStateEvent,
  createRoomStateEvent,
  isAuthoritativeRoomStateEvent,
  type RealtimeEvent,
} from '../../realtime/events'
import type { RoomSession } from '../identity/room-session'
import {
  getHostRoomState,
  getPublicRoomSnapshot,
  saveHostRoomState,
  synchronizeRoomParticipants,
} from './host-room-state'
import {
  type RoomConnectionStatus,
  useRoomChannel,
} from './use-room-channel'

export type { RoomConnectionStatus } from './use-room-channel'

export type RoomSynchronizationStatus =
  | 'authoritative'
  | 'waiting'
  | 'synchronized'

export type HostAvailability = 'checking' | 'online' | 'offline'

interface RoomRealtimeState {
  status: RoomConnectionStatus
  participants: Participant[]
  snapshot: RoomSnapshot | null
  synchronizationStatus: RoomSynchronizationStatus
  hostAvailability: HostAvailability
  error: string | null
}

interface UseRoomRealtimeInput {
  roomId: string
  session: RoomSession
}

export function useRoomRealtime({
  roomId,
  session,
}: UseRoomRealtimeInput): RoomRealtimeState {
  const [hostState, setHostState] = useState<RoomState | null>(() =>
    session.role === 'host' ? getHostRoomState(roomId, session) : null,
  )
  const [receivedSnapshot, setReceivedSnapshot] = useState<RoomSnapshot | null>(
    null,
  )
  const hostStateRef = useRef(hostState)

  const handleParticipantsChange = useCallback(
    (liveParticipants: Participant[]) => {
      if (session.role === 'host') {
        setHostState((currentState) =>
          currentState
            ? synchronizeRoomParticipants(currentState, liveParticipants)
            : currentState,
        )
      }
    },
    [session.role],
  )

  const handleEvent = useCallback(
    (
      event: RealtimeEvent,
      reply: (event: RealtimeEvent) => Promise<void>,
    ) => {
      if (event.type === 'request_state' && session.role === 'host') {
        const currentHostState = hostStateRef.current

        if (currentHostState) {
          void reply(
            createRoomStateEvent(
              { roomId, senderId: session.participantId },
              getPublicRoomSnapshot(currentHostState),
            ),
          )
        }
        return
      }

      if (
        event.type === 'room_state' &&
        session.role === 'participant' &&
        isAuthoritativeRoomStateEvent(event)
      ) {
        setReceivedSnapshot((currentSnapshot) =>
          !currentSnapshot || event.snapshot.revision >= currentSnapshot.revision
            ? event.snapshot
            : currentSnapshot,
        )
      }
    },
    [roomId, session.participantId, session.role],
  )

  const {
    error,
    participants,
    presenceSynchronized,
    sendEvent,
    status,
  } = useRoomChannel({
    roomId,
    session,
    onEvent: handleEvent,
    onParticipantsChange: handleParticipantsChange,
  })

  useEffect(() => {
    hostStateRef.current = hostState

    if (hostState) {
      saveHostRoomState(hostState)
    }
  }, [hostState])

  useEffect(() => {
    if (
      session.role !== 'participant' ||
      status !== 'connected' ||
      !participants.some((participant) => participant.role === 'host')
    ) {
      return
    }

    void sendEvent(
      createRequestStateEvent({
        roomId,
        senderId: session.participantId,
      }),
    )
  }, [participants, roomId, sendEvent, session.participantId, session.role, status])

  useEffect(() => {
    if (!hostState || status !== 'connected') {
      return
    }

    void sendEvent(
      createRoomStateEvent(
        { roomId, senderId: session.participantId },
        getPublicRoomSnapshot(hostState),
      ),
    )
  }, [hostState, roomId, sendEvent, session.participantId, status])

  const snapshot = hostState ? getPublicRoomSnapshot(hostState) : receivedSnapshot

  return {
    status,
    error,
    participants,
    snapshot,
    synchronizationStatus:
      session.role === 'host'
        ? 'authoritative'
        : receivedSnapshot
          ? 'synchronized'
          : 'waiting',
    hostAvailability: getHostAvailability(
      session,
      participants,
      presenceSynchronized,
    ),
  }
}

function getHostAvailability(
  session: RoomSession,
  participants: Participant[],
  presenceSynchronized: boolean,
): HostAvailability {
  if (session.role === 'host') {
    return 'online'
  }

  if (!presenceSynchronized) {
    return 'checking'
  }

  return participants.some((participant) => participant.role === 'host')
    ? 'online'
    : 'offline'
}
