# OmniDesk

A unified, AI-native helpdesk that centralizes customer emails into a single collaborative workspace — an AI first-responder resolves tickets against a knowledge base when it can, and hands off to a human representative when it can't.

One app instance serves one support team (no multi-tenancy). Users sign in with email + password and have a role — `ADMIN` or `ASSOCIATE` — that decides which functionality they can use.

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
  shared/   Placeholder for Zod schemas/types shared by both apps (not used yet)
```

## Requirements
- Node 24+
- pnpm 10+ (`corepack enable` will pick up the version pinned in the root `package.json`)
- Docker (for local Postgres + pgvector)

## Setup

```bash
pnpm install                              # also runs `prisma generate` (API postinstall)

cp .env.example .env                      # Postgres creds for Docker Compose
cp apps/api/.env.example apps/api/.env    # API: DATABASE_URL, SESSION_SECRET, seed admin
cp apps/web/.env.example apps/web/.env    # web: VITE_API_BASE_URL

docker compose up -d                      # Postgres 18 + pgvector -> localhost:5432
                                          # (standalone installs: `docker-compose up -d`)

cd apps/api
pnpm exec prisma migrate dev              # apply migrations
pnpm exec prisma db seed                  # create the first ADMIN user
```

### Environment files

| File | Used by | Variables |
|---|---|---|
| `.env` | `docker-compose.yml` | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` |
| `apps/api/.env` | API + Prisma CLI | `DATABASE_URL`, `SESSION_SECRET` (required); `PORT`, `FRONTEND_URL` (optional); `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` (seed only) |
| `apps/web/.env` | Vite frontend | `VITE_API_BASE_URL` |

All three are gitignored; the committed `.env.example` next to each is the template. The API validates its env on startup and refuses to boot if a required var is missing.

### Signing in

The seed creates an `ADMIN` from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `apps/api/.env` — by default **`admin@example.com` / `SeedPass#1234`** (local dev only). Re-running `prisma db seed` is safe: it updates that user's password instead of failing. Admins create further users via `POST /api/users` (see Swagger).

### Resetting the database

```bash
cd apps/api
pnpm exec prisma migrate reset --force    # drop everything + re-apply migrations
pnpm exec prisma db seed                  # Prisma 7 no longer seeds automatically after reset
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
Phase 1 (auth + roles) is done: session login, admin-only user management, and a minimal signed-in dashboard. Tickets, knowledge base, AI, and email are next — see `implementation-plan.md`.
