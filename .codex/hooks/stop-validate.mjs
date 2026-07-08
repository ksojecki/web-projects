import { spawnSync } from 'node:child_process';

const workspaceRoot = resolveWorkspaceRoot();
process.chdir(workspaceRoot);

const checks = [
  ['format', 'npm run format:check'],
  ['lint', 'npm run lint'],
  ['typecheck', 'npm run typecheck'],
  ['test', 'npm test'],
];

let failed = false;

for (const [label, command] of checks) {
  console.log(`stop-validate: running ${label}`);
  const result = spawnSync(command, {
    shell: true,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    console.error(`stop-validate: ${label} failed`);
    failed = true;
  } else {
    console.log(`stop-validate: ${label} passed`);
  }
}

process.exit(failed ? 1 : 0);

function resolveWorkspaceRoot() {
  const result = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || 'Failed to resolve workspace root');
  }

  return result.stdout.trim();
}
