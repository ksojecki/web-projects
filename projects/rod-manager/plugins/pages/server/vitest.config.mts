import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@ksojecki/rod-manager-pages-shared': resolve(
        configDir,
        '../../../../../projects/rod-manager/plugins/pages/shared/src/index.ts',
      ),
      '@ksojecki/platform-server-platform': resolve(
        configDir,
        '../../../../../libs/server-platform/src/index.ts',
      ),
      '@ksojecki/platform-shared': resolve(configDir, '../../../../../libs/shared/src/index.ts'),
    },
    conditions: ['@ksojecki/platform-source'],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{spec,test}.ts'],
  },
});
