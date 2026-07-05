import { joinPathFragments, type Tree } from '@nx/devkit';
import { type NormalizedOptions, writeFile, writeJson } from './shared';

export function writeApiApp(tree: Tree, options: NormalizedOptions): void {
  const apiRoot = joinPathFragments(options.projectRoot, 'apps/api');
  const viteBuildCommand = 'npx vite build --config vite.config.mts';
  const typecheckCommand =
    'npx tsc --noEmit -p tsconfig.app.json && npx tsc --noEmit -p tsconfig.spec.json';

  writeJson(tree, joinPathFragments(apiRoot, 'package.json'), {
    name: options.apiPackageName,
    version: '0.0.1',
    private: true,
    nx: {
      targets: {
        build: {
          executor: 'nx:run-commands',
          outputs: [`{workspaceRoot}/dist/${apiRoot}`],
          defaultConfiguration: 'production',
          options: {
            cwd: apiRoot,
            command: `${viteBuildCommand} --mode production`,
          },
          configurations: {
            development: {
              command: `${viteBuildCommand} --mode development`,
            },
            production: {
              command: `${viteBuildCommand} --mode production`,
            },
          },
        },
        'prune-lockfile': {
          dependsOn: ['build'],
          cache: true,
          executor: '@nx/js:prune-lockfile',
          outputs: [
            `{workspaceRoot}/dist/${apiRoot}/package.json`,
            `{workspaceRoot}/dist/${apiRoot}/package-lock.json`,
          ],
          options: {
            buildTarget: 'build',
          },
        },
        'copy-workspace-modules': {
          dependsOn: ['build'],
          cache: true,
          outputs: [`{workspaceRoot}/dist/${apiRoot}/workspace_modules`],
          executor: '@nx/js:copy-workspace-modules',
          options: {
            buildTarget: 'build',
          },
        },
        prune: {
          dependsOn: ['prune-lockfile', 'copy-workspace-modules'],
          executor: 'nx:noop',
        },
        serve: {
          continuous: true,
          executor: '@nx/js:node',
          defaultConfiguration: 'development',
          dependsOn: ['build'],
          options: {
            buildTarget: `${options.apiPackageName}:build`,
            runBuildTargetDependencies: false,
          },
          configurations: {
            development: {
              buildTarget: `${options.apiPackageName}:build:development`,
            },
            production: {
              buildTarget: `${options.apiPackageName}:build:production`,
            },
          },
        },
        dev: {
          continuous: true,
          cache: false,
          executor: 'nx:run-commands',
          options: {
            command: `node ./tools/launch/launch-product.mjs --project-id ${options.name} --serve-target ${options.apiPackageName}:serve --default-api-port 3000 --default-frontend-base-url https://localhost:3000 --default-chrome-debug-port 9222`,
          },
        },
        typecheck: {
          dependsOn: ['^build'],
          executor: 'nx:run-commands',
          options: {
            cwd: apiRoot,
            command: typecheckCommand,
          },
        },
        lint: {
          executor: 'nx:run-commands',
          options: {
            command: `node node_modules/oxlint/bin/oxlint ${apiRoot} --config .oxlintrc.json`,
          },
        },
        test: {
          executor: 'nx:run-commands',
          options: {
            cwd: apiRoot,
            command: 'npx vitest run --config vitest.config.mts',
          },
        },
        format: {
          executor: 'nx:run-commands',
          options: {
            cwd: apiRoot,
            command: 'npx prettier --write .',
          },
        },
      },
    },
    dependencies: {
      '@ksojecki/platform-shared': '0.0.1',
      '@ksojecki/platform-server-platform': '0.0.1',
    },
  });

  writeJson(tree, joinPathFragments(apiRoot, 'tsconfig.json'), {
    extends: '../../../../tsconfig.base.json',
    files: [],
    include: [],
    references: [
      { path: './tsconfig.app.json' },
      { path: './tsconfig.spec.json' },
    ],
  });

  writeJson(tree, joinPathFragments(apiRoot, 'tsconfig.app.json'), {
    extends: '../../../../tsconfig.base.json',
    compilerOptions: {
      outDir: `../../../../dist/${apiRoot}`,
      types: ['node'],
      rootDir: 'src',
      tsBuildInfoFile: `../../../../dist/${apiRoot}/tsconfig.app.tsbuildinfo`,
    },
    include: ['src/**/*.ts'],
    exclude: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    references: [
      { path: '../../../../libs/shared/tsconfig.lib.json' },
      { path: '../../../../libs/server-platform/tsconfig.lib.json' },
    ],
  });

  writeJson(tree, joinPathFragments(apiRoot, 'tsconfig.spec.json'), {
    extends: '../../../../tsconfig.base.json',
    compilerOptions: {
      types: ['node', 'vitest/globals'],
      rootDir: 'src',
      module: 'esnext',
      moduleResolution: 'bundler',
      tsBuildInfoFile: `../../../../dist/${apiRoot}/tsconfig.spec.tsbuildinfo`,
    },
    include: ['src/**/*.ts'],
    references: [
      { path: '../../../../libs/shared/tsconfig.lib.json' },
      { path: '../../../../libs/server-platform/tsconfig.lib.json' },
    ],
  });

  writeFile(
    tree,
    joinPathFragments(apiRoot, 'vite.config.mts'),
    createApiViteConfig(options),
  );
  writeFile(
    tree,
    joinPathFragments(apiRoot, 'vitest.config.mts'),
    createApiVitestConfig(),
  );
  writeFile(
    tree,
    joinPathFragments(apiRoot, 'src/main.ts'),
    createApiMain(options),
  );
  writeFile(
    tree,
    joinPathFragments(apiRoot, 'src/productConfig.ts'),
    createApiProductConfig(options),
  );
}

function createApiViteConfig(options: NormalizedOptions): string {
  return `/// <reference types="vitest" />
import { builtinModules } from 'node:module';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const workspaceRelativeRoot = '../../../../';
const cacheDir = \`\${workspaceRelativeRoot}node_modules/.vite/${options.projectRoot}/apps/api\`;
const outDir = \`\${workspaceRelativeRoot}dist/${options.projectRoot}/apps/api\`;
const sharedSourcePath = fileURLToPath(
  new URL(\`\${workspaceRelativeRoot}libs/shared/src/index.ts\`, import.meta.url),
);

const nodeBuiltins = new Set([
  ...builtinModules,
  ...builtinModules.map((moduleName) => \`node:\${moduleName}\`),
]);

function isExternalImport(id: string) {
  if (id.startsWith('.') || id.startsWith('/') || id.startsWith('\\0')) {
    return false;
  }

  if (id.startsWith('@ksojecki/')) {
    return false;
  }

  return !nodeBuiltins.has(id);
}

export default defineConfig(({ mode }) => ({
  root: import.meta.dirname,
  cacheDir,
  resolve: {
    alias: {
      '@ksojecki/platform-shared': sharedSourcePath,
    },
    conditions: ['@ksojecki/platform-source'],
  },
  ssr: {
    resolve: {
      conditions: ['@ksojecki/platform-source'],
    },
  },
  build: {
    ssr: 'src/main.ts',
    outDir,
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
`;
}

function createApiVitestConfig(): string {
  return `import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const workspaceRelativeRoot = '../../../../';
const sharedSourcePath = fileURLToPath(
  new URL(\`\${workspaceRelativeRoot}libs/shared/src/index.ts\`, import.meta.url),
);
const serverPlatformSourcePath = fileURLToPath(
  new URL(
    \`\${workspaceRelativeRoot}libs/server-platform/src/index.ts\`,
    import.meta.url,
  ),
);

export default defineConfig({
  resolve: {
    alias: {
      '@ksojecki/platform-shared': sharedSourcePath,
      '@ksojecki/platform-server-platform': serverPlatformSourcePath,
    },
    conditions: ['@ksojecki/platform-source'],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{spec,test}.ts'],
    passWithNoTests: true,
  },
});
`;
}

function createApiMain(options: NormalizedOptions): string {
  return `import { startProductServer } from '@ksojecki/platform-server-platform';
import { ${options.projectConfigConstName} } from './productConfig';

startProductServer({
  productId: '${options.name}',
  project: ${options.projectConfigConstName},
});
`;
}

function createApiProductConfig(options: NormalizedOptions): string {
  return `import path from 'node:path';
import type { ServerPlatformProjectConfig } from '@ksojecki/platform-server-platform';
import {
  getProductAuthDbPath,
  getProductSeedInitialUser,
  loadProductEnv,
} from '@ksojecki/platform-shared';

loadProductEnv('${options.name}');

export const ${options.projectConfigConstName}: ServerPlatformProjectConfig = {
  projectId: '${options.name}',
  database: {
    path: getProductAuthDbPath('${options.name}'),
    seedInitialUser: getProductSeedInitialUser(),
  },
  ssr: {
    webRoot: path.resolve(process.cwd(), 'projects/${options.name}/apps/web'),
    production: {
      clientRoot: path.resolve(
        process.cwd(),
        'dist/projects/${options.name}/apps/web/client',
      ),
      serverEntryPath: path.resolve(
        process.cwd(),
        'dist/projects/${options.name}/apps/web/server/entry-server.mjs',
      ),
    },
  },
};
`;
}
