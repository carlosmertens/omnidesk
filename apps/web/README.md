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

Requires `VITE_API_BASE_URL` (see `.env`, defaults to `http://localhost:3000/api`) pointing at a running API — the homepage includes a "Check backend health" button (`src/components/BackendHealthCheck.tsx`) that calls `GET /api/health` to verify the connection.

## Other scripts
```bash
pnpm run build    # type-check + production build to dist/
pnpm run preview  # preview the production build locally
pnpm run lint     # oxlint
```
