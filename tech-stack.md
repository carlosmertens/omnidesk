# OmniDesk v1 Tech Stack (MVP)

Scope: fast path to a working v1 per `project-scope.md` (email-only, multi-tenant, AI first-response over a KB, admin + representative roles). Complex/production-grade concerns are explicitly deferred rather than decided now — see bottom.

## Frontend
- **React + TypeScript + Vite + React Router** — SPA for ticket dashboard and detail views. Router wired in `main.tsx` (`BrowserRouter` + a `Layout` component rendering `<Outlet />`) — declarative mode, not the data/framework router, since this is a plain Vite SPA.
- **Tailwind CSS v4** (`@tailwindcss/vite` plugin) **+ shadcn/ui** (Nova preset, **Base UI** primitives) — fast build of data-dense tables, dialogs, sidebars. Base UI over Radix because it's the shadcn CLI's current recommended default (`shadcn@latest init -b base`), not a deliberate Radix rejection — consistent with this project's "follow current tool defaults" pattern elsewhere (ESM+Vitest, oxlint, pg18). `@` import alias configured in `vite.config.ts` + `tsconfig.app.json` (`paths` only — `baseUrl` is deprecated in the TypeScript version this project is on).
- **Zod + React Hook Form** (`@hookform/resolvers/zod`) — form validation and type inference.
  - Schemas live in `packages/shared` (see Monorepo below) so frontend and backend import the same source of truth instead of copy-pasting.

## Formatting & linting
- **oxlint** (linting) + **Prettier** (formatting) in both apps — the Nest v12 and Vite CLI defaults; kept as-is rather than adopting Biome, since Biome would replace two already-working, framework-default tools for marginal benefit. `apps/web` originally shipped with no formatter (oxlint doesn't format); added Prettier there to match `apps/api`.
- `.zed/settings.json` (committed) disables the Biome language server per-project for JS/TS/TSX/JSON (`"language_servers": ["!biome", "..."]`). This is a necessary workaround, not a nicety: Zed's Biome extension auto-activates its language server for any JS/TS project the moment it's installed, with no global settings.json toggle to turn that off — so per-project disabling is the only way to keep Biome diagnostics out of this repo without uninstalling the extension entirely. No explicit formatter config needed — Zed has built-in Prettier support, enabled by default for TypeScript, that auto-detects each app's `.prettierrc`. (No `.vscode/settings.json` is committed: the user's global VSCode default that forced Biome has since been removed, so there's no active problem left for a workspace override to solve.)

## Monorepo
- **pnpm workspaces** — `apps/api` (NestJS), `apps/web` (Vite React), `packages/shared` (Zod schemas and any other cross-cutting types). Chosen over npm/yarn workspaces for speed/disk efficiency, and over Turborepo/Nx as unnecessary tooling overhead for a two-app MVP.

## Backend
- **NestJS** (chosen over Express specifically) — module/DI structure absorbs the complexity being deferred now (queues, WebSockets, guards) without a later rewrite; also a deliberate learning goal for this project.
- **`nestjs-zod`** — reuses the same Zod schemas as DTOs/validation pipes instead of duplicating with `class-validator`.
- **Nest's built-in `Logger`** — structured logs (context, level) instead of raw `console`, at no extra setup cost. Convention: one `private readonly logger = new Logger(ClassName.name)` per injectable that needs to log.
- **`@nestjs/config`, validated with a plain Zod schema** — `ConfigModule.forRoot({ isGlobal: true, validationSchema })` fails startup fast (and loudly) on missing/invalid env vars instead of failing later with a confusing `undefined` somewhere downstream. Uses `@nestjs/config`'s native Standard Schema support so the same Zod-first pattern covers env validation too, instead of adding `class-validator` just for this.
- **`@nestjs/swagger` + `nestjs-zod`'s `cleanupOpenApiDoc()`** — official Nest OpenAPI module, generating interactive Swagger UI docs directly from the existing Zod DTOs (no separate schema duplication just for docs). Served at `/docs`.
- **Global `/api` route prefix** (`app.setGlobalPrefix('api')`) — conventional REST API namespacing (e.g. `GET /api/health`); Swagger UI stays unprefixed at `/docs`.
- **CORS via `app.enableCors()`** — origin read from `FRONTEND_URL` env var (defaults to `http://localhost:5173`), `credentials: true` for the cookie-based session auth planned in Phase 1.
- **Vitest + Supertest** — ships free with the Nest CLI scaffold (Nest v12's default for new ESM-first projects is Vitest, not Jest; adopted as-is rather than fighting the CLI default).
- **ESM** (`"type": "module"`) — Nest v12's default module system for new projects.

## Database & ORM
- **PostgreSQL + Prisma 7** (pinned to `7.10.0`; npm's `latest` tag currently points at an `8.0.0-rc.*` pre-release, so this needs pinning explicitly rather than a bare install), via a `PrismaService`/`PrismaModule` — the standard Nest DI pattern (`OnModuleInit`/`OnModuleDestroy` lifecycle hooks, `@Global()` module).
  - Prisma 7 is architecturally different from earlier Prisma versions: no Rust query engine binary, client code generates into the project source tree (`apps/api/src/generated/prisma`, gitignored) instead of `node_modules`, and every `PrismaClient` requires an explicit driver adapter — `@prisma/adapter-pg` (+ `pg`) for Postgres — rather than a bundled engine. Config lives in `apps/api/prisma.config.ts`.
  - Prisma is not a perfect fit for this project specifically — no native `vector` type, so KB similarity search requires raw `$queryRaw` SQL. Accepted as a known, bounded exception rather than a blocker; Drizzle (native pgvector support) is the realistic alternative if this becomes a real pain point later, but stacking a second unfamiliar tool on top of learning NestJS isn't worth it for v1.
  - Every table carries `workspace_id` from day one, even with a single real tenant early on — cheap now, painful to retrofit.

## Vector search
- **pgvector** (Postgres extension) — stores knowledge base embeddings for the AI response-matching flow.

## AI
- **Anthropic Claude** — classification, summaries, drafting.
- **Voyage AI** — embeddings (Anthropic has no embeddings API; Voyage is their recommended pairing).

## Auth
- **`@nestjs/passport` + `passport-local`, session-based** — session store in the existing Postgres (`connect-pg-simple`), password hashing via **bcrypt**.
  - Deliberately not fully custom session handling — same DB-backed cookie session shape, but built on maintained libraries to avoid hand-rolled auth security bugs.

## Email
- **SendGrid** (picked over Mailgun to avoid carrying an undecided either/or) — outbound delivery and inbound parse webhook for email ingestion.
  - Webhook signature verification and idempotency handling (avoid duplicate tickets on webhook retries) required at implementation time.

## Real-time dashboard updates
- **Polling** (e.g. every 10–15s) — sufficient feel at MVP agent volumes; WebSockets is a clean later upgrade (Nest has first-class support when needed).

## Containerization
- **Docker Compose**: Postgres + pgvector only (`pgvector/pgvector:pg18` — Postgres 18 is current as of this writing, checked via context7/Docker Hub rather than assuming pg16).
  - Postgres 18's official image changed its data-directory convention: the named volume must mount at `/var/lib/postgresql` (not `/var/lib/postgresql/data`, the pg16/17 convention) or the container crash-loops on start. Worth knowing if bumping the major version again later.
- Run the Nest server directly (`npm run start:dev`) locally for fastest iteration; add it to Compose closer to deployment.

## Ticket model (from project-scope.md, for reference)
- Statuses: `open` → `resolved` → `closed`.
- Categories: `general question`, `technical (account) question`, `order status`.

---

## Deferred (explicitly punted, not forgotten)
- **Background job queue** — none for v1; AI calls run synchronously inside the webhook handler. Keep the classify → embed → search → draft chain fast enough to beat the email provider's webhook timeout. Add **pg-boss** (runs on existing Postgres, no new infra) as a Nest module once this becomes a bottleneck.
- **Row-Level Security** for tenant isolation — rely on Prisma query-level `workspace_id` filtering for now; add Postgres RLS once there's more than one paying tenant.
- **Attachments / object storage** — v1 handles text-only email bodies; add S3/R2 when attachment support is needed.
- **Error tracking / observability stack (e.g. Sentry)** — defer until the core ticket → AI → reply loop works end-to-end; keep enough structured logging in the meantime to manually audit AI-sent replies (ticket id, KB article used, AI vs. human).
- **Production deployment target** — not yet chosen.
