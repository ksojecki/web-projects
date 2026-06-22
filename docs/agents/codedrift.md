# CodeDrift

CodeDrift is the required repository MCP and local indexing tool for indexed repository search, symbol resolution, session-aware reads, memory, redaction, and dashboard analytics during Codex work in this repository. It is installed outside the Node/Nx dependency graph so application builds and CI do not depend on it.

## Install

Run these commands from the repository root:

```sh
python3 -m venv .venv-codrift
.venv-codrift/bin/python -m pip install --upgrade pip
.venv-codrift/bin/python -m pip install "codedrift[all,dashboard] @ git+https://github.com/darshil3011/codedrift@b5346a06fc9b3a880bfc05390ac024f4601f5252"
.venv-codrift/bin/python -m pip install "tree-sitter-language-pack==0.2.0" "tree-sitter>=0.24,<0.25"
.venv-codrift/bin/python ./scripts/codedrift-local.py init
.venv-codrift/bin/python ./scripts/codedrift-local.py redact enable
./scripts/install-codedrift-hook.sh
```

If the install fails on a Python version newer than CodeDrift's dependencies support, recreate `.venv-codrift` with Python 3.10, 3.11, 3.12, or 3.13 and rerun the commands.

Generated CodeDrift state lives in `.codecodedrift/`; keep it local and uncommitted.

Use `.venv-codrift/bin/python ./scripts/codedrift-local.py` instead of calling `.venv-codrift/bin/codedrift` directly. The wrapper configures newer tree-sitter parser caches under `.codecodedrift/cache/` when supported. The explicit `tree-sitter-language-pack==0.2.0` pin keeps CodeDrift on the parser API it currently expects. Installing `codedrift[all,dashboard]` keeps the local dashboard available for repository work. The hook installer uses the same wrapper so post-commit updates do not depend on a globally installed `codedrift` executable.

## Codex MCP

Register the repository-local MCP launcher with Codex:

```sh
codex mcp add rod-manager-codedrift -- /Users/kamilsojecki/Projekty/rod-manager/scripts/codedrift-mcp.sh
```

Verify the registration:

```sh
codex mcp list
codex mcp get rod-manager-codedrift
```

## Usage

- Use CodeDrift MCP tools for repository overview, symbol search, symbol resolution, and file reads during discovery, planning, implementation, validation, and review.
- Treat CodeDrift MCP as mandatory for Codex work in this repository.
- After editing a file, prefer `codedrift_read` for follow-up reads so repeated inspection returns the diff since the last session read instead of rereading the full file through shell commands.
- Local Husky hooks keep CodeDrift current after common git events: `.husky/post-commit` runs after commits, `.husky/post-merge` runs after `git pull` merges remote changes, and `.husky/post-checkout` runs after branch checkouts.
- Run `npm run codedrift:status` or `npm run codedrift:update` when CodeDrift context looks stale before continuing substantial work.
- Run `.venv-codrift/bin/python ./scripts/codedrift-local.py update` after significant local edits or when search results look stale.
- Use `.venv-codrift/bin/python ./scripts/codedrift-local.py status` to inspect index health.
- Use `.venv-codrift/bin/python ./scripts/codedrift-local.py memory recall "<task>"` before similar follow-up work, and `.venv-codrift/bin/python ./scripts/codedrift-local.py memory record` after a session when the context should be reusable.
- Prefer the root npm wrappers for common local usage: `npm run codedrift:status`, `npm run codedrift:update`, `npm run codedrift:recall -- "<task>"`, `npm run codedrift:record`, `npm run codedrift:dashboard`, and `npm run codedrift:api`.

## Cross-Session Context

- Treat CodeDrift memory as the first step for follow-up work and the last step for reusable handoff.
- Start a task with `npm run codedrift:recall -- "<task>"` to reuse prior implementation notes, validation hints, and file targets.
- End a task with `npm run codedrift:record` after capturing concise notes about what changed, what remains open, and how to verify the result.
- If the dashboard still shows no savings, confirm agent sessions are using the MCP tools first and that memory is being recorded intentionally at handoff.

## Dashboard

Start local analytics when needed:

```sh
npm run codedrift:dashboard
```

For headless/API-only use:

```sh
npm run codedrift:api
```
