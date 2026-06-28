# Architecture Docs

## Contents

- `mvp-plan-react-fastify-sqlite.md` - target MVP architecture plan.
- `adr/0001-stack-react-fastify-sqlite.md` - technology stack decision.
- `adr/0002-project-template-strategy.md` - product-template and per-project
  isolation decision.
- `project-template-refactor-ticket.md` - durable project-template architecture
  context.
- `project-template-implementation-roadmap.md` - durable implementation guide
  for the project-template stream.
- `recepturomat-source-inventory.md` - concrete legacy source snapshot for the
  Recepturomat migration stream.
- `recepturomat-migration.md` - Recepturomat migration architecture and issue
  breakdown.

## Principle

Implement the MVP first with simple components and minimal framework overhead.
After confirming production needs, add more advanced elements incrementally.
