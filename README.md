# Poker Planning

A lightweight realtime planning poker application for estimating Jira tasks in
hours during team bug triage sessions.

## Local development

Requirements:

- Node.js 24.19 or newer (`nvm use`).
- pnpm 10 or newer.

Install dependencies and start the development server:

```bash
pnpm install
pnpm dev
```

Quality checks:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Supabase configuration will be added in a later implementation stage. Copy
`.env.example` to `.env.local` when those values are available.
