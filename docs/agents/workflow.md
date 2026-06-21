# Agent Workflow

This is the default mechanism for non-trivial implementation work in this repository.
Use it for features, bug fixes, and error remediation.
When the task requires planning, do not start implementation until the plan is accepted.

## 1) Discovery

- Check `README.md`, `AGENTS.md`, and `docs/README.md`.
- Confirm the current Nx workspace state (`nx.json`, `package.json`).
- Check the current git branch before starting delivery work. If the current branch is `main`, create a new working branch before making changes.
- If CodeDrift is configured, start with memory recall for the current task before broader search/read steps.
- For new features, identify MVP scope vs non-goals.

## 2) Plan

- Define implementation steps and validation points.
- If a durable architecture decision is made, create or update an ADR.
- Follow root-level defaults (TS, Oxlint, Prettier).
- Treat plan acceptance as the gate to start delivery work.
- When using this repository workflow, treat plan acceptance as the point where the delivery loop begins spawning step-scoped subagents.

## 3) Delivery Loop

- After the plan is accepted, use a plan -> per-step implementer/tester -> final review loop for scoped changes.
- The reusable skill for this loop lives at `.agents/skills/agent-delivery-loop/SKILL.md`.
- Recommended model split for that skill:
  - Implementer uses `gpt-5.4-mini`.
  - Tester uses `gpt-5.4-mini`.
  - Choose the planning/review model based on task risk and scope.
- Split the work into small implementation steps during planning, then execute them sequentially.
- For one current step at a time, spawn one implementer subagent, integrate its result, then spawn one tester subagent for that same step.
- Do not spawn implementers for multiple future steps in parallel by default; prefer the smallest active step to reduce token usage and keep context narrow.
- Keep each spawned subagent scoped to one current step so the delivery loop stays auditable, step-local, and cheap.
- Treat review as the final gate after the planned steps are complete.
- If review finds a gap, add a new corrective step and run the same sequential implementer -> tester flow for that step before reviewing again.
- Keep the reviewer agent in the background when possible so review context is not lost between sessions.
- Keep each pass narrow and evidence-driven.
- Revisit the plan after any failed validation before widening the change.
- Do not bypass this loop for non-trivial feature delivery or for fixing bugs and runtime errors.

## 4) Implementation

- Make small changes, ideally one goal per change.
- Do not override local package conventions unless necessary.
- For API changes, keep alignment with `docs/architecture/`.
- Keep generated code and comments in English.
- For new plugins, use a folder-based structure with `index.ts` as a thin entrypoint and focused modules (types + implementation files), matching the `database` plugin style.
- For larger modules in general, split by responsibility once complexity grows (avoid monolithic files).

## 5) Validation

- Run lint/format and a quick smoke-check after major changes.
- Before a PR, verify whether documentation updates are required.

## 6) Handover

- In the change description, include what changed, where, why, and how to verify.
- Add links to updated docs and ADRs when relevant.
- When the user asks to publish completed work, commit the accepted changes and push the working branch to `origin`.
- If the session produced reusable context, record it in CodeDrift memory before ending the task.
