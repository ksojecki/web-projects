# Product Workspace

This repository is an Nx monorepo for multiple web products that share one
platform codebase and one project generator.

## Products

### Rod Manager

- Main reference product in the workspace.
- Owns a React SSR web app, a Fastify API app, and product-local pages plugins.
- Lives under `projects/rod-manager/`.

### Recepturomat

- Generated second product used to prove the template and isolation model.
- Owns a React SSR web app and a Fastify API app.
- Lives under `projects/recepturomat/`.

## Shared Platform

- `libs/server-platform` - shared Fastify, SSR, database, session, and OAuth
  platform code.
- `libs/web-platform` - shared auth, account, layout, and shell UI for product
  apps.
- `libs/shared` - shared DTOs and cross-project contracts.
- `libs/ui` - shared UI primitives.

## Create a New Product

Use the supported generator wrapper:

```sh
npm run generate:project -- my-product
```

This creates:

- `projects/my-product/apps/api`
- `projects/my-product/apps/web`
- flat package ids `@ksojecki/my-product-api` and
  `@ksojecki/my-product-web`
- a root `dev:my-product` script

New product files live in nested `projects/<product>/apps/*` paths, but package
names and Nx project ids stay flat in the npm-compatible form
`@ksojecki/<product>-api` and `@ksojecki/<product>-web`.

## Technical Docs

- [docs/operations/workspace-development.md](/Users/kamilsojecki/Projekty/rod-manager/docs/operations/workspace-development.md) -
  setup, commands, naming rules, and local development flow.
- [CONTRIBUTING.md](/Users/kamilsojecki/Projekty/rod-manager/CONTRIBUTING.md) -
  contributor validation, production build, and release commands.
- [docs/architecture/README.md](/Users/kamilsojecki/Projekty/rod-manager/docs/architecture/README.md) -
  architecture decisions, roadmap, and ADRs.
- [AGENTS.md](/Users/kamilsojecki/Projekty/rod-manager/AGENTS.md) -
  coding-agent workflow and repository conventions.
