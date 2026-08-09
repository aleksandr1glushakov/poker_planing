import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-300">
          404
        </p>
        <h1 className="mt-3 text-4xl font-bold text-white">Page not found</h1>
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
