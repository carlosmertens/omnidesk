# OmniDesk Web

React + TypeScript + Vite frontend for OmniDesk. See the [root README](../../README.md) for full-stack setup; this covers running the frontend on its own.

## Requirements
- Node 24+, pnpm 10+ (managed at the workspace root)
- The API running (see `../api/README.md`) for the frontend to have anything to talk to

## Run

From the workspace root (recommended):

```bash
pnpm --filter web run dev
```

Or from this directory:

```bash
pnpm run dev
```

Serves on **http://localhost:5173** with hot module replacement.

Requires `apps/web/.env` (`cp .env.example .env`) with `VITE_API_BASE_URL` pointing at a running API, including its `/api` prefix (e.g. `http://localhost:3000/api`).

Sign in at `/login` with the seeded admin (see the root README — default `admin@example.com` / `SeedPass#1234`).

## Structure

| Path | What |
|---|---|
| `src/main.tsx` | Router: `/login` is public; everything else goes through `RequireAuth` → `AppShell` |
| `src/lib/api.ts` | `fetch` wrapper — prefixes `VITE_API_BASE_URL`, sends `credentials: 'include'` for the session cookie |
| `src/lib/auth-context.tsx` | `AuthProvider` / `useAuth()` — calls `GET /auth/me` on load, exposes `login()` / `logout()` |
| `src/components/LoginPage.tsx` | Email + password form (React Hook Form + Zod) |
| `src/components/RequireAuth.tsx` | Redirects to `/login` when signed out |
| `src/components/AppShell.tsx` | Signed-in chrome: bordered top bar with brand, role badge, and sign out |
| `src/components/DashboardPage.tsx` | Dashboard (placeholder until Phase 2's ticket list) |
| `src/components/ui/` | shadcn/ui components (Base UI primitives) |
| `src/index.css` | Tailwind v4 + shadcn's default theme tokens (Nova preset, neutral base color) |

## Other scripts
```bash
pnpm run build    # type-check + production build to dist/
pnpm run preview  # preview the production build locally
pnpm run lint     # oxlint
```
