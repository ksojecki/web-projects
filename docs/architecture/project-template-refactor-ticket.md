# Refactoring Ticket: Convert `rod-manager` into a Reusable Project Template

## Tracking Note

This document is architecture context for the project-template refactor.

- Track active work, progress updates, and sequencing in GitHub issues.
- Keep ADRs and roadmap updates in the repository when the durable architecture or implementation plan changes.
- Use `docs/architecture/project-template-implementation-roadmap.md` as the execution guide for the remaining work.

## Summary

`rod-manager` is now being treated as a reusable project template and reference implementation, not as a single authenticated portal that hosts multiple products on one shared user base.

The repository direction is locked:

- reusable platform code lives in `libs/`
- concrete product implementations live in `projects/<product>/`
- each product keeps its own database, users, sessions, OAuth records, and product data
- reuse happens through shared libraries and generators rather than one multi-product runtime

This ticket now documents the current architecture state, the major refactor moves that are already complete, and the remaining work needed to make the template workflow fully reusable.

## Problem Statement

The workspace already had strong reusable backend foundations, but its frontend auth/account composition and some product boundaries were still too tightly coupled to `rod-manager`.

Without a clearer template model:

1. new projects would still require copying `rod-manager` application code
2. product-specific behavior would keep leaking into shared layers
3. isolated auth and database ownership could be broken by implicit defaults instead of explicit per-product contracts

## Target Outcome

The refactor is complete when:

- `rod-manager` remains a working reference product
- reusable auth, session, OAuth, and account foundations are shared through platform libraries
- each project can bootstrap its own `api` and `web` apps with isolated auth data
- product-specific features remain under `projects/<product>/`
- creating a new project is a scaffolded workflow rather than a copy-paste exercise

## Locked Constraints

- Do not introduce a shared multi-tenant user base across products.
- Do not turn `rod-manager` into a runtime host for many products under one `/account`.
- Keep documentation and generated code in English.
- Follow existing Nx, TypeScript, Fastify plugin, and formatting conventions.
- Treat registration as a product-scoped capability:
  - shared platform code may provide registration primitives
  - each product decides whether registration routes and UI are enabled

## Scope

### In Scope

- shared backend and frontend platform foundations
- product-scoped bootstrap contracts
- clear boundaries between shared libraries and product code
- generator-based project scaffolding
- architecture and validation rules that preserve per-product isolation

### Out of Scope

- shared cross-project SSO or identity merging
- replacing SQLite as part of this refactor
- moving product features such as CMS behavior into shared libraries
- treating this ticket as the live progress tracker

## Current State

### Locked Architecture Direction

The workspace structure should remain:

- shared platform code in `libs/`
- product implementations in `projects/<product>/`
- optional product-local feature plugins under `projects/<product>/plugins/`
- per-product application bootstrap for both backend and frontend

The durable model is template reuse through libraries, composition files, and generators, not through one runtime serving many products from one authenticated shell.

### Completed Architecture Moves

The following refactor steps are already reflected in the repository:

- `libs/server-platform` is the shared backend platform entrypoint.
- backend bootstrap is now explicitly product-scoped through `projects/rod-manager/apps/api/src/productConfig.ts`.
- `projects/rod-manager/apps/api/src/main.ts` acts as a thinner product bootstrap that passes explicit product configuration into `createServerPlatform`.
- `libs/web-platform` exists as the shared frontend platform library for auth/account foundations.
- reusable auth mechanics already live in `libs/web-platform`, including auth provider logic, route guarding, OAuth callback handling, request helpers, and form schemas.
- reusable account shell mechanics already live in `libs/web-platform`, including the account shell, authentication methods panel, password management form, and related types.
- `projects/rod-manager` now composes shared account/auth pieces instead of owning all of those mechanics directly.
- `rod-manager` account content is already split between shared platform sections and product-local composition through `projects/rod-manager/apps/web/src/app/account/rodManagerAccountSections.tsx`.
- the account section extension contract is intentionally kept as an ordered content-block API, with product-local account configuration deciding which sections render and in what order.
- language and user-settings persistence remain product-local in `rod-manager` instead of moving into `libs/web-platform` before a second product proves a shared settings contract is needed.

### Boundaries That Must Stay Intact

- shared platform libraries may own auth, session, OAuth, account shell, and generic UI foundations
- product apps own routes, navigation, branding, and product-specific page composition
- product plugins own feature behavior such as CMS routes, persistence, and content-management UI
- product-only DTOs must not remain in generic shared packages long term

## Remaining Gaps

The template direction is established, but the workflow is not complete yet.

### Product Configuration Surface

The repository still needs a more explicit frontend product-configuration surface so products can declare:

- public home route
- post-login route
- navigation items
- branding choices
- whether registration is enabled

Shared frontend code should expose primitives and composition points, not own top-level application routes directly.

### Route and Registration Composition

Some route and screen composition is still product-local in `rod-manager` and should be made more intentionally configurable:

- login and registration entry points
- post-auth redirects
- route ownership around `/account` and product pages
- registration enablement as a per-product decision instead of an implicit always-on assumption

### DTO Ownership Cleanup

`libs/shared` should contain only genuinely reusable contracts. The page DTO move is now complete through `projects/rod-manager/plugins/pages/shared`, but product-owned contracts still need periodic review so future product-specific types do not drift back into generic packages.

### Generator and Sample Project Validation

The template is not complete until a generator and a second sample project prove that:

- a new project can be scaffolded without copying `rod-manager`
- the new project uses shared platform libraries
- the new project has its own database and user base
- no `rod-manager` CMS behavior is required to bootstrap another product

### Documentation Follow-through

Once generator and sample-project validation land, the repo still needs final documentation updates that explain:

- how to add a new product
- what belongs in `libs/`
- what belongs in `projects/<product>/`
- how auth and database isolation are preserved

## Recommended Remaining Workstreams

### Workstream 1: Frontend Product Composition

- formalize frontend product configuration contracts
- make registration explicitly configurable per product
- reduce remaining hardcoded route and redirect assumptions

### Workstream 2: Shared Contract Cleanup

- review shared DTO exports
- keep product-owned DTOs in product-owned packages such as `projects/rod-manager/plugins/pages/shared`
- keep platform exports generic and free from CMS terminology

### Workstream 3: Generator and Isolation Proof

- add a project generator under the repo tooling conventions
- generate one sample second project
- validate separate database and user ownership

### Workstream 4: Final Docs and Workflow Guidance

- update contributor and agent docs once the scaffolded workflow is real
- keep GitHub issues as the live tracker for sequencing and status

## Acceptance Criteria

- `rod-manager` still boots and preserves its current auth/account behavior.
- Shared auth/session/OAuth/account mechanics live in reusable libraries, not only in `rod-manager` app code.
- Backend bootstrap stays explicitly product-scoped.
- Frontend composition exposes product-level control over registration and route decisions.
- A new project can be scaffolded with its own `api` and `web` apps.
- A scaffolded project uses a separate database and separate user base.
- Product-specific features remain under `projects/<product>/`.
- Docs clearly explain how to add another project and what must remain isolated.

## Risks and Trade-offs

### Risk: Shared APIs still leak product assumptions

If route names, DTOs, or section APIs retain `rod-manager` or CMS assumptions, future products will inherit the wrong boundaries.

Mitigation:

- keep shared exports generic
- validate against a sample second project before freezing the template surface

### Risk: Frontend composition remains too implicit

If frontend route ownership and registration behavior are not made explicit, a second product will still require manual rewiring.

Mitigation:

- formalize product composition contracts
- make registration and redirect behavior explicit product settings

### Risk: Generator validation is skipped

If the repo stops after library extraction, the template may look reusable but still require hidden `rod-manager` knowledge to start a second product.

Mitigation:

- require one generated sample project as proof
- verify separate database and auth ownership during that exercise

## Validation Plan

At minimum, validate the full refactor stream with:

1. `rod-manager` auth login/register/logout flow
2. OAuth callback flow still working in `rod-manager`
3. account page still functioning in `rod-manager`
4. a generated second project booting successfully
5. the generated second project creating users in its own database
6. no session or user crossover between the two products
7. `npx nx run-many -t lint test build typecheck --no-tui`

## Relationship to Other Architecture Docs

- `docs/architecture/adr/0002-project-template-strategy.md` records the top-level decision.
- `docs/architecture/project-template-implementation-roadmap.md` contains the implementation sequence and file-level targets.
- This ticket should stay focused on architecture context, current state, and remaining gaps rather than live status tracking.
