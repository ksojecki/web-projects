---
name: session-usage-analysis
description: Analyze Codex session token usage and estimated cost with `ccusage`, including parent-thread totals, spawned-agent breakdowns, and workflow comparisons. Use when the user wants to inspect a session, the last session, a specific thread id, or compare token and cost impact across workflow changes.
---

# Session Usage Analysis

Use this skill when the user wants Codex session usage or estimated cost, especially when a parent session spawned child agents and `ccusage` needs thread-level aggregation.

## Workflow

1. Resolve the target session:
   - If the user gives a session or thread id, use it directly.
   - If the user asks for the last session, prefer the helper script `--last`, which skips the current session by default.

2. Run the helper script:

```sh
python3 .agents/skills/session-usage-analysis/scripts/report_session_usage.py --last
```

Or for a specific thread:

```sh
python3 .agents/skills/session-usage-analysis/scripts/report_session_usage.py 019f0f39-92c7-7033-910f-879170d2a0e6
```

3. Use `--json` when the result needs further processing or a machine-readable diff:

```sh
python3 .agents/skills/session-usage-analysis/scripts/report_session_usage.py --last --json
```

## What The Helper Does

- Reads local Codex history and session metadata under `~/.codex/`.
- Finds the target top-level thread and recursively discovers spawned child threads.
- Runs `ccusage codex session --json` and matches rollout usage back to those thread ids.
- Reports:
  - Parent-thread totals.
  - Parent-only totals.
  - Spawned-agent combined totals.
  - Workflow-worker totals for implementer/tester style subagents.
  - Guardian approval totals for runtime safety reviews.
  - Per-agent token and estimated cost breakdown.

## Reporting

When answering the user, summarize:

- Which thread was analyzed.
- Total tokens and estimated cost for the whole thread.
- The parent-session share versus spawned-agent share.
- The workflow-worker share versus guardian approval overhead.
- The list of spawned agents with their per-session totals.
- Any caveat, such as missing local history or `ccusage` data.

Use the wording `estimated cost`, because the value comes from `ccusage` pricing data rather than direct billing export.
