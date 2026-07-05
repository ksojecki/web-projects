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

- `npx nx run @ksojecki/rod-manager-api:launch --no-tui` - start Rod Manager and open Chrome for Testing on `https://localhost:3000/` with remote debugging on `127.0.0.1:9222`
- `npx nx run @ksojecki/recepturomat-api:launch --no-tui` - start Recepturomat and open Chrome for Testing on `https://localhost:3100/` with remote debugging on `127.0.0.1:9333`
- `npm run launch:rod-manager` / `npm run launch:recepturomat` - thin aliases to the Nx launch targets above
- `npm run dev:rod-manager` - start the Rod Manager API host and SSR web app
- `npm run dev:recepturomat` - start the Recepturomat API host and SSR web app
- `npm run generate:project -- <name>` - scaffold a new product
- `npm run lint` - run Nx lint targets
- `npm run typecheck` - run Nx typecheck targets
- `npm run format:check` - run Prettier checks

## Local Development

Prefer the per-project launch workflow for browser-facing work:

```sh
npx nx run @ksojecki/rod-manager-api:launch --no-tui
```

`launch:<project>` loads env in this order:

1. shell environment
2. `.env`
3. `.env.local`
4. `projects/<project>/.env`
5. `projects/<project>/.env.local`

Later files override earlier files. Keep shared defaults such as
`AUTH_SEED_INITIAL_USER`, `AUTH_INITIAL_USER_EMAIL`, and
`AUTH_INITIAL_USER_PASSWORD` in the root env files. Use project-local files only
for product-specific overrides such as:

- `PORT=3000` or `PORT=3100`
- `WEB_PORT=4200` or `WEB_PORT=4300`
- `CHROME_DEBUG_PORT=9222` or `CHROME_DEBUG_PORT=9333`
- `CHROME_USER_DATA_DIR=tmp/chrome/<project>`
- `AUTH_DB_PATH=tmp/<project>/auth.sqlite`
- `RECIPE_DB_PATH=tmp/recepturomat/recipes.sqlite`
- `OAUTH_REDIRECT_BASE_URL=https://localhost:<product-port>`
- `AUTH_SEED_INITIAL_USER=true`

Smoke checks after launch:

- `https://localhost:3000/` and `https://localhost:3000/api` for Rod Manager
- `https://localhost:3100/` and `https://localhost:3100/api` for Recepturomat

Use an authenticated session for both the page and `/api` checks.

If you only need the server process without opening Chrome, use
`npm run dev:<project>` instead. The Nx launch target uses Puppeteer's managed
Chrome for Testing by default and opens the product URL automatically.

For Codex-driven UI debugging after `npm run launch:<project>`, use the
Chrome-backed browser path exposed by the bundled browser plugin and the
existing `node_repl` backend. This repo does not define or require a standalone
`[mcp_servers.chrome-devtools]` block.

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
