import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const workspaceRelativeRoot = '../../../../';
const sharedSourcePath = fileURLToPath(
  new URL(`${workspaceRelativeRoot}libs/shared/src/index.ts`, import.meta.url),
);
const serverPlatformSourcePath = fileURLToPath(
  new URL(`${workspaceRelativeRoot}libs/server-platform/src/index.ts`, import.meta.url),
);

export default defineConfig({
  resolve: {
    alias: {
      '@ksojecki/platform-shared': sharedSourcePath,
      '@ksojecki/platform-server-platform': serverPlatformSourcePath,
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
