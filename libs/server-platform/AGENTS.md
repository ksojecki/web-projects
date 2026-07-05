# `libs/server-platform`

This library owns the shared Fastify runtime and platform plugins. Keep project routes and project config out of it.

## Ownership

- Treat this folder as backend platform code.
- Keep plugin entrypoints thin. Put business logic in the nearby domain file.
- Keep Fastify decorators and registration in `index.ts` files.
- Move project-specific behavior to `projects/*` or to project-scoped config.

## Validation

- Run `npx nx test @ksojecki/platform-server-platform --no-tui` for route and plugin changes.
- Run `npx nx build @ksojecki/platform-server-platform --no-tui` when you touch runtime code.
- Run `npx nx typecheck @ksojecki/platform-server-platform --no-tui` before handoff.
- Run `npx nx lint @ksojecki/platform-server-platform --no-tui` after implementation changes.

## Local conventions

- Keep `plugins/` split by responsibility.
- Keep shared contracts in `src/lib/contracts/`.
- Keep session and database helpers close to the code that uses them.
- Prefer focused files over `helpers.ts` or `utils.ts`.
- Keep docs and comments direct.
