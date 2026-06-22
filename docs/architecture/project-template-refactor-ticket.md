# Refactoring Ticket: Convert `rod-manager` into a Reusable Project Template

## Tracking Note

This document is architecture context for the project-template refactor.

- Track active work, progress updates, and step ordering in GitHub issues.
- Keep ADRs and roadmap updates in the repository when the durable architecture or implementation plan changes.

## Summary

Refactor the current `rod-manager` workspace so it serves as a reusable project template and reference implementation, not as a single authenticated entry point for multiple products sharing one user base.

The template must maximize reuse of authentication, session management, OAuth integration, account panel patterns, plugin structure, and Nx conventions, while keeping each future project isolated with its own application bootstrap, database, users, sessions, and feature modules.

## Problem Statement

The current workspace already contains reusable pieces:

- backend platform orchestration in `libs/server-platform`
- shared DTOs in `libs/shared`
- shared UI primitives in `libs/ui`
- product-specific implementation in `projects/rod-manager`

However, the current structure still mixes two concerns:

1. platform-level reusable capabilities
2. `rod-manager` product-specific CMS behavior

Without a clearer separation, adding a new project will likely require copying large parts of `rod-manager`, manually rewiring auth/account flow, and repeatedly separating product-specific code from code that should have been shared.

## Target Outcome

After the refactor:

- `rod-manager` remains a working product and acts as the reference implementation.
- New projects can be added with their own `api` and `web` apps.
- Each project uses a separate user base and separate database.
- Shared auth, OAuth, session, account, and UI foundations are reused from libraries.
- Product-specific features stay inside product directories instead of leaking into shared libraries.
- Creating a new project becomes a scaffolded workflow rather than a copy-paste exercise.

## Key Constraints

- Do not introduce a shared multi-tenant user base across products.
- Do not turn `rod-manager` into a runtime host for many products under one `/account`.
- Preserve the current `rod-manager` behavior during the refactor.
- Keep documentation and generated code in English.
- Follow existing Nx, TypeScript, Fastify plugin, and formatting conventions.

## Scope

### In Scope

- Extracting reusable platform-level backend and frontend building blocks.
- Defining clear boundaries between shared libraries and product-specific code.
- Standardizing per-project bootstrap structure.
- Creating a repeatable approach for adding a new project with isolated auth data.
- Documenting a phased migration plan and acceptance criteria.

### Out of Scope

- Building a shared cross-project SSO or identity provider.
- Merging user accounts across products.
- Replacing SQLite with another database as part of this refactor.
- Fully implementing a new second product in production scope.

## Current State

### Reusable Foundations Already Present

- `libs/server-platform/src/lib/createServerPlatform.ts` registers core platform plugins and routes.
- `libs/server-platform/src/lib/plugins/session/` contains session plumbing.
- `libs/server-platform/src/lib/plugins/oauth/` contains OAuth orchestration.
- `libs/server-platform/src/lib/routes/auth.ts` exposes core auth/session endpoints.
- `projects/rod-manager/apps/web/src/app/auth/` already contains a full auth flow.
- `projects/rod-manager/apps/web/src/app/account/AccountPage.tsx` provides an account area.

### Current Coupling Problems

- Frontend auth/account code lives directly inside the `rod-manager` web app instead of behind reusable product-template boundaries.
- `rod-manager` routes are still largely hardcoded in `projects/rod-manager/apps/web/src/app/routes.tsx`.
- Database bootstrap in `libs/server-platform/src/lib/plugins/database/index.ts` is reusable in intent, but still assumes one active application runtime instead of an explicit per-project configuration contract.
- The current plugin model is useful for product features such as `pages`, but not yet formalized as a template workflow for new projects.

## Architectural Direction

Use `rod-manager` as a reference implementation built on top of reusable platform libraries.

The architecture should be:

- shared platform code in `libs/`
- product implementations in `projects/<product>/`
- separate app bootstraps per product
- separate databases and auth stores per product
- optional product-local feature plugins under `projects/<product>/plugins/`

This means reuse happens through libraries and generators, not through one runtime serving many projects from one authenticated shell.

## Proposed Target Structure

```text
libs/
  server-platform/
    src/lib/
      createServerPlatform.ts
      contracts/
      plugins/
      routes/
  shared/
  ui/
  web-platform/                  # new reusable frontend auth/account shell
    src/lib/
      auth/
      account/
      routing/
      branding/

projects/
  rod-manager/
    apps/
      api/
      web/
    plugins/
      pages/
        server/
        ui/

  <new-project>/
    apps/
      api/
      web/
    plugins/
      <feature>/
        server/
        ui/
```

`libs/web-platform` is a suggested name. A different name is acceptable if it better matches repo naming conventions, but the responsibility split should remain the same.

## Detailed Refactor Plan

### Phase 1: Lock the Architectural Decision

#### Goal

Document the target model before code movement starts.

#### Tasks

1. Add an ADR stating that `rod-manager` is a reference product and template source, not a shared multi-product authenticated portal.
2. Record the rule that each product owns:
   - its own database
   - its own users table
   - its own sessions
   - its own OAuth provider records
   - its own product data
3. Record the rule that shared libraries may provide auth/account mechanics, but may not own cross-product identity state.
4. Document terminology:
   - platform library
   - product
   - feature plugin
   - reference implementation

#### Deliverables

- ADR in `docs/architecture/adr/`
- updated architecture overview in `docs/architecture/`

### Phase 2: Define Platform Boundaries

#### Goal

Separate reusable platform code from `rod-manager` product code.

#### Tasks

1. Audit `projects/rod-manager/apps/web/src/app/auth/` and classify each file as:
   - reusable platform code
   - product-specific presentation
   - mixed and needs splitting
2. Audit `projects/rod-manager/apps/web/src/app/account/` with the same classification.
3. Audit `libs/server-platform` and mark which parts are:
   - stable reusable contracts
   - platform internals
   - `rod-manager` assumptions that must be removed
4. Define an explicit boundary document for:
   - backend shared responsibilities
   - frontend shared responsibilities
   - product override points

#### Likely Extraction Targets

- reusable:
  - auth context
  - auth API helpers
  - OAuth callback flow
  - route guards
  - account shell layout
  - authentication methods management UI patterns
- product-specific:
  - CMS routes
  - content pages
  - content management screens
  - `pages` plugin behavior

#### Deliverables

- boundary notes in architecture docs
- file movement plan before code changes begin

#### Initial Boundary Audit Notes

- Reusable frontend auth mechanics:
  - `projects/rod-manager/apps/web/src/app/auth/AuthContext.tsx`
  - `projects/rod-manager/apps/web/src/app/auth/authApi.ts`
  - `projects/rod-manager/apps/web/src/app/auth/RequireAuth.tsx`
  - `projects/rod-manager/apps/web/src/app/auth/OAuthCallbackPage.tsx`
  - `projects/rod-manager/apps/web/src/app/auth/hooks/useAuthForm.ts`
  - `projects/rod-manager/apps/web/src/app/auth/types/loginSchema.ts`
  - `projects/rod-manager/apps/web/src/app/auth/types/registerSchema.ts`
- Mixed frontend composition files that stay product-local for now:
  - `projects/rod-manager/apps/web/src/app/auth/RegisterPage.tsx`
  - `projects/rod-manager/apps/web/src/app/auth/components/LoginModal.tsx`
  - `projects/rod-manager/apps/web/src/app/account/AccountPage.tsx`
  - `projects/rod-manager/apps/web/src/app/layout/components/Navbar.tsx`
  - `projects/rod-manager/apps/web/src/app/routes.tsx`
- Product-local code that should not move into shared platform libraries:
  - `projects/rod-manager/apps/web/src/app/content-management/*`
  - `projects/rod-manager/plugins/pages/**/*`
  - `libs/shared/src/lib/page.dto.ts`
- First extraction pass:
  - create `libs/web-platform`
  - move only the reusable auth mechanics listed above
  - keep route ownership, navigation, and account composition inside `projects/rod-manager`

### Phase 3: Create Reusable Frontend Platform Module

#### Goal

Move auth/account foundations out of `rod-manager` app code into a reusable frontend library.

#### Tasks

1. Create a new reusable frontend platform library, for example `libs/web-platform`.
2. Move or re-home reusable modules from `projects/rod-manager/apps/web/src/app/auth/`:
   - `AuthContext.tsx`
   - `RequireAuth.tsx`
   - `authApi.ts`
   - `OAuthCallbackPage.tsx`
   - reusable form hooks and schemas where applicable
3. Move or re-home reusable account foundations from `projects/rod-manager/apps/web/src/app/account/`:
   - account shell structure
   - authentication methods panel
   - password management pattern
   - language or settings extension points if still broadly reusable
4. Expose composition APIs so product apps can:
   - provide branding
   - provide post-login landing route
   - add product-specific account sections
   - decide whether registration is enabled
5. Keep reusable code free from CMS-specific route assumptions.

#### Implementation Notes

- Avoid making the new library own top-level application routes directly.
- Prefer exported route builders, components, and hooks that product apps compose into their own router.
- Keep DTO usage aligned with `libs/shared`.

#### Deliverables

- new frontend platform library
- `rod-manager` web app consuming the shared auth/account modules

### Phase 4: Formalize Per-Project Backend Bootstrap

#### Goal

Make backend startup explicitly project-scoped.

#### Tasks

1. Introduce a project bootstrap configuration contract for `createServerPlatform`.
2. Make database path and bootstrap behavior explicitly configurable per product.
3. Ensure auth/session/oauth tables remain local to the active product database.
4. Ensure `projects/rod-manager/apps/api/src/main.ts` becomes a thin product bootstrap only.
5. Define how each project provides:
   - database path
   - TLS/dev settings if needed
   - enabled feature plugins
   - SSR web root paths
   - seed strategy
6. Remove assumptions that imply one default product for the whole workspace.

#### Suggested Contract Areas

- product metadata
- database configuration
- core feature toggles
- plugin registration list
- SSR options
- initial seed options

#### Deliverables

- explicit backend bootstrap contract
- thinner per-product `main.ts`

### Phase 5: Keep Product Features Product-Local

#### Goal

Prevent feature behavior from contaminating shared template code.

#### Tasks

1. Keep `projects/rod-manager/plugins/pages/` as product-level feature code.
2. Define a pattern for future product-local plugins:
   - `server/` for API and persistence
   - `ui/` for product frontend integration
3. Ensure shared libraries contain only generic extension contracts, not product feature implementation.
4. Review `libs/shared` DTOs and move any product-only DTOs out if they should not be shared across unrelated products.

#### Deliverables

- documented product-local plugin convention
- clearer DTO ownership

### Phase 6: Define Account Shell Extension Model

#### Goal

Reuse account management UX while allowing each project to customize its own user panel.

#### Tasks

1. Split the current account page into:
   - platform account shell
   - platform auth/security sections
   - product-specific sections
2. Define an extension contract so a product can register:
   - account navigation item
   - account section component
   - access rules
   - ordering metadata
3. Keep baseline platform sections reusable:
   - profile summary
   - password management
   - linked OAuth providers
   - language or basic preferences if still generic
4. Ensure product-specific sections do not require modifying the shared shell internals.

#### Deliverables

- reusable account shell API
- `rod-manager` account page rebuilt using that API

### Phase 7: Add New Project Scaffolding

#### Goal

Make adding a project a first-class workflow.

#### Tasks

1. Create an Nx generator or repo script that scaffolds:
   - `projects/<name>/apps/api`
   - `projects/<name>/apps/web`
   - product bootstrap config
   - shared auth/account integration
   - example protected route
   - optional starter feature plugin
2. Ensure the generated API app wires `createServerPlatform` with a separate product configuration.
3. Ensure the generated web app consumes the reusable frontend platform library rather than copying auth/account code.
4. Add post-generation validation steps:
   - `npx nx show project <name> --no-tui`
   - build
   - typecheck

#### Deliverables

- scaffold command
- documented “how to add a new project” workflow

### Phase 8: Prove the Template with a Sample Second Project

#### Goal

Verify that the architecture is genuinely reusable.

#### Tasks

1. Generate one sample project in the workspace.
2. Give it:
   - separate app names
   - separate database file
   - separate user set
   - separate home/dashboard route
3. Reuse platform auth/account flows from shared libraries.
4. Confirm no `rod-manager` CMS feature is required for the new project to boot.
5. Confirm the sample project can authenticate users independently of `rod-manager`.

#### Deliverables

- sample second project
- validation notes from the exercise

### Phase 9: Documentation and Cleanup

#### Goal

Finish the refactor with maintainable guidance.

#### Tasks

1. Update `README.md` and `docs/README.md` with the new workspace model.
2. Update `AGENTS.md` guidance if the recommended project-creation workflow changes.
3. Document:
   - how to add a new product
   - where shared auth/account code lives
   - where product-only code belongs
4. Remove outdated architecture notes that imply a single product path.

#### Deliverables

- updated docs
- reduced onboarding ambiguity

## Suggested Work Breakdown

### Ticket 1

ADR and boundary documentation.

### Ticket 2

Reusable frontend auth/account extraction.

### Ticket 3

Per-project backend bootstrap contract.

### Ticket 4

Account shell extension API.

### Ticket 5

Project scaffolding generator.

### Ticket 6

Sample second project validation.

## Acceptance Criteria

- `rod-manager` still boots and preserves current auth/account behavior.
- Shared auth/session/OAuth logic lives in reusable libraries, not in `rod-manager`-only app code.
- A new project can be scaffolded with its own `api` and `web` apps.
- A scaffolded project uses a separate database and separate user base.
- A scaffolded project reuses shared auth/account mechanics without copying large code blocks.
- Product-specific features remain under `projects/<product>/`.
- Docs clearly explain how to add another project and what must remain isolated.

## Risks and Trade-offs

### Risk: Over-extracting too early

If extraction is too aggressive, shared libraries may become abstract but hard to use.

Mitigation:

- extract only what is already proven reusable by `rod-manager`
- validate with a real second project before freezing APIs

### Risk: Shared library leaks product assumptions

If CMS or `rod-manager` terminology remains in shared APIs, future projects will inherit wrong boundaries.

Mitigation:

- enforce generic naming in shared libraries
- review exports before stabilizing contracts

### Risk: Frontend router coupling remains too strong

If route composition stays hardcoded, new projects will still need heavy manual edits.

Mitigation:

- prefer route builders and extension points over fixed route ownership

### Risk: Database bootstrap remains implicit

If database configuration is not product-scoped, separate user bases may be broken by configuration mistakes.

Mitigation:

- make product database configuration explicit and test it

## Validation Plan

At minimum, validate with:

1. `rod-manager` auth login/register/logout flow
2. OAuth callback flow still working in `rod-manager`
3. account page still functioning in `rod-manager`
4. generated second project booting successfully
5. generated second project creating users in its own database
6. no session or user crossover between the two products
7. `npx nx run-many -t lint test build typecheck --no-tui`

## Recommended First Implementation Step

Start with the ADR and the boundary audit before moving code.

The most important design choice is already clear:

- reuse libraries across projects
- isolate users and databases per project

The refactor should preserve that principle in every extraction step.
