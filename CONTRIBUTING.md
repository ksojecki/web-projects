# Contributing

## Language Rule

- Write documentation in English.
- Use English for generated identifiers, comments, and user-facing messages.

## Local Development

Install dependencies:

```sh
npm ci
```

If local HTTPS certificates are missing, recreate them with:

```sh
npm run setup:certs
```

Start the SSR development server:

```sh
npm run dev
```

Smoke checks:

- `https://localhost:3000/` should return SSR HTML.
- `https://localhost:3000/api` should return Fastify API JSON.

## Validation

Run the standard project checks:

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

## Production Build

Build and start the production SSR bundle:

```sh
npm run build:ssr
npm run start:ssr
```

## Release

Use Nx release tooling:

```sh
npx nx release --no-tui
```

Run with `--dry-run` before publishing from local machines.
