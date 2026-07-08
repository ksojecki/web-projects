import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const workspaceRoot = resolveWorkspaceRoot();
const hookScriptPath = path.resolve(new URL(import.meta.url).pathname);
const codexRoot = path.resolve(workspaceRoot, '.codex');
process.chdir(workspaceRoot);

const changedFiles = collectChangedFiles(workspaceRoot);
const formatableFiles = changedFiles.filter(isOxfmtFile);
const lintableFiles = changedFiles.filter(isLintFile);

if (formatableFiles.length === 0 && lintableFiles.length === 0) {
  console.log('post-edit-oxfix: no changed files to process');
  process.exit(0);
}

if (formatableFiles.length > 0) {
  run(
    process.execPath,
    [
      './node_modules/oxfmt/bin/oxfmt',
      '--write',
      '--no-error-on-unmatched-pattern',
      ...formatableFiles,
    ],
    'oxfmt'
  );
}

if (lintableFiles.length > 0) {
  run(
    process.execPath,
    [
      './node_modules/oxlint/bin/oxlint',
      '--fix',
      '--config',
      '.oxlintrc.json',
      '--no-error-on-unmatched-pattern',
      ...lintableFiles,
    ],
    'oxlint'
  );
}

function resolveWorkspaceRoot() {
  const result = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || 'Failed to resolve workspace root');
  }

  return result.stdout.trim();
}

function collectChangedFiles(root) {
  const files = new Set([
    ...readPathList(['git', ['diff', '--name-only', '--diff-filter=ACMR']]),
    ...readPathList(['git', ['diff', '--name-only', '--cached', '--diff-filter=ACMR']]),
    ...readPathList(['git', ['ls-files', '--others', '--exclude-standard']]),
  ]);

  return [...files]
    .map((file) => path.resolve(root, file))
    .filter((file) => existsSync(file))
    .filter((file) => !file.startsWith(`${codexRoot}${path.sep}`))
    .filter((file) => file !== hookScriptPath);
}

function readPathList([command, args]) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || `Failed to run ${command}`);
  }

  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function isOxfmtFile(file) {
  return /\.(cjs|cts|css|gql|graphql|html|js|json|json5|jsonc|jsx|less|md|mdx|mjs|mts|scss|ts|tsx|toml|yaml|yml)$/u.test(file);
}

function isLintFile(file) {
  return /\.(cjs|cts|js|jsx|mjs|mts|ts|tsx)$/u.test(file);
}

function run(command, args, label) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    console.error(`post-edit-oxfix: ${label} failed`);
    process.exit(result.status ?? 1);
  }
}
