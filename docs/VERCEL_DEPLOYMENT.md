# Vercel Deployment

Deploy this monorepo as two Vercel Projects from the same Git repository. The API must be deployed first because the web build rejects a missing production `BACKEND_URL`.

## 1. Prepare Supabase

Apply the SQL in `apps/api/database/schema.sql` for a new database. For an existing database, apply the numbered files in `apps/api/database/migrations/` in order. Use the Supabase Session Pooler IPv4 connection on port `5432` with `sslmode=require`; do not use the direct IPv6 database hostname.

Use separate Supabase projects for production and staging when possible. Pointing Preview deployments at the production API allows preview code to mutate production data.

## 2. Create the API Project

Import the repository into Vercel and configure:

- Project name: for example `almatera-api`
- Root Directory: `apps/api`
- Framework Preset: Other
- Production Branch: `main`

Leave Vercel's detected Turbo build command unchanged. The `api` workspace intentionally has no Node `build` script: Vercel's Go Runtime compiles `api/index.go` in its runtime builder instead of trying to execute the unavailable `go` binary inside the preliminary pnpm/Turbo build image.

The API project declares the empty `public` output directory in `vercel.json`. It satisfies Vercel's preliminary monorepo output check; application requests remain served by the Go Function and its API rewrites.

The API domain root redirects to `/api`, where the lightweight health response is served. This keeps direct browser visits useful without adding a separate static landing page.

Set these encrypted variables for Production and the appropriate Preview environment:

```text
DATABASE_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SECRET_KEY
```

`SUPABASE_SECRET_KEY` is server-only. Never expose it through a `NEXT_PUBLIC_` variable or commit it to Git. `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_JWT_SECRET` are compatibility fallbacks only.

Deploy and verify that `GET https://<api-project>.vercel.app/api` returns `{"status":"success","message":"API is ready"}`.

## 3. Create the Web Project

Import the same repository again and configure:

- Project name: for example `almatera-shell`
- Root Directory: `apps/web`
- Framework Preset: Next.js
- Production Branch: `main`

Set `BACKEND_URL=https://<api-project>.vercel.app` for Production. Use a staging API URL for Preview if previews must not access production data. Do not add a trailing slash.

## 4. Verify the Deployment

- `/` redirects to `/shell`; unauthenticated shell access redirects to `/auth`.
- Login creates a secure HTTP-only session cookie and logout removes it.
- Projects, FAQs, Pricing, and Site Content list and detail requests succeed.
- Search, pagination, row limit, CRUD, image upload, roles, and permissions work.
- A list page performs one bounded collection request, with no request loop or N+1 database query.
- Browser console and Vercel Function logs contain no secrets or hydration errors.

Environment changes apply only to new deployments, so redeploy after editing a variable. Rotate any secret that has previously been shared outside the Vercel/Supabase secret stores.
