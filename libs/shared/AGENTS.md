# `libs/shared`

This library owns shared DTOs and workspace configuration helpers. Keep product-specific code out of it.

## Ownership

- Treat this folder as platform code for both products.
- Keep exports stable. Changes here can affect backend and frontend code at once.
- Move product-only logic to `projects/*` or a product library.

## Validation

- Run `npx nx test @ksojecki/platform-shared --no-tui` for behavior changes.
- Run `npx nx build @ksojecki/platform-shared --no-tui` when you change exported types or runtime helpers.
- Run `npx nx typecheck @ksojecki/platform-shared --no-tui` before handoff.
- Run `npx nx lint @ksojecki/platform-shared --no-tui` when you touch implementation code.

## Local conventions

- Keep files small and domain-specific.
- Keep DTOs in `src/lib/*.dto.ts`.
- Keep workspace config helpers in `src/lib/workspaceConfig.ts`.
- Update import sites when you rename or move exports.
- Keep prose in comments and docs direct and short.
