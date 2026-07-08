import { joinPathFragments, type Tree } from '@nx/devkit';
import { type NormalizedOptions, writeFile, writeJson } from './shared';
import {
  createAccountPage,
  createAppLayout,
  createHomePage,
  createRoutes,
  createWebProductConfig,
} from './web-app-files';
import {
  createEntryClient,
  createEntryServer,
  createI18nSetup,
  createWebViteConfig,
} from './web-runtime';
import { createStylesCss, createWebIndexHtml } from './web-shell';

export function writeWebApp(tree: Tree, options: NormalizedOptions): void {
  const webRoot = joinPathFragments(options.projectRoot, 'apps/web');
  const clientOutDir = `../../../../dist/${webRoot}/client`;
  const viteBuildCommand = 'npx vite build';

  writeJson(tree, joinPathFragments(webRoot, 'package.json'), {
    name: options.webPackageName,
    version: '0.0.1',
    private: true,
    nx: {
      targets: {
        typecheck: {
          executor: 'nx:run-commands',
          dependsOn: ['^build'],
          options: {
            cwd: webRoot,
            command:
              'npx tsc --noEmit -p tsconfig.app.json && npx tsc --noEmit -p tsconfig.spec.json && npx tsc --noEmit -p tsconfig.node.json',
          },
        },
        lint: {
          executor: 'nx:run-commands',
          options: {
            command: `node node_modules/oxlint/bin/oxlint ${webRoot} --config .oxlintrc.json`,
          },
        },
        build: {
          dependsOn: ['build-client', 'build-server'],
          executor: 'nx:noop',
        },
        'build-client': {
          executor: 'nx:run-commands',
          outputs: [`{workspaceRoot}/dist/${webRoot}/client`],
          options: {
            cwd: webRoot,
            command: `${viteBuildCommand} --outDir ${clientOutDir}`,
          },
          configurations: {
            development: {
              command: `${viteBuildCommand} --mode development --outDir ${clientOutDir}`,
            },
            production: {
              command: `${viteBuildCommand} --mode production --outDir ${clientOutDir}`,
            },
          },
        },
        'build-server': {
          executor: 'nx:run-commands',
          outputs: [`{workspaceRoot}/dist/${webRoot}/server`],
          options: {
            cwd: webRoot,
            command: `${viteBuildCommand} --ssr src/entry-server.tsx --outDir ../../../../dist/${webRoot}/server`,
          },
        },
        test: {
          executor: 'nx:run-commands',
          options: {
            cwd: webRoot,
            command: 'npx vitest run --config vite.config.mts',
          },
        },
        format: {
          executor: 'nx:run-commands',
          options: {
            cwd: webRoot,
            command: 'node ./node_modules/oxfmt/bin/oxfmt --write .',
          },
        },
      },
    },
    dependencies: {
      '@ksojecki/platform-web-platform': '0.0.1',
      i18next: '^26.3.1',
      'react-i18next': '^17.0.8',
      'react-router': '^8.0.1',
    },
  });

  writeFile(tree, joinPathFragments(webRoot, 'index.html'), createWebIndexHtml(options));
  writeJson(tree, joinPathFragments(webRoot, 'tsconfig.json'), {
    files: [],
    include: [],
    references: [
      { path: './tsconfig.app.json' },
      { path: './tsconfig.node.json' },
      { path: './tsconfig.spec.json' },
    ],
    extends: '../../../../tsconfig.base.json',
  });

  writeJson(tree, joinPathFragments(webRoot, 'tsconfig.app.json'), {
    extends: '../../../../tsconfig.base.json',
    compilerOptions: {
      outDir: `../../../../dist/${webRoot}`,
      tsBuildInfoFile: `../../../../dist/${webRoot}/tsconfig.app.tsbuildinfo`,
      jsx: 'react-jsx',
      lib: ['dom'],
      types: [
        'node',
        '@nx/react/typings/cssmodule.d.ts',
        '@nx/react/typings/image.d.ts',
        'vite/client',
      ],
      rootDir: 'src',
      module: 'esnext',
      moduleResolution: 'bundler',
    },
    exclude: [
      'src/**/*.spec.ts',
      'src/**/*.test.ts',
      'src/**/*.spec.tsx',
      'src/**/*.test.tsx',
      'src/**/*.spec.js',
      'src/**/*.test.js',
      'src/**/*.spec.jsx',
      'src/**/*.test.jsx',
    ],
    include: ['src/**/*.js', 'src/**/*.jsx', 'src/**/*.ts', 'src/**/*.tsx'],
    references: [
      { path: '../../../../libs/ui/tsconfig.lib.json' },
      { path: '../../../../libs/shared/tsconfig.lib.json' },
      { path: '../../../../libs/web-platform/tsconfig.lib.json' },
    ],
  });

  writeJson(tree, joinPathFragments(webRoot, 'tsconfig.node.json'), {
    extends: '../../../../tsconfig.base.json',
    compilerOptions: {
      module: 'esnext',
      moduleResolution: 'bundler',
      composite: true,
      outDir: `../../../../dist/${webRoot}`,
      tsBuildInfoFile: `../../../../dist/${webRoot}/tsconfig.node.tsbuildinfo`,
    },
    include: ['vite.config.mts'],
  });

  writeJson(tree, joinPathFragments(webRoot, 'tsconfig.spec.json'), {
    extends: '../../../../tsconfig.base.json',
    compilerOptions: {
      jsx: 'react-jsx',
      lib: ['dom', 'es2022'],
      module: 'esnext',
      moduleResolution: 'bundler',
      tsBuildInfoFile: `../../../../dist/${webRoot}/tsconfig.spec.tsbuildinfo`,
      types: ['node', 'vitest/globals', 'vite/client', '@testing-library/jest-dom'],
    },
    include: ['src/**/*.ts', 'src/**/*.tsx'],
  });

  writeFile(tree, joinPathFragments(webRoot, 'vite.config.mts'), createWebViteConfig(options));
  writeFile(
    tree,
    joinPathFragments(webRoot, 'src/main.tsx'),
    "import { startClient } from './entry-client';\nimport './styles.css';\n\nstartClient();\n",
  );
  writeFile(tree, joinPathFragments(webRoot, 'src/entry-client.tsx'), createEntryClient());
  writeFile(tree, joinPathFragments(webRoot, 'src/entry-server.tsx'), createEntryServer());
  writeFile(
    tree,
    joinPathFragments(webRoot, 'src/test-setup.ts'),
    "process.env.NODE_ENV = 'test';\n\nimport '@testing-library/jest-dom/vitest';\n",
  );
  writeFile(tree, joinPathFragments(webRoot, 'src/styles.css'), createStylesCss());
  writeFile(tree, joinPathFragments(webRoot, 'src/app/i18n/i18n.ts'), createI18nSetup(options));
  writeFile(tree, joinPathFragments(webRoot, 'src/app/productConfig.ts'), createWebProductConfig());
  writeFile(tree, joinPathFragments(webRoot, 'src/app/routes.tsx'), createRoutes());
  writeFile(tree, joinPathFragments(webRoot, 'src/app/HomePage.tsx'), createHomePage());
  writeFile(
    tree,
    joinPathFragments(webRoot, 'src/app/account/AccountPage.tsx'),
    createAccountPage(),
  );
  writeFile(tree, joinPathFragments(webRoot, 'src/app/layout/AppLayout.tsx'), createAppLayout());
}
