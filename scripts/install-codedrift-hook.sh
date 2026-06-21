#!/usr/bin/env sh
set -eu

repo_root=$(git rev-parse --show-toplevel)
hook_path="$repo_root/.git/hooks/post-commit"

cat > "$hook_path" <<'HOOK'
#!/usr/bin/env sh
set -eu

repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$repo_root"

if [ -x ".venv-codrift/bin/python" ] && [ -f "scripts/codedrift-local.py" ]; then
  .venv-codrift/bin/python ./scripts/codedrift-local.py update --quiet >/dev/null 2>&1 || true
fi
HOOK

chmod +x "$hook_path"
printf 'Hook installed: %s\n' "$hook_path"
