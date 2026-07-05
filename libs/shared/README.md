# @ksojecki/platform-shared

Shared TypeScript contracts and helpers used by API and web projects.

Use this library for DTOs, shared auth payloads, and workspace-level helpers that need one source of truth.

## Responsibilities

- Define shared auth DTOs
- Define shared user settings contracts
- Expose workspace configuration helpers
- Keep API and web layers aligned on shared types

## Key paths

- `src/lib/auth.dto.ts`
- `src/lib/user-settings.dto.ts`
- `src/lib/workspaceConfig.ts`
- `src/index.ts`

## Related Docs

- [Library agents](./AGENTS.md)
- [Root AGENTS](../../AGENTS.md)
- [Agent workflow](../../docs/agents/workflow.md)
- [Workspace development](../../docs/operations/workspace-development.md)
