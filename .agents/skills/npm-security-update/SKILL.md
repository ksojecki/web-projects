---
name: npm-security-update
description: Safely reduce npm audit and Dependabot security findings in Node.js/npm workspaces. Use when Codex needs to inspect npm audit output, update package.json/package-lock.json, handle npm registry approval constraints, avoid unsafe npm audit fix --force behavior, avoid npm overrides unless explicitly requested, and verify dependency updates with project checks such as Nx lint/test/build/typecheck.
---

# Npm Security Update

## Workflow

1. Inspect the workspace dependency shape before changing anything:
   - Read root and relevant workspace `package.json` files.
   - Check `package-lock.json` presence and package manager assumptions.
   - Check `git --no-pager status --short`.

2. Treat registry calls as explicit external disclosure:
   - Run `npm audit --json` only after user approval when policy requires it.
   - Run `npm outdated --json`, `npm view`, and `npm install` only after approval if registry access is restricted.
   - If a registry command is rejected because it sends dependency inventory, stop and ask for explicit approval for that exact command category.

3. Prefer direct, normal dependency updates:
   - Update direct dependencies with available patch/minor fixes first.
   - Keep related peer groups in sync, such as all React Router packages together.
   - Update workspace manifests that declare their own compatible ranges so the lockfile does not keep older versions unnecessarily.
   - Regenerate `package-lock.json` with plain `npm install`.

4. Avoid unsafe shortcuts unless the user explicitly asks:
   - Do not use `npm install --force`.
   - Do not use `npm audit fix --force`.
   - Do not add npm `overrides` unless the user explicitly allows overrides.
   - Do not accept audit suggestions that downgrade major toolchains, such as Nx, without calling out the tradeoff and getting approval.

5. If npm hits peer conflicts:
   - Inspect which installed or locked packages are anchoring the old version.
   - Update the full peer set in `package.json`.
   - Retry plain `npm install`.
   - If an interrupted command partially updated the lockfile, inspect `package-lock.json` and installed package versions, then continue with plain `npm install`.

6. After updates:
   - Run `npm audit --json` again when approved and report before/after counts.
   - Run repo-appropriate checks. In Nx workspaces, prefer:

```sh
npx nx run-many -t lint test build typecheck --no-tui
```

## Reporting

Summarize:

- Direct packages bumped and files changed.
- Audit counts before and after.
- Remaining vulnerabilities and why they remain.
- Whether force, overrides, or major toolchain downgrades were avoided.
- Verification commands and results.

When remaining npm advisories require `--force`, overrides, or major toolchain changes, leave them unresolved unless the user explicitly approves that risk.
