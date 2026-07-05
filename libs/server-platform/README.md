# @ksojecki/platform-server-platform

Shared Fastify server library for workspace APIs.

It provides the runtime pieces that projects reuse instead of rebuilding auth, session, database, OAuth, and SSR wiring in each app.

## Responsibilities

- Create the shared Fastify platform runtime
- Register auth, session, database, and OAuth plugins
- Expose shared HTTP routes and runtime contracts
- Support SSR delivery for web apps

## Key paths

- `src/lib/createServerPlatform.ts`
- `src/lib/routes/`
- `src/lib/plugins/`
- `src/lib/contracts/`
- `src/lib/runtime/context.ts`
- `src/index.ts`

## Related Docs

- [Library agents](./AGENTS.md)
- [OAuth integration](./docs/oauth-integration.md)
- [Root AGENTS](../../AGENTS.md)
- [Agent workflow](../../docs/agents/workflow.md)
- [Workspace development](../../docs/operations/workspace-development.md)
