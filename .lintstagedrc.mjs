import path from 'node:path';

const typecheckAffectedFiles = (files) => {
  const relativeFiles = files
    .map((file) => path.relative(process.cwd(), file))
    .join(',');

  return `npx nx affected -t typecheck --files=${JSON.stringify(relativeFiles)} --no-tui`;
};

export default {
  '*': typecheckAffectedFiles,
  '*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}': [
    'npx oxlint --fix --config .oxlintrc.json',
    'npx prettier --write',
  ],
  '*.{json,jsonc,md,yml,yaml,css,scss,html}': ['npx prettier --write'],
};
