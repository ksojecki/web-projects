# Agent Setup

Use this page to prepare a coding-agent session for this repository.

## 1) Orient

- Read `README.md`, `AGENTS.md`, and `docs/README.md`.
- During Codex initialization for this repository, always load `.agents/skills/agent-delivery-loop/SKILL.md`.
- Install the global `stop-slop` skill during agent onboarding when it is not present locally:

```sh
git clone https://github.com/hardikpandya/stop-slop ~/.codex/skills/stop-slop
```

- If the task includes drafting or reviewing documentation or code comments, also load the global `stop-slop` skill before editing prose.
- If Nx MCP is available in the session, use it first for Nx docs, graph inspection, and running-task introspection before falling back to broader file reads.
- Check current worktree state with `git --no-pager status --short`.
- If you need GitHub issue or PR access through `gh`, request elevated access up
  front instead of waiting for the command to fail on sandboxed network access.
- Inspect `package.json`, `nx.json`, and the touched project package/config files before changing code.
- Inspect `.husky/pre-commit` and `.lintstagedrc.mjs` before changing staged-file validation behavior.
- Use `rg`/`rg --files` for searches; avoid opening generated output in `dist`, `coverage`, `.nx`, and `node_modules`.

### Low-token start sequence

Use the cheapest discovery path that can answer the current question:

```sh
git --no-pager status --short
rg -n "<feature|file|target clue>" .
npx nx show projects --json
npx nx show project <project-name> --json
```

Only read full files after `rg`, Nx MCP, or `nx show` tells you which file or project matters.

## 2) Install

```sh
npm ci
```

This also runs `scripts/postinstall.mjs`, which prepares local HTTPS certificates unless the install is production-only. If certificates are missing, run:

```sh
npm run setup:certs
```

## 3) Run Locally

```sh
npx nx run @ksojecki/rod-manager-api:launch --no-tui
```

This starts the SSR app through the Fastify API server, waits for it to become
reachable, then opens Puppeteer's managed Chrome for Testing with a repo-local
profile and remote debugging enabled.

Choose the product explicitly:

```sh
npx nx run @ksojecki/rod-manager-api:launch --no-tui
npx nx run @ksojecki/recepturomat-api:launch --no-tui
```

The root `npm run launch:<project>` commands are thin aliases to these Nx
targets.

Default launch endpoints:

- `rod-manager`: `https://localhost:3000/`, Chrome DevTools on `127.0.0.1:9222`
- `recepturomat`: `https://localhost:3100/`, Chrome DevTools on `127.0.0.1:9333`

If you only need the backend/SSR process without opening Chrome, use:

```sh
npm run dev:rod-manager
npm run dev:recepturomat
```

Env precedence for launch and dev sessions is:

1. shell environment
2. `.env`
3. `.env.local`
4. `projects/<product>/.env`
5. `projects/<product>/.env.local`

Later files override earlier files. Use the root files for shared defaults and
the project-local files for per-product overrides such as ports, DB paths, auth
seed flags, OAuth redirect URLs, Chrome debug ports, and Chrome user-data
directories.

Auth seeding defaults are shared from the root env (`AUTH_SEED_INITIAL_USER`,
`AUTH_INITIAL_USER_EMAIL`, `AUTH_INITIAL_USER_PASSWORD`). If a project-local env
file sets `AUTH_SEED_INITIAL_USER`, that override applies only to that project.

Smoke checks:

- `https://localhost:<product-port>/` should be verified through an authenticated session and return SSR HTML.
- `https://localhost:<product-port>/api` should be verified through the same authenticated session and return API JSON.

If a product's default port is already in use, inspect the listener with:

```sh
lsof -nP -iTCP:<product-port> -sTCP:LISTEN
```

Reuse an existing matching dev server when possible. Only stop the process
automatically if it is clearly a stale server from this repository; otherwise
report the conflict and ask the user.

For UI debugging after the Nx launch target or its npm alias, use Codex's Chrome-backed
browser path. On this machine that path comes from the bundled browser plugin
using the existing `node_repl` backend; there is no separate
`[mcp_servers.chrome-devtools]` block to configure or depend on.

## 4) Validate Changes

Use the smallest relevant check while developing, then run CI-equivalent checks before handoff when feasible:

```sh
npm run lint
npm run typecheck
npm run format:check
npx nx run-many -t test --no-tui
npx nx run-many -t lint test build typecheck --no-tui
```

Prefer `--no-tui` for task-running Nx commands when the command supports it. Prefer `npx nx show ... --json` for cheap structured inspection. Use `npx nx graph --print` for stdout or `npx nx graph --file=/tmp/nx-graph.json` only when you specifically need dependency-graph data.

Nx MCP can assist with read-only exploration and Nx documentation, but keep CLI commands as the executable validation contract for this repo.

Pre-commit behavior is defined by `.husky/pre-commit` and `.lintstagedrc.mjs`. Keep them aligned with the staged-file checks you expect contributors and agents to run locally.

## 5) Handoff

- Summarize changed behavior, changed files, and validation performed.
- Call out skipped checks or environment blockers explicitly.
- Update `docs/architecture/` or ADRs when a change affects architecture or long-lived workflows.
