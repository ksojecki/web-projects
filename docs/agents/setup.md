# Agent Setup

Use this page to prepare a coding-agent session for this repository.

## 1) Orient

- Read `README.md`, `AGENTS.md`, and `docs/README.md`.
- During Codex initialization for this repository, always load `.agents/skills/agent-delivery-loop/SKILL.md`.
- Check current worktree state with `git --no-pager status --short`.
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

Only read full files after `rg` or `nx show` tells you which file or project matters.

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
npm run dev:rod-manager
```

This starts the SSR app through the Fastify API server.

When running as an AI agent, prefer:

```sh
npm run dev:rod-manager
```

Smoke checks:

- `https://localhost:3000/` returns SSR HTML.
- `https://localhost:3000/api` returns API JSON.

If port `3000` is already in use, inspect the listener with:

```sh
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

Reuse an existing `rod-manager` dev server when possible. Only stop the process automatically if it is clearly a stale server from this repository; otherwise report the conflict and ask the user.

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

Pre-commit behavior is defined by `.husky/pre-commit` and `.lintstagedrc.mjs`. Keep them aligned with the staged-file checks you expect contributors and agents to run locally.

## 5) Handoff

- Summarize changed behavior, changed files, and validation performed.
- Call out skipped checks or environment blockers explicitly.
- Update `docs/architecture/` or ADRs when a change affects architecture or long-lived workflows.
