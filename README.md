# RodManager

RodManager is an Nx 22 monorepo for a React SSR web app backed by a Fastify API and shared TypeScript libraries. The MVP stack is React Router, Fastify, SQLite, Vitest, Oxlint, and Prettier.

## Repository Layout

- `apps/web` - React 19 web application with SSR entrypoints, routes, auth UI, account pages, and content-management pages.
- `apps/api` - Fastify runtime entrypoint that serves API routes and production SSR artifacts.
- `libs/server-platform` - Fastify plugins, routes, OAuth/session/database integration, and server composition.
- `libs/shared` - shared DTOs and cross-app contracts.
- `libs/ui` - reusable React UI components.
- `libs/plugins/pages/*` - page plugin packages split into server and UI concerns.
- `docs` - architecture, operations, and agent workflow documentation.
- `scripts` - setup helpers, including development certificate generation.

## Prerequisites

- Node 26, matching `.github/workflows/ci.yml`.
- npm with the committed `package-lock.json`.
- Local HTTPS certificates are generated during `npm install` unless production install flags are used.

## Setup

```sh
npm ci
```

If certificates need to be recreated manually:

```sh
npm run setup:certs
```

## Development

Run the SSR development stack:

```sh
npm run dev:ssr
```

Run the web or API project separately:

```sh
npm run dev:web
npm run dev:api
```

Local smoke checks:

- `https://localhost:3000/` should return SSR HTML.
- `https://localhost:3000/api` should return Fastify API JSON.

## Build, Test, and Quality

```sh
npm run lint
npm run typecheck
npm run format:check
npx nx run-many -t test --no-tui
npx nx run-many -t lint test build typecheck --no-tui
```

- `npm run lint` runs Oxlint through Nx project targets.
- `npm run typecheck` runs TypeScript project checks.
- `npm run format:check` verifies Prettier formatting.
- `npx nx run-many -t lint test build typecheck --no-tui` mirrors CI locally.

Build and start the production SSR bundle:

```sh
npm run build:ssr
npm run start:ssr
```

## Architecture Notes

Use `docs/architecture/` for the MVP plan and ADRs. OAuth/session/database logic lives in `libs/server-platform/src/lib/plugins/`; keep plugin entrypoints thin and move feature logic into focused files.

Shared TypeScript settings live in `tsconfig.base.json` with strict, composite, NodeNext, declaration-focused output. Nx target inference is configured in `nx.json`; prefer changing root configuration over duplicating project-level settings.

## Contributor and Agent Guidance

- `AGENTS.md` is the root operating guide for AI coding agents.
- `docs/agents/` contains workflow and review checklists.
- Documentation, generated identifiers, comments, and user-facing messages must be written in English.
- Use `--no-tui` for Nx commands and `git --no-pager` for Git output in automated sessions.

## Release

Use Nx release tooling:

```sh
npx nx release --no-tui
```

Run with `--dry-run` before publishing from local machines.
