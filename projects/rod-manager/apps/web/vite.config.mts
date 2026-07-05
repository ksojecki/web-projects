/// <reference types='vitest' />
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const workspaceRelativeRoot = '../../../../';
const workspaceConfigUrl = new URL(
  `${workspaceRelativeRoot}scripts/workspace-config.mjs`,
  import.meta.url,
);
const cacheDir = `${workspaceRelativeRoot}node_modules/.vite/projects/rod-manager/apps/web`;
const clientOutDir = `${workspaceRelativeRoot}dist/projects/rod-manager/apps/web/client`;
const webPlatformSourcePath = fileURLToPath(
  new URL(
    `${workspaceRelativeRoot}libs/web-platform/src/index.ts`,
    import.meta.url,
  ),
);
const pagesSharedSourcePath = fileURLToPath(
  new URL(
    `${workspaceRelativeRoot}projects/rod-manager/plugins/pages/shared/src/index.ts`,
    import.meta.url,
  ),
);

export default defineConfig(async ({ command }) => {
  const { getProductApiPort, getProductWebPort, loadProductEnv } = await import(
    workspaceConfigUrl.href
  );

  loadProductEnv('rod-manager');

  const nodeEnv =
    command === 'build'
      ? 'production'
      : (process.env.NODE_ENV ?? 'development');
  const apiPort = getProductApiPort('rod-manager');
  const webPort = getProductWebPort('rod-manager');

  return {
    root: import.meta.dirname,
    cacheDir,
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
      alias: {
        '@ksojecki/rod-manager-pages-shared': pagesSharedSourcePath,
        '@ksojecki/platform-web-platform': webPlatformSourcePath,
      },
      conditions: ['@ksojecki/platform-source'],
    },
    ssr: {
      resolve: {
        conditions: ['@ksojecki/platform-source'],
      },
    },
    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [],
    // },
    build: {
      outDir: clientOutDir,
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
