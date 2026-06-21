import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    conditions: ['@sojecki/platform-source'],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{spec,test}.ts'],
    passWithNoTests: true,
  },
});
