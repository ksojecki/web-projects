/// <reference types='vitest' />
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const webPlatformSourcePath = fileURLToPath(
  new URL('../../../../libs/web-platform/src/index.ts', import.meta.url),
);
const pagesSharedSourcePath = fileURLToPath(
  new URL(
    '../../../../projects/rod-manager/plugins/pages/shared/src/index.ts',
    import.meta.url,
  ),
);

export default defineConfig(({ command }) => {
  const nodeEnv =
    command === 'build'
      ? 'production'
      : (process.env.NODE_ENV ?? 'development');

  process.env.NODE_ENV = nodeEnv;

  return {
    root: import.meta.dirname,
    cacheDir: '../../../../node_modules/.vite/projects/rod-manager/apps/web',
    server: {
      port: 4200,
      host: 'localhost',
      proxy: {
        '/api': {
          target: 'https://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: 4200,
      host: 'localhost',
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(nodeEnv),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@sojecki/rod-manager-pages-shared': pagesSharedSourcePath,
        '@sojecki/platform-web-platform': webPlatformSourcePath,
      },
      conditions: ['@sojecki/platform-source'],
    },
    ssr: {
      resolve: {
        conditions: ['@sojecki/platform-source'],
      },
    },
    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [],
    // },
    build: {
      outDir: '../../../../dist/projects/rod-manager/apps/web/client',
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
    },
  };
});
