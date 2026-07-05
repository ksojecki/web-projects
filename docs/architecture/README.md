# Architecture Docs

Root architecture docs cover workspace-wide decisions. Product migration notes live under the owning project.

## Workspace Decisions

- [MVP stack plan](mvp-plan-react-fastify-sqlite.md)
- [Stack ADR](adr/0001-stack-react-fastify-sqlite.md)
- [Project-template ADR](adr/0002-project-template-strategy.md)
- [Project-template context](project-template-refactor-ticket.md)
- [Project-template roadmap](project-template-implementation-roadmap.md)
- [Server-platform externalization plan](server-platform-externalization-plan.md)

## Owner Docs

- [Recepturomat migration](../../projects/recepturomat/docs/recepturomat-migration.md)
- [Recepturomat source inventory](../../projects/recepturomat/docs/recepturomat-source-inventory.md)
- [OAuth integration](../../libs/server-platform/docs/oauth-integration.md)

## Principle

Build the simple product path first. Add shared abstractions after a second product proves the reuse point.
