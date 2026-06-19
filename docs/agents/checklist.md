# Agent Checklist

Use this list before closing a task.

## Scope and architecture

- [ ] Is the change within MVP scope?
- [ ] Is the change aligned with `docs/architecture/mvp-plan-react-fastify-sqlite.md`?
- [ ] Is a new ADR required, or does an existing ADR need an update?

## Quality

- [ ] Does the code respect Oxlint-enforced rules (including no `any` and no floating promises)?
- [ ] For review-enforced conventions, are top-level declarations ordered as: exported types, local types, constants, exported functions, local functions?
- [ ] If that order was impossible due to compilation constraints, is there a short local comment explaining why?
- [ ] Do public methods include JSDoc descriptions where project conventions require them?
- [ ] Is formatting aligned with Prettier (2-space indentation)?
- [ ] Are documentation updates written in English?
- [ ] Is generated code written in English (identifiers, comments, user-facing text)?
- [ ] For new plugins, is the entrypoint `index.ts` (thin composition only) and implementation split into focused files (types + services/helpers), similar to `libs/server-platform/src/lib/plugins/database/`?
- [ ] For larger non-plugin modules, was code split by responsibility instead of growing a single file?

## Operations

- [ ] Does the change keep Nx inferred targets intact?
- [ ] Do pre-commit scripts/hooks still work?
- [ ] Was documentation updated when workflow or architecture changed?
