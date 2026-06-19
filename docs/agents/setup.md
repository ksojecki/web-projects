# Agent Setup

Use this page to prepare a coding-agent session for this repository.

## 1) Orient

- Read `README.md`, `AGENTS.md`, and `docs/README.md`.
- Check current worktree state with `git --no-pager status --short`.
- Inspect `package.json`, `nx.json`, and the touched project package/config files before changing code.
- Use `rg`/`rg --files` for searches; avoid opening generated output in `dist`, `coverage`, `.nx`, and `node_modules`.

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
npm run dev:ssr
```

This starts the React SSR web app and Fastify API together. For split sessions:

```sh
npm run dev:web
npm run dev:api
```

Smoke checks:

- `https://localhost:3000/` returns SSR HTML.
- `https://localhost:3000/api` returns API JSON.

## 4) Validate Changes

Use the smallest relevant check while developing, then run CI-equivalent checks before handoff when feasible:

```sh
npm run lint
npm run typecheck
npm run format:check
npx nx run-many -t test --no-tui
npx nx run-many -t lint test build typecheck --no-tui
```

Always pass `--no-tui` to Nx commands. Use `npx nx graph --json --no-tui` for graph inspection.

## 5) Handoff

- Summarize changed behavior, changed files, and validation performed.
- Call out skipped checks or environment blockers explicitly.
- Update `docs/architecture/` or ADRs when a change affects architecture or long-lived workflows.
