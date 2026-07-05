# ADR 0002: Treat `rod-manager` as a Reusable Project Template

- Status: proposed
- Date: 2026-06-21

## Context

The repository already contains reusable platform pieces:

- backend platform orchestration in `libs/server-platform`
- shared DTOs in `libs/shared`
- shared UI primitives in `libs/ui`
- a working project implementation in `projects/rod-manager`

At the same time, the current structure still mixes reusable platform concerns with `rod-manager` project concerns. The main risk is that adding a new project will require copying `rod-manager`, then manually untangling CMS-specific behavior from reusable auth, account, session, and OAuth code.

There is also an explicit project requirement:

- each future project must use a separate user base
- each future project must use a separate database

Because of that constraint, this repository must not evolve into one multi-project runtime with a shared authenticated user base.

## Decision

We will treat `rod-manager` as a reference implementation and reusable project template, not as a shared authenticated entry point for multiple projects.

The repository strategy is:

- shared platform capabilities live in `libs/`
- concrete projects live in `projects/<project>/`
- each project owns its own `api` app and `web` app
- each project owns its own database, users, sessions, OAuth records, and project data
- project features live under `projects/<project>/plugins/`
- reuse happens through shared libraries and generators, not through one runtime serving many projects

We will refactor toward:

- a reusable backend platform centered on `libs/server-platform`
- a reusable frontend auth/account platform library
- thin project composition layers in each project app
- a scaffolded workflow for adding a new project

## Consequences

Positive:

- New projects can reuse auth, session, OAuth, account, and UI foundations without sharing user data.
- Project boundaries become clearer: generic code in `libs/`, project code in `projects/<project>/`.
- `rod-manager` remains useful as both a working project and a proof that the template abstractions are practical.
- Adding a new project becomes a controlled scaffolded workflow instead of copy-paste.

Negative / trade-offs:

- We will maintain more than one app bootstrap in the workspace.
- Some current `rod-manager` frontend files must be split before they can be reused cleanly.
- We must be strict about not leaking project-specific DTOs or routes into shared libraries.
- The refactor adds short-term structural work before it reduces long-term project setup cost.

## Rejected Alternatives

### Shared Multi-Project Portal

Rejected because it would push the repository toward one shared user base and one shared account surface, which conflicts with the requirement that each project must keep separate users and separate databases.

### Copy `rod-manager` for Each New Project

Rejected because it would duplicate auth, OAuth, account, and session logic, increasing maintenance cost and making future fixes harder to propagate.

## Follow-up

- Use GitHub issues as the execution and progress tracker for the refactor stream.
- Use [project-template-refactor-ticket.md](../project-template-refactor-ticket.md) as architecture context.
- Use [project-template-implementation-roadmap.md](../project-template-implementation-roadmap.md) as the implementation plan.
- First implementation steps:
  - extract reusable frontend auth/account code into a shared library
  - introduce explicit per-project backend bootstrap configuration
  - validate the approach by scaffolding a second sample project with an isolated database
