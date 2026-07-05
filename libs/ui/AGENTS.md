# `libs/ui`

This library owns reusable React primitives. Keep it free of app-specific behavior.

## Ownership

- Treat this folder as shared presentation code.
- Keep component names free of the `Ui` prefix.
- Prefer small composition pieces over large page-specific components.

## Validation

- Run `npx nx lint @ksojecki/platform-ui --no-tui` after component changes.
- Use `npm run format:check` before handoff.
- If you touch public exports or component contracts, check the consumer app that imports them.

## Local conventions

- Export components from `src/lib` or nested feature folders.
- Keep props simple and explicit.
- Reuse existing visual patterns before adding new ones.
- Keep docs and examples short and direct.
