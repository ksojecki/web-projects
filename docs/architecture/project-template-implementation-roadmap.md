# Project Template Refactor Implementation Roadmap

## Purpose

This roadmap turns the high-level refactoring context into an execution plan with concrete file targets.

Active progress for this refactor belongs in GitHub issues. This document is a durable implementation guide, not the live status tracker.

The target remains:

- `rod-manager` stays as a working reference product
- reusable platform mechanics move into shared libraries
- each future project gets its own `api` app, `web` app, database, and user base

This document is implementation-oriented and should be used as the delivery sequence for the refactor. Several steps below already reflect repository state; keep this document aligned with the supported workflow instead of treating completed work as hypothetical.

## Success Definition

The refactor is complete when:

- `projects/rod-manager` still works
- auth, session, OAuth, and account mechanics are reusable without copy-paste
- a new project can be scaffolded with isolated auth data
- product-specific CMS logic remains under `projects/rod-manager`

## Tracking

- Track current status, sequencing, and progress updates in GitHub issues.
- Update this document when the implementation plan or acceptance criteria change.

## Supported Workflow

The repository already supports the following template workflow:

- scaffold a product with `npm run generate:project -- <name>`
- use `projects/<product>/apps/api/src/productConfig.ts` for product-scoped backend bootstrap
- use `projects/<product>/apps/web/src/app/productConfig.ts` for product-scoped frontend composition
- use `projects/recepturomat` as the generated second product that proves the scaffold works without `rod-manager` app dependencies

The remaining roadmap work should preserve and validate that supported surface.

## Delivery Sequence

## Step 1: Keep the Architecture Decision Current

### Goal

Keep the core decision current when the template strategy changes.

### Files to Maintain

- `docs/architecture/adr/0002-project-template-strategy.md`

### Files to Update

- `docs/architecture/project-template-refactor-ticket.md`
- optionally `docs/README.md` if you want the new roadmap linked immediately

### ADR Content

- `rod-manager` is a reference implementation, not a shared authenticated portal
- future projects use separate databases and user bases
- reuse happens through `libs/` and generators
- product features live in `projects/<product>/plugins/`

### Validation

- ADR updates stay aligned with the implemented template strategy

## Step 2: Audit and Mark the Existing Reusable Surface

### Goal

Classify current files into reusable platform code, product code, and mixed code.

### Files to Audit

- `projects/rod-manager/apps/web/src/app/auth/AuthContext.tsx`
- `projects/rod-manager/apps/web/src/app/auth/authApi.ts`
- `projects/rod-manager/apps/web/src/app/auth/RequireAuth.tsx`
- `projects/rod-manager/apps/web/src/app/auth/OAuthCallbackPage.tsx`
- `projects/rod-manager/apps/web/src/app/auth/RegisterPage.tsx`
- `projects/rod-manager/apps/web/src/app/auth/components/LoginModal.tsx`
- `projects/rod-manager/apps/web/src/app/auth/components/LoginForm.tsx`
- `projects/rod-manager/apps/web/src/app/auth/components/OAuthButtons.tsx`
- `projects/rod-manager/apps/web/src/app/auth/components/OAuthLoginButtons.tsx`
- `projects/rod-manager/apps/web/src/app/auth/components/OAuthRegisterButtons.tsx`
- `projects/rod-manager/apps/web/src/app/auth/components/PasswordRegisterForm.tsx`
- `projects/rod-manager/apps/web/src/app/auth/hooks/useAuthForm.ts`
- `projects/rod-manager/apps/web/src/app/auth/types/loginSchema.ts`
- `projects/rod-manager/apps/web/src/app/auth/types/registerSchema.ts`
- `projects/rod-manager/apps/web/src/app/account/AccountPage.tsx`
- `projects/rod-manager/apps/web/src/app/account/PasswordMethodForm.tsx`
- `projects/rod-manager/apps/web/src/app/account/LanguageSelector.tsx`
- `projects/rod-manager/apps/web/src/app/account/settingsApi.ts`
- `projects/rod-manager/apps/web/src/app/account/passwordSchema.ts`
- `projects/rod-manager/apps/web/src/app/layout/components/Navbar.tsx`
- `projects/rod-manager/apps/web/src/app/routes.tsx`
- `libs/server-platform/src/lib/createServerPlatform.ts`
- `libs/server-platform/src/lib/routes/auth.ts`
- `libs/server-platform/src/lib/routes/oauth.ts`
- `libs/server-platform/src/lib/routes/user-settings.ts`
- `libs/server-platform/src/lib/plugins/database/index.ts`
- `libs/server-platform/src/lib/plugins/database/init.ts`
- `libs/shared/src/lib/auth.dto.ts`
- `libs/shared/src/lib/user-settings.dto.ts`
- `libs/shared/src/lib/page.dto.ts`
- `libs/shared/src/index.ts`

### Expected Classification

Likely reusable:

- `AuthContext.tsx`
- `authApi.ts`
- `RequireAuth.tsx`
- `OAuthCallbackPage.tsx`
- `hooks/useAuthForm.ts`
- auth schemas
- account security flows

Likely mixed:

- `RegisterPage.tsx`
- `LoginModal.tsx`
- `AccountPage.tsx`
- `Navbar.tsx`
- `routes.tsx`

Likely product-specific:

- `projects/rod-manager/apps/web/src/app/content-management/*`
- `projects/rod-manager/plugins/pages/**/*`
- `libs/shared/src/lib/page.dto.ts`

### Deliverable

- one short classification note added to the ticket or ADR

## Step 3: Create a Reusable Frontend Platform Library

### Goal

Move shared auth/account UX logic into a dedicated frontend library.

### New Library

- `libs/web-platform`

If a different name is chosen, keep the responsibility the same.

### Suggested Initial File Structure

```text
libs/web-platform/src/
  index.ts
  lib/
    auth/
      AuthProvider.tsx
      RequireAuth.tsx
      authApi.ts
      OAuthCallbackPage.tsx
      useAuth.ts
      storage.ts
      hooks/
        useAuthForm.ts
      schemas/
        loginSchema.ts
        registerSchema.ts
    account/
      AccountShell.tsx
      AuthenticationMethodsPanel.tsx
      PasswordMethodForm.tsx
      sections.ts
      settingsApi.ts
    routing/
      createAuthRoutes.tsx
    types/
      branding.ts
      account.ts
```

### Files to Create

- `libs/web-platform/package.json`
- `libs/web-platform/tsconfig.json`
- `libs/web-platform/tsconfig.lib.json`
- `libs/web-platform/tsconfig.spec.json`
- `libs/web-platform/vite.config.mts`
- `libs/web-platform/src/index.ts`

### Files to Move or Split

Move mostly unchanged:

- `projects/rod-manager/apps/web/src/app/auth/AuthContext.tsx`
- `projects/rod-manager/apps/web/src/app/auth/authApi.ts`
- `projects/rod-manager/apps/web/src/app/auth/RequireAuth.tsx`
- `projects/rod-manager/apps/web/src/app/auth/OAuthCallbackPage.tsx`
- `projects/rod-manager/apps/web/src/app/auth/hooks/useAuthForm.ts`
- `projects/rod-manager/apps/web/src/app/auth/types/loginSchema.ts`
- `projects/rod-manager/apps/web/src/app/auth/types/registerSchema.ts`

Split before moving:

- `projects/rod-manager/apps/web/src/app/auth/RegisterPage.tsx`
- `projects/rod-manager/apps/web/src/app/auth/components/LoginModal.tsx`
- `projects/rod-manager/apps/web/src/app/account/AccountPage.tsx`
- `projects/rod-manager/apps/web/src/app/layout/components/Navbar.tsx`

Keep product-local:

- product text/layout choices tightly coupled to `rod-manager`
- content management navigation items

### Required Refactors

1. Separate auth mechanics from route destinations hardcoded to `rod-manager`.
2. Replace fixed redirect assumptions such as `/account` and `/?login=1` with configurable options where needed.
3. Extract OAuth state storage helpers from `authApi.ts` into a smaller utility if the file becomes too broad.
4. Export composable primitives instead of a full app shell.

### Files to Update After Extraction

- `projects/rod-manager/apps/web/src/app/routes.tsx`
- `projects/rod-manager/apps/web/src/app/layout/components/Navbar.tsx`
- `projects/rod-manager/apps/web/src/app/account/AccountPage.tsx`
- `projects/rod-manager/apps/web/src/main.tsx`

### Validation

- `rod-manager` web still renders
- login modal still works
- protected routes still redirect correctly
- OAuth callback page still resolves

## Step 4: Split Platform Account Shell from Product Account Content

### Goal

Turn the current account page into a reusable shell with extension points.

### Current Files

- `projects/rod-manager/apps/web/src/app/account/AccountPage.tsx`
- `projects/rod-manager/apps/web/src/app/account/PasswordMethodForm.tsx`
- `projects/rod-manager/apps/web/src/app/account/LanguageSelector.tsx`
- `projects/rod-manager/apps/web/src/app/account/settingsApi.ts`
- `projects/rod-manager/apps/web/src/app/account/passwordSchema.ts`

### New Shared Files

- `libs/web-platform/src/lib/account/AccountShell.tsx`
- `libs/web-platform/src/lib/account/AuthenticationMethodsPanel.tsx`
- `libs/web-platform/src/lib/account/PasswordMethodForm.tsx`
- `libs/web-platform/src/lib/account/settingsApi.ts`
- `libs/web-platform/src/lib/account/passwordSchema.ts`
- `libs/web-platform/src/lib/account/types.ts`

### New Product-Local Files

- `projects/rod-manager/apps/web/src/app/account/RodManagerAccountPage.tsx`
- `projects/rod-manager/apps/web/src/app/account/rodManagerAccountSections.tsx`

### Required Refactors

1. Extract a generic account shell that accepts:
   - current user
   - standard platform sections
   - product-provided extra sections
2. Keep password and OAuth connection management in shared code.
3. Decide whether `LanguageSelector.tsx` is platform-level or product-level.
   It can stay shared if language preferences remain generic.
4. Replace the current monolithic `AccountPage.tsx` with a small product composition file.

### Files to Update

- `projects/rod-manager/apps/web/src/app/routes.tsx`
- any imports referencing old account components

### Validation

- `/account` still works in `rod-manager`
- password update still works
- OAuth link/unlink still works

## Step 5: Make Backend Bootstrap Explicitly Project-Scoped

### Goal

Ensure the backend runtime is clearly configured per product.

### Current Files

- `projects/rod-manager/apps/api/src/main.ts`
- `libs/server-platform/src/lib/createServerPlatform.ts`
- `libs/server-platform/src/lib/plugins/database/index.ts`
- `libs/server-platform/src/lib/plugins/database/init.ts`

### New Shared Files to Add

- `libs/server-platform/src/lib/contracts/bootstrap.contract.ts`
- `libs/server-platform/src/lib/runtime/projectConfig.ts`

### Files to Update

- `libs/server-platform/src/lib/createServerPlatform.ts`
- `libs/server-platform/src/index.ts`
- `libs/server-platform/src/lib/plugins/database/index.ts`
- `libs/server-platform/src/lib/plugins/database/init.ts`
- `projects/rod-manager/apps/api/src/main.ts`

### Required Refactors

1. Introduce a `projectConfig` or `bootstrap` object for `createServerPlatform`.
2. Move database-path resolution behind explicit product configuration.
3. Replace implicit environment-only database assumptions in `getDatabasePath()` with a contract like:
   - product id
   - database path
   - seed options
4. Keep one database per product app.
5. Ensure auth/session/oauth tables are created in the active product database only.

### Recommended Contract Shape

The exact names can vary, but the contract should cover:

- `projectId`
- `database.path`
- `database.seedInitialUser`
- `ssr.webRoot`
- `ssr.production.clientRoot`
- `ssr.production.serverEntryPath`
- `plugins`

### Validation

- `rod-manager` API still starts
- database file path is explicitly attributable to `rod-manager`
- tests can point a future second project at a different database path

## Step 6: Clean Shared DTO Boundaries

### Goal

Keep only truly reusable contracts in shared libraries.

### Files to Review

- `libs/shared/src/lib/auth.dto.ts`
- `libs/shared/src/lib/user-settings.dto.ts`
- `libs/shared/src/lib/page.dto.ts`
- `libs/shared/src/index.ts`

### Required Changes

1. Keep auth and user-settings DTOs in `libs/shared` if they remain common to all products.
2. Move `page.dto.ts` out of `libs/shared` if it is only relevant to `rod-manager`.
3. If moved, create a product-local DTO location such as:
   - `projects/rod-manager/plugins/pages/shared/`
   - or `projects/rod-manager/libs/shared-pages/`
4. Update exports in `libs/shared/src/index.ts` to remove product-only contracts.

### Validation

- shared package exports only generic contracts
- `rod-manager` imports still resolve after DTO relocation

## Step 7: Keep Product Features Strictly Local

### Goal

Preserve a clean boundary between template code and product features.

### Files to Preserve as Product-Local

- `projects/rod-manager/plugins/pages/server/src/lib/plugin.ts`
- `projects/rod-manager/plugins/pages/server/src/lib/routes.ts`
- `projects/rod-manager/plugins/pages/server/src/lib/store.ts`
- `projects/rod-manager/plugins/pages/server/src/lib/migrations.ts`
- `projects/rod-manager/plugins/pages/ui/src/lib/plugin.ts`
- `projects/rod-manager/apps/web/src/app/content-management/ContentManagementPage.tsx`
- `projects/rod-manager/apps/web/src/app/content-management/ContentPage.tsx`
- `projects/rod-manager/apps/web/src/app/content-management/pagesApi.ts`

### Required Changes

1. Ensure none of the above are moved into shared platform libraries.
2. If they depend on auth/account code, consume the new shared frontend/backend APIs instead of internal `rod-manager` implementations.
3. If they depend on `libs/shared/src/lib/page.dto.ts`, update imports after DTO relocation.

### Validation

- CMS still works, but clearly as a product feature

## Step 8: Introduce Product Composition Files

### Goal

Make each product app a thin composition layer over shared libraries.

### New Product-Level Files to Add

Backend:

- `projects/rod-manager/apps/api/src/productConfig.ts`

Frontend:

- `projects/rod-manager/apps/web/src/app/productConfig.ts`
- `projects/rod-manager/apps/web/src/app/account/accountSections.tsx`
- optionally `projects/rod-manager/apps/web/src/app/auth/authConfig.ts`

### Files to Update

- `projects/rod-manager/apps/api/src/main.ts`
- `projects/rod-manager/apps/web/src/app/routes.tsx`
- `projects/rod-manager/apps/web/src/app/layout/components/Navbar.tsx`

### Responsibilities

Backend composition should declare:

- product id
- database configuration
- enabled plugins
- SSR paths

Frontend composition should declare:

- app name
- public home route
- post-login route
- account sections
- top navigation items

### Validation

- product-specific behavior is declared in small composition files
- shared code no longer contains `rod-manager` assumptions

## Step 9: Maintain the Generator for New Projects

### Goal

Keep the repeatable project-creation workflow aligned with the supported surface.

### Generator Location

- `tools/generators/project-template/`

### Files to Maintain

- `tools/generators/project-template/generator.ts`
- `tools/generators/project-template/schema.json`

### Generator Output

- `projects/<name>/apps/api/src/main.ts`
- `projects/<name>/apps/api/src/productConfig.ts`
- `projects/<name>/apps/web/src/main.tsx`
- `projects/<name>/apps/web/src/app/routes.tsx`
- `projects/<name>/apps/web/src/app/productConfig.ts`
- optional starter plugin skeleton under `projects/<name>/plugins/`

### Templates Should Reuse

- `createServerPlatform` from `libs/server-platform`
- auth/account components from `libs/web-platform`
- shared DTOs from `libs/shared`

### Validation

- `npx nx show project <generated-project> --json`
- generated project builds
- generated project typechecks

## Step 10: Keep the Sample Second Project as Isolation Proof

### Goal

Keep validating the template with a real second project in the workspace.

### Proof Project

- `projects/recepturomat/apps/api`
- `projects/recepturomat/apps/web`

### Required Validation

1. The generated Recepturomat project has a different database path than `rod-manager`.
2. User registration in the generated Recepturomat project does not create rows in the `rod-manager` database.
3. Session cookies and auth tables remain isolated by application runtime.
4. Shared auth/account code is consumed from libraries, not copied from `rod-manager`.

### Files Likely to Be Touched

- `projects/recepturomat/**/*`
- generator files when the scaffold surface changes
- workspace config files if Nx inference requires additions

## Step 11: Update Tests Around the New Boundaries

### Goal

Protect the refactor with contract-level coverage.

### Existing Tests to Review

- `projects/rod-manager/apps/web/src/app/account/AccountPage.spec.tsx`
- `projects/rod-manager/apps/web/src/app/routes.spec.tsx`
- `libs/server-platform/src/lib/createServerPlatform.spec.ts`
- `libs/server-platform/src/lib/routes/auth.spec.ts`
- `libs/server-platform/src/lib/routes/oauth.spec.ts`
- `libs/server-platform/src/lib/routes/user-settings.spec.ts`
- `libs/server-platform/src/lib/plugins/session/index.spec.ts`
- `projects/rod-manager/plugins/pages/server/src/lib/routes.spec.ts`

### New Tests to Add

- `libs/web-platform` tests for auth/account composition
- backend tests covering explicit project bootstrap configuration
- generated-project smoke tests
- tests asserting separate database usage

### Validation Command

- `npx nx run-many -t lint test build typecheck --no-tui`

## Step 12: Update Docs and Agent Guidance

### Goal

Make the new workflow discoverable.

### Files to Update

- `README.md`
- `docs/README.md`
- `AGENTS.md`
- `docs/architecture/project-template-refactor-ticket.md`

### Required Documentation Updates

- how to add a new project
- what belongs in `libs/`
- what belongs in `projects/<product>/`
- how auth/user isolation is preserved
- how product-scoped registration is configured

## Suggested Implementation Order for Actual Delivery

1. `ADR 0002`
2. create `libs/web-platform`
3. extract shared auth modules
4. extract account shell
5. introduce backend project bootstrap contract
6. clean shared DTO ownership
7. add product composition files to `rod-manager`
8. land and maintain the project generator
9. keep the sample second project validated
10. update tests
11. update docs

## Recommended Branching Strategy

Because this is a large refactor, split work into small PRs:

1. ADR and docs only
2. frontend shared auth extraction
3. frontend account shell extraction
4. backend bootstrap contract
5. DTO boundary cleanup
6. generator
7. sample project validation and final docs

## Notes for Execution

- Do not move `pages` or other CMS features into shared libraries.
- Do not introduce shared user tables across projects.
- Prefer composition files over hardcoded product assumptions.
- If an abstraction is only used by `rod-manager`, keep it product-local until the sample second project proves reuse.
