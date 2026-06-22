# AGENTS Guide

## Repo Snapshot

- This is an Nx 22 workspace (`nx`, `@nx/js` in `package.json`) organized around product directories under `projects/` and shared libraries under `libs/`.
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
- Nx graph exploration: use `--json` flag instead of `--no-tui` (e.g., `npx nx graph --json`)
- Pipe to `cat` or `head` for long outputs to prevent pager activation
- These prevent output from being sent to `more`/`less` or browser windows, making results readable by agents

## Critical Workflows

- During Codex initialization for this repository, always load `.agents/skills/agent-delivery-loop/SKILL.md` before starting substantial work.
- Default delivery mechanism for non-trivial work: use the Agent Workflow in `docs/agents/workflow.md`.
- For features, bug fixes, and error remediation, first agree on a plan when the task calls for planning, then execute that accepted plan through the delivery loop in `.agents/skills/agent-delivery-loop/SKILL.md`.
- In that delivery loop, divide the plan into small, easy-to-implement steps before execution.
- In that delivery loop, always use one `gpt-5.4-mini` implementer subagent, then one `gpt-5.4-mini` tester subagent for the same accepted current step.
- Do not spawn implementers for multiple planned steps in parallel by default; prefer the smallest active step to reduce token usage.
- The implementer should execute the accepted current step rather than re-reviewing or re-planning it.
- When the user asks to publish completed work, commit the accepted changes and push the working branch to `origin`.
- Before implementation work starts, check the current branch. If you are on `main`, create a new working branch first.
- When running Nx commands as an AI agent, always pass `--no-tui`.
- Install deps: `npm ci` (used in CI).
- Start local SSR development as an AI agent with `npm run dev`, then smoke test `https://localhost:3000/` and `https://localhost:3000/api`.
- If port `3000` is already in use, inspect the listener with `lsof -nP -iTCP:3000 -sTCP:LISTEN`. Reuse an existing `rod-manager` dev server when possible. Only stop the process automatically if it is clearly a stale server from this repository; otherwise report the conflict and ask the user.
- Run lint via npm script: `npm run lint` (delegates to Nx `lint` targets).
- Run formatting checks: `npm run format:check`; auto-fix formatting: `npm run format`.
- Run CI-equivalent checks locally: `npx nx run-many -t lint test build typecheck --no-tui`.
- Keep Husky hooks in sync with CI check categories using staged-file equivalents where possible; `.husky/pre-commit` should run `lint-staged`, and the `lint-staged` config should track CI lint/format expectations for staged files.
- Apply Nx Cloud CI remediation hints: `npx nx fix-ci --no-tui`.
- Explore project/task graph: `npx nx graph --json --no-tui` (use `--json` to avoid browser).
- Keep TS project refs consistent after adding projects: `npx nx sync --no-tui` (or `npx nx sync:check --no-tui` in CI).
- CodeDrift MCP is mandatory during discovery, planning, implementation, validation, and review in this repository.
- Use CodeDrift MCP tools for repository overview, symbol search, symbol resolution, and session-aware reads throughout the delivery loop.
- For cross-session context, start follow-up work with CodeDrift memory recall and record reusable context at handoff. Setup and commands live in `docs/agents/codedrift.md`.

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
- `customConditions` includes `@sojecki/platform-source`; keep this in mind when introducing conditional exports/resolution.
- In `libs/ui`, prefer component names without a `Ui` prefix (for example `Button`, `Card`, `TextInput`).

## Integration Points

- CI runs on GitHub Actions (`.github/workflows/ci.yml`) with Node 26 and npm cache.
- Nx Cloud is configured (`nxCloudId` in `nx.json`); distributed agents are prepared but currently commented in CI.
- Release flow is expected via `npx nx release --no-tui` (documented in `README.md`).

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

- Prefer Nx generators (example from `README.md`):
  - `npx nx g @nx/js:lib libs/<name> --publishable --importPath=@my-org/<name> --no-tui`
  - `npx nx g @nx/react:app <name> --bundler=vite --no-tui`, then place product apps under `projects/<product>/apps/` if they are product-specific.
- After generation, validate inferred targets with `npx nx show project <project-name> --no-tui` and run `build` + `typecheck`.
- Keep new package configs aligned with root TS/Nx conventions instead of overriding defaults unless necessary.
