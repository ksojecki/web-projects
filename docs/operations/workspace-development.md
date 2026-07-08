# Workspace Development

Use this page for technical workspace details that do not belong in the root
README.

## Stack

- Nx 23 workspace
- React Router SSR frontend apps
- Fastify backend apps
- SQLite project-local storage
- Vitest, Oxlint, and Oxfmt

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

- `npx nx run @ksojecki/rod-manager-api:dev --no-tui` - start Rod Manager and open Chrome for Testing on `https://localhost:3000/` with remote debugging on `127.0.0.1:9222`
- `npx nx run @ksojecki/recepturomat-api:dev --no-tui` - start Recepturomat and open Chrome for Testing on `https://localhost:3100/` with remote debugging on `127.0.0.1:9333`
- `npm run dev:rod-manager` / `npm run dev:recepturomat` - thin aliases to the Nx `dev` targets above
- `npm run generate:project -- <name>` - scaffold a new project
- `npm run lint` - run Nx lint targets
- `npm run typecheck` - run Nx typecheck targets
- `npm run format:check` - run Oxfmt checks

## Local Development

Prefer the per-project `dev` workflow for browser-facing work:

```sh
npx nx run @ksojecki/rod-manager-api:dev --no-tui
```

The public `dev` workflow reads env files in this order:

1. shell environment
2. `.env`
3. `.env.local`
4. `projects/<project>/.env`
5. `projects/<project>/.env.local`

Later env files override earlier env files. Values already present in the shell
environment still win because the loader does not overwrite existing
`process.env` keys.

Keep shared defaults such as `AUTH_SEED_INITIAL_USER`,
`AUTH_INITIAL_USER_EMAIL`, and `AUTH_INITIAL_USER_PASSWORD` in the root env
files. Use project-local files only for project-specific overrides such as:

- `PORT=3000` or `PORT=3100`
- `WEB_PORT=4200` or `WEB_PORT=4300`
- `CHROME_DEBUG_PORT=9222` or `CHROME_DEBUG_PORT=9333`
- `CHROME_USER_DATA_DIR=tmp/chrome/<project>`
- `AUTH_DB_PATH=tmp/<project>/auth.sqlite`
- `RECIPE_DB_PATH=tmp/recepturomat/recipes.sqlite`
- `OAUTH_REDIRECT_BASE_URL=https://localhost:<project-port>`
- `AUTH_SEED_INITIAL_USER=true`

Smoke checks after startup:

- `https://localhost:3000/` and `https://localhost:3000/api` for Rod Manager
- `https://localhost:3100/` and `https://localhost:3100/api` for Recepturomat

Use an authenticated session for both the page and `/api` checks.

If you only need the raw server process without opening Chrome, use the
underlying Nx `serve` target directly. The public Nx `dev` target uses
Puppeteer's managed Chrome for Testing by default and opens the project URL.

For Codex-driven UI debugging after `npm run dev:<project>`, use the
Chrome-backed browser path exposed by the bundled browser plugin and the
existing `node_repl` backend. This repo does not define or require a standalone
`[mcp_servers.chrome-devtools]` block.

## Naming Rules

- Filesystem layout uses nested paths such as `projects/<project>/apps/api` and
  `projects/<project>/apps/web`.
- Package names and Nx project ids stay flat:
  `@ksojecki/<project>-api` and `@ksojecki/<project>-web`.
- Do not use path-like package names such as `@ksojecki/<project>/api`.
- The root workspace package identity is `@ksojecki/platform-source`.

## Project Boundaries

- Reusable platform code belongs in `libs/`.
- Project apps belong in `projects/<project>/apps/`.
- Project-specific features belong in `projects/<project>/plugins/`.
- Each project keeps isolated database, users, sessions, OAuth records, and
  project data.
- Backend composition contract:
  `projects/<project>/apps/api/src/productConfig.ts`
- Frontend composition contract:
  `projects/<project>/apps/web/src/app/productConfig.ts`
