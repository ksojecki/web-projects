# Agent Workflow

This is the default mechanism for non-trivial implementation work in this repository.
Use it for features, bug fixes, and error remediation.
When the task requires planning, do not start implementation until the plan is accepted.

## 1) Discovery

- Check `README.md`, `AGENTS.md`, and `docs/README.md`.
- Confirm the current Nx workspace state (`nx.json`, `package.json`).
- Check the current git branch before starting delivery work. If the current branch is `main`, create a new working branch before making changes.
- For new features, identify MVP scope vs non-goals.

## 2) Plan

- Define implementation steps and validation points.
- Divide the plan into small, easy-to-implement, implementation-ready steps.
- If a durable architecture decision is made, create or update an ADR.
- Track active task progress in GitHub issues. Keep local docs focused on architecture, workflow, and implementation guidance.
- Follow root-level defaults (TS, Oxlint, Prettier).
- Treat plan acceptance as the gate to start delivery work.
- When using this repository workflow, treat plan acceptance as the point where the delivery loop begins spawning step-scoped subagents.

## 3) Delivery Loop

- After the plan is accepted, use a plan -> per-step implementer/tester -> final review loop for scoped changes.
- The reusable skill for this loop lives at `.agents/skills/agent-delivery-loop/SKILL.md`.
- Required model split for that skill:
  - Implementer uses `gpt-5.4-mini`.
  - Tester uses `gpt-5.4-mini`.
  - Planning and review stay in the current agent session unless the user explicitly asks for a different model.
- Split the work into small, easy-to-implement steps during planning, then execute them sequentially.
- For one current step at a time, spawn one implementer subagent, integrate its result, then spawn one tester subagent for that same step.
- The implementer executes the accepted current step and does not re-review or re-plan it.
- Do not spawn implementers or testers for multiple future steps in parallel.
- Keep each spawned subagent scoped to one current step so the delivery loop stays auditable, step-local, and cheap.
- After a completed worker result is integrated, close finished implementer/tester threads before spawning the next worker so completed agents do not consume the thread budget.
- Pass only the accepted current step, success criteria, exact files, and the minimum evidence needed for that worker pass.
- Do not resend the full plan, full repo overview, or prior-step history to each worker unless the current step cannot be completed or validated without it.
- Treat the tester pass as the default authoritative validation for that step. Do not routinely rerun the same narrow validation in the parent session unless the tester found a concrete problem, a direct fix needs rechecking, or the step explicitly requires a broader integration check.
- Treat review as the final gate after the planned steps are complete.
- If review finds a gap, add a new corrective step and run the same sequential implementer -> tester flow for that step before reviewing again.
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
- Avoid low-signal parent-session validation commands. Add coverage or extra reporting runs only when the output is decision-relevant for the current step or final review.
- Before a PR, verify whether documentation updates are required.

## 6) Handover

- In the change description, include what changed, where, why, and how to verify.
- Add links to updated docs and ADRs when relevant.
- When task status changes materially, update the corresponding GitHub issue instead of adding live progress notes to repository docs.
- When the user asks to publish completed work, commit the accepted changes, push the working branch to `origin`, create a PR, and include the PR link in the user-facing handoff.
- When the work is considered finished in-session, prefer ending with a PR link rather than stopping at a local-only branch state.
