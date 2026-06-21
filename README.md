# Sojecki Platform Workspace

This repository is an Nx 22 monorepo for the neutral shared platform workspace that currently hosts the RodManager React SSR web app, its Fastify API, and shared TypeScript libraries. The MVP stack is React Router, Fastify, SQLite, Vitest, Oxlint, and Prettier.

## Workspace Purpose

The root workspace is intended to host multiple web projects that share the same backend/frontend platform concerns:

- Fastify-based API hosting
- React SSR application hosting
- shared authentication, session, OAuth, and database patterns
- shared DTOs and reusable UI primitives
- product-specific plugins and extensions

The first product in this workspace is Rod Manager.

## Current Projects

### Rod Manager

- `projects/rod-manager/apps/web` - the Rod Manager React 19 SSR frontend. It owns user-facing pages, auth screens, account settings, and content-management views.
- `projects/rod-manager/apps/api` - the Rod Manager Fastify bootstrap application. It starts the HTTPS server, wires the shared server platform, and registers Rod Manager server plugins.
- `projects/rod-manager/plugins/pages/server` - the Rod Manager backend pages plugin. It adds page-related routes, store access, and migrations to the shared server platform.
- `projects/rod-manager/plugins/pages/ui` - the Rod Manager UI-side pages plugin package for product-specific page features.

### Shared Platform Libraries

- `libs/server-platform` - the shared Fastify platform layer. It owns server composition, SSR route registration, database/session/oauth plugins, and core API routes.
- `libs/shared` - shared DTOs and cross-project contracts used by apps and plugins.
- `libs/ui` - shared React UI components and primitives reused across products.

### Supporting Areas

- `docs` - architecture, operations, and agent workflow documentation.
- `scripts` - setup helpers, local tooling, and development certificate scripts.

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
npm run dev
```

This starts the SSR app through the Fastify API server.

Today that command starts the Rod Manager product:

- the API host from `projects/rod-manager/apps/api`
- the SSR frontend from `projects/rod-manager/apps/web`
- the Rod Manager pages plugin from `projects/rod-manager/plugins/pages/server`

Local smoke checks:

- `https://localhost:3000/` should return SSR HTML.
- `https://localhost:3000/api` should return Fastify API JSON.

## Architecture Notes

Use `docs/architecture/` for the MVP plan and ADRs. OAuth/session/database logic lives in `libs/server-platform/src/lib/plugins/`; keep plugin entrypoints thin and move feature logic into focused files.

Shared TypeScript settings live in `tsconfig.base.json` with strict, composite, NodeNext, declaration-focused output. Nx target inference is configured in `nx.json`; prefer changing root configuration over duplicating project-level settings.

The root workspace package identity is `@sojecki/platform-source`; use that shared condition when working with source-first conditional exports at the workspace level.

When adding another product, keep product code under `projects/<product>/...` and keep reusable platform code in `libs/...`.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development, validation, and release workflow.

## Agent Guidance

AI agent instructions live in [AGENTS.md](./AGENTS.md) and `docs/agents/`.
