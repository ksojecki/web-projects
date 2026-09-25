# Family project — implementation plan

## Goal

Add a new `family` product to the existing `ksojecki/web-projects` workspace and deploy it as the private application behind `rodzina.sojecki.pl`.

The project should reuse the existing platform architecture and authentication implementation instead of introducing Astro or a second authentication stack.

The work is split into three platform concerns:

1. create the `family` product using the existing project conventions,
2. establish PostgreSQL as the production persistence stack,
3. establish a repeatable Render deployment model for this workspace.

Public report publishing is intentionally treated as a separate architecture track. The existing public `sojecki.pl` publication flow remains in place until that track is explicitly migrated.

## Scope

### In scope

- new `projects/family` product,
- existing shared auth/session/OAuth implementation,
- user invitation flow,
- PostgreSQL production persistence,
- local/test database strategy compatible with the production abstraction,
- Render Web Service deployment,
- Render PostgreSQL,
- `rodzina.sojecki.pl` custom domain,
- repository-owned deployment configuration where practical,
- migrations and deployment-safe database lifecycle,
- production verification,
- explicit architecture decision for public report publishing.

### Out of scope for the first MVP

- replacing the existing authentication implementation,
- introducing Better Auth,
- introducing Astro into `family`,
- migrating the public `sojecki.pl` site immediately,
- moving the report publication source of truth away from `knowledge_base`,
- implementing family-domain features before the platform foundation is production-ready.

## Existing platform assumptions

The implementation should preserve current workspace conventions:

- React SSR frontend,
- Fastify backend,
- shared `libs/server-platform`,
- shared `libs/web-platform`,
- shared UI and DTO packages,
- project-specific configuration through `productConfig`,
- Oxlint, Oxfmt, Husky, lint-staged and Nx workflows,
- current session and OAuth behavior.

Authentication itself is not redesigned by this project.

## Target repository structure

```text
web-projects/
├── projects/
│   └── family/
│       ├── apps/
│       │   ├── api/
│       │   └── web/
│       ├── plugins/
│       ├── docs/
│       │   └── implementation-plan.md
│       ├── README.md
│       └── AGENTS.md
├── libs/
│   ├── server-platform/
│   ├── web-platform/
│   ├── shared/
│   └── ui/
└── render.yaml / deployment configuration
```

Use the existing project generator where possible rather than hand-creating a divergent project layout.

## Authentication

### Preserve the existing implementation

Do not replace or redesign the current login/session/OAuth stack.

The `family` project should configure and consume the existing platform authentication capability.

Any changes required for `family` should be implemented as reusable platform capabilities only when they are genuinely generic.

### Registration

Keep the current registration model unchanged unless implementation of invitations requires a small explicit extension.

The family product should not depend on open public registration as its membership model.

## User invitations

Add an invitation capability on top of the existing user/auth system.

The expected model:

1. an authorized existing user creates an invitation for an email address,
2. the server stores the invitation,
3. the invite has a cryptographically random token,
4. the invite has an expiry,
5. the invite can be accepted only once,
6. invitation acceptance results in or links to a normal platform user account,
7. after acceptance, normal existing login mechanisms are used,
8. the invitation does not create a parallel authentication path.

### Initial authorization

For the first family deployment, seed or otherwise bootstrap the initial administrator account using the existing platform mechanism.

After bootstrap, adding further family members should happen through invitations rather than manual database changes.

### Suggested invitation data model

```text
user_invitations
- id
- email
- token_hash
- invited_by_user_id
- role
- created_at
- expires_at
- accepted_at
- revoked_at
```

Store only a hash of the invitation token when practical.

Invitation roles should initially be intentionally small, for example:

- `admin`
- `member`

Do not build a generalized enterprise RBAC system for the MVP.

### Invitation UX

Minimum UI:

- member management page,
- invite by email,
- list pending invitations,
- revoke pending invitation,
- acceptance page,
- clear expired/already-used invitation states.

Email delivery can be implemented after the invitation domain model if necessary. The first version may expose or copy the invite link to the administrator, but the domain/API must not depend on that temporary delivery mechanism.

## PostgreSQL

### Goal

Replace the assumption that production persistence is SQLite-only with a database abstraction that supports PostgreSQL as the production database for `family`.

Do not introduce project-local SQL access that bypasses the shared database/platform layer.

### Required discovery before implementation

Inventory the current database contract in:

- `libs/server-platform`,
- authentication/session storage,
- migrations,
- project plugins that receive database context,
- tests that instantiate `better-sqlite3`,
- generator templates,
- product configuration.

Classify SQLite-specific behavior into:

- API surface that can remain unchanged,
- SQL syntax differences,
- transaction differences,
- migration behavior,
- connection lifecycle,
- test-only assumptions.

### Target direction

Prefer a shared database contract such as:

```text
server platform
      │
      ▼
database adapter / persistence contract
      │
      ├── PostgreSQL adapter  -> production
      └── test/local adapter  -> explicit decision
```

Avoid spreading driver-specific APIs through application plugins.

### Local development decision

Choose one of these approaches during implementation and document the choice:

**Preferred if operationally simple:**

- PostgreSQL locally and in production,
- same migration path everywhere,
- local PostgreSQL through Docker or an explicitly documented local service.

**Acceptable transitional option:**

- SQLite for fast isolated unit tests,
- PostgreSQL for integration tests and all deployed environments,
- only if the shared persistence contract and migration tests prove parity.

Do not assume SQL written for SQLite is portable to PostgreSQL.

### Database library

Select the PostgreSQL driver/query layer only after inventorying the current database APIs.

Selection criteria:

- small abstraction cost,
- explicit transactions,
- migration support,
- good TypeScript support,
- no need for a large ORM unless it materially simplifies the existing platform,
- easy use in Fastify and Vitest,
- support for Render PostgreSQL connection strings and TLS requirements.

Possible approaches to evaluate:

- `pg` with a thin repository/platform layer,
- Kysely,
- Drizzle.

Make the decision in a short ADR before broad migration.

### Migrations

The migration system must be safe for production deployment.

Requirements:

- migrations are ordered and idempotence assumptions are explicit,
- schema version is stored in the database,
- deployment fails rather than serving against an incompatible schema,
- migrations can run as an explicit deployment step,
- concurrent app startup must not race migrations,
- rollback policy is documented,
- migration tests run against PostgreSQL.

Do not silently run destructive migrations from every application process startup.

## Render deployment

### Goal

Create a repeatable production deployment for the `family` project on Render.

Target resources:

```text
Render Project / Production
├── family web service
│   └── rodzina.sojecki.pl
└── family PostgreSQL
```

The deployed service runs the Fastify backend and serves the SSR frontend using the existing workspace production model.

### Infrastructure as code

Prefer a repository-owned Render Blueprint (`render.yaml`) for non-secret infrastructure where it provides a clean representation of the service.

The configuration should define or document:

- service name,
- runtime,
- build command,
- start command,
- branch,
- health check,
- database resource,
- database connection environment variable,
- non-secret environment variables,
- custom domain setup where supported by the workflow.

Secrets remain in Render and are never committed.

### Monorepo build strategy

The Render build must target only what is required for the family deployment while keeping workspace dependency resolution correct.

Define explicit commands for:

- dependency installation,
- Nx synchronization/check if required,
- lint/typecheck/test gates appropriate for deployment,
- family API build,
- family web SSR build,
- production start.

Avoid rebuilding unrelated projects when Nx affected/project targeting can safely narrow the build.

### Production runtime

The production process should:

1. start one Fastify service,
2. expose the family API,
3. serve the family SSR application,
4. use PostgreSQL through `DATABASE_URL` or the selected canonical variable,
5. expose a lightweight unauthenticated health endpoint that does not leak data.

### Render environment

Expected environment categories:

**Database**

- PostgreSQL connection URL,
- pool configuration if required,
- TLS behavior where required by Render.

**Auth/session**

Reuse existing platform variables and production-safe secrets.

**OAuth**

Reuse the existing provider configuration mechanism.

Set the redirect base URL to:

```text
https://rodzina.sojecki.pl
```

**Application**

- production origin/base URL,
- project id/config,
- production ports only where Render requires them.

### Custom domain

Configure:

```text
rodzina.sojecki.pl
```

Definition of done:

- TLS is valid,
- auth callbacks return to the custom domain,
- cookies use production-safe attributes,
- direct access to protected routes behaves correctly,
- no generated links point to localhost or the Render fallback URL.

## Production verification

Do not equate a successful Render deployment with a successful application release.

For each deployment verify separately:

1. local/CI checks,
2. deployed commit SHA,
3. Render build status,
4. migration result,
5. runtime health,
6. database connectivity,
7. authentication flow,
8. SSR page behavior,
9. invitation flow,
10. custom domain behavior.

Document any area that cannot be verified instead of assuming success.

## Public report publishing

### Current position

Do not make the `family` project responsible for public reports in the first implementation.

Keep the existing path operational:

```text
knowledge_base
      ↓
publication preparation / validation
      ↓
ksojecki/sojecki.pl
      ↓
Astro static publication
      ↓
sojecki.pl
```

This isolates the private application migration from the public publishing system.

### Architecture decision to make later

After the family/PostgreSQL/Render stack is stable, evaluate whether public report publishing should:

#### Option A — remain in Astro

```text
sojecki.pl        -> Astro, public content
rodzina.sojecki.pl -> web-projects, private application
```

Advantages:

- minimal migration risk,
- public content remains optimized for static publication,
- no coupling between reports and authenticated application runtime.

#### Option B — move public web publishing into web-projects

Create a public product/service in the existing platform and replace Astro.

This should happen only if there is a concrete benefit such as:

- shared UI/runtime becoming more valuable than static simplicity,
- reports requiring server-side querying,
- reports being backed by PostgreSQL,
- one deployment stack materially reducing maintenance.

#### Option C — shared publication data, separate renderers

Keep `knowledge_base` as source of truth and produce a normalized publication artifact consumed by:

- Astro for public reports,
- family/web-projects for authenticated/private views.

This is the preferred direction if the same report data eventually needs both public and private presentation.

### Constraint

Do not solve report publishing by giving the production family service direct runtime access to the private `knowledge_base` repository.

Use an explicit build/import/publication boundary.

## Implementation phases

### Phase 0 — inventory and ADRs

- inspect existing database plugin contract,
- inspect auth/session persistence assumptions,
- inspect project generator output,
- inspect production build/start shape,
- write PostgreSQL adapter/query-layer ADR,
- write local database strategy ADR,
- decide Render Blueprint ownership/location.

Deliverable: architecture decisions with no broad refactor yet.

### Phase 1 — scaffold family

Generate the `family` project using existing workspace tooling.

Add:

- project README,
- local AGENTS rules,
- product configuration,
- minimal authenticated shell,
- tests.

Do not add domain features yet.

### Phase 2 — PostgreSQL platform support

Implement PostgreSQL support in the shared server platform.

Migrate at minimum:

- users/auth persistence,
- sessions,
- migrations,
- family storage.

Add PostgreSQL integration tests.

Do not migrate unrelated project data unless the platform change requires it.

### Phase 3 — invitations

Implement reusable invitation domain/API support.

Add family UI for:

- pending invitations,
- creating invitations,
- revocation,
- accepting invitations.

Keep normal login unchanged.

### Phase 4 — Render

Add production deployment configuration.

Provision:

- Web Service,
- PostgreSQL.

Configure production environment and deploy the family project.

### Phase 5 — custom domain and production auth

Attach `rodzina.sojecki.pl`.

Verify:

- HTTPS,
- session cookies,
- OAuth redirects,
- login/logout,
- invitation acceptance,
- protected API behavior.

### Phase 6 — MVP platform acceptance

The platform foundation is complete when:

- family is deployable from `main`,
- production uses PostgreSQL,
- migrations are deterministic,
- existing authentication works,
- users can be invited and accept an invitation,
- authenticated SSR works,
- deployment can be reproduced from repository configuration plus secrets,
- production health and database connectivity are observable.

Only after this milestone should normal family application modules be added.

### Phase 7 — report publishing decision

Review the real maintenance cost of:

- Astro public site,
- web-projects production stack,
- normalized report publication artifacts.

Choose Option A, B or C based on measured needs rather than preemptive consolidation.

## First implementation task

Start with Phase 0.

Do not begin the PostgreSQL migration by replacing `better-sqlite3` imports file-by-file.

First produce a concrete map of:

- database interfaces and driver leakage,
- auth/session tables and queries,
- migration entrypoints,
- generator assumptions,
- tests coupled to SQLite,
- production process entrypoint.

Then write the PostgreSQL persistence ADR and split the migration into small independently testable steps.
