/// <reference types="vitest" />
import { builtinModules } from 'node:module';
import { defineConfig } from 'vite';

const nodeBuiltins = new Set([
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`),
]);

function isExternalImport(id: string) {
  if (id.startsWith('.') || id.startsWith('/') || id.startsWith('\0')) {
    return false;
  }

  if (id.startsWith('@ksojecki/')) {
    return false;
  }

  return !nodeBuiltins.has(id);
}

export default defineConfig(({ mode }) => ({
  root: import.meta.dirname,
  cacheDir: '../../../../node_modules/.vite/projects/recepturomat/apps/api',
  resolve: {
    conditions: ['@ksojecki/platform-source'],
  },
  ssr: {
    resolve: {
      conditions: ['@ksojecki/platform-source'],
    },
  },
  build: {
    ssr: 'src/main.ts',
    outDir: '../../../../dist/projects/recepturomat/apps/api',
    emptyOutDir: true,
    reportCompressedSize: false,
    sourcemap: mode !== 'production',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rolldownOptions: {
      external: isExternalImport,
      output: {
        entryFileNames: 'main.js',
        format: 'cjs',
        exports: 'auto',
      },
    },
  },
}));
