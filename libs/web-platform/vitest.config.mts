import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    conditions: ['@ksojecki/platform-source'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{spec,test}.{ts,tsx}'],
  },
});
