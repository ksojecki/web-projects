# Web Projects

Nx workspace for web projects and shared libraries.

## Projects

- [Rod Manager](projects/rod-manager/README.md) - community portal for small groups that need public pages, member accounts, and simple content management.
- [Recepturomat](projects/recepturomat/README.md) - recipe and yield calculation app for small bakeries, restaurants, and food enthusiasts.

## Libraries

- [Server platform](libs/server-platform/README.md) - shared Fastify runtime for auth, sessions, database access, OAuth, and SSR delivery.
- [Web platform](libs/web-platform/README.md) - shared React flows for auth, account pages, and app shell behavior.
- [Shared contracts](libs/shared/README.md) - DTOs and workspace helpers shared across API and web layers.
- [UI primitives](libs/ui/README.md) - reusable React components for pages, forms, links, and modal flows.

## Docs

- [Workspace docs](docs/README.md)
- [Agent guide](AGENTS.md)
- [Agent workflow](docs/agents/workflow.md)
- [Architecture docs](docs/architecture/README.md)
- [Operations docs](docs/operations/README.md)

## Commands

```sh
npm ci
npm run dev:rod-manager
npm run dev:recepturomat
npm run generate:project -- <name>
npm run lint
npm run typecheck
npm run format:check
```
