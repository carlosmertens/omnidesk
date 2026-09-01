# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

OmniDesk: a multi-tenant, AI-native helpdesk. An AI first-responder classifies inbound (email-only, v1) tickets, searches a per-workspace knowledge base, and auto-resolves when it finds a confident match; otherwise the ticket goes to a human representative. See `project-scope.md` for full product scope and what's explicitly out of scope for v1, `tech-stack.md` for stack choices and rationale (including deferred items), and `implementation-plan.md` for the phased task breakdown — check it before starting new work; it's a living document, update it as work progresses.

**Always use the `context7` MCP server** (`resolve-library-id` then `query-docs`) before writing code against, or citing APIs/config/CLI flags for, any library in this stack. This is a fast-moving JS/TS toolchain (NestJS, Vite, pnpm, `nestjs-zod`, etc.) and training-data knowledge goes stale quickly — this already caught one real bug (`tech-stack.md` had recommended `nestjs-zod`'s `patchNestJsSwagger()`, but the current API is `cleanupOpenApiDoc()`; the stale name would have crashed the app at boot).

## Workflow

**Never run `git commit` (or `git push`) in this repo unless explicitly asked to.** After implementing a change, give the normal end-of-turn summary plus a suggested commit message, and stop there — the user wants time to review the diff and ask questions before it's committed. This is a personal learning project; committing on their behalf short-circuits that.

## Repo structure

pnpm workspace monorepo:

```
apps/api/       NestJS backend
apps/web/       React + TypeScript + Vite frontend
packages/shared/  Shared Zod schemas/types (stubbed, not yet used)
```

## Commands

Run from the repo root unless noted. Use `pnpm --filter api run <script>` / `pnpm --filter web run <script>` to target one app, or `cd` into `apps/api` / `apps/web` and drop the `--filter` flag.

```bash
pnpm install                        # install all workspace deps

pnpm --filter api run start:dev     # backend dev server, watch mode -> :3000
pnpm --filter web run dev           # frontend dev server, HMR -> :5173

pnpm --filter api run build         # compile backend -> apps/api/dist
pnpm --filter web run build         # typecheck + build frontend -> apps/web/dist

pnpm --filter api run lint          # oxlint (backend)
pnpm --filter web run lint          # oxlint (frontend)

pnpm --filter api run test          # backend unit tests (Vitest)
pnpm --filter api run test:e2e      # backend e2e tests (Vitest + Supertest)
pnpm --filter api run test:watch    # backend unit tests, watch mode
```

To run a single test file/case, use Vitest's own filtering directly, e.g. `pnpm --filter api exec vitest run src/health/health.controller.spec.ts` or add `-t "test name"`.

Backend API docs (Swagger UI, generated from Zod DTOs) are served at `http://localhost:3000/docs` while `start:dev` is running. All backend routes are namespaced under `/api` (e.g. `GET /api/health`) except `/docs` itself.

## Architecture notes

- **NestJS is ESM + Vitest**, not the older CommonJS + Jest combo — this is Nest v12's current default for new projects, adopted deliberately (see `tech-stack.md`). Source files use explicit `.js` extensions on relative imports (e.g. `import { AppService } from './app.service.js'`) as required by Node ESM resolution, even though the source files are `.ts`.
- **Validation is Zod-first, not `class-validator`**: request DTOs are defined as Zod schemas via `nestjs-zod`'s `createZodDto()` (see `apps/api/src/ping/ping.schema.ts`, `apps/api/src/health/health.schema.ts` for the pattern), validated by a global `ZodValidationPipe` registered as `APP_PIPE` in `app.module.ts`. Don't reach for `class-validator` decorators.
- **Swagger docs are generated from those same Zod schemas** via `nestjs-zod`'s `cleanupOpenApiDoc()`, wired in `apps/api/src/main.ts`. Do not add an explicit `.meta({ id: ... })` on a Zod schema that shares a name with another schema/DTO — this throws a "duplicate schema name" error at boot; let `nestjs-zod` derive the schema name from the DTO class name instead.
- **CORS and route prefixing** are both set in `apps/api/src/main.ts`: global prefix `/api`, CORS origin from `FRONTEND_URL` env var (default `http://localhost:5173`) with `credentials: true` — required because auth will be cookie/session-based, not token-based.
- **Frontend talks to the backend via `apps/web/src/lib/api.ts`**, a thin `fetch` wrapper reading `VITE_API_BASE_URL` (see `apps/web/.env` / `.env.example`) and sending `credentials: 'include'` on every request, for the same cookie-session reason.
- **Multi-tenancy**: every backend table is expected to carry a `workspace_id` from the start (not yet implemented — no Prisma schema exists yet). There is no Postgres RLS; tenant isolation will rely on consistently scoping queries by workspace in application code (a `@CurrentWorkspace()` decorator per `implementation-plan.md`) — this is a manual discipline, not something the DB enforces.
- **No database is wired up yet** (Docker Compose for Postgres+pgvector is the next planned step) — the current backend has no Prisma schema or DB dependency.
- Per-app `README.md` (`apps/api/README.md`, `apps/web/README.md`) document each app's scripts and env vars in more detail than this file.
