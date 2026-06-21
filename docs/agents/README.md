# Agent Playbook

This directory extends `AGENTS.md`.

## Language Rule

- Write documentation in English only.
- Generate code in English only (identifiers, comments, and user-facing text).

## Purpose

- Keep decisions consistent across agents and humans.
- Reduce onboarding time for new contributors.
- Prevent regressions with clear change boundaries.

## Working Standard

- Treat `AGENTS.md` as the entrypoint and this directory as the detailed guide.
- Use the Agent Workflow as the default delivery mechanism for non-trivial features, bug fixes, and error remediation.
- Document architecture decisions as ADRs in `docs/architecture/adr/`.
- For cross-cutting changes, also update operations documentation.
- Prefer small, reversible steps and validate after each meaningful change.

## Quick links

- Workflow: `docs/agents/workflow.md`
- Delivery loop skill: `.agents/skills/agent-delivery-loop/SKILL.md`
- Pre-commit staged-file checks: `.husky/pre-commit` and `.lintstagedrc.mjs`
- Checklist: `docs/agents/checklist.md`
- Setup: `docs/agents/setup.md`
- Plan MVP: `docs/architecture/mvp-plan-react-fastify-sqlite.md`
