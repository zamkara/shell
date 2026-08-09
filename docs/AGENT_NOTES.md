# Repository Findings and Decisions

This file is the persistent handover record for verified repository behavior and user-directed rules. Update it after material architecture, API, data-contract, or workflow changes. Code is the source of truth when older documentation disagrees.

## Current Backend Architecture

`apps/api` is a Go `net/http` service using PostgreSQL through `pgxpool`. Supabase provides authentication and the database. JWTs are verified by `SupabaseAuthMiddleware`. `LoadAccessMiddleware` performs one aggregate query for all roles and effective permissions; downstream role and permission checks use that request-context snapshot without more queries.

Required backend environment variables are `DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY`. `SUPABASE_JWT_SECRET` is also required when validating an HMAC-signed token. Creating users additionally requires the server-only `SUPABASE_SECRET_KEY` (preferred) or legacy `SUPABASE_SERVICE_ROLE_KEY`. Supabase pooler connectivity must remain IPv4-compatible for Vercel.

## Implemented Go API Endpoints

### `/api`

- Handler currently accepts any HTTP method.
- Queries `SELECT version()` and returns `{ status, message, db_version }`.
- Supports response field pruning through `?fields=status,message`.

### `/api/projects`

- `GET` is public and returns a paginated collection containing only `id`, `title`, and `tagline`, ordered by `created_at DESC`.
- `GET /api/projects/<uuid>` returns one complete project through one `WHERE id = $1` query; slug filtering is not implemented.
- `POST`, `PUT`, and `DELETE` return `501 Not Implemented`; other methods return `405`.

### `/api/auth/login`

- `POST` only; input is `{ email: string, password: string }`.
- Proxies the credentials to Supabase password authentication and forwards its status and JSON response, including `access_token` and `expires_in` on success.

### `/api/auth/session`

- `GET` only and protected by JWT verification plus `shell.access`.
- Returns `{ authenticated: true, user_id, user: { id, name, email, avatar_url, role, roles, permissions } }`.
- Ensures the authenticated user has a `profiles` row, then returns its current name and avatar. An empty stored avatar resolves to the SHA-256 Gravatar URL for the normalized email with an identicon fallback.
- Used by the frontend login flow before storing the session cookie.

### `/api/profile`

- `GET` requires `profile.read`; `PUT` requires `profile.update`.
- `GET` returns `{ id, email, full_name, display_name, avatar_url, resolved_avatar_url, role, roles, permissions, created_at, updated_at }`; it creates the legacy user's profile row from verified JWT claims when missing.
- `PUT` accepts only `{ full_name, avatar_url }`. Email and role remain read-only because they are owned by Supabase Auth and RBAC.
- Each request performs one aggregate access query and one profile upsert/query. The count is fixed and contains no query loop.

### `/api/admin/projects`

- Every method requires a valid JWT and `admin` role.
- `POST` creates a project and returns `201` with `{ message, id }`.
- `PUT?id=<uuid>` replaces all editable project fields and returns a message.
- `DELETE?id=<uuid>` deletes the project and returns a message.
- `GET` and unsupported methods return `405`.

### Public content endpoints

- Every collection GET (`/api/projects`, `/api/faqs`, `/api/pricing`, `/api/content`) accepts the shared `search`, `page`, and `limit` parameters. Defaults are `page=1` and `limit=10`; the global parser caps `limit` at 100.
- Every collection response uses `{ items, total, page, limit }`. The shared frontend hook and collection panel own query state, fetching, search, pagination, and custom row limits for all Shell list pages.
- FAQ lists return only `id` and `question`; pricing lists return only `id` and `name`; site-setting lists return only `key`. Their `/api/<collection>/<id>` detail endpoints fetch one complete item only after it is opened.
- `GET /api/faqs` additionally supports the exact `category` filter; admin-only `POST`, `PUT?id=<uuid>`, and `DELETE?id=<uuid>` mutate one row per request.
- `GET /api/content` additionally accepts exact `key`; admin-only `PUT /api/content` upserts one JSONB setting and `DELETE?id=<key>` removes one setting.
- Collection reads use a bounded list query plus count query. No content handler performs queries inside a loop, so collection size never increases the number of database round trips.

## Implemented Identity and Permission Modules

- Existing databases must run `apps/api/database/migrations/003_add_role_permissions.sql`. It adds `permissions`, `role_permissions`, audit timestamps, indexes, protected system records, and default grants for `admin`, `editor`, and `viewer`.
- `/api/auth/session` requires `shell.access`. Session and profile payloads include `role`, `roles`, and `permissions`; profile also includes `updated_at`.
- `/api/admin/users[/{id}]`, `/api/admin/roles[/{id}]`, and `/api/admin/permissions[/{id}]` require both the `admin` role and the method-specific `module.read|create|update|delete` permission.
- The three list endpoints use the global server-side `search`, `page`, and `limit` contract. Each list has exactly two SQL queries (aggregated list plus count), detail has one, and relationship replacement uses array-backed statements inside one transaction. There are no query loops.
- User creation uses the Supabase Admin API only from Go, followed by a transactional profile/role insert. The current user and last remaining admin cannot be deleted. System roles cannot be renamed/deleted; saving `admin` always restores every permission. Seeded permissions cannot be renamed/deleted.
- Every shell page and toolbar action declares a permission in `apps/web/lib/data.ts`. The global `AccessProvider` filters sidebar and toolbar entries. The backend remains authoritative; direct navigation also checks page access.
- Sidebar navigation is a configuration-driven tree built as `SHELL_NAV_TREE` from `PAGE_CONFIGS`. `Content` contains Projects, FAQs, Pricing, and Site Content; `Administration` contains Users, Roles, and Permissions. Permission and role filtering is applied to children before rendering, empty parents are omitted, active parents open automatically, and navigation continues through `router.push` without full-page reloads. Do not recreate flat page lists or hardcode this grouping in `shell.tsx`.
- Users, Roles, and Permissions reuse the same dynamic shell route, `ContentList`, `CollectionWorkspace`, global empty state, server-side search, and pagination as all other content modules.
- The Roles editor adapts the reference Role & Permission workflow through the reusable schema control `permission-matrix`: permissions are fetched once as a bounded catalog, grouped by module, support group select/clear, and show added/removed changes against the opened role snapshot. Role selection remains in the global collection panel and Save remains in the global toolbar, so there is no duplicate role selector or page-local action bar. The system `admin` permission set is read-only because the backend always restores every permission for that role.
- Permission rows inside each role module use the global `List`/`ListItem` primitives. `ListItem` is the sole owner of row borders and selected background; its inner toggle is a borderless `ghost` button whose radius inherits the row. Each module has one outer `Frame` containing a semantic `FieldSet`, while `FramePanel` and `ButtonGroup` remain absent so row borders and corner radii are not duplicated.
- Shared collection-option requests are cached by endpoint to prevent duplicate HTTP fetches across editor controls. Mutating a source collection invalidates its catalog cache so later role or user editors do not display stale permissions or roles.
- `/api/admin/upload` checks for `projects.create` or `projects.update` before processing an image.

## Project Data Contract

Project fields are `id`, `slug`, `title`, `status`, `tagline`, `challenge`, `solution`, `image_url`, `image_thumbnail_url`, `hero_url`, `hero_thumbnail_url`, `ratio`, `live_url`, `tags`, `media`, `media_thumbnail_urls`, `meta`, `stats`, `created_by`, and `created_at`. Every full-size image has a companion thumbnail: the two scalar pairs must be present together, while `media` and `media_thumbnail_urls` must have equal length and matching indexes. `status` is the PostgreSQL enum `project_status` and only accepts `draft`, `archived`, or `published`; omitted status values normalize to `draft`. Database-required input fields are `slug`, `title`, `image_url`, `image_thumbnail_url`, and `ratio`. `tags`, `media`, and `media_thumbnail_urls` are string arrays; `meta` and `stats` are JSONB that may be objects or arrays because Petot stores project statistics as an array. The editor normalizes legacy missing thumbnails to the corresponding full URL. `id` defaults to UUIDv4 and `created_at` defaults to the current time. Public project reads currently omit `created_by` from their SQL selection.

Existing databases must apply `apps/api/database/migrations/001_add_project_status.sql` before deploying code that selects the new column. The migration is idempotent and assigns `draft` to existing rows through the non-null column default.

Existing databases must also apply `apps/api/database/migrations/002_add_project_image_thumbnails.sql`. It adds the three companion thumbnail columns, backfills existing providers with their full URL as the safe fallback, and installs database constraints for scalar pairing and media-array cardinality.

The schema also defines `faqs`, `pricing_tiers`, `site_settings`, `profiles`, `roles`, and `user_roles`. FAQ, pricing, and site-setting list, detail, and mutation endpoints are implemented.

At the repository boundary, pass `ProjectStatus` as `string` and cast its SQL parameter to `project_status`. Passing the custom Go string type directly can leave `pgx` without an encoding plan for the PostgreSQL enum. Project insert and update each remain one query.

Validate project `meta` and `stats` as JSON, pass them as JSON text, and cast their SQL parameters to `jsonb`. Do not pass `map[string]interface{}` directly to `pgx` because pooler/prepared-statement type inference can report unknown OID 0; do not pass marshaled `[]byte` because PostgreSQL can interpret it as `bytea` instead of JSON text.

## Frontend BFF and Access Rules

- `/` has no page component and redirects to `/shell`.
- `/shell` requires the HTTP-only `access_token` cookie and a successful admin-session validation; otherwise it redirects to `/auth`.
- The shell layout reads the protected profile endpoint and passes that snapshot into the single global sidebar footer. The server profile helper is memoized per render so `/shell/profile` and its parent layout do not duplicate the request. `POST /api/auth/logout` expires the HTTP-only cookie before navigating to `/auth`.
- Next.js rewrites project list/detail requests to Go; `/api/admin/projects` forwards authenticated mutations.
- Next.js `POST /api/auth/login` accepts credentials in an HTTP request body, validates the resulting admin session, stores the JWT in an HTTP-only cookie, and returns no token to the browser code. Do not pass passwords as Server Action arguments because Next.js development logging can expose those arguments.
- Next.js `/api/admin/upload` requires `projects.create` or `projects.update`, converts images to WebP with Sharp, and uploads them to PiXhost. Its `url` is the direct full-size `https://imgN.pixhost.cc/images/...` URL derived from PiXhost's returned `th_url`; `thumbnail_url`/`th_url` retain the distinct `https://tN.pixhost.cc/thumbs/...` asset. `show_url` is only the Pixhost viewer page and is never persisted as an image asset.
- Login, shell-session calls, and the admin-project proxy use `BACKEND_URL`, defaulting locally to `http://localhost:8080`.
- Each Project Card has one icon-only actions menu. `Duplicate` immediately submits one new project with `status: "draft"`, a UUID-suffixed copy slug, and no copied `id`/`created_at`; it then refreshes the collection once and selects the persisted duplicate. `Delete` confirms once, sends one `DELETE /api/admin/projects?id=<uuid>` request, then refreshes the collection once.
- Project collection loading uses one summary SQL query selecting only `id`, `title`, and `tagline`. Opening a card performs one detail query for that ID. Duplicate performs one detail query, one insert query, and one subsequent summary collection query; its database round trips stay bounded regardless of collection size.
- The Empty primitives live globally in `packages/ui/src/components/empty.tsx`. Only `apps/web/components/collection-panel.tsx` imports them; page components do not import or render Empty primitives.
- Collection workspace layout, search, loading, error, list/editor empty states, pagination, and custom row limits are rendered only by `apps/web/components/collection-panel.tsx`. Per-collection icons, labels, empty copy, editor schemas, search placeholders, actions, and endpoints live in `COLLECTION_CONFIGS` inside `apps/web/lib/data.ts`.
- Collection rows use the global `List`/`ListItem` primitives from `packages/ui/src/components/list.tsx`. `CollectionPanel` writes the `List` wrapper once for every Shell collection; the vertical grouping removes adjacent top borders and inner corner radii, matching `ButtonGroup` without double borders or focus-ring collisions. Unselected rows stay transparent; only the selected row receives the semantic `bg-muted` state.
- Pagination navigation is owned by the global `CollectionPanel`; previous and next controls use the transparent `ghost` button variant so navigation does not introduce persistent row-like backgrounds. Both controls remain disabled while the collection request is loading, keeping the SSR and first client render deterministic before page bounds are known.
- Theme state is owned only by `next-themes` in the root layout. It applies the global `.dark` class to the document and persists the preference; do not add manual theme scripts, `localStorage` synchronization, or page-level theme providers.
- Toolbar actions use the global shadcn `Button` with `variant="outline"`. Keep the registry's semantic outline treatment intact, including its `input`-token dark surface; never add action-specific color classes in `Toolbar` or page configuration.
- The global collection workspace places the editor/detail panel on the left and the narrower searchable collection list on the right. Preserve this order and the matching `1fr 20%` Shell grid globally; do not reorder panels per page.
- `/shell` owns the single Shell layout. FAQ, Pricing, and Site Content share one dynamic `app/shell/[collection]/page.tsx` route and one schema-driven `ContentList`; there are no repeated page implementations for those collections.
- Multiline scalar values use the shared `AdaptiveTextInput`, which switches to a textarea when the current value contains a newline.
- Inline React `style` props are forbidden across application and UI-package source. Dynamic shell sizing now uses flex/min-height layout, media thumbnail sizing uses aspect-ratio layout, and sidebar dimensions are global CSS variables.
- Application components must not set font-size utilities. Typography comes from global base styles or UI primitives. Arbitrary font sizes, literal palette colors, and component-local `dark:` color overrides are forbidden; reusable primitives consume semantic global theme tokens.

## Open Findings

- Linting currently stops before source analysis because the installed `typescript-eslint` version does not support TypeScript 7.0.
- No tracked frontend or Go test files currently exist.
- Pooler documentation and code comments mention different ports (`5432` and `6543`); confirm the deployed connection mode before changing database configuration.

## Resolved Findings

- Production deployment uses two Vercel Projects imported from the same monorepo: `apps/api` is a single Go Function entrypoint and `apps/web` is the Next.js project. The API deploys first; the web production build requires its deployed origin through `BACKEND_URL` and never falls back to localhost in production.
- The API workspace intentionally declares no package-level `build` script. Vercel may run its detected `turbo run build` preliminary command, but Go compilation must remain owned by the Vercel Go Runtime builder; a package script calling `go build` runs in Vercel's Node build image where `go` is unavailable.
- The API Vercel Project explicitly uses the tracked empty `apps/api/public` output directory. Turbo has no API build task, while the output directory satisfies Vercel's monorepo output validation before the Go Function is packaged.
- The API Vercel root redirects to `/api`; the production health endpoint therefore remains the single canonical response for both direct domain visits and health checks.
- `BACKEND_URL` is the only deployment variable allowlisted for Turbo build tasks. It is required by the web production build; database and Supabase server credentials remain exclusive to the API Vercel Project.
- Shared Go handlers live in `apps/api/httpapi`, not `internal/httpapi`. Vercel compiles a generated wrapper under the separate `handler/api` module path; Go's internal-package boundary would reject that wrapper's transitive Function import if the Function entrypoint imported `terabe/internal/httpapi` directly.
- The public API health response no longer opens a database connection or exposes the PostgreSQL server version. Serverless pgx pools are capped at four connections per warm function instance and use the Supabase-compatible simple protocol.
- Vercel environment values are documented in `docs/VERCEL_DEPLOYMENT.md`. Production and Preview must be configured independently; Preview should use staging infrastructure to avoid mutating production data.

- Repeated `/auth?_rsc` requests were caused by a corrupted Turbopack HMR subscription after route changes, not by application data fetching. The old `.next` cache was moved to `/tmp/shell-next-cache-hmr-loop-20260809-0035` and the dev stack was restarted. After restart, `/auth` remained at one page request with no recurring HMR errors.
- Login previously used a Server Action with email and password arguments, which Next.js printed in development logs. Login now uses a Route Handler request body so credentials are not emitted as Server Action arguments.

## User-Directed Repository Rules

- N+1 database access is forbidden. Collection size must not increase the number of database round trips; use joins, batching, aggregation, array parameters, or explicit preload instead.
- Never place database queries inside loops over records. Record the expected bounded query count when adding or changing a collection endpoint.
- Unbounded duplicate browser, RSC, or API requests are forbidden. Routing, auth checks, effects, retries, and polling must have a bounded and verified request count.
- Page actions belong in the global-header `Toolbar`, with static configuration from `apps/web/lib/data.ts`.
- Profile is a shell-owned shadcn `Dialog`, opened from the user menu at the bottom of the sidebar without changing the active page or URL. It edits the current user's name and optional custom avatar; its Save action belongs to `DialogFooter` because Profile is not a page.
- Shared dialogs use their primitive sections: `DialogHeader` owns identity and context, the body owns editable content, and `DialogFooter` contains actions only. Header and footer section treatment is defined once in `packages/ui/src/components/dialog.tsx`, not repeated by consumers.
- `DialogFooter` distributes direct actions into equal-width columns. A direct `ButtonGroup` automatically fills the footer and gives each grouped action an equal `flex-1` share. The shared `Avatar` primitive provides an `xl` preset for identity-focused dialog headers; consumers select the preset instead of adding local sizing classes.
- The shell brand is `Almatera Incubator` with the description `Landing Control Centre`. Its logo geometry is embedded in `components/shell.tsx` and uses `currentColor` with the semantic `sidebar-foreground` token, so rendering does not fetch an external logo and remains theme-adaptive. `SidebarMenuButton` only applies its default SVG size when the SVG has no explicit `size-*` preset, allowing the brand logo's `size-8` to render as intended.
- The Projects toolbar owns the status selector. It dispatches `set-status` with `draft`, `archived`, or `published`; `ProjectForm` updates local state and the existing Save action persists it without an extra request.
- Do not add page-level headers or page-local action bars.
- Put temporary tests, fixtures, and verification scripts in `.local-tests/`, which is ignored by Git.
- Preserve user changes in the dirty worktree and keep implementations modular.
- Do not add inline `style` props, literal/custom palette colors, application-level font-size utilities, or local dark-mode color overrides. Put reusable visual rules in global CSS or shared UI primitives and use semantic theme tokens.
- Use Tailwind v4 canonical data variants and child selectors (for example, `data-expanded:`, `group-data-expanded/name:`, and `*:data-[slot=…]:`) instead of equivalent legacy arbitrary-selector forms.

## Petot Consumer Migration

- `/home/zam/Projects/petot` currently stores its consumer content as constants in `src/lib/data.ts`; it does not query Supabase yet.
- `apps/api/database/seed_petot.sql` is the idempotent handoff seed for that content. Run `schema.sql` (and the project-status migration for an existing database) before the seed.
- The seed publishes all six listed projects. Only Lezza has full challenge, solution, metadata, statistics, hero, and gallery values in Petot; the remaining five retain their exact catalog fields and intentionally have no invented detail content.
- Global Petot constants are stored in `site_settings` as JSONB under descriptive keys (`process`, `build_items`, `services`, `engagements`, `how_we_work`, `stats`, `brands`, `contact_links`, `nav`, and image keys). FAQs and pricing tiers use their dedicated tables.
