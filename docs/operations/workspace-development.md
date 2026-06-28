# Workspace Development

This page holds the technical workspace details that do not need to live in the
root README.

## Stack

- Nx 23 workspace
- React Router SSR frontend apps
- Fastify backend apps
- SQLite product-local storage
- Vitest, Oxlint, and Prettier

## Prerequisites

- Node 26, matching `.github/workflows/ci.yml`
- npm with the committed `package-lock.json`

Install dependencies with:

```sh
npm ci
```

If local HTTPS certificates are missing, recreate them with:

```sh
npm run setup:certs
```

## Supported Commands

- `npm run dev:rod-manager` - start the Rod Manager API host and SSR web app
- `npm run dev:recepturomat` - start the Recepturomat API host and SSR web app
- `npm run generate:project -- <name>` - scaffold a new product
- `npm run lint` - run Nx lint targets
- `npm run typecheck` - run Nx typecheck targets
- `npm run format:check` - run Prettier checks

## Local Development

Start the main development stack:

```sh
npm run dev:rod-manager
```

Smoke checks:

- `https://localhost:3000/` should return SSR HTML
- `https://localhost:3000/api` should return Fastify API JSON

## Naming Rules

- Filesystem layout uses nested paths such as `projects/<product>/apps/api` and
  `projects/<product>/apps/web`.
- Package names and Nx project ids stay flat:
  `@ksojecki/<product>-api` and `@ksojecki/<product>-web`.
- Do not use path-like package names such as `@ksojecki/<product>/api`.
- The root workspace package identity is `@ksojecki/platform-source`.

## Product Boundaries

- Reusable platform code belongs in `libs/`.
- Product apps belong in `projects/<product>/apps/`.
- Product-specific features belong in `projects/<product>/plugins/`.
- Each product keeps isolated database, users, sessions, OAuth records, and
  product data.
- Backend composition contract:
  `projects/<product>/apps/api/src/productConfig.ts`
- Frontend composition contract:
  `projects/<product>/apps/web/src/app/productConfig.ts`
