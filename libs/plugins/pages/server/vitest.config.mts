import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@rod-manager/server-platform': resolve(
        __dirname,
        '../../../../libs/server-platform/src/index.ts',
      ),
      '@rod-manager/shared': resolve(
        __dirname,
        '../../../../libs/shared/src/index.ts',
      ),
    },
    conditions: ['@rod-manager/source'],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{spec,test}.ts'],
  },
});
