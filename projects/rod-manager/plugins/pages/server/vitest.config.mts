import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@ksojecki/rod-manager-pages-shared': resolve(
        __dirname,
        '../../../../../projects/rod-manager/plugins/pages/shared/src/index.ts',
      ),
      '@ksojecki/platform-server-platform': resolve(
        __dirname,
        '../../../../../libs/server-platform/src/index.ts',
      ),
      '@ksojecki/platform-shared': resolve(
        __dirname,
        '../../../../../libs/shared/src/index.ts',
      ),
    },
    conditions: ['@ksojecki/platform-source'],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{spec,test}.ts'],
  },
});
