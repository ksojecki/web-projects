import path from 'node:path';

const relativeFiles = (files) => files.map((file) => path.relative(process.cwd(), file));

const shellQuotedFiles = (files) =>
  relativeFiles(files)
    .map((file) => JSON.stringify(file))
    .join(' ');

const withoutCodexFiles = (files) =>
  files.filter((file) => !path.relative(process.cwd(), file).startsWith('.codex/'));

const typecheckAffectedFiles = (files) => {
  const changedFiles = relativeFiles(files).join(',');

  return `npx nx affected -t typecheck --files=${JSON.stringify(changedFiles)} --no-tui`;
};

export default {
  '*': typecheckAffectedFiles,
  '*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}': (files) => {
    const filteredFiles = withoutCodexFiles(files);
    const commands = ['node ./scripts/check-no-deep-src-mocks.mjs'];

    if (filteredFiles.length === 0) {
      return commands;
    }

    commands.push(
      `npx oxlint --fix --config .oxlintrc.json ${shellQuotedFiles(filteredFiles)}`,
      `npx oxfmt --write ${shellQuotedFiles(filteredFiles)}`,
    );

    return commands;
  },
  '*.{json,jsonc,md,mdx,yml,yaml,toml,css,scss,less,html,graphql,gql}': (files) => {
    const filteredFiles = withoutCodexFiles(files);

    if (filteredFiles.length === 0) {
      return [];
    }

    return `npx oxfmt --write ${shellQuotedFiles(filteredFiles)}`;
  },
};
