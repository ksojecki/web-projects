# Web Projects

Nx workspace for product apps and shared platform libraries.

## Products

- [Rod Manager](projects/rod-manager/README.md) - reference product with a React SSR app, Fastify API, and product page plugins.
- [Recepturomat](projects/recepturomat/README.md) - recipe-management product migrated into the shared workspace model.

## Libraries

- [Server platform](libs/server-platform/README.md) - shared Fastify runtime, auth, sessions, database, OAuth, and SSR support.
- [Web platform](libs/web-platform/README.md) - shared React auth, account, layout, and shell behavior.
- [Shared contracts](libs/shared/README.md) - DTOs and workspace configuration helpers.
- [UI primitives](libs/ui/README.md) - reusable React presentation components.

## Root Docs

- [Workspace docs](docs/README.md) - shared approach, tooling, architecture, and operations.
- [Agent guide](AGENTS.md) - root rules for coding agents.
- [Agent workflow](docs/agents/workflow.md) - delivery loop and validation rules.
- [Architecture docs](docs/architecture/README.md) - ADRs and workspace-level design notes.
- [Operations docs](docs/operations/README.md) - commands and local development.

## Commands

```sh
npm ci
npm run dev:rod-manager
npm run dev:recepturomat
npm run generate:project -- my-product
npm run lint
npm run typecheck
npm run format:check
```
