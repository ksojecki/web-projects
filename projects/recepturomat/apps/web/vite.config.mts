/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(async ({ command }) => {
  const { getProductApiPort, getProductWebPort, loadProductEnv } =
    await import('../../../../scripts/workspace-config.mjs');

  loadProductEnv('recepturomat');

  const nodeEnv =
    command === 'build'
      ? 'production'
      : (process.env.NODE_ENV ?? 'development');
  const apiPort = getProductApiPort('recepturomat');
  const webPort = getProductWebPort('recepturomat');

  return {
    root: import.meta.dirname,
    cacheDir: '../../../../node_modules/.vite/projects/recepturomat/apps/web',
    server: {
      port: webPort,
      host: 'localhost',
      proxy: {
        '/api': {
          target: `https://localhost:${String(apiPort)}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: webPort,
      host: 'localhost',
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(nodeEnv),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      conditions: ['@ksojecki/platform-source'],
    },
    ssr: {
      resolve: {
        conditions: ['@ksojecki/platform-source'],
      },
    },
    build: {
      outDir: '../../../../dist/projects/recepturomat/apps/web/client',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test-setup.ts'],
      include: ['src/**/*.{spec,test}.{ts,tsx}'],
      passWithNoTests: true,
    },
  };
});
