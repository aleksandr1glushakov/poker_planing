import type { SupabaseClient } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { Participant } from '../../domain/room/types'
import { getSupabaseClient } from '../../lib/supabase/client'
import {
  parseRealtimeEvent,
  type RealtimeEvent,
} from '../../realtime/events'
import type { RoomSession } from '../identity/room-session'
import { createPresencePayload, parsePresenceState } from './presence'

const ROOM_BROADCAST_EVENT = 'room_event'

export type RoomConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'offline'
  | 'error'

interface RoomChannelState {
  status: RoomConnectionStatus
  participants: Participant[]
  presenceSynchronized: boolean
  error: string | null
  sendEvent: (event: RealtimeEvent) => Promise<void>
}

interface UseRoomChannelInput {
  roomId: string
  session: RoomSession
  onParticipantsChange?: (participants: Participant[]) => void
  onEvent?: (
    event: RealtimeEvent,
    sendEvent: (event: RealtimeEvent) => Promise<void>,
  ) => void
}

type RoomChannel = ReturnType<SupabaseClient['channel']>

export function useRoomChannel({
  roomId,
  session,
  onParticipantsChange,
  onEvent,
}: UseRoomChannelInput): RoomChannelState {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [presenceSynchronized, setPresenceSynchronized] = useState(false)
  const [connection, setConnection] = useState<{
    status: RoomConnectionStatus
    error: string | null
  }>(() => ({
    status: navigator.onLine ? 'connecting' : 'offline',
    error: null,
  }))
  const [participants, setParticipants] = useState<Participant[]>(() => [
    participantFromSession(session),
  ])
  const channelRef = useRef<RoomChannel | null>(null)
  const callbacksRef = useRef({ onEvent, onParticipantsChange })

  useEffect(() => {
    callbacksRef.current = { onEvent, onParticipantsChange }
  }, [onEvent, onParticipantsChange])

  const sendEvent = useCallback(async (event: RealtimeEvent) => {
    const channel = channelRef.current

    if (!channel) {
      return
    }

    await channel.send({
      type: 'broadcast',
      event: ROOM_BROADCAST_EVENT,
      payload: event,
    })
  }, [])

  useEffect(() => {
    const handleOffline = () => {
      setConnection({ status: 'offline', error: null })
      setIsOnline(false)
    }
    const handleOnline = () => {
      setConnection({ status: 'reconnecting', error: null })
      setIsOnline(true)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  useEffect(() => {
    if (!isOnline) {
      return
    }

    let isActive = true

    try {
      const supabase = getSupabaseClient()
      const channel = supabase.channel(`planning-room:${roomId}`, {
        config: {
          broadcast: { ack: true },
          presence: { key: session.participantId },
          private: false,
        },
      })
      channelRef.current = channel

      const syncPresence = () => {
        if (!isActive) {
          return
        }

        const liveParticipants = parsePresenceState(channel.presenceState())
        const nextParticipants =
          liveParticipants.length > 0
            ? liveParticipants
            : [participantFromSession(session)]
        setParticipants(nextParticipants)
        callbacksRef.current.onParticipantsChange?.(nextParticipants)
        setPresenceSynchronized(true)

        if (
          liveParticipants.some(
            (participant) => participant.id === session.participantId,
          )
        ) {
          setConnection({ status: 'connected', error: null })
        }
      }

      channel
        .on('presence', { event: 'sync' }, syncPresence)
        .on('presence', { event: 'join' }, syncPresence)
        .on('presence', { event: 'leave' }, syncPresence)
        .on('broadcast', { event: ROOM_BROADCAST_EVENT }, ({ payload }) => {
          if (!isActive) {
            return
          }

          const event = parseRealtimeEvent(payload)
          if (event?.roomId === roomId) {
            callbacksRef.current.onEvent?.(event, sendEvent)
          }
        })
        .subscribe((status) => {
          if (!isActive) {
            return
          }

          if (String(status) === 'SUBSCRIBED') {
            void channel.track(createPresencePayload(session)).then((trackStatus) => {
              if (!isActive) {
                return
              }

              const connected = String(trackStatus) === 'ok'
              setConnection({
                status: connected ? 'connected' : 'error',
                error: connected
                  ? null
                  : 'Unable to publish your room presence.',
              })
            })
            return
          }

          if (
            String(status) === 'CHANNEL_ERROR' ||
            String(status) === 'TIMED_OUT'
          ) {
            setConnection({
              status: 'reconnecting',
              error: 'Realtime connection was interrupted. Reconnecting…',
            })
            return
          }

          if (String(status) === 'CLOSED') {
            setConnection({
              status: navigator.onLine ? 'reconnecting' : 'offline',
              error: null,
            })
          }
        })

      return () => {
        isActive = false
        if (channelRef.current === channel) {
          channelRef.current = null
        }
        void channel.untrack()
        void supabase.removeChannel(channel)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to connect to Supabase.'
      const errorTimer = window.setTimeout(() => {
        if (isActive) {
          setConnection({ status: 'error', error: message })
        }
      }, 0)

      return () => {
        isActive = false
        window.clearTimeout(errorTimer)
      }
    }
  }, [isOnline, roomId, sendEvent, session])

  return {
    ...connection,
    participants,
    presenceSynchronized,
    sendEvent,
  }
}

function participantFromSession(session: RoomSession): Participant {
  return {
    id: session.participantId,
    name: session.displayName,
    role: session.role,
    joinedAt: session.joinedAt,
    isOnline: true,
  }
}
