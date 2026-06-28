# Sojecki Platform Workspace

This repository is an Nx 23 monorepo for a reusable product-template workspace. It contains a working `rod-manager` reference product, the generated `recepturomat` migration shell, and shared TypeScript libraries for backend and frontend platform code. The stack is React Router, Fastify, SQLite, Vitest, Oxlint, and Prettier.

## Workspace Purpose

The root workspace is intended to host multiple web projects that share the same backend and frontend platform concerns:

- Fastify-based API hosting
- React SSR application hosting
- shared authentication, session, OAuth, and database patterns
- shared DTOs and reusable UI primitives
- product-specific plugins and extensions
- generator-based project creation

Each product keeps its own database, users, sessions, OAuth records, and product data. Reuse happens through `libs/` and the project generator, not through a shared multi-tenant runtime.

## Current Projects

### Rod Manager

- `projects/rod-manager/apps/web` - the Rod Manager React 19 SSR frontend. It owns user-facing pages, auth screens, account settings, and content-management views.
- `projects/rod-manager/apps/api` - the Rod Manager Fastify bootstrap application. It starts the HTTPS server, wires the shared server platform, and registers Rod Manager server plugins.
- `projects/rod-manager/plugins/pages/server` - the Rod Manager backend pages plugin. It adds page-related routes, store access, and migrations to the shared server platform.
- `projects/rod-manager/plugins/pages/ui` - the Rod Manager UI-side pages plugin package for product-specific page features.

### Recepturomat

- `projects/recepturomat/apps/web` - a generated React SSR frontend that establishes the Recepturomat product shell inside this workspace.
- `projects/recepturomat/apps/api` - a generated Fastify bootstrap application with Recepturomat-specific database and SSR paths.

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

## Supported Commands

- `npm run dev:rod-manager` - start the `rod-manager` API host and SSR web app.
- `npm run dev:recepturomat` - start the generated `recepturomat` API host and SSR web app.
- `npm run generate:project -- <name>` - scaffold a new template-based product under `projects/<name>/apps/`.
- `npm run lint` - run Nx lint targets.
- `npm run typecheck` - run Nx typecheck targets.
- `npm run format:check` - check formatting.

## Development

Run the SSR development stack:

```sh
npm run dev:rod-manager
```

This starts the Rod Manager SSR app through the Fastify API server:

- the API host from `projects/rod-manager/apps/api`
- the SSR frontend from `projects/rod-manager/apps/web`
- the Rod Manager pages plugin from `projects/rod-manager/plugins/pages/server`

To run the generated Recepturomat shell instead:

```sh
npm run dev:recepturomat
```

Local smoke checks:

- `https://localhost:3000/` should return SSR HTML.
- `https://localhost:3000/api` should return Fastify API JSON.

## Template Workflow

Create a new product with the supported generator:

```sh
npm run generate:project -- my-product
```

The generator creates:

- `projects/my-product/apps/api`
- `projects/my-product/apps/web`
- product-scoped config files for backend and frontend composition
- a root `dev:my-product` script

The current generated product for that workflow is `projects/recepturomat`.

## Product Boundaries

- Put reusable platform code in `libs/`.
- Put product apps in `projects/<product>/apps/`.
- Put product-specific features and plugins in `projects/<product>/plugins/`.
- Keep registration as a product-scoped capability configured by the product, not a workspace-wide assumption.
- Keep auth, session, OAuth, and database state isolated per product.

The supported composition surface is:

- backend: `projects/<product>/apps/api/src/productConfig.ts`
- frontend: `projects/<product>/apps/web/src/app/productConfig.ts`

## Architecture Notes

Use `docs/architecture/` for the template strategy, roadmap, and ADRs. OAuth, session, and database logic lives in `libs/server-platform/src/lib/plugins/`; keep plugin entrypoints thin and move feature logic into focused files.

Shared TypeScript settings live in `tsconfig.base.json` with strict, composite, NodeNext, declaration-focused output. Nx target inference is configured in `nx.json`; prefer changing root configuration over duplicating project-level settings.

The root workspace package identity is `@sojecki/platform-source`; use that shared condition when working with source-first conditional exports at the workspace level.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development, validation, and release workflow.

## Agent Guidance

AI agent instructions live in [AGENTS.md](./AGENTS.md) and `docs/agents/`.
