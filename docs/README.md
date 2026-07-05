# Workspace Docs

Use root docs for rules that apply across the workspace. Put product and library details next to the code that owns them.

## Root Scope

- [Agent docs](agents/README.md) - agent setup, workflow, and checklist.
- [Architecture docs](architecture/README.md) - workspace decisions, ADRs, and template strategy.
- [Operations docs](operations/README.md) - local commands and maintenance notes.

## Project Docs

- [Rod Manager](../projects/rod-manager/README.md)
- [Recepturomat](../projects/recepturomat/README.md)
- [Recepturomat migration](../projects/recepturomat/docs/recepturomat-migration.md)
- [Recepturomat source inventory](../projects/recepturomat/docs/recepturomat-source-inventory.md)

## Library Docs

- [Server platform](../libs/server-platform/README.md)
- [Server platform OAuth](../libs/server-platform/docs/oauth-integration.md)
- [Web platform](../libs/web-platform/README.md)
- [Shared contracts](../libs/shared/README.md)
- [UI primitives](../libs/ui/README.md)

## Sources Of Truth

- `AGENTS.md` sets root coding-agent rules.
- `README.md` links the workspace map.
- `package.json` defines root scripts.
- `nx.json` defines Nx orchestration.
- `tsconfig.base.json`, `.oxlintrc.json`, and `.prettierrc` set shared TypeScript, lint, and formatting rules.
- GitHub issues track active task progress.
