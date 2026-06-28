# Operations Notes

- [workspace-development.md](/Users/kamilsojecki/Projekty/rod-manager/docs/operations/workspace-development.md) -
  workspace setup, command surface, naming rules, and local development flow.

## Standard commands

```sh
npm ci
npm run format:check
npm run lint
npm run typecheck
```

## After adding the first Nx packages

```sh
node ./node_modules/nx/dist/bin/nx.js run-many -t lint test build typecheck --no-tui
node ./node_modules/nx/dist/bin/nx.js sync --no-tui
```

## Documentation update rules

- If you change workflow, update `docs/agents/workflow.md`.
- If you change architecture, update `docs/architecture/*` and ADRs.
- If you change repo conventions, update `AGENTS.md`.
