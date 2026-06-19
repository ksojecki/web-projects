# Docs Index

This directory is the operational knowledge base for contributors and AI agents.

## Language Policy

- All documentation in this repository must be written in English.
- All generated code must use English for identifiers, comments, and user-facing messages.

## Structure

- `docs/agents/` - agent setup, workflow, guardrails, and checklists.
- `docs/architecture/` - MVP architecture plan and ADRs.
- `docs/operations/` - maintenance and execution notes.

## Sources of truth in this repository

- `AGENTS.md` - quick onboarding for coding agents.
- `nx.json` - Nx orchestration and inferred targets.
- `tsconfig.base.json` - global TypeScript baseline.
- `.oxlintrc.json` - linting rules for TS/React/Node/JSX.
- `.prettierrc` - formatting rules (2 spaces, single quotes).

## How to use

1. Start with `AGENTS.md`.
2. For architecture decisions, continue in `docs/architecture/`.
3. Prepare local agent sessions with `docs/agents/setup.md`.
4. Before larger changes, run a quick check with `docs/agents/checklist.md`.
