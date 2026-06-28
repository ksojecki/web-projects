# AGENTS Guide

## Repo Snapshot

- This is an Nx 23 workspace (`nx`, `@nx/js` in `package.json`) organized around product directories under `projects/` and shared libraries under `libs/`.
- Product applications live in `projects/<product>/apps/` (`projects/rod-manager/apps/api`, `projects/rod-manager/apps/web`), and reusable code lives in `libs/` (`libs/shared`, `libs/ui`).
- Treat root config as source of truth unless a project-level config overrides it intentionally.
- Extended docs for agents and architecture are in `docs/` (`docs/agents/`, `docs/architecture/`, `docs/operations/`).

## Language Policy

- All documentation must be written in English.
- All generated code must use English for identifiers, comments, and user-facing messages.

## Big Picture Architecture

- Monorepo orchestration is defined in `nx.json`; project tasks are expected to be inferred by Nx.
- `@nx/js/typescript` plugin wires common targets: `build` and `typecheck` (see `nx.json` plugin options).
- Shared cache inputs include `.github/workflows/ci.yml` via `namedInputs.sharedGlobals`; CI changes can invalidate task cache.
- Product-specific feature plugins can live under `projects/<product>/plugins/`, while shared platform libraries remain under `libs/`.
- TypeScript baseline lives in `tsconfig.base.json` with strict + composite settings and NodeNext module system.

## Terminal Command Handling

**Important**: When running terminal commands that may trigger pagers, browser windows, or interactive output:

- Git commands: use `git --no-pager` (e.g., `git log --no-pager`, `git diff --no-pager`, `git show --no-pager`)
- Nx graph exploration: use `--print` for stdout or `--file=<path>.json` for machine-readable output (for example `npx nx graph --file=/tmp/nx-graph.json`)
- Pipe to `cat` or `head` for long outputs to prevent pager activation
- These prevent output from being sent to `more`/`less` or browser windows, making results readable by agents

## Critical Workflows

- During Codex initialization for this repository, always load `.agents/skills/agent-delivery-loop/SKILL.md` before starting substantial work.
- Default delivery mechanism for non-trivial work: use the Agent Workflow in `docs/agents/workflow.md`.
- Track task progress in GitHub issues. Always start by finding the relevant GitHub issue; if the work has no issue yet, create one before implementation. Use repository docs for durable guidance, ADRs, and implementation plans, not as the live status tracker for active work.
- For features, bug fixes, and error remediation, first agree on a plan when the task calls for planning, then execute that accepted plan through the delivery loop in `.agents/skills/agent-delivery-loop/SKILL.md`.
- In that delivery loop, divide the plan into small, easy-to-implement steps before execution.
- In that delivery loop, always use one `gpt-5.4-mini` implementer subagent, then one `gpt-5.4-mini` tester subagent for the same accepted current step.
- Keep planning and review in the current agent session unless the user explicitly asks for a different model.
- Do not spawn implementers or testers for multiple planned steps in parallel.
- The implementer should execute the accepted current step rather than re-reviewing or re-planning it.
- Pass only the accepted current step, success criteria, exact files, and the minimum evidence needed to each worker pass.
- When the user asks to publish completed work, commit the accepted changes, push the working branch to `origin`, create a PR, and report the PR link back in the user-facing handoff.
- PR titles or descriptions must include the GitHub issue number that identifies the work item.
- Before implementation work starts, check the current branch. If you are on `main`, create a new working branch first.
- When running task-oriented Nx commands as an AI agent, prefer `--no-tui` to suppress interactive output when the command supports it.
- Install deps: `npm ci` (used in CI).
- Start local SSR development as an AI agent with `npm run dev:rod-manager`, then smoke test `https://localhost:3000/` and `https://localhost:3000/api`.
- If port `3000` is already in use, inspect the listener with `lsof -nP -iTCP:3000 -sTCP:LISTEN`. Reuse an existing `rod-manager` dev server when possible. Only stop the process automatically if it is clearly a stale server from this repository; otherwise report the conflict and ask the user.
- Run lint via npm script: `npm run lint` (delegates to Nx `lint` targets).
- Run formatting checks: `npm run format:check`; auto-fix formatting: `npm run format`.
- Run CI-equivalent checks locally: `npx nx run-many -t lint test build typecheck --no-tui`.
- Keep Husky hooks in sync with CI check categories using staged-file equivalents where possible; `.husky/pre-commit` should run `lint-staged`, and the `lint-staged` config should track CI lint/format expectations for staged files.
- Apply Nx Cloud CI remediation hints: `npx nx fix-ci --no-tui`.
- Explore project/task graph: `npx nx graph --print` for stdout or `npx nx graph --file=/tmp/nx-graph.json` for machine-readable output. Prefer `nx show` first because graph output is much larger.
- Keep TS project refs consistent after adding projects: `npx nx sync --no-tui` (or `npx nx sync:check --no-tui` in CI).

## Project-Specific Conventions

- Formatting: Prettier with single quotes (`.prettierrc`).
- Formatting indentation is 2 spaces globally (`tabWidth: 2`, `useTabs: false`); JSON/JSONC have explicit Prettier override.
- Ignore generated artifacts in formatting and VCS (`.prettierignore`, `.gitignore` include `dist`, `coverage`, `.nx/*`).
- Oxlint uses `.oxlintrc.json` with explicit per-project Nx `lint` targets.
- Oxlint enforces the configured TypeScript rules, including `typescript/no-explicit-any` and `typescript/no-floating-promises`.
- Some project conventions are review-enforced rather than lint-enforced after the Oxlint migration; keep checklist guidance in sync with lint coverage.
- Keep top-level declaration order as: exported types, local types, constants, exported functions, local functions.
- Allow exceptions only when this order breaks compilation; in such cases add a local comment with a short reason.
- TS output intent is declaration-focused (`emitDeclarationOnly: true` in `tsconfig.base.json`), so library packaging should expect `.d.ts` generation.
- `customConditions` includes `@ksojecki/platform-source`; keep this in mind when introducing conditional exports/resolution.
- In `libs/ui`, prefer component names without a `Ui` prefix (for example `Button`, `Card`, `TextInput`).

## Low-Token Navigation Workflow

- Start with task-local context before broad repo reads: issue/PR text, `git --no-pager status --short`, then `rg -n` in the likely area.
- Prefer `rg` and `rg --files` over opening full files. Read only the matching sections with `sed -n` or `rg -n -C`.
- Use `npx nx show projects --json` to list workspace projects without opening the graph.
- Use `npx nx show project <project-name> --json` to inspect one project's resolved root, targets, and metadata.
- Use `npx nx show target <project-name>:<target>` when you need one target's resolved inputs or outputs.
- Use `npx nx graph --print` or `npx nx graph --file=/tmp/nx-graph.json` only when project relationships are still unclear after `nx show`; the graph output is much larger.
- For task execution, prefer the narrowest command that proves the change instead of jumping to workspace-wide `run-many`.
- When a task spans sessions, keep the issue or PR updated with touched files, commands tried, current blocker, and next safe step so the next agent does not rediscover context.

## Integration Points

- CI runs on GitHub Actions (`.github/workflows/ci.yml`) with Node 26 and npm cache.
- Nx Cloud is configured (`nxCloudId` in `nx.json`); distributed agents are prepared but currently commented in CI.
- Release flow is expected via `npx nx release --no-tui` (documented in `README.md`).

## Project Template Workflow

- Use the supported root wrapper to scaffold a product: `npm run generate:project -- <name>`.
- The underlying generator entrypoint is `./tools/generators.json:project-template`, and its required input is `name`.
- The generator creates `projects/<name>/apps/api` and `projects/<name>/apps/web`, adds a root `dev:<name>` script, and updates root TS references.
- Generated package names and Nx project ids stay flat and npm-compatible:
  `@ksojecki/<name>-api` and `@ksojecki/<name>-web`.
- The current generated product in this workspace is `projects/recepturomat`.
- Keep reusable platform code in `libs/`, product apps in `projects/<product>/apps/`, and product-specific features in `projects/<product>/plugins/`.
- Treat registration as a product-scoped capability configured by the product frontend, not a workspace-wide default.
- For backend bootstrap, use `projects/<product>/apps/api/src/productConfig.ts` as the product-scoped contract for project id, database path, seed behavior, and SSR paths.
- For frontend composition, use `projects/<product>/apps/web/src/app/productConfig.ts` as the product-scoped contract for routes, redirects, login prompt behavior, and registration enablement.
- Do not introduce path-like package names such as `@ksojecki/<name>/api`; use
  the nested `projects/<name>/apps/*` paths for filesystem structure and the
  flat package ids in commands, imports, and `package.json`.

## Authentication & OAuth

### Architecture Overview

- **Backend (Fastify)**: OAuth plugin entrypoint (`libs/server-platform/src/lib/plugins/oauth/index.ts`) delegates implementation to modular files in `libs/server-platform/src/lib/plugins/oauth/`.
- **Database**: SQLite `oauth_providers` table stores provider credentials per user; supports Google, Apple, and Facebook.
- **Frontend (React)**: OAuth flow initiated on login page with state/code verifier stored in session storage; callback handler manages token exchange.
- **Session Management**: After OAuth callback, standard session cookie is created (no OAuth tokens returned to frontend).

### OAuth Environment Variables

Provider credentials must be configured via environment variables:

- `OAUTH_GOOGLE_CLIENT_ID` / `OAUTH_GOOGLE_CLIENT_SECRET` — Google OAuth 2.0 app credentials.
- `OAUTH_APPLE_CLIENT_ID` / `OAUTH_APPLE_CLIENT_SECRET` / `OAUTH_APPLE_TEAM_ID` — Apple Sign In credentials.
- `OAUTH_FACEBOOK_CLIENT_ID` / `OAUTH_FACEBOOK_CLIENT_SECRET` — Facebook app credentials.
- `OAUTH_REDIRECT_BASE_URL` — Base URL for OAuth callbacks (default: `http://localhost:3000`); must match provider redirect URI config.

### Adding a New OAuth Provider

1. **Extend `OAuthProviderType`** in `libs/shared/src/lib/auth.dto.ts` to include new provider string literal.
2. **Update OAuth plugin modules**:
   - Provider config and env wiring: `libs/server-platform/src/lib/plugins/oauth/oauthConfigs.ts`.
   - OAuth service methods: `libs/server-platform/src/lib/plugins/oauth/service.ts`.
   - User profile mapping helpers: `libs/server-platform/src/lib/plugins/oauth/userInfo.ts`.
   - PKCE helpers: `libs/server-platform/src/lib/plugins/oauth/pkce.ts`.
3. **Update OAuth routes** (`libs/server-platform/src/lib/routes/oauth.ts`) if new authorization/callback flow differs from standard OAuth 2.0.
4. **Update frontend OAuth controls** (`projects/rod-manager/apps/web/src/app/auth/components/OAuthLoginButtons.tsx`, `projects/rod-manager/apps/web/src/app/auth/components/OAuthRegisterButtons.tsx`, and shared `OAuthButtons.tsx`) to add provider buttons and call `initiateOAuth()`.

### Code Structure

- **Backend Routes**: `POST /api/auth/oauth/authorize/:provider` (initiate), `GET /api/auth/oauth/callback/:provider` (callback), `DELETE /api/auth/oauth/link/:provider` (unlink).
- **Frontend Auth UI**: `OAuthLoginButtons`, `OAuthRegisterButtons`, shared `OAuthButtons`, and `OAuthCallbackPage`.
- **Shared Types**: `OAuthProviderType`, `OAuthInitiateRequestBody`, `OAuthUserInfo` in `libs/shared/src/lib/auth.dto.ts`.

### Security Considerations

- PKCE (Proof Key for Code Exchange) used for all OAuth flows; code verifier generated per authorization and validated at callback.
- OAuth state stored in browser `sessionStorage` with 10-minute expiration; validated on callback.
- Access tokens NOT returned to frontend; stored server-side in database, refreshed as needed.
- Email auto-verified on OAuth login (implicit account linking if email matches); explicit confirmation recommended for production.

## Plugin and Module Structure Policy

- For Fastify plugins, use a folder-based structure like `libs/server-platform/src/lib/plugins/database/`:
  - `index.ts` entrypoint for composition/registration (preferred over `<plugin>.ts`).
  - `types.ts` for exported contracts and module augmentation.
  - Feature-focused files (`oauthConfigs.ts`, `store.ts`, `service.ts`, `providers.ts`, etc.) for implementation details.
- Keep plugin `index.ts` files limited to orchestration: register plugin dependencies and attach decorators/hooks; move business logic to domain files.
- In Fastify plugins, keep decorator registration explicit in `index.ts` (use `decorate*`/`decorate` there) so the available decorators are visible in one place.
- If decorator logic needs plugin dependencies, create small domain-specific factory functions that accept `fastify` and return decorator implementations.
- For the `libs/server-platform/src/lib/plugins/session/` plugin specifically, keep `index.ts` as decorator/registration wiring only.
- Avoid generic file names like `helpers.ts` or `utils.ts`; use domain-specific names that reflect the responsibility.
- Keep plugin entrypoints thin; avoid placing provider logic, parsing helpers, and HTTP calls in a single file.
- Split any module when it exceeds one responsibility or grows beyond ~200 lines.
- For larger modules outside plugins, apply the same pattern: contracts + orchestration + focused implementation files.
- When introducing a new plugin/module, update docs in `docs/agents/` if the pattern or workflow changes.

## When Adding a New Project

- Use the supported generator wrapper: `npm run generate:project -- <name>`.
- Validate the generated apps with `npx nx show project @ksojecki/<name>-api --json` and `npx nx show project @ksojecki/<name>-web --json` when needed.
- Keep command examples on the flat ids above even though the generated files
  live under `projects/<name>/apps/api` and `projects/<name>/apps/web`.
- Check the generated product contracts in `projects/<name>/apps/api/src/productConfig.ts` and `projects/<name>/apps/web/src/app/productConfig.ts`.
- Run at least `npm run typecheck` after generation, and use `npx nx run-many -t lint test build typecheck --no-tui` for CI-equivalent validation when the change is broader.
- Keep new package configs aligned with root TS/Nx conventions instead of overriding defaults unless necessary.
