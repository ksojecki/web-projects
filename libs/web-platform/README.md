# @ksojecki/platform-web-platform

Shared React library for cross-project web flows.

It contains the account, auth, and shell pieces that projects compose into their own routes and branding.

## Responsibilities

- Provide auth pages, hooks, and client-side auth state
- Provide shared account page composition
- Provide shared shell and navigation building blocks
- Keep common frontend flows aligned across projects

## Key paths

- `src/lib/auth/`
- `src/lib/account/`
- `src/lib/shell/`
- `src/lib/auth/OAuthCallbackPage.tsx`
- `src/lib/shell/PlatformNavbar.tsx`
- `src/index.ts`

## Related Docs

- [Library agents](./AGENTS.md)
- [Root AGENTS](../../AGENTS.md)
- [Agent workflow](../../docs/agents/workflow.md)
- [Workspace development](../../docs/operations/workspace-development.md)
