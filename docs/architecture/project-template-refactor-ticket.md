# Refactoring Ticket: Convert `rod-manager` into a Reusable Project Template

## Tracking Note

Use this file as architecture context for the project-template refactor.

- Track active work, progress updates, and sequencing in GitHub issues.
- Keep ADRs and roadmap updates in the repository when the durable architecture or implementation plan changes.
- Use `docs/architecture/project-template-implementation-roadmap.md` as the execution guide for the remaining work.

## Summary

`rod-manager` is being treated as a reusable project template and reference implementation, not as a single authenticated portal that hosts multiple projects on one shared user base.

The repository direction is locked:

- reusable platform code lives in `libs/`
- concrete project implementations live in `projects/<project>/`
- each project keeps its own database, users, sessions, OAuth records, and project data
- reuse happens through shared libraries and generators rather than one multi-project runtime

This ticket documents the repository architecture state, the major refactor moves that are already complete, and the remaining follow-up work needed to keep the supported template workflow clear and durable.

## Problem Statement

The workspace already had strong reusable backend foundations, but its frontend auth/account composition and some project boundaries were still too tightly coupled to `rod-manager`.

Without a clearer template model:

1. new projects would still require copying `rod-manager` application code
2. project-specific behavior would keep leaking into shared layers
3. isolated auth and database ownership could be broken by implicit defaults instead of explicit per-project contracts

## Target Outcome

The refactor is complete when:

- `rod-manager` remains a working reference project
- reusable auth, session, OAuth, and account foundations are shared through platform libraries
- each project can bootstrap its own `api` and `web` apps with isolated auth data
- project-specific features remain under `projects/<project>/`
- creating a new project is a scaffolded workflow rather than a copy-paste exercise

## Locked Constraints

- Do not introduce a shared multi-tenant user base across projects.
- Do not turn `rod-manager` into a runtime host for many projects under one `/account`.
- Keep documentation and generated code in English.
- Follow existing Nx, TypeScript, Fastify plugin, and formatting conventions.
- Treat registration as a project-scoped capability:
  - shared platform code may provide registration primitives
  - each project decides whether registration routes and UI are enabled

## Scope

### In Scope

- shared backend and frontend platform foundations
- project-scoped bootstrap contracts
- clear boundaries between shared libraries and project code
- generator-based project scaffolding
- architecture and validation rules that preserve per-project isolation

### Out of Scope

- shared cross-project SSO or identity merging
- replacing SQLite as part of this refactor
- moving project features such as CMS behavior into shared libraries
- treating this ticket as the live progress tracker

## Current State

### Locked Architecture Direction

The workspace structure should remain:

- shared platform code in `libs/`
- project implementations in `projects/<project>/`
- optional project-local feature plugins under `projects/<project>/plugins/`
- per-project application bootstrap for both backend and frontend

The durable model is template reuse through libraries, composition files, and generators, not through one runtime serving many projects from one authenticated shell.

### Completed Architecture Moves

The following refactor steps are already reflected in the repository:

- `libs/server-platform` is the shared backend platform entrypoint.
- backend bootstrap is explicitly project-scoped through `projects/rod-manager/apps/api/src/productConfig.ts`.
- `projects/rod-manager/apps/api/src/main.ts` acts as a thinner project bootstrap that passes explicit project configuration into `createServerPlatform`.
- `libs/web-platform` exists as the shared frontend platform library for auth/account foundations.
- reusable auth mechanics already live in `libs/web-platform`, including auth provider logic, route guarding, OAuth callback handling, request helpers, and form schemas.
- reusable account shell mechanics already live in `libs/web-platform`, including the account shell, authentication methods panel, password management form, and related types.
- `projects/rod-manager` composes shared account/auth pieces instead of owning all of those mechanics directly.
- `rod-manager` account content is already split between shared platform sections and project-local composition through `projects/rod-manager/apps/web/src/app/account/rodManagerAccountSections.tsx`.
- the account section extension contract is intentionally kept as an ordered content-block API, with project-local account configuration deciding which sections render and in what order.
- language and user-settings persistence remain project-local in `rod-manager` instead of moving into `libs/web-platform` before a second project proves a shared settings contract is needed.

### Supported Template Workflow

The repository already includes a supported scaffold-and-proof path:

- the root generator wrapper is `npm run generate:project -- <name>`
- the generator entrypoint is `./tools/generators.json:project-template`
- the current generated project in the workspace is `projects/recepturomat`
- generated backend apps use `projects/<project>/apps/api/src/productConfig.ts` for project-scoped bootstrap
- generated frontend apps use `projects/<project>/apps/web/src/app/productConfig.ts` for project-scoped routes, redirects, and registration settings

This is the workflow contributors should document and extend instead of describing project creation as hypothetical.

### Boundaries That Must Stay Intact

- shared platform libraries may own auth, session, OAuth, account shell, and generic UI foundations
- project apps own routes, navigation, branding, and project-specific page composition
- project plugins own feature behavior such as CMS routes, persistence, and content-management UI
- project-only DTOs must not remain in generic shared packages long term

## Remaining Gaps

The template direction is established and the scaffold workflow exists. The remaining gaps are about keeping boundaries clean, validating behavior deeply enough, and ensuring the docs describe the supported workflow accurately.

### Project Configuration Surface

The repository still needs a more explicit frontend project-configuration surface so projects can declare:

- public home route
- post-login route
- navigation items
- branding choices
- whether registration is enabled

Shared frontend code should expose primitives and composition points, not own top-level application routes directly.

### Route and Registration Composition

Some route and screen composition is still project-local in `rod-manager` and should be made more intentionally configurable:

- login and registration entry points
- post-auth redirects
- route ownership around `/account` and project pages
- registration enablement as a per-project decision instead of an implicit always-on assumption

### DTO Ownership Cleanup

`libs/shared` should contain only genuinely reusable contracts. The page DTO move is complete through `projects/rod-manager/plugins/pages/shared`, but project-owned contracts still need periodic review so future project-specific types do not drift back into generic packages.

### Generator and Sample Project Validation

The repository already includes a generator and a second sample project. Follow-up validation should continue proving that:

- a new project can be scaffolded without copying `rod-manager`
- the new project uses shared platform libraries
- the new project has its own database and user base
- no `rod-manager` CMS behavior is required to bootstrap another project

### Documentation Follow-through

The repository docs need to explain the supported workflow clearly:

- how to add a new project
- what belongs in `libs/`
- what belongs in `projects/<project>/`
- how auth and database isolation are preserved

## Recommended Remaining Workstreams

### Workstream 1: Frontend Project Composition

- formalize frontend project configuration contracts
- make registration explicitly configurable per project
- reduce remaining hardcoded route and redirect assumptions

### Workstream 2: Shared Contract Cleanup

- review shared DTO exports
- keep project-owned DTOs in project-owned packages such as `projects/rod-manager/plugins/pages/shared`
- keep platform exports generic and free from CMS terminology

### Workstream 3: Generator and Isolation Proof

- keep the project generator aligned with the actual supported scaffold surface
- keep `recepturomat` useful as the generated second project proof
- continue validating separate database and user ownership

### Workstream 4: Final Docs and Workflow Guidance

- update contributor and agent docs once the scaffolded workflow is real
- keep GitHub issues as the live tracker for sequencing and status

## Acceptance Criteria

- `rod-manager` still boots and preserves its current auth/account behavior.
- Shared auth/session/OAuth/account mechanics live in reusable libraries, not only in `rod-manager` app code.
- Backend bootstrap stays explicitly project-scoped.
- Frontend composition exposes project-level control over registration and route decisions.
- A new project can be scaffolded with its own `api` and `web` apps.
- A scaffolded project uses a separate database and separate user base.
- Project-specific features remain under `projects/<project>/`.
- Docs clearly explain how to add another project and what must remain isolated.

## Risks and Trade-offs

### Risk: Shared APIs still leak project assumptions

If route names, DTOs, or section APIs retain `rod-manager` or CMS assumptions, future projects will inherit the wrong boundaries.

Mitigation:

- keep shared exports generic
- validate against a sample second project before freezing the template surface

### Risk: Frontend composition remains too implicit

If frontend route ownership and registration behavior are not made explicit, a second project will still require manual rewiring.

Mitigation:

- formalize project composition contracts
- make registration and redirect behavior explicit project settings

### Risk: Generator validation is skipped

If the repo stops after library extraction, the template may look reusable but still require hidden `rod-manager` knowledge to start a second project.

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
6. no session or user crossover between the two projects
7. `npx nx run-many -t lint test build typecheck --no-tui`

## Relationship to Other Architecture Docs

- `docs/architecture/adr/0002-project-template-strategy.md` records the top-level decision.
- `docs/architecture/project-template-implementation-roadmap.md` contains the implementation sequence and file-level targets.
- This ticket should stay focused on architecture context, repository state, and remaining gaps rather than live status tracking.
