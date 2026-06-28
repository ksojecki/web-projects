# Agent Checklist

Use this list before closing a task.

## Scope and architecture

- [ ] Is the change within MVP scope?
- [ ] Is the change aligned with `docs/architecture/mvp-plan-react-fastify-sqlite.md`?
- [ ] Is a new ADR required, or does an existing ADR need an update?
- [ ] Is the work tracked by a GitHub issue, and does the PR title or description include that issue number?
- [ ] If the task was non-trivial, was the accepted plan executed through the Agent Workflow delivery loop?

## Quality

- [ ] Does the code respect Oxlint-enforced rules (including no `any` and no floating promises)?
- [ ] For review-enforced conventions, are top-level declarations ordered as: exported types, local types, constants, exported functions, local functions?
- [ ] If that order was impossible due to compilation constraints, is there a short local comment explaining why?
- [ ] Is formatting aligned with Prettier (2-space indentation)?
- [ ] Are documentation updates written in English?
- [ ] Is generated code written in English (identifiers, comments, user-facing text)?
- [ ] For new plugins, is the entrypoint `index.ts` (thin composition only) and implementation split into focused files (types + services/helpers), similar to `libs/server-platform/src/lib/plugins/database/`?
- [ ] For larger non-plugin modules, was code split by responsibility instead of growing a single file?

## Operations

- [ ] Does the change keep Nx inferred targets intact?
- [ ] Do pre-commit scripts/hooks still work?
- [ ] If hook behavior changed, was `.lintstagedrc.mjs` reviewed or updated alongside `.husky/pre-commit`?
- [ ] Was documentation updated when workflow or architecture changed?
