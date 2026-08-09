import { useEffect, useState } from 'react'

import type { Participant } from '../../domain/room/types'
import { getSupabaseClient } from '../../lib/supabase/client'
import type { RoomSession } from '../identity/room-session'
import { createPresencePayload, parsePresenceState } from './presence'

export type RoomConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'offline'
  | 'error'

interface RoomPresenceState {
  status: RoomConnectionStatus
  participants: Participant[]
  error: string | null
}

interface UseRoomPresenceInput {
  roomId: string
  session: RoomSession
}

export function useRoomPresence({
  roomId,
  session,
}: UseRoomPresenceInput): RoomPresenceState {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [state, setState] = useState<RoomPresenceState>(() => ({
    status: navigator.onLine ? 'connecting' : 'offline',
    participants: [toLocalParticipant(session)],
    error: null,
  }))

  useEffect(() => {
    const handleOffline = () => {
      setState((currentState) => ({ ...currentState, status: 'offline' }))
      setIsOnline(false)
    }
    const handleOnline = () => {
      setState((currentState) => ({ ...currentState, status: 'reconnecting' }))
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

      const syncPresence = () => {
        if (!isActive) {
          return
        }

        const participants = parsePresenceState(channel.presenceState())
        setState((currentState) => ({
          ...currentState,
          participants:
            participants.length > 0 ? participants : [toLocalParticipant(session)],
          status: participants.some(
            (participant) => participant.id === session.participantId,
          )
            ? 'connected'
            : currentState.status,
          error: null,
        }))
      }

      channel
        .on('presence', { event: 'sync' }, syncPresence)
        .on('presence', { event: 'join' }, syncPresence)
        .on('presence', { event: 'leave' }, syncPresence)
        .subscribe((status) => {
          if (!isActive) {
            return
          }

          if (String(status) === 'SUBSCRIBED') {
            void channel.track(createPresencePayload(session)).then((trackStatus) => {
              if (!isActive) {
                return
              }

              setState((currentState) => ({
                ...currentState,
                status: String(trackStatus) === 'ok' ? 'connected' : 'error',
                error:
                  String(trackStatus) === 'ok'
                    ? null
                    : 'Unable to publish your room presence.',
              }))

            })
            return
          }

          if (
            String(status) === 'CHANNEL_ERROR' ||
            String(status) === 'TIMED_OUT'
          ) {
            setState((currentState) => ({
              ...currentState,
              status: 'reconnecting',
              error: 'Realtime connection was interrupted. Reconnecting…',
            }))
            return
          }

          if (String(status) === 'CLOSED') {
            setState((currentState) => ({
              ...currentState,
              status: navigator.onLine ? 'reconnecting' : 'offline',
            }))
          }
        })

      return () => {
        isActive = false
        void channel.untrack()
        void supabase.removeChannel(channel)
      }
    } catch (error) {
      setState((currentState) => ({
        ...currentState,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unable to connect to Supabase.',
      }))
    }
  }, [isOnline, roomId, session])

  return state
}

function toLocalParticipant(session: RoomSession): Participant {
  return {
    id: session.participantId,
    name: session.displayName,
    role: session.role,
    joinedAt: session.joinedAt,
    isOnline: true,
  }
}
