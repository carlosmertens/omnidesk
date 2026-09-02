# OmniDesk API

NestJS backend for OmniDesk. See the [root README](../../README.md) for full-stack setup; this covers running the API on its own.

## Requirements
- Node 24+, pnpm 10+ (managed at the workspace root)
- PostgreSQL + pgvector running (see root README's Docker Compose step)
- `.env` in this directory with `DATABASE_URL` set (`cp .env.example .env` — no default; the app refuses to boot without a valid one)

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

All routes are under the `/api` prefix (e.g. `GET /api/health`). CORS is enabled for the frontend origin (`FRONTEND_URL` env var, defaults to `http://localhost:5173`), with credentials allowed for the cookie-based session auth planned in Phase 1.

## Other scripts
```bash
pnpm run build       # compile to dist/
pnpm run start:prod  # run compiled output
pnpm run lint        # oxlint
pnpm run test        # unit tests (Vitest)
pnpm run test:e2e    # e2e tests (Vitest, Supertest) — requires Postgres running (boots the real AppModule, incl. Prisma)
```
