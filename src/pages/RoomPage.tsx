import { Check, Clipboard, Crown, LogIn, UsersRound } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import {
  createRoomSession,
  getRememberedDisplayName,
  getRoomSession,
  isValidDisplayName,
  normalizeDisplayName,
  type RoomSession,
} from '../features/identity/room-session'
import { createInviteUrl, isValidRoomId } from '../features/room/room-links'

export function RoomPage() {
  const { roomId = '' } = useParams()
  const [session, setSession] = useState<RoomSession | null>(() =>
    isValidRoomId(roomId) ? getRoomSession(roomId) : null,
  )

  if (!isValidRoomId(roomId)) {
    return <InvalidRoom />
  }

  if (!session) {
    return <JoinRoom roomId={roomId} onJoined={setSession} />
  }

  return <RoomLobby roomId={roomId} session={session} />
}

interface JoinRoomProps {
  roomId: string
  onJoined: (session: RoomSession) => void
}

function JoinRoom({ roomId, onJoined }: JoinRoomProps) {
  const [displayName, setDisplayName] = useState(getRememberedDisplayName)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isValidDisplayName(displayName)) {
      setError('Enter a name between 1 and 80 characters.')
      return
    }

    onJoined(
      createRoomSession({
        roomId,
        displayName: normalizeDisplayName(displayName),
        role: 'participant',
      }),
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/85 p-8 shadow-2xl shadow-violet-950/30">
        <div className="inline-flex rounded-2xl bg-violet-500/15 p-3 text-violet-300">
          <LogIn aria-hidden="true" size={28} />
        </div>
        <p className="mt-7 text-sm font-semibold uppercase tracking-[0.18em] text-violet-300">
          Room invitation
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">Join planning session</h1>
        <p className="mt-3 text-slate-400">
          Choose the name your teammates will see at the table.
        </p>

        <form className="mt-7" onSubmit={handleSubmit}>
          <label className="text-sm font-medium text-slate-200" htmlFor="join-display-name">
            Your name
          </label>
          <input
            autoComplete="name"
            autoFocus
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
            id="join-display-name"
            maxLength={80}
            onChange={(event) => {
              setDisplayName(event.target.value)
              setError(null)
            }}
            placeholder="Alex"
            value={displayName}
          />
          {error ? (
            <p className="mt-2 text-sm text-rose-300" role="alert">
              {error}
            </p>
          ) : null}
          <button
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white transition hover:bg-violet-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400"
            type="submit"
          >
            Join room
            <LogIn aria-hidden="true" size={18} />
          </button>
        </form>
      </section>
    </main>
  )
}

interface RoomLobbyProps {
  roomId: string
  session: RoomSession
}

function RoomLobby({ roomId, session }: RoomLobbyProps) {
  const [copied, setCopied] = useState(false)
  const inviteUrl = createInviteUrl(roomId)

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2_000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/75 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-violet-500/15 p-2.5 text-violet-300">
              <UsersRound aria-hidden="true" size={24} />
            </span>
            <div>
              <p className="font-semibold text-white">Poker Planning</p>
              <p className="text-xs text-slate-500">Room {roomId.slice(0, 8)}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-300">
              {session.role === 'host' ? (
                <Crown aria-hidden="true" className="mr-2 inline text-amber-300" size={16} />
              ) : null}
              {session.displayName}
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400"
              onClick={() => void copyInviteLink()}
              type="button"
            >
              {copied ? <Check aria-hidden="true" size={17} /> : <Clipboard aria-hidden="true" size={17} />}
              {copied ? 'Copied' : 'Copy invite link'}
            </button>
          </div>
        </header>

        <section className="mt-6 grid min-h-[70vh] place-items-center rounded-[2rem] border border-white/10 bg-slate-900/45 p-6">
          <div className="max-w-xl text-center">
            <div className="mx-auto grid size-24 place-items-center rounded-full border border-violet-400/30 bg-violet-500/10 text-violet-200 shadow-xl shadow-violet-950/40">
              <UsersRound aria-hidden="true" size={42} />
            </div>
            <p className="mt-7 text-sm font-semibold uppercase tracking-[0.18em] text-violet-300">
              Local lobby
            </p>
            <h1 className="mt-3 text-4xl font-bold text-white">You are in the room</h1>
            <p className="mt-4 text-lg leading-8 text-slate-400">
              Realtime participants arrive in the next stage. For now, this room
              identity survives a page refresh in the current browser tab.
            </p>
            <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-left">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Invite URL</p>
              <p className="mt-2 break-all text-sm text-slate-300">{inviteUrl}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function InvalidRoom() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <section className="max-w-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-300">
          Invalid invitation
        </p>
        <h1 className="mt-3 text-4xl font-bold text-white">This room link is not valid</h1>
        <p className="mt-4 text-slate-400">
          Ask the host for a fresh invite link or return to the start page.
        </p>
        <Link
          className="mt-7 inline-flex rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white transition hover:bg-violet-400"
          to="/"
        >
          Back home
        </Link>
      </section>
    </main>
  )
}
