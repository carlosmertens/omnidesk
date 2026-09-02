# OmniDesk MVP — Implementation Plan

## Context
OmniDesk is a greenfield project — only `project-scope.md` and `tech-stack.md` exist so far, no code. The scope defines a multi-tenant, email-only AI helpdesk (AI attempts to auto-resolve tickets against a per-workspace knowledge base; falls back to a human representative when there's no KB match or the ticket involves money/account actions). The stack is decided: React/Vite frontend, NestJS backend, Postgres+Prisma+pgvector, Claude+Voyage AI, session auth via Passport, SendGrid for email.

The user is strong on frontend but has little backend experience, and explicitly wants this project to double as a NestJS/backend learning vehicle. The plan below is sequenced to build backend confidence early (a thin, fully-working full-stack slice before any AI/email complexity), isolates the two hardest new concepts (pgvector raw SQL, LLM SDK integration) into their own phase away from email-webhook debugging, and calls out the specific new backend concept being learned at each non-trivial backend task.

This file is meant to be a living document — reorder, add, or check off tasks here as work progresses or priorities change, rather than treating it as a one-time snapshot.

## Phase 0: Project Scaffolding & Tooling
**Goal:** Get frontend, backend, and DB booting together before any real feature code.

1. ✅ Init pnpm workspace: root `package.json` + `pnpm-workspace.yaml` declaring `apps/*` and `packages/*`; root `README.md`. Create empty `apps/api`, `apps/web`, and `packages/shared` folders (the latter a placeholder for shared Zod schemas — no content yet, just the slot so adding them later isn't a restructure). *Learning: workspace tooling — how a monorepo lets multiple packages reference each other locally without publishing to npm.*
   - Done: NestJS scaffolded in `apps/api` (v12, defaults to ESM+Vitest — see tech-stack.md), Vite React+TS scaffolded in `apps/web`, `packages/shared` stubbed with a placeholder `package.json`. Both apps build cleanly (`pnpm --filter api run build`, `pnpm --filter web run build`). Git repo initialized, initial commit made.
2. ✅ `docker-compose.yml` running `pgvector/pgvector:pg16` only, named volume, `.env` for Postgres creds. Checkpoint: `docker compose up`, `psql` in, `CREATE EXTENSION vector;` succeeds.
   - Done: used `pgvector/pgvector:pg18` (current latest, checked via context7/Docker Hub — Postgres 18 is out) instead of the originally-planned pg16. Hit a real, current issue while testing: Postgres 18's official image changed its data-directory convention — mounting the named volume at `/var/lib/postgresql/data` (the old pg16/17 convention) crash-loops the container with "Error: in 18+, these Docker images are configured to store database data in a format which is compatible with pg_ctlcluster..."; fixed by mounting at `/var/lib/postgresql` instead (the new convention, which places data in a version-specific subdirectory itself). Added a `pg_isready` healthcheck. `.env`/`.env.example` hold `POSTGRES_USER/PASSWORD/DB/PORT`. Verified end-to-end twice (including a full `down -v` + fresh `up`): container reaches `healthy`, `psql` connects, `CREATE EXTENSION vector;` succeeds (v0.8.6), confirmed via `\dx`.
3. ✅ (Merged into task 1 — already done there: Nest and Vite React+TS were scaffolded together as part of the initial workspace setup.)
4. ✅ Tailwind + Shadcn init, React Router base layout with one placeholder route, in `apps/web`.
   - Done: Tailwind v4 via `@tailwindcss/vite`; `shadcn@latest init -b base -p nova` (Base UI primitives, Nova preset — CLI's current recommended default, run non-interactively since the plain `init` prompt hung waiting for stdin); `@` alias wired in `vite.config.ts` + `tsconfig.app.json`. React Router: `BrowserRouter` + a `Layout` (`<Outlet />`) wrapping the existing scaffold homepage as the one placeholder (index) route, in `main.tsx`/`components/Layout.tsx`.
   - Hit and fixed a real bug while verifying in-browser: the original Vite scaffold's `@media (prefers-color-scheme: dark)` CSS block conflicted with shadcn's class-based dark mode (Nova preset doesn't respond to the media query), leaving light text on a light background under a dark-mode OS preference — confirmed via computed-style inspection (`h1` color resolving to the dark-mode value while `body` background stayed light). Removed the conflicting `--text`/`--bg` overrides from that media query block; real dark-mode support is out of scope here since this whole placeholder page is replaced by the real dashboard in Phase 2. Also fixed an unrelated current-tooling deprecation surfaced along the way: `__dirname` → `import.meta.dirname` in `vite.config.ts` (Vite's native config loader warns on the old Node global). One more CLI oddity: the non-interactive `shadcn init` wrote `lib/utils.ts` under a literal `apps/web/@/` directory instead of resolving the `@` alias to `src/` — moved it to `src/lib/utils.ts` by hand; worth watching for the same issue when `shadcn add <component>` is run later. Verified end-to-end in Chrome: page renders correctly, routing works transparently, and the Phase-0-task-9 backend health check still succeeds through the new Layout/Route wrapper.
   - Follow-up: replaced the Vite landing-page boilerplate entirely (hero image, "Get started" copy, doc/social links, unused assets) with a minimal real page (`App.tsx`) using actual shadcn components — added `Button` and `Card` via `shadcn add button card`, which hit the *same* `apps/web/@/` alias-resolution bug as `init` (moved to `src/components/ui/` by hand again). `BackendHealthCheck` rewritten to use `Card`/`Button` instead of inline styles. `index.css` also stripped of dead scaffold-only CSS (old `--text`/`--bg`/`--accent-bg`/etc. vars and the `h1`/`h2`/`code`/`#root` selectors tied to the removed markup) down to just what shadcn's theme actually needs. Re-verified in Chrome with a live backend: custom page renders, shadcn components styled correctly, health check still round-trips.
5. ✅ Add Prisma to the Nest app, point `DATABASE_URL` at Docker Postgres, commit empty `schema.prisma`. Checkpoint: `migrate dev` connects.
   - Done: installed Prisma **7.10.0** pinned explicitly — npm's `latest` dist-tag currently points at an `8.0.0-rc.*` release candidate, so a plain `pnpm add prisma` would have grabbed an unstable pre-release. Prisma 7 is a genuinely different architecture from what tech-stack.md originally assumed: no Rust query engine, client code generates into the project source tree (`src/generated/prisma`, gitignored) instead of `node_modules`, and every client needs an explicit driver adapter (`@prisma/adapter-pg` + `pg`) rather than a bundled binary engine. Config lives in `prisma.config.ts` (the CLI defaulted to naming it `prisma7.config.ts`, reserved for side-by-side Prisma 7/8 migrations — renamed to the plain `prisma.config.ts` since this project isn't doing that migration). `prisma init` also auto-installed AI agent "skills" (`.claude/`, `.windsurf/`, `.agents/`, `skills-lock.json`) — deleted, not something this project wants. `apps/api/.env` holds `DATABASE_URL` pointing at the Docker Postgres from task 2; `**/src/generated/` added to root `.gitignore`. Verified: `prisma generate` and `prisma migrate dev` both connect cleanly against the running container (schema is still empty, so no migration file was created — nothing to migrate yet).
6. ✅ Build `PrismaService` (`OnModuleInit`/`OnModuleDestroy`) + global `PrismaModule`. *Learning: Nest DI — `@Injectable()` + module `providers`/`exports`, lifecycle hooks.*
   - Done: `src/prisma/prisma.service.ts` extends the generated `PrismaClient`, constructed with a `PrismaPg` adapter over `DATABASE_URL`, connecting/disconnecting via `OnModuleInit`/`OnModuleDestroy`. `src/prisma/prisma.module.ts` is `@Global()` so any future feature module can inject `PrismaService` without re-importing it. Wired into `AppModule`. Verified by booting `start:dev`: Nest logs `PrismaModule dependencies initialized`, no connection errors, and the existing `/api/health` round-trip still works — confirming Prisma's lifecycle hooks aren't blocking app startup.
7. ✅ Add `nestjs-zod`, wire a global `ZodValidationPipe`; one throwaway DTO to confirm validation rejects bad payloads. *Learning: Nest pipes.* (Done alongside task 9 — see its note.)
8. ✅ Nest `Logger` convention + `@nestjs/config` for env loading. *Learning: `ConfigModule` — injectable env config vs. raw `process.env`.*
   - Done: `@nestjs/config` (resolved to v12, matching the rest of Nest) wired via `ConfigModule.forRoot({ isGlobal: true, validationSchema })` in `app.module.ts`. `validationSchema` is a plain Zod schema (`src/config/env.validation.ts`) — `@nestjs/config` supports Standard Schema validators natively, so this reuses the project's existing Zod-first convention instead of pulling in `class-validator`/`class-transformer` just for env parsing. Schema covers `NODE_ENV`/`PORT`/`DATABASE_URL`/`FRONTEND_URL` with sane dev defaults; `DATABASE_URL` has none (a missing/invalid one fails startup loudly — verified by temporarily setting an invalid `DATABASE_URL` and confirming Nest throws `Config validation error: DATABASE_URL: Invalid URL` before the app boots). `main.ts` now reads `PORT`/`FRONTEND_URL` via an injected, generically-typed `ConfigService<EnvVariables, true>` instead of raw `process.env` — Nest logs a `Bootstrap` context log line on successful listen. Logger convention: `PrismaService` now instantiates `new Logger(PrismaService.name)` and logs on connect/disconnect, as the reference example for later services (`this.logger = new Logger(ClassName.name)`, one per injectable, no raw `console.log`).
9. ✅ Add `@nestjs/swagger` + `nestjs-zod`, wire `cleanupOpenApiDoc()` in `main.ts`, serve docs at `/docs`. *Learning: OpenAPI generation from code — docs stay in sync with the API because they're derived from the same DTOs, not hand-written separately.*
   - Done: added a throwaway `POST /ping` endpoint (`src/ping/`) with a Zod-backed DTO to prove the full loop — `/docs` renders Swagger UI, valid payloads return 201, invalid payloads are rejected with a 400 and a clear Zod error. This also completes task 7's validation-pipe goal (global `ZodValidationPipe` wired via `APP_PIPE` in `app.module.ts`). Note: `nestjs-zod`'s current API is `cleanupOpenApiDoc()`, not `patchNestJsSwagger()` as originally noted in tech-stack.md — corrected there. Also hit and fixed a `cleanupOpenApiDoc` "duplicate schema name" error caused by setting an explicit `.meta({id})` on the Zod schema — removed it and let `nestjs-zod` derive the schema name from the DTO class instead.
10. Confirm Vitest + Supertest smoke test passes out of the box.
11. ✅ Frontend `.env`/API base URL + a thin fetch wrapper.
   - Done: `apps/web/.env` (+ `.env.example`) sets `VITE_API_BASE_URL`; `apps/web/src/lib/api.ts` is the thin `fetch` wrapper (`credentials: 'include'` for future cookie-session auth).
12. ✅ Root dev script (plus Docker) running `apps/api` + `apps/web` concurrently. Checkpoint: browser → frontend fetch → Nest round-trips.
   - Done ahead of schedule, as a connectivity test: added `GET /api/health` (`src/health/`), a global `/api` route prefix, and `app.enableCors()` (origin from `FRONTEND_URL`, defaults to `localhost:5173`, `credentials: true`) — all not originally itemized in this phase but needed to prove cross-origin calls actually work. Added `BackendHealthCheck.tsx` component on the frontend homepage with a button that calls `GET /api/health` via the fetch wrapper. Verified live in Chrome: click → "✅ ok — &lt;timestamp&gt;" rendered from a real cross-origin request. Docker Compose (task 2) still outstanding — this checkpoint didn't need a DB.

## Phase 1: Auth & Multi-Tenant Foundation
**Goal:** `Workspace` + `User` as the root of every table, session login working, before any ticket logic.

1. Prisma schema for `Workspace` + `User` (`role`: `ADMIN`/`REPRESENTATIVE`, `workspaceId` FK). First real migration.
2. Seed script creating one workspace + one bcrypt-hashed admin user. *Learning: Prisma seeding as the standard "no signup UI yet" workflow.*
3. `bcrypt` hashing utility + `UsersService`; unit test it.
4. `@nestjs/passport` + `passport-local`; `LocalStrategy` against `UsersService`. *Learning: Passport strategies wrapped by a Nest Guard.*
5. `express-session` + `connect-pg-simple`, session table, middleware wired in `main.ts`.
6. `AuthController`: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`. *Learning: Nest Guards vs. pipes vs. interceptors.*
7. `SessionSerializer` (`serializeUser`/`deserializeUser`) so `req.user` populates from session. Checkpoint: login via curl, cookie round-trips through `/auth/me`.
8. `AuthenticatedGuard` applied globally except `/auth/*`. *Learning: global vs. route-scoped guards.*
9. `RolesGuard` + `@Roles()` custom decorator via `Reflector`. *Learning: metadata-based decorators.*
10. Admin-only `POST /users` / `GET /users`. Checkpoint: admin creates a rep; rep hitting an admin route gets 403.
11. `@CurrentWorkspace()` param decorator pulling `workspaceId` off `req.user` — the reusable hook that replaces deferred Postgres RLS with consistent application-level tenant scoping.
12. Frontend: login page (RHF+Zod), `useAuth` hook (`GET /auth/me` on load), route guarding. Checkpoint: full login flow works, session survives refresh.

## Phase 2: Core Ticket CRUD + Dashboard (No AI/Email Yet)
**Goal:** Prove out the domain model and full-stack CRUD pattern against manually created tickets before touching AI or email.

1. Prisma schema for `Ticket` (status `open`/`resolved`/`closed`, category enum, `assignedUserId`, `customerEmail`) and `TicketMessage` (`sender`: `customer`/`agent`/`ai`). Migrate.
2. `TicketsModule`/`Service`/`Controller`: `POST /tickets` (manual creation stands in for inbound email), `GET /tickets/:id`. *Learning: the module pattern repeated at scale, cementing Phase 0/1.*
3. `GET /tickets` with status/category filter + sort, workspace-scoped via `@CurrentWorkspace()`. Checkpoint: filtering/sorting works via query string.
4. `PATCH /tickets/:id` for status transitions (simple state-machine validation in the service) + manual assignment. `POST /tickets/:id/messages` to append a reply (reused later for AI-sent replies).
5. Supertest e2e for create/list/filter/status-transition. *Learning: Nest's e2e pattern — real app module in-process against a test DB.*
6. Frontend: ticket dashboard (filter/sort table) + manual "create ticket" form (RHF+Zod).
7. Frontend: ticket detail page (thread view, status badge, assignment, manual reply box, status controls). Checkpoint: full manual ticket lifecycle works end to end in the UI.
8. Dashboard polling (10–15s refetch) — the "real-time-ish" mechanism per tech-stack.md, no WebSockets.
9. Add a `TicketEvent` table (`type`, `payload`, `createdAt`) now, cheaply, so later AI phases have a place to log actions into.

## Phase 3: Knowledge Base + Vector Search + AI Drafting/Summarization
**Goal:** Layer AI/KB onto the manually created tickets from Phase 2, isolating pgvector raw SQL and the Claude/Voyage integration from email-webhook complexity.

1. Prisma schema for `KbArticle` (title, body, category, workspace-scoped). Migrate.
2. Raw-SQL migration (`migrate dev --create-only`, hand-edit) adding `embedding vector(1024)` + an ivfflat/hnsw index. *Learning: Prisma migrations are just tracked `.sql` files you can hand-write for what the schema DSL can't model.*
3. `KbModule` CRUD, admin-only via `RolesGuard`. Checkpoint: CRUD an article via curl.
4. Voyage AI SDK: `EmbeddingsService.embed(text)`. Store embedding via `$executeRaw` on create/update (Prisma can't map the vector column). *Learning: `Prisma.sql` tagged templates for safe raw SQL.*
5. `KbSearchService.findBestMatch(embedding, workspaceId, category)` via `$queryRaw` using pgvector's `<=>` cosine-distance operator. *Learning: why similarity search bypasses Prisma's query builder.*
6. Frontend: KB management UI (admin-only route guard). Checkpoint: seed 2–3 articles per category through the UI.
7. Anthropic SDK: `AiService.classify(subject, body)` and `AiService.draftReply(thread, kbArticle)`, using structured/tool-use output. *Learning: prompting for structured LLM output instead of parsing free text.*
8. Wire classification into ticket creation. Checkpoint: manual ticket gets auto-categorized.
9. Wire the core auto-resolution orchestration: classify → embed → KB search → if matched **and** not money/account-sensitive (explicit guard, checked via keyword/LLM check since category alone isn't granular enough) → draft reply → post as `TicketMessage(sender: ai)` → status `resolved` → record `usedKbArticleId`. Otherwise ticket stays `open`, unassigned. *Learning: this orchestration in `TicketsService` is the core of the whole product — one service composing several others.*
10. `POST /tickets/:id/ai/summary` and `.../ai/suggest-reply` for human-handled open tickets (suggestion only, not auto-sent).
11. "Customer requests human" override — manual "escalate" action for now (no real customer channel yet) that reopens/reassigns regardless of AI resolution.
12. Frontend: "AI Summary"/"Suggest Reply" buttons on ticket detail (rep-only, open/assigned tickets); show "resolved via KB article X" banner when AI-resolved. Checkpoint: a ticket matching a seeded KB article auto-resolves; a refund-flavored one stays open with human tools available.

## Phase 4: Email Ingestion (SendGrid)
**Goal:** Replace manual ticket creation with real inbound/outbound email — pure transport-layer work; all business logic upstream already works.

1. SendGrid Inbound Parse → local tunnel (ngrok) → `POST /webhooks/email/inbound`, log-only first. Checkpoint: test email arrives and logs.
2. Webhook signature verification as a Guard/middleware. *Learning: HMAC/signature verification for third-party webhooks, distinct from your own app auth.*
3. Idempotency: dedupe on provider message-id before creating a ticket. *Learning: idempotency keys for at-least-once delivery webhooks.*
4. Parse payload → reuse the Phase 2/3 creation+classify+auto-resolve pipeline as-is. Checkpoint: real email matching a KB article auto-resolves in the dashboard.
5. Match inbound replies to existing threads (reply-to convention or `References`/`In-Reply-To` headers) → append `TicketMessage(sender: customer)` instead of new ticket.
6. `EmailService.send(...)` via SendGrid outbound, wired wherever an `ai`/`agent` message is created. *Learning: outbound SDK integration + correct threading headers.*
7. Basic outbound failure handling (log + surface status; note as the explicit hook point for the deferred pg-boss queue).
8. End-to-end checkpoint: real external email in → full pipeline → reply lands back in the test inbox, zero manual steps.

## Phase 5: Polish & Hardening
**Goal:** Round out remaining spec items and light hardening appropriate for MVP scope.

1. Audit logging: extend `TicketEvent` to record every AI action (classified, kb-matched, auto-resolved, summary/suggestion generated); surface as a ticket timeline.
2. Admin UI for rep account management (list/create/deactivate — no fine-grained permissions per scope).
3. Dashboard polish (status/category badges, empty/loading states, pagination if needed).
4. Ticket detail polish (clear customer/agent/AI message distinction, KB-article link banner).
5. Formalize the money/account-sensitive guard from Phase 3.9 into a named, unit-tested `RiskClassifier.isSensitive(ticket)` — the one rule the spec insists must never be bypassed.
6. Nest exception filters for uniform API error shapes + frontend error handling. *Learning: exception filters as the counterpart to guards/pipes/interceptors.*
7. Fill e2e coverage gaps (webhook idempotency, sensitive-category never-auto-resolves, role-guard enforcement).
8. README pass documenting env vars, local setup, and on-ramps for every deferred item (pg-boss queue point, RLS as defense-in-depth alongside `@CurrentWorkspace()`, shared Zod package, attachments/object storage, observability, deployment target).

## Critical files
- `apps/api/prisma/schema.prisma` — multi-tenant data model every phase extends.
- `apps/api/src/prisma/prisma.service.ts` — injectable Prisma client; home for raw pgvector `$queryRaw`/`$executeRaw` calls.
- `apps/api/src/auth/` — strategy, guards, session serializer; defines `@CurrentWorkspace()`/`@Roles()` used everywhere downstream.
- `apps/api/src/tickets/tickets.service.ts` — orchestration hub (classify → KB search → draft → auto-resolve), called from both manual creation and the email webhook.
- `apps/api/src/webhooks/email-inbound.controller.ts` — signature-verification/idempotency boundary where untrusted external input enters the system.

## Verification
Each phase ends with an explicit checkpoint (noted inline above) that can be run by hand: `docker compose` + curl/Postman checks in Phases 0–1, full browser click-through in Phase 2, manually-triggered AI resolution in Phase 3, and a real external email round-trip in Phase 4. Supertest e2e suites accumulate alongside the API (Phases 1–4) and should be run (`npm run test:e2e`) before moving to the next phase. No CI/deployment verification is in scope yet (deferred).
