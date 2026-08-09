# Almatera Landing Control Centre

Admin shell monorepo containing a Next.js frontend, a Go API, and shared shadcn UI primitives.

## Repository layout

- `apps/web` — authenticated Next.js shell and server-side BFF routes.
- `apps/api` — Go API, Supabase authentication, PostgreSQL repositories, and the Vercel Function entrypoint.
- `packages/ui` — shared UI primitives and global theme tokens.
- `docs` — contributor findings and deployment instructions.

## Local checks

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
```

The developer controls `pnpm dev`. The Go API reads `apps/api/.env.local`; the web app reads `apps/web/.env.local` or its Vercel environment.

## Deploying

Deploy the API and web app as two Vercel Projects from the same Git repository. Follow [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md) for the exact root directories, environment variables, deployment order, and verification checklist.
