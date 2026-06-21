#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

exec ./.venv-codrift/bin/python ./scripts/codedrift-local.py mcp
