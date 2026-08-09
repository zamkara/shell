<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:ui-rules -->

# UI Architecture Rules

- NEVER use page-level headers (`<h1>` and page descriptions with buttons directly inside the page).
- ALL page actions must be placed inside a `Toolbar` component located in the global layout header.
- The `Toolbar` component must read its static configuration (e.g. list of buttons per page) from `src/lib/data.ts`.
- NEVER use React inline `style` props or inline CSS in source files.
- NEVER use literal/custom palette colors or page-local dark-mode color overrides. Visual colors must come from semantic tokens defined by the global theme and owned by reusable UI primitives.
- NEVER set typography sizes in application components, including arbitrary `text-[...]` values or Tailwind `text-xs` through `text-9xl` overrides. Typography belongs to the global stylesheet or reusable UI primitives.
- Keep code clean and modular.

<!-- END:ui-rules -->

<!-- BEGIN:local-testing-rules -->

# Local Testing Rules

- Place all newly created test files, ad hoc test scripts, and test fixtures under the repository-root `.local-tests/` directory.
- Do not place test files alongside application or package source code unless the user explicitly requests tracked tests.
- `.local-tests/` is ignored by Git so temporary verification files do not pollute the repository.

<!-- END:local-testing-rules -->

<!-- BEGIN:documentation-continuity-rules -->

# Documentation Continuity Rules

- Record verified architecture, endpoint contracts, data shapes, implementation findings, and user decisions in `docs/AGENT_NOTES.md`.
- Update the notes whenever implementation behavior or repository rules change.
- Clearly distinguish implemented behavior from planned or documented-only behavior; treat executable code as the source of truth.

<!-- END:documentation-continuity-rules -->

<!-- BEGIN:database-query-rules -->

# Database Query Rules

- NEVER introduce N+1 database queries.
- NEVER execute a database query once per item or from inside a collection-processing loop.
- Load related or repeated data with a bounded query strategy such as `JOIN`, batch lookup, array parameters, aggregation, or explicit preload.
- Review query counts for collection endpoints and document the expected bounded number of queries before considering the implementation complete.
- NEVER allow unbounded duplicate HTTP, RSC, or client data requests; effects, redirects, retries, polling, and development tooling must have a bounded request count.
- Verify request counts in the browser network panel when changing routing, authentication, or client-side data loading.

<!-- END:database-query-rules -->
