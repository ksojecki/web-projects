# `libs/web-platform`

This library owns shared React behavior for auth, account, and shell UI. Keep project-specific routes and copy in the project app.

## Ownership

- Treat this folder as shared frontend platform code.
- Keep auth and account flows reusable across projects.
- Keep project-specific labels, routes, and feature toggles outside the library.

## Validation

- Run `npx nx test @ksojecki/platform-web-platform --no-tui` for behavior changes.
- Run `npx nx build @ksojecki/platform-web-platform --no-tui` when you change exported components or hooks.
- Run `npx nx typecheck @ksojecki/platform-web-platform --no-tui` before handoff.
- Run `npx nx lint @ksojecki/platform-web-platform --no-tui` after implementation changes.
- If you change account defaults, run the targeted spec in `src/lib/account/` too.

## Local conventions

- Keep hook and component names specific to their domain.
- Keep auth, account, and shell code in separate folders.
- Reuse existing form and route patterns before adding new ones.
- Keep copy short and project-neutral.
