import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    conditions: ['@ksojecki/platform-source'],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{spec,test}.ts'],
  },
});
