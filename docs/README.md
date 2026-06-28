# Docs Index

This directory is the operational knowledge base for contributors and AI agents.

## Language Policy

- All documentation in this repository must be written in English.
- All generated code must use English for identifiers, comments, and user-facing messages.

## Structure

- `docs/agents/` - agent setup, workflow, guardrails, and checklists.
- `docs/architecture/` - template strategy, implementation roadmap, and ADRs.
- `docs/operations/` - maintenance and execution notes.

## Sources of truth in this repository

- `AGENTS.md` - quick onboarding for coding agents.
- `nx.json` - Nx orchestration and inferred targets.
- `tsconfig.base.json` - global TypeScript baseline.
- `.oxlintrc.json` - linting rules for TS/React/Node/JSX.
- `.prettierrc` - formatting rules (2 spaces, single quotes).
- `package.json` - root script surface, including `dev:<product>` and `generate:project`.
- `tools/generators.json` - workspace generator entrypoints.
- GitHub issues - active task tracking and progress updates.

## Template Workflow Pointers

- `README.md` - contributor-facing overview of the supported project-template workflow.
- `docs/architecture/adr/0002-project-template-strategy.md` - durable decision for template reuse and per-project isolation.
- `docs/architecture/project-template-refactor-ticket.md` - repository architecture state and product-boundary rules.
- `docs/architecture/project-template-implementation-roadmap.md` - delivery sequence and remaining follow-up work.
- `docs/architecture/recepturomat-migration.md` - Recepturomat migration architecture and ticket breakdown.
- `package.json` and `tools/generators.json` - supported scaffold entrypoints for new products.
- `docs/agents/setup.md` - cheapest-first session start and low-token command workflow for agents.

## How to use

1. Start with `AGENTS.md`.
2. Read `README.md` for the root command surface and template workflow.
3. For architecture decisions and ADRs, continue in `docs/architecture/`.
4. Use the documented root wrapper `npm run generate:project -- <name>`; it dispatches to `tools/generators.json:project-template`.
5. Prepare local agent sessions with `docs/agents/setup.md`.
6. Before larger changes, run a quick check with `docs/agents/checklist.md`.
7. Start task work from the relevant GitHub issue. If one does not exist, create
   it before implementation.
8. Record active task progress in GitHub instead of duplicating status updates
   in local docs.
