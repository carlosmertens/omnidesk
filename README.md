# OmniDesk

A unified, AI-native helpdesk that centralizes customer emails into a single collaborative workspace — an AI first-responder resolves tickets against a knowledge base when it can, and hands off to a human representative when it can't.

## Docs
- [`project-scope.md`](./project-scope.md) — problem, solution, feature scope, and what's explicitly out of scope for v1
- [`tech-stack.md`](./tech-stack.md) — chosen stack and rationale, including deferred/later-upgrade items
- [`implementation-plan.md`](./implementation-plan.md) — phased task breakdown; living doc, update as work progresses

## Project structure
This is a pnpm monorepo:

```
apps/
  api/      NestJS backend
  web/      React + TypeScript + Vite frontend
packages/
  shared/   Shared Zod schemas/types used by both apps
```

## Requirements
- Node 24+
- pnpm 10+ (`corepack enable` will pick up the version pinned in the root `package.json`)
- Docker (for local Postgres + pgvector)

## Setup

```bash
pnpm install
cp .env.example .env                      # Postgres creds for Docker Compose
docker compose up -d                      # starts Postgres 18 + pgvector -> localhost:5432
cp apps/api/.env.example apps/api/.env    # DATABASE_URL for the API (required — no default)
```

## Running locally

Either run both at once from the root:

```bash
pnpm run dev
```

Or run each app in its own terminal (useful for keeping their logs separate):

```bash
pnpm --filter api run start:dev   # backend  -> http://localhost:3000
pnpm --filter web run dev         # frontend -> http://localhost:5173
```

API docs (Swagger UI) are served at **http://localhost:3000/docs** while the backend is running.

See `apps/api/README.md` and `apps/web/README.md` for each app's other scripts (build, lint, test).

## Status
Early scaffolding stage — see `implementation-plan.md` for what's done and what's next.
