export default {
  '*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}': [
    'npx oxlint --fix --config .oxlintrc.json',
    'npx prettier --write',
  ],
  '*.{json,jsonc,md,yml,yaml,css,scss,html}': ['npx prettier --write'],
};
