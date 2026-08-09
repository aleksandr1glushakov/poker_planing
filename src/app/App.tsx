import { ArrowRight, UsersRound } from 'lucide-react'

export function App() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-violet-950/30 backdrop-blur sm:p-12">
        <div className="mb-8 inline-flex rounded-2xl bg-violet-500/15 p-3 text-violet-300">
          <UsersRound aria-hidden="true" size={30} />
        </div>

        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
          Team estimation
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
          Poker Planning
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
          A lightweight realtime room for discussing Jira tasks, voting in hours,
          and agreeing on a team estimate.
        </p>

        <button
          className="mt-10 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white transition hover:bg-violet-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400"
          type="button"
        >
          Project scaffold is ready
          <ArrowRight aria-hidden="true" size={18} />
        </button>
      </section>
    </main>
  )
}
