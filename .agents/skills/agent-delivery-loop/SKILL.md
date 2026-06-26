---
name: agent-delivery-loop
description: Run a reusable plan -> stepwise implementer/tester passes -> final review loop for scoped code changes in this workspace.
---

# Agent Delivery Loop

Use this skill when a task needs a controlled implementation cycle instead of a single pass.

## Model Split

- Always use `gpt-5.4-mini` for the implementer pass.
- Always use `gpt-5.4-mini` for the tester pass.
- Keep planning and review in the current agent session by default.
- Do not switch planning or review to a different model unless the user explicitly asks for it.

## Loop

1. Plan.
   - Restate the goal, constraints, and exact files likely to change.
   - Split the work into the smallest safe implementation steps.
   - Divide the plan into small, easy-to-implement, implementation-ready steps.
   - Define the validation that proves each step is complete before moving on.
   - Do not start the delivery loop until the plan is accepted.
2. Implementer.
   - After plan acceptance, spawn an implementer subagent for the current plan step only.
   - Always use `gpt-5.4-mini` for that implementer.
   - The implementer does not re-review, re-plan, or widen scope; it executes the accepted current step.
   - Keep edits scoped to that step's accepted objective.
   - Pass only the accepted current step, success criteria, exact files, and the minimum evidence needed to complete that step.
   - Do not resend the full plan, full repo overview, or prior-step history unless the current step cannot be completed without it.
3. Tester.
   - Spawn a tester subagent for that same current step.
   - Always use `gpt-5.4-mini` for that tester.
   - Run the narrowest relevant validation commands first.
   - Validate the current step before moving to the next one.
   - Capture failures as concrete evidence, not guesses.
   - Pass only the accepted current step, expected behavior, exact files, and the minimum evidence needed to validate that step.
   - Do not resend the full plan, full repo overview, or prior-step history unless the current validation cannot be completed without it.
4. Repeat per step.
   - Continue spawning one step-scoped implementer, then one step-scoped tester, until every planned step is complete.
   - Do not spawn implementers or testers for multiple planned steps in parallel.
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
- Prefer small, easy, implementation-ready steps over broad or multi-goal steps.
- Execute steps sequentially.
- If validation fails, address the root cause before starting the next step.
- Avoid touching unrelated files unless they are strictly necessary for correctness.
- Keep worker prompts step-local and minimal.
- Record the commands run and the files changed so the handoff is auditable.

## Handoff

Summarize:

- The final outcome.
- Exact files changed.
- Assumptions made.
- Validation commands and results.
- Any remaining risk or follow-up work.

If the user asks to publish the finished work, follow handoff by committing the accepted changes and pushing the working branch to `origin`.
After push, create a PR and include the PR link in the user-facing handoff when the job is finished.
