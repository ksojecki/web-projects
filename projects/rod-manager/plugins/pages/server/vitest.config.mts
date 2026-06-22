import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@sojecki/rod-manager-pages-shared': resolve(
        __dirname,
        '../../../../../projects/rod-manager/plugins/pages/shared/src/index.ts',
      ),
      '@sojecki/platform-server-platform': resolve(
        __dirname,
        '../../../../../libs/server-platform/src/index.ts',
      ),
      '@sojecki/platform-shared': resolve(
        __dirname,
        '../../../../../libs/shared/src/index.ts',
      ),
    },
    conditions: ['@sojecki/platform-source'],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{spec,test}.ts'],
  },
});
