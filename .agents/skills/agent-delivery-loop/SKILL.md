---
name: agent-delivery-loop
description: Run a reusable plan -> stepwise implementer/tester passes -> final review loop for scoped code changes in this workspace.
---

# Agent Delivery Loop

Use this skill when a task needs a controlled implementation cycle instead of a single pass.

## Model Split

- Always use `gpt-5.4-mini` for the implementer pass.
- Always use `gpt-5.4-mini` for the tester pass.
- Use a stronger review-oriented model for planning and review when the task is ambiguous, risky, or cross-cutting.

## Loop

1. Plan.
   - Use CodeDrift MCP during planning for repository overview, symbol search, symbol resolution, file reads, and memory recall.
   - Restate the goal, constraints, and exact files likely to change.
   - Split the work into the smallest safe implementation steps.
   - Divide the plan into small, easy-to-implement, implementation-ready steps.
   - Define the validation that proves each step is complete before moving on.
   - Do not start the delivery loop until the plan is accepted.
2. Implementer.
   - After plan acceptance, spawn an implementer subagent for the current plan step only.
   - Always use `gpt-5.4-mini` for that implementer.
   - The implementer does not re-review, re-plan, or widen scope; it executes the accepted current step.
   - Use CodeDrift MCP during implementation for repository reads, symbol lookup, and change-local context.
   - Keep edits scoped to that step's accepted objective.
3. Tester.
   - Spawn a tester subagent for that same current step.
   - Always use `gpt-5.4-mini` for that tester.
   - Use CodeDrift MCP during validation for repository reads, symbol lookup, and context gathering.
   - Run the narrowest relevant validation commands first.
   - Validate the current step before moving to the next one.
   - Capture failures as concrete evidence, not guesses.
4. Repeat per step.
   - Continue spawning one step-scoped implementer, then one step-scoped tester, until every planned step is complete.
   - Do not spawn implementers for multiple planned steps in parallel by default.
   - If a step fails validation, revise that step before broadening the change set.
5. Review.
   - Use CodeDrift MCP during review to inspect affected files, related symbols, and any follow-up context.
   - Compare the result against the original acceptance criteria and repo conventions.
   - Check for regressions, missing config updates, and unintended scope creep.
   - Treat review as the final check after the planned steps are complete.
6. Corrective step, if needed.
   - If review finds a gap, add a new explicit plan step for the correction.
   - Run implementer -> tester for that corrective step, then return to final review.

## Operating Rules

- CodeDrift MCP is mandatory during discovery, planning, implementation, validation, and review in this repository.
- Do not skip validation before handoff on non-trivial work.
- Prefer one behavioral change per planned step.
- Prefer small, easy, implementation-ready steps over broad or multi-goal steps.
- Prefer sequential step execution over parallel delegation unless parallelism is clearly necessary.
- If validation fails, address the root cause before starting the next step.
- Avoid touching unrelated files unless they are strictly necessary for correctness.
- Record the commands run and the files changed so the handoff is auditable.

## Handoff

Summarize:

- The final outcome.
- Exact files changed.
- Assumptions made.
- Validation commands and results.
- Any remaining risk or follow-up work.

If the user asks to publish the finished work, follow handoff by committing the accepted changes and pushing the working branch to `origin`.
