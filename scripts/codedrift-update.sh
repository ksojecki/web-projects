#!/usr/bin/env sh
set -eu

repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$repo_root"

if [ ! -x ".venv-codrift/bin/python" ]; then
  printf '%s\n' 'CodeDrift update skipped: .venv-codrift is not available.' >&2
  exit 0
fi

if [ ! -f "scripts/codedrift-local.py" ]; then
  printf '%s\n' 'CodeDrift update skipped: scripts/codedrift-local.py is missing.' >&2
  exit 0
fi

if ! .venv-codrift/bin/python ./scripts/codedrift-local.py update "$@"; then
  printf '%s\n' 'CodeDrift update skipped: local CodeDrift is not configured correctly.' >&2
fi
