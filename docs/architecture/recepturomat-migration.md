# Recepturomat Migration Plan

## Context

Recepturomat currently lives outside this workspace at
`/Users/kamilsojecki/Projekty/recepturomat`. The source application is an Nx 22
workspace with:

- `apps/ui` for the React Router frontend.
- `apps/backend` for an Express API.
- `libs/data-model` for recipe, ingredient, response, and user contracts.
- MongoDB collections for users, settings, and recipes.
- Custom JWT authentication and bearer-token frontend state.

For the concrete legacy file inventory, route map, and bootstrap details, start
with [`recepturomat-source-inventory.md`](./recepturomat-source-inventory.md).
This document stays at the migration strategy level.

The target workspace is the Nx 23 product-template structure in this repository.
Recepturomat should enter the workspace through the supported generator:

```sh
npm run generate:project -- recepturomat
```

The generated product should then be adapted incrementally under
`projects/recepturomat/` instead of copying the old repository layout.

## Architecture Decision

Use product-local SQLite for the migrated Recepturomat runtime.

Reasons:

- The application targets small companies, so operational simplicity matters more
  than horizontal scaling.
- The current data model is small: recipes, nested ingredients, recipe-to-recipe
  references, and basic bootstrap settings.
- This repository already uses product-scoped SQLite for platform auth and
  session storage through `ServerPlatformProjectConfig`.
- Keeping MongoDB would add a second runtime database and deployment dependency
  for one product.
- A generic storage adapter would add abstraction cost before there is a second
  runtime storage backend to support.

MongoDB may remain useful as a legacy import source, but it should not be part of
normal Recepturomat runtime after migration unless a later ticket proves a hard
requirement.

## Target Runtime Shape

- `projects/recepturomat/apps/api` owns Recepturomat API composition.
- `projects/recepturomat/apps/web` owns Recepturomat frontend composition.
- Shared auth/session/platform routes come from `libs/server-platform` and
  `libs/web-platform`.
- Recipe-specific data access, schema bootstrap, and feature routes stay
  product-local until reuse is proven.
- Product config uses Recepturomat-specific project ID, database paths, seed
  flags, SSR paths, and frontend routing settings.

For the first SQL model, store recipes in a product-local table with stable
`recipeId`, `name`, `defaultWeight`, and JSON-encoded ingredients. This preserves
the current document-shaped recipe behavior cheaply while still removing the
MongoDB runtime dependency. Normalize ingredients later only if reporting,
inventory, or query requirements justify the extra schema complexity.

## Migration Tickets

Active progress belongs in GitHub issues. This document is architecture context,
not the live status tracker.

- [#30](https://github.com/ksojecki/rod-manager/issues/30) - Move
  Recepturomat into this repository.
- [#66](https://github.com/ksojecki/rod-manager/issues/66) - Inventory source
  app behavior and migration boundaries.
- [#67](https://github.com/ksojecki/rod-manager/issues/67) - Scaffold generated
  product shell.
- [#68](https://github.com/ksojecki/rod-manager/issues/68) - Define
  product-local recipe SQL schema and store.
- [#69](https://github.com/ksojecki/rod-manager/issues/69) - Port backend routes
  to Fastify platform API.
- [#70](https://github.com/ksojecki/rod-manager/issues/70) - Port frontend into
  generated web app.
- [#71](https://github.com/ksojecki/rod-manager/issues/71) - Add legacy Mongo
  export/import path to SQLite.
- [#72](https://github.com/ksojecki/rod-manager/issues/72) - Document product
  operations and validate independent builds.

Use the `recepturomat` label for all follow-up tickets in this stream.

## Non-Goals

- Do not introduce MongoDB as a shared platform dependency.
- Do not create a generic storage abstraction before a second runtime backend is
  required.
- Do not move recipe-specific components or stores into global `libs/` during
  the initial migration.
- Do not make Recepturomat share Rod Manager's product database, users, or
  runtime identity.
