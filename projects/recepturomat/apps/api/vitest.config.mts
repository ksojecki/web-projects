import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const sharedSourcePath = fileURLToPath(
  new URL('../../../../libs/shared/src/index.ts', import.meta.url),
);

export default defineConfig({
  resolve: {
    alias: {
      '@ksojecki/platform-shared': sharedSourcePath,
    },
    conditions: ['@ksojecki/platform-source'],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{spec,test}.ts'],
    passWithNoTests: true,
  },
});
