---
name: agent-delivery-loop
description: Run a reusable plan -> stepwise implementer/tester passes -> final review loop for scoped code changes in this workspace.
---

# Agent Delivery Loop

Use this skill when a task needs a controlled implementation cycle instead of a single pass.

## Recommended Model Split

- Use `gpt-5.4-mini` for the implementer and tester passes.
- Use a stronger review-oriented model for planning and review when the task is ambiguous, risky, or cross-cutting.

## Loop

1. Plan.
   - Restate the goal, constraints, and exact files likely to change.
   - Split the work into the smallest safe implementation steps.
   - Define the validation that proves each step is complete before moving on.
2. Implementer.
   - Spawn an implementer for the current plan step only.
   - Keep edits scoped to that step's accepted objective.
3. Tester.
   - Run the narrowest relevant validation commands first.
   - Validate the current step before moving to the next one.
   - Capture failures as concrete evidence, not guesses.
4. Repeat per step.
   - Continue implementer -> tester passes until every planned step is complete.
   - If a step fails validation, revise that step before broadening the change set.
5. Review.
   - Compare the result against the original acceptance criteria and repo conventions.
   - Check for regressions, missing config updates, and unintended scope creep.
   - Treat review as the final check after the planned steps are complete.
6. Corrective step, if needed.
   - If review finds a gap, add a new explicit plan step for the correction.
   - Run implementer -> tester for that corrective step, then return to final review.

## Operating Rules

- Do not skip validation before handoff on non-trivial work.
- Prefer one behavioral change per planned step.
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
