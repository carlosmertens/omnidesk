# OmniDesk API

NestJS backend for OmniDesk. See the [root README](../../README.md) for full-stack setup; this covers running the API on its own.

## Requirements
- Node 24+, pnpm 10+ (managed at the workspace root)
- PostgreSQL + pgvector running (see root README's Docker Compose step)
- `.env` in this directory (`cp .env.example .env`). Validated at startup by `src/config/env.validation.ts` — the app refuses to boot if a required var is missing or invalid.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | yes | — | Postgres connection string (must match the root `.env`) |
| `SESSION_SECRET` | yes | — | Signs the session cookie |
| `PORT` | no | `3000` | HTTP port |
| `FRONTEND_URL` | no | `http://localhost:5173` | Allowed CORS origin |
| `SEED_ADMIN_EMAIL` | seed only | — | Email of the ADMIN user `prisma db seed` creates |
| `SEED_ADMIN_PASSWORD` | seed only | — | That user's password (min 8 chars) |

## Run

From the workspace root (recommended, so pnpm resolves workspace deps correctly):

```bash
pnpm --filter api run start:dev
```

Or from this directory:

```bash
pnpm run start:dev
```

Serves on **http://localhost:3000** with watch/hot-reload.

Interactive API docs (Swagger UI, generated from the Zod DTOs via `nestjs-zod`) are at **http://localhost:3000/docs**.

All routes are under the `/api` prefix (e.g. `GET /api/health`). CORS is enabled for the frontend origin (`FRONTEND_URL`), with credentials allowed for the cookie-based session auth.

## Auth & roles

Session-based: Passport local strategy (email + password) → `express-session` cookie, sessions stored in Postgres (`session` table, via `connect-pg-simple`). There is a single workspace — no tenant scoping — and access is controlled by `User.role` (`ADMIN` / `ASSOCIATE`).

- Every route requires a session by default (global `AuthenticatedGuard`); opt out with `@Public()`.
- Restrict a route or controller to roles with `@UseGuards(RolesGuard)` + `@Roles('ADMIN')`.

| Route | Access | Notes |
|---|---|---|
| `GET /api/health` | public | |
| `POST /api/auth/login` | public | body `{ email, password }`; sets the session cookie |
| `POST /api/auth/logout` | public | destroys the session |
| `GET /api/auth/me` | signed in | current user (`id`, `email`, `role`) |
| `GET /api/users` | ADMIN | list users |
| `POST /api/users` | ADMIN | body `{ email, password, role }` |

## Database

Prisma 7 with the `@prisma/adapter-pg` driver adapter. Schema: `prisma/schema.prisma` (`User`, `session`); config: `prisma.config.ts`. The generated client lives in `src/generated/prisma` (gitignored).

```bash
pnpm exec prisma migrate dev --name <change>   # create + apply a migration after editing the schema
pnpm exec prisma generate                      # regenerate the client (migrate dev doesn't in Prisma 7)
pnpm exec prisma db seed                       # upsert the ADMIN user from SEED_ADMIN_* (re-runnable)
pnpm exec prisma migrate reset --force         # wipe + re-apply migrations (then seed again)
pnpm exec prisma studio                        # browse data
```

Run seed via `prisma db seed` rather than `tsx prisma/seed.ts` directly — the Prisma CLI is what loads `.env`.

## Other scripts
```bash
pnpm run build       # compile to dist/
pnpm run start:prod  # run compiled output
pnpm run lint        # oxlint
pnpm run test        # unit tests (Vitest)
pnpm run test:e2e    # e2e tests (Vitest, Supertest) — requires Postgres running and migrated (boots the real AppModule, incl. Prisma)
```
