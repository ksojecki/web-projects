# CodeDrift

CodeDrift is an optional local agent tool for indexed repository search, symbol resolution, session-aware reads, memory, redaction, and dashboard analytics. It is installed outside the Node/Nx dependency graph so application builds and CI do not depend on it.

## Install

Run these commands from the repository root:

```sh
python3 -m venv .venv-codrift
.venv-codrift/bin/python -m pip install --upgrade pip
.venv-codrift/bin/python -m pip install "codedrift[all] @ git+https://github.com/darshil3011/codedrift@b5346a06fc9b3a880bfc05390ac024f4601f5252"
.venv-codrift/bin/python -m pip install "tree-sitter-language-pack==0.2.0" "tree-sitter>=0.24,<0.25"
.venv-codrift/bin/python ./scripts/codedrift-local.py init
.venv-codrift/bin/python ./scripts/codedrift-local.py redact enable
./scripts/install-codedrift-hook.sh
```

If the install fails on a Python version newer than CodeDrift's dependencies support, recreate `.venv-codrift` with Python 3.10, 3.11, 3.12, or 3.13 and rerun the commands.

Generated CodeDrift state lives in `.codecodedrift/`; keep it local and uncommitted.

Use `.venv-codrift/bin/python ./scripts/codedrift-local.py` instead of calling `.venv-codrift/bin/codedrift` directly. The wrapper configures newer tree-sitter parser caches under `.codecodedrift/cache/` when supported. The explicit `tree-sitter-language-pack==0.2.0` pin keeps CodeDrift on the parser API it currently expects. The hook installer uses the same wrapper so post-commit updates do not depend on a globally installed `codedrift` executable.

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

- Prefer CodeDrift MCP tools for repository overview, symbol search, symbol resolution, and file reads when the MCP server is available.
- Fall back to `rg`, `rg --files`, and direct file reads when CodeDrift is unavailable, stale, or returns insufficient context.
- Run `.venv-codrift/bin/python ./scripts/codedrift-local.py update` after significant local edits or when search results look stale.
- Use `.venv-codrift/bin/python ./scripts/codedrift-local.py status` to inspect index health.
- Use `.venv-codrift/bin/python ./scripts/codedrift-local.py memory recall "<task>"` before similar follow-up work, and `.venv-codrift/bin/python ./scripts/codedrift-local.py memory record` after a session when the context should be reusable.

## Dashboard

Start local analytics when needed:

```sh
.venv-codrift/bin/python ./scripts/codedrift-local.py dashboard
```

For headless/API-only use:

```sh
.venv-codrift/bin/python ./scripts/codedrift-local.py api
```
