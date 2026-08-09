import { ArrowRight, Link2, Sparkles, UsersRound } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  createRoomSession,
  getRememberedDisplayName,
  isValidDisplayName,
  normalizeDisplayName,
} from '../features/identity/room-session'
import { createRoomId, extractRoomId } from '../features/room/room-links'

export function HomePage() {
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState(getRememberedDisplayName)
  const [roomReference, setRoomReference] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)

  function handleCreateRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isValidDisplayName(displayName)) {
      setCreateError('Enter a name between 1 and 80 characters.')
      return
    }

    const roomId = createRoomId()
    createRoomSession({
      roomId,
      displayName: normalizeDisplayName(displayName),
      role: 'host',
    })
    void navigate(`/room/${roomId}`)
  }

  function handleJoinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const roomId = extractRoomId(roomReference)

    if (!roomId) {
      setJoinError('Paste a valid room link or room ID.')
      return
    }

    void navigate(`/room/${roomId}`)
  }

  return (
    <main className="min-h-screen px-6 py-12 sm:py-20">
      <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section>
          <div className="mb-8 inline-flex rounded-2xl bg-violet-500/15 p-3 text-violet-300">
            <UsersRound aria-hidden="true" size={32} />
          </div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
            Team estimation
          </p>
          <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-white sm:text-7xl">
            Discuss together. Vote independently.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Create a temporary room for bug triage, share one link with the team,
            and agree on a realistic estimate without anchoring the first vote.
          </p>

          <div className="mt-9 flex flex-wrap gap-3 text-sm text-slate-300">
            {['No accounts', 'Hidden cards', 'Session-only history'].map((label) => (
              <span
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2"
                key={label}
              >
                {label}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-violet-950/30 backdrop-blur sm:p-8">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-violet-500/15 p-2 text-violet-300">
              <Sparkles aria-hidden="true" size={20} />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-white">Start a session</h2>
              <p className="text-sm text-slate-400">You will be the room host.</p>
            </div>
          </div>

          <form className="mt-6" onSubmit={handleCreateRoom}>
            <label className="text-sm font-medium text-slate-200" htmlFor="display-name">
              Your name
            </label>
            <input
              autoComplete="name"
              autoFocus
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
              id="display-name"
              maxLength={80}
              onChange={(event) => {
                setDisplayName(event.target.value)
                setCreateError(null)
              }}
              placeholder="Alex"
              value={displayName}
            />
            {createError ? (
              <p className="mt-2 text-sm text-rose-300" role="alert">
                {createError}
              </p>
            ) : null}
            <button
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white transition hover:bg-violet-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400"
              type="submit"
            >
              Create room
              <ArrowRight aria-hidden="true" size={18} />
            </button>
          </form>

          <div className="my-7 flex items-center gap-4 text-xs uppercase tracking-[0.16em] text-slate-500">
            <span className="h-px flex-1 bg-white/10" />
            or join a team
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleJoinRoom}>
            <label className="text-sm font-medium text-slate-200" htmlFor="room-reference">
              Invite link or room ID
            </label>
            <div className="relative mt-2">
              <Link2
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 py-3 pl-11 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
                id="room-reference"
                onChange={(event) => {
                  setRoomReference(event.target.value)
                  setJoinError(null)
                }}
                placeholder="Paste room link"
                value={roomReference}
              />
            </div>
            {joinError ? (
              <p className="mt-2 text-sm text-rose-300" role="alert">
                {joinError}
              </p>
            ) : null}
            <button
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-white/15 px-5 py-3 font-semibold text-slate-100 transition hover:border-white/30 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400"
              type="submit"
            >
              Join room
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
