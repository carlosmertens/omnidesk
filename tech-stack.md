# OmniDesk v1 Tech Stack (MVP)

Scope: fast path to a working v1 per `project-scope.md` (email-only, multi-tenant, AI first-response over a KB, admin + representative roles). Complex/production-grade concerns are explicitly deferred rather than decided now — see bottom.

## Frontend
- **React + TypeScript + Vite + React Router** — SPA for ticket dashboard and detail views.
- **Tailwind CSS + Shadcn UI** — fast build of data-dense tables, dialogs, sidebars.
- **Zod + React Hook Form** (`@hookform/resolvers/zod`) — form validation and type inference.
  - Schemas live in `packages/shared` (see Monorepo below) so frontend and backend import the same source of truth instead of copy-pasting.

## Monorepo
- **pnpm workspaces** — `apps/api` (NestJS), `apps/web` (Vite React), `packages/shared` (Zod schemas and any other cross-cutting types). Chosen over npm/yarn workspaces for speed/disk efficiency, and over Turborepo/Nx as unnecessary tooling overhead for a two-app MVP.

## Backend
- **NestJS** (chosen over Express specifically) — module/DI structure absorbs the complexity being deferred now (queues, WebSockets, guards) without a later rewrite; also a deliberate learning goal for this project.
- **`nestjs-zod`** — reuses the same Zod schemas as DTOs/validation pipes instead of duplicating with `class-validator`.
- **Nest's built-in `Logger`** — structured logs (context, level) instead of raw `console`, at no extra setup cost.
- **`@nestjs/swagger` + `nestjs-zod`'s `cleanupOpenApiDoc()`** — official Nest OpenAPI module, generating interactive Swagger UI docs directly from the existing Zod DTOs (no separate schema duplication just for docs). Served at `/docs`.
- **Vitest + Supertest** — ships free with the Nest CLI scaffold (Nest v12's default for new ESM-first projects is Vitest, not Jest; adopted as-is rather than fighting the CLI default).
- **ESM** (`"type": "module"`) — Nest v12's default module system for new projects.

## Database & ORM
- **PostgreSQL + Prisma** (via a `PrismaService`/`PrismaModule`, the standard Nest DI pattern).
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
- **Docker Compose**: Postgres + pgvector only (`pgvector/pgvector:pg16`).
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
