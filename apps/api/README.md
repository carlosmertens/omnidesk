# OmniDesk API

NestJS backend for OmniDesk. See the [root README](../../README.md) for full-stack setup; this covers running the API on its own.

## Requirements
- Node 24+, pnpm 10+ (managed at the workspace root)
- PostgreSQL + pgvector running (see root README's Docker Compose step)

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

## Other scripts
```bash
pnpm run build       # compile to dist/
pnpm run start:prod  # run compiled output
pnpm run lint        # oxlint
pnpm run test        # unit tests (Vitest)
pnpm run test:e2e    # e2e tests (Vitest, Supertest)
```
