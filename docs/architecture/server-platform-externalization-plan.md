# ServerPlatform Externalization Plan and Plugin Data Contract

## Status

This plan is historical implementation context. The current server platform lives in `libs/server-platform`, while `apps/api` is the thin bootstrap host.

## Objective

Extract the current server-side platform from `apps/api` into an external reusable library while keeping `apps/api` as a thin bootstrap host.

At the same time, define a stable plugin data contract so feature modules (for example: `pages`) can be attached without changing core internals.

## Scope

In scope:

- Server platform extraction to a publishable library.
- Plugin registration model for backend modules.
- Data contracts for plugin HTTP endpoints and plugin metadata.
- Migration of current `pages` feature into a plugin package.

Out of scope:

- Full frontend plugin extraction (covered only where required by API contracts).
- Business logic changes unrelated to pluginization.

## Original State (Before Extraction)

- `apps/api/src/app/app.ts` autoloads `plugins` and `routes` from app-local directories.
- Core concerns and feature concerns are mixed in one runtime.
- `pages` routes live in `apps/api/src/app/routes/pages.ts`.
- `pageStore` is currently created in `apps/api/src/app/plugins/database/pageStore.ts` and decorated in `apps/api/src/app/plugins/database/index.ts`.
- Auth/session store logic (for example `apps/api/src/app/plugins/database/store.ts`) is core-level and should remain in core.

## Target Architecture

## Naming Decision

- Backend platform name: `ServerPlatform`.
- Frontend platform name: `WebPlatform`.
- This document focuses on backend extraction and plugin contracts, but naming is aligned across both sides.

## Workspace Shape (Monorepo)

```text
libs/
  server-platform/
    src/lib/
      createServerPlatform.ts
      serverPluginRegistry.ts
      contracts/
        plugin.contract.ts
        capability.contract.ts
      runtime/
        context.ts
  plugins/
    pages/
      server/
        src/lib/
          index.ts
          plugin.ts
          routes.ts
          store.ts
          migrations.ts
      ui/
        src/lib/
          index.ts
          plugin.tsx
          routes.tsx

apps/
  api/
    src/main.ts  # bootstrap only
```

## Package Shape (Monorepo Internal)

Recommended package split inside this monorepo:

- `libs/server-platform`: runtime + plugin registration + server contracts.
- `libs/server-platform-contracts` (optional): type-only package for plugin contracts.

This split avoids forcing plugin modules to depend on server runtime implementation details.

## Plugin Data Contract

## Contract Goals

- Keep plugin integration explicit and typed.
- Allow runtime registration of routes, migrations, and optional capabilities.
- Avoid leaking internal core services by default.

## Type Contract (First Version)

```ts
import type { FastifyBaseLogger, FastifyInstance } from 'fastify';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | { [key: string]: JsonValue }
  | JsonValue[];

export interface ServerPlatformAuthStoreUser {
  id: string;
  email: string;
  role: string;
  displayName: string;
}

export interface ServerPlatformAuthSession {
  token: string;
  userId: string;
  expiresAt: number;
  userEmail: string;
  userRole: string;
}

export interface ServerPlatformAuthStore {
  findUserById(id: string): ServerPlatformAuthStoreUser | undefined;
  findSession(token: string): ServerPlatformAuthSession | undefined;
  createSession(userId: string): string;
  deleteSession(token: string): void;
}

export interface ServerPlatformSessionService {
  createSession(userId: string): string;
  invalidateSession(token: string): void;
  deleteExpiredSessions(now: number): void;
}

export interface ServerPlatformDbStatement<
  TParams extends readonly JsonValue[] = readonly JsonValue[],
  TResult = JsonValue,
> {
  get(...params: TParams): TResult | undefined;
  all(...params: TParams): TResult[];
  run(...params: TParams): { changes: number };
}

export interface ServerPlatformDbClient {
  prepare<
    TParams extends readonly JsonValue[] = readonly JsonValue[],
    TResult = JsonValue,
  >(
    sql: string,
  ): ServerPlatformDbStatement<TParams, TResult>;
  exec(sql: string): void;
}

export interface ServerPlatformPluginMeta {
  id: string;
  version: string;
  description?: string;
  dependsOn?: string[];
  capabilities?: string[];
}

export interface ServerPlatformPluginContext {
  fastify: FastifyInstance;
  services: {
    authStore: ServerPlatformAuthStore;
    sessionService: ServerPlatformSessionService;
    db: ServerPlatformDbClient;
    logger: FastifyBaseLogger;
  };
}

export interface ServerPlatformMigration {
  id: string;
  up: (ctx: ServerPlatformPluginContext) => Promise<void> | void;
}

export interface ServerPlatformPlugin {
  meta: ServerPlatformPluginMeta;
  migrations?: ServerPlatformMigration[];
  register: (ctx: ServerPlatformPluginContext) => Promise<void> | void;
}
```

## HTTP Data Contract Rules for Plugins

Each plugin must:

- Keep request/response DTOs in shared contracts package (for example `@my-org/shared` or `libs/server-platform-contracts`).
- Version all public DTO changes using semantic versioning.
- Use explicit error shape:

```ts
export interface ApiErrorResponse {
  message: string;
  code?: string;
  details?: Record<string, JsonValue>;
}
```

For `pages` plugin specifically:

- Move page DTOs to shared contract module.
- Keep response envelopes stable (`{ pages: [...] }`, `{ page: ... }`).
- Add contract tests to guarantee backward compatibility.

## Migration Strategy

## Phase 0 - Preparation

Deliverables:

- Baseline test snapshot for current API behavior.
- Inventory of core modules vs feature modules.
- Decision log in ADR style.

Tasks:

1. Mark core modules (auth, oauth orchestration, session, base db wiring).
2. Mark feature modules (`pages`) for plugin extraction.
3. Freeze public API behavior with tests.

## Phase 1 - Create ServerPlatform Library

Deliverables:

- `libs/server-platform` with `createServerPlatform` entrypoint.
- Plugin registry and contract definitions.

Tasks:

1. Create `createServerPlatform` that configures server platform plugins/routes only.
2. Add `registerPlugins(plugins: ServerPlatformPlugin[])` flow.
3. Keep app-local bootstrap minimal in `apps/api/src/main.ts`.

Acceptance:

- API boots with no feature plugins.
- Existing auth/session endpoints still work when core routes are enabled.

## Phase 2 - Extract Pages Into Plugin

Historical implementation tasks:

Deliverables:

- `libs/plugins/pages/server` package.
- `libs/plugins/pages/ui` package for `WebPlatform` integration.
- Pages-specific store and migrations relocated from core db plugin.

Tasks:

1. Move `pages` routes from `apps/api/src/app/routes/pages.ts` to plugin routes.
2. Move `pageStore` implementation from core db area into plugin package.
3. Register server plugin in bootstrap list.

Acceptance:

- `/api/pages` and `/api/pages/:slug` are served only when `pages/server` plugin is installed.
- ServerPlatform works without `pages/server` plugin.

## Phase 3 - Contract Hardening

Deliverables:

- Shared DTO source of truth and contract tests.
- Backward compatibility policy.

Tasks:

1. Introduce plugin contract tests (request/response snapshots).
2. Add schema validation for plugin responses where possible.
3. Define deprecation policy for DTO fields.

Acceptance:

- Contract tests block breaking API changes.
- Plugin package versioning follows semver.

## Delivery Boundary

Current plan scope ends at monorepo readiness. Packaging/publication outside this monorepo is intentionally out of scope for now.

## Bootstrap Design (apps/api)

`apps/api` should only:

1. Read env and TLS config.
2. Create Fastify instance.
3. Build plugin list.
4. Call server platform registration.
5. Start server.

Pseudo-shape:

```ts
const plugins: ServerPlatformPlugin[] = [pagesServerPlugin()];
await createServerPlatform(server, { plugins });
```

No feature route/store logic should remain in `apps/api`.

## Data Ownership Boundaries

ServerPlatform owns:

- Authentication and session lifecycle.
- Core database connection lifecycle.
- Shared runtime context and plugin orchestration.

Plugin owns:

- Feature-specific tables/migrations.
- Feature routes and feature stores.
- Feature DTO evolution within contract rules.

## Versioning and Compatibility

- `libs/server-platform`: MAJOR bump for contract breaking changes.
- Plugin libraries in `libs/plugins/*`: independent versioning, but must declare compatible contract version in docs and changelog.

## Testing Plan

Required test layers:

1. Server platform unit tests for plugin registry and initialization order.
2. Plugin integration tests (`pages` mounted/unmounted scenarios).
3. Contract tests for DTO payload stability.
4. End-to-end smoke tests for bootstrap app.

Minimum CI gate:

- `lint`, `typecheck`, `test`, `build` for core and plugin packages.

## Risks and Mitigations

Risk: Hidden coupling between core db plugin and pages store.
Mitigation: Move pages persistence fully into plugin and expose only minimal core db handle in context.

Risk: Route conflicts from plugin catch-all patterns.
Mitigation: Define routing conventions and priority order in plugin registry.

Risk: Contract drift between frontend and backend.
Mitigation: Keep DTOs in one shared package + contract tests.

## Execution Checklist

- [ ] Create `libs/server-platform` and move server composition from `apps/api/src/app/app.ts`.
- [ ] Introduce `ServerPlatformPlugin` contract and plugin registry.
- [ ] Refactor `apps/api/src/main.ts` to bootstrap-only host.
- [ ] Extract `pages` routes and store into `libs/plugins/pages/server`.
- [ ] Add paired `WebPlatform` extension in `libs/plugins/pages/ui`.
- [ ] Move pages migrations to plugin package.
- [ ] Keep auth/session store (including `store.ts`) in core package.
- [ ] Add contract tests for pages DTOs and error responses.

## Definition of Done

Done when:

- `apps/api` contains bootstrap code only.
- ServerPlatform works as a reusable library consumed by apps inside this monorepo.
- Pages feature is installable/removable as plugin.
- Plugin data contract is versioned, tested, and documented.
- Pages plugin namespace is split into `server` and `ui` modules under `libs/plugins/pages/`.
