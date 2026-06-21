# ADR 0001: Stack for Community MVP

- Status: accepted
- Date: 2026-03-14

## Context

The project is in Nx bootstrap state. We need a simple stack for:

- public announcements,
- a discussion board for authenticated users,
- a small database,
- fast delivery and low maintenance cost.

## Decision

We choose:

- Frontend: React + Vite
- Backend: Fastify
- Database: SQLite
- Monorepo layout: `projects/rod-manager/apps/web`, `projects/rod-manager/apps/api`, `libs/shared`, `libs/ui`

## Consequences

Positive:

- Low setup and maintenance cost.
- Simple MVP deployment.
- Clear frontend/backend boundaries.

Negative / trade-offs:

- SQLite has write concurrency limits.
- Some Express middleware does not map 1:1.
- A migration to Postgres may be required as traffic grows.

## Follow-up

- After MVP launch, collected metrics will drive database migration decisions.
- If the stack changes, add a new ADR instead of rewriting decision history.
