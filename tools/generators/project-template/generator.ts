import {
  formatFiles,
  joinPathFragments,
  names,
  updateJson,
  type Tree,
} from '@nx/devkit';

export interface ProjectTemplateSchema {
  name: string;
}

interface NormalizedOptions {
  apiPackageName: string;
  displayName: string;
  envPrefix: string;
  name: string;
  projectConfigConstName: string;
  projectPropertyName: string;
  projectRoot: string;
  webPackageName: string;
}

export async function projectTemplateGenerator(
  tree: Tree,
  schema: ProjectTemplateSchema,
): Promise<void> {
  const options = normalizeOptions(schema);

  writeApiApp(tree, options);
  writeWebApp(tree, options);
  updateRootPackageScripts(tree, options);
  updateRootTsConfigReferences(tree, options);

  await formatFiles(tree);
}

export default projectTemplateGenerator;

function normalizeOptions(schema: ProjectTemplateSchema): NormalizedOptions {
  const parsedName = names(schema.name);
  const projectName = parsedName.fileName;

  return {
    apiPackageName: `@ksojecki/${projectName}-api`,
    displayName: toDisplayName(projectName),
    envPrefix: projectName.replace(/-/g, '_').toUpperCase(),
    name: projectName,
    projectConfigConstName: `${parsedName.propertyName}ProjectConfig`,
    projectPropertyName: parsedName.propertyName,
    projectRoot: joinPathFragments('projects', projectName),
    webPackageName: `@ksojecki/${projectName}-web`,
  };
}

function writeApiApp(tree: Tree, options: NormalizedOptions): void {
  const apiRoot = joinPathFragments(options.projectRoot, 'apps/api');

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
            command:
              'node ../../../../node_modules/vite/bin/vite.js build --config vite.config.mts --mode production',
          },
          configurations: {
            development: {
              command:
                'node ../../../../node_modules/vite/bin/vite.js build --config vite.config.mts --mode development',
            },
            production: {
              command:
                'node ../../../../node_modules/vite/bin/vite.js build --config vite.config.mts --mode production',
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
        typecheck: {
          dependsOn: ['^build'],
          executor: 'nx:run-commands',
          options: {
            cwd: apiRoot,
            command:
              'node ../../../../node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json && node ../../../../node_modules/typescript/bin/tsc --noEmit -p tsconfig.spec.json',
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
            command:
              'node ../../../../node_modules/vitest/vitest.mjs run --config vitest.config.mts',
          },
        },
        format: {
          executor: 'nx:run-commands',
          options: {
            cwd: apiRoot,
            command:
              'node ../../../../node_modules/prettier/bin/prettier.cjs --write .',
          },
        },
      },
    },
    dependencies: {
      '@ksojecki/platform-server-platform': '0.0.1',
      dotenv: '^17.4.2',
      fastify: '^5.8.5',
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

function writeWebApp(tree: Tree, options: NormalizedOptions): void {
  const webRoot = joinPathFragments(options.projectRoot, 'apps/web');

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
              'node ../../../../node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json && node ../../../../node_modules/typescript/bin/tsc --noEmit -p tsconfig.spec.json && node ../../../../node_modules/typescript/bin/tsc --noEmit -p tsconfig.node.json',
          },
        },
        lint: {
          executor: 'nx:run-commands',
          options: {
            command: `node node_modules/oxlint/bin/oxlint ${webRoot} --config .oxlintrc.json`,
          },
        },
        'build-server': {
          executor: 'nx:run-commands',
          outputs: [`{workspaceRoot}/dist/${webRoot}/server`],
          options: {
            cwd: webRoot,
            command: `node ../../../../node_modules/vite/bin/vite.js build --ssr src/entry-server.tsx --outDir ../../../../dist/${webRoot}/server`,
          },
        },
        test: {
          executor: 'nx:run-commands',
          options: {
            cwd: webRoot,
            command:
              'node ../../../../node_modules/vitest/vitest.mjs run --config vite.config.mts',
          },
        },
        format: {
          executor: 'nx:run-commands',
          options: {
            cwd: webRoot,
            command:
              'node ../../../../node_modules/prettier/bin/prettier.cjs --write .',
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

  writeFile(
    tree,
    joinPathFragments(webRoot, 'index.html'),
    createWebIndexHtml(options),
  );
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
      types: [
        'node',
        'vitest/globals',
        'vite/client',
        '@testing-library/jest-dom',
      ],
    },
    include: ['src/**/*.ts', 'src/**/*.tsx'],
  });

  writeFile(
    tree,
    joinPathFragments(webRoot, 'vite.config.mts'),
    createWebViteConfig(options),
  );
  writeFile(
    tree,
    joinPathFragments(webRoot, 'src/main.tsx'),
    "import { startClient } from './entry-client';\nimport './styles.css';\n\nstartClient();\n",
  );
  writeFile(
    tree,
    joinPathFragments(webRoot, 'src/entry-client.tsx'),
    createEntryClient(),
  );
  writeFile(
    tree,
    joinPathFragments(webRoot, 'src/entry-server.tsx'),
    createEntryServer(),
  );
  writeFile(
    tree,
    joinPathFragments(webRoot, 'src/test-setup.ts'),
    "process.env.NODE_ENV = 'test';\n\nimport '@testing-library/jest-dom/vitest';\n",
  );
  writeFile(
    tree,
    joinPathFragments(webRoot, 'src/styles.css'),
    createStylesCss(),
  );
  writeFile(
    tree,
    joinPathFragments(webRoot, 'src/app/i18n/i18n.ts'),
    createI18nSetup(options),
  );
  writeFile(
    tree,
    joinPathFragments(webRoot, 'src/app/productConfig.ts'),
    createWebProductConfig(),
  );
  writeFile(
    tree,
    joinPathFragments(webRoot, 'src/app/routes.tsx'),
    createRoutes(),
  );
  writeFile(
    tree,
    joinPathFragments(webRoot, 'src/app/HomePage.tsx'),
    createHomePage(),
  );
  writeFile(
    tree,
    joinPathFragments(webRoot, 'src/app/account/AccountPage.tsx'),
    createAccountPage(),
  );
  writeFile(
    tree,
    joinPathFragments(webRoot, 'src/app/account/productAccountConfig.ts'),
    createProductAccountConfig(),
  );
  writeFile(
    tree,
    joinPathFragments(webRoot, 'src/app/account/productAccountSections.tsx'),
    createProductAccountSections(options),
  );
  writeFile(
    tree,
    joinPathFragments(webRoot, 'src/app/layout/AppLayout.tsx'),
    createAppLayout(),
  );
}

function createApiViteConfig(options: NormalizedOptions): string {
  return `/// <reference types="vitest" />
import { builtinModules } from 'node:module';
import { defineConfig } from 'vite';

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
  cacheDir: '../../../../node_modules/.vite/${options.projectRoot}/apps/api',
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
    outDir: '../../../../dist/${options.projectRoot}/apps/api',
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
  return `import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
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
  return `import 'dotenv/config';
import Fastify from 'fastify';
import { existsSync, readFileSync } from 'node:fs';
import type { FastifyInstance } from 'fastify';
import { createServerPlatform } from '@ksojecki/platform-server-platform';
import { ${options.projectConfigConstName} } from './productConfig';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

const defaultDevKeyPath = '.cert/localhost-key.pem';
const defaultDevCertPath = '.cert/localhost-cert.pem';
const httpsOptions = getHttpsOptions();

const server = Fastify({
  logger: true,
  https: httpsOptions,
}) as FastifyInstance;

function getHttpsOptions() {
  const httpsKeyPath =
    process.env.HTTPS_KEY_PATH ??
    (isProduction ? undefined : defaultDevKeyPath);
  const httpsCertPath =
    process.env.HTTPS_CERT_PATH ??
    (isProduction ? undefined : defaultDevCertPath);

  if (httpsKeyPath === undefined || httpsCertPath === undefined) {
    throw new Error(
      'HTTPS requires HTTPS_KEY_PATH and HTTPS_CERT_PATH in production.',
    );
  }

  if (!existsSync(httpsKeyPath) || !existsSync(httpsCertPath)) {
    throw new Error(
      \`Missing TLS files: \${httpsKeyPath} and \${httpsCertPath}. Run npm install for local development or provide certificate paths via HTTPS_KEY_PATH and HTTPS_CERT_PATH.\`,
    );
  }

  return {
    key: readFileSync(httpsKeyPath),
    cert: readFileSync(httpsCertPath),
  };
}

server.register(async (instance) => {
  await createServerPlatform(instance, {
    project: ${options.projectConfigConstName},
    plugins: [],
  });
});

server.listen({ port, host }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  } else {
    console.log(\`[ ready ] https://\${host}:\${String(port)}\`);
  }
});
`;
}

function createApiProductConfig(options: NormalizedOptions): string {
  return `import path from 'node:path';
import type { ServerPlatformProjectConfig } from '@ksojecki/platform-server-platform';

export const ${options.projectConfigConstName}: ServerPlatformProjectConfig = {
  projectId: '${options.name}',
  database: {
    path: process.env.${options.envPrefix}_AUTH_DB_PATH ?? 'tmp/${options.name}/auth.sqlite',
    seedInitialUser: process.env.${options.envPrefix}_AUTH_SEED_INITIAL_USER === 'true',
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

function createWebIndexHtml(options: NormalizedOptions): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${options.displayName}</title>
    <base href="/" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="root"><!--ssr-outlet--></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

function createWebViteConfig(options: NormalizedOptions): string {
  return `/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command }) => {
  const nodeEnv =
    command === 'build'
      ? 'production'
      : (process.env.NODE_ENV ?? 'development');

  process.env.NODE_ENV = nodeEnv;

  return {
    root: import.meta.dirname,
    cacheDir: '../../../../node_modules/.vite/${options.projectRoot}/apps/web',
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
      conditions: ['@ksojecki/platform-source'],
    },
    ssr: {
      resolve: {
        conditions: ['@ksojecki/platform-source'],
      },
    },
    build: {
      outDir: '../../../../dist/${options.projectRoot}/apps/web/client',
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
`;
}

function createEntryClient(): string {
  return `import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './app/i18n/i18n';
import { AppRoutes } from './app/routes';

export function startClient() {
  const rootElement = document.getElementById('root');

  if (rootElement === null) {
    throw new Error('Missing #root element for client startup.');
  }

  const app = (
    <StrictMode>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </StrictMode>
  );

  if (rootElement.hasChildNodes()) {
    hydrateRoot(rootElement, app);
    return;
  }

  createRoot(rootElement).render(app);
}
`;
}

function createEntryServer(): string {
  return `import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import './app/i18n/i18n';
import { AppRoutes } from './app/routes';

export function render(url: string): string {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <AppRoutes />
      </StaticRouter>
    </StrictMode>,
  );
}
`;
}

function createStylesCss(): string {
  return `@import 'tailwindcss';

@plugin "daisyui" {
  themes: emerald --default;
}

@source '../../../../../libs/ui/src/**/*.{ts,tsx}';
@source '../../../../../libs/web-platform/src/**/*.{ts,tsx}';
`;
}

function createI18nSetup(options: NormalizedOptions): string {
  return `import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: {
      layout: {
        appName: '${options.displayName}',
        menuHome: 'Home',
        menuAccount: 'Account',
        menuLogin: 'Log in',
        menuLogout: 'Log out',
        menuRegister: 'Register',
        footerText: '${options.displayName}',
      },
      auth: {
        or: 'or',
        title: 'Log in',
        hint: 'Use a local account or continue with OAuth.',
        emailLabel: 'Email',
        emailRequired: 'Email is required.',
        emailInvalid: 'Enter a valid email address.',
        passwordLabel: 'Password',
        passwordRequired: 'Password is required.',
        submit: 'Sign in',
        submitting: 'Signing in...',
        checkingSession: 'Checking session...',
        unexpectedError: 'Unexpected server error.',
        validationRequired: 'is required.',
        oauthDivider: 'or continue with',
        noAccount: "Don't have an account?",
        registerLink: 'Register',
        register: {
          title: 'Create account',
          passwordSectionTitle: 'Create account with password',
          passwordSectionHint:
            'Create a local account with your name, email, and password.',
          oauthSectionTitle: 'Create account with OAuth',
          oauthSectionHint:
            'Use your provider profile details to create an account.',
          oauthDivider: 'or continue with',
          nameLabel: 'First name',
          nameRequired: 'First name is required.',
          surnameLabel: 'Last name',
          surnameRequired: 'Last name is required.',
          emailLabel: 'Email',
          emailRequired: 'Email is required.',
          emailInvalid: 'Enter a valid email address.',
          passwordLabel: 'Password',
          passwordHint:
            'Required for account creation with email and password.',
          passwordMinLength: 'Password must be at least 8 characters.',
          submit: 'Create account',
          submitting: 'Creating account...',
          alreadyHaveAccount: 'Already have an account?',
          loginLink: 'Log in',
        },
      },
      home: {
        badge: 'Generated project',
        title: '${options.displayName}',
        description:
          'This starter product wires the shared backend and frontend platform libraries into a minimal product-local shell. Extend routes, branding, and sections here without copying auth shell code.',
        signedInCta: 'Open account',
        signedOutCta: 'Log in',
        registerCta: 'Register',
        authStateTitle: 'Current auth state',
        authenticatedState: 'Signed in as {{email}}.',
        guestState: 'Guest session.',
      },
      account: {
        title: '${options.displayName} account',
        welcome: 'Welcome back, {{name}}.',
        fallbackUserName: 'user',
        roleLabel: 'Role',
      },
    },
  },
});
`;
}

function createWebProductConfig(): string {
  return `import {
  buildLoginPromptHref as buildSharedLoginPromptHref,
  type LoginPromptConfig,
} from '@ksojecki/platform-web-platform';

export interface FrontendProductRoutes {
  account: string;
  home: string;
  register: string;
}

export interface FrontendProductAuthConfig {
  guestRedirectTo: string;
  oauthAuthenticatedFallbackTo: string;
  oauthGuestFallbackTo: string;
  postLoginRedirectTo: string;
  postRegistrationRedirectTo: string;
}

export interface FrontendProductRegistrationConfig {
  disabledRedirectTo: string;
  enabled: boolean;
}

export interface FrontendProductConfig {
  auth: FrontendProductAuthConfig;
  loginPrompt: LoginPromptConfig;
  registration: FrontendProductRegistrationConfig;
  routes: FrontendProductRoutes;
}

export const frontendProductConfig: FrontendProductConfig = {
  routes: {
    home: '/',
    account: '/account',
    register: '/register',
  },
  auth: {
    guestRedirectTo: '/?login=1',
    postLoginRedirectTo: '/account',
    postRegistrationRedirectTo: '/account',
    oauthAuthenticatedFallbackTo: '/account',
    oauthGuestFallbackTo: '/',
  },
  registration: {
    enabled: true,
    disabledRedirectTo: '/',
  },
  loginPrompt: {
    queryParam: 'login',
    queryValue: '1',
  },
};

export function buildLoginPromptHref(): string {
  return buildSharedLoginPromptHref(
    frontendProductConfig.routes.home,
    frontendProductConfig.loginPrompt,
  );
}
`;
}

function createRoutes(): string {
  return `import { Navigate, Route, Routes } from 'react-router';
import {
  AuthProvider,
  OAuthCallbackPage,
  RegisterPage,
  RequireAuth,
} from '@ksojecki/platform-web-platform';
import { AccountPage } from './account/AccountPage';
import { HomePage } from './HomePage';
import { AppLayout } from './layout/AppLayout';
import { buildLoginPromptHref, frontendProductConfig } from './productConfig';

export function AppRoutes() {
  const { auth, registration, routes } = frontendProductConfig;

  return (
    <AuthProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path={routes.home} element={<HomePage />} />
          <Route
            path={routes.register}
            element={
              registration.enabled ? (
                <RegisterPage
                  authenticatedRedirectTo={auth.postRegistrationRedirectTo}
                  disabledRedirectTo={registration.disabledRedirectTo}
                  loginHref={buildLoginPromptHref()}
                  registrationEnabled={registration.enabled}
                />
              ) : (
                <Navigate replace to={registration.disabledRedirectTo} />
              )
            }
          />
          <Route
            path="/auth/oauth/callback/:provider"
            element={
              <OAuthCallbackPage
                authenticatedFallbackTo={auth.oauthAuthenticatedFallbackTo}
                guestFallbackTo={auth.oauthGuestFallbackTo}
              />
            }
          />
          <Route
            path={routes.account}
            element={
              <RequireAuth guestRedirectTo={auth.guestRedirectTo}>
                <AccountPage />
              </RequireAuth>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
`;
}

function createHomePage(): string {
  return `import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@ksojecki/platform-web-platform';
import { buildLoginPromptHref, frontendProductConfig } from './productConfig';

export function HomePage() {
  const { t } = useTranslation('home');
  const { status, user } = useAuth();

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-box bg-base-100 p-6 shadow">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-base-content/60">
          {t('badge')}
        </p>
        <h1 className="text-4xl font-semibold">{t('title')}</h1>
        <p className="max-w-2xl text-base-content/75">
          {t('description')}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {status === 'authenticated' ? (
          <Link className="btn btn-primary" to={frontendProductConfig.routes.account}>
            {t('signedInCta')}
          </Link>
        ) : (
          <Link className="btn btn-primary" to={buildLoginPromptHref()}>
            {t('signedOutCta')}
          </Link>
        )}
        {frontendProductConfig.registration.enabled ? (
          <Link className="btn btn-outline" to={frontendProductConfig.routes.register}>
            {t('registerCta')}
          </Link>
        ) : null}
      </div>

      <div className="rounded-box border border-base-300 p-4">
        <h2 className="text-lg font-medium">{t('authStateTitle')}</h2>
        <p className="text-base-content/75">
          {status === 'authenticated'
            ? t('authenticatedState', {
                email: user?.email ?? 'unknown user',
              })
            : t('guestState')}
        </p>
      </div>
    </section>
  );
}
`;
}

function createAccountPage(): string {
  return `import { useTranslation } from 'react-i18next';
import { AccountShell, useAuth } from '@ksojecki/platform-web-platform';
import { productAccountConfig } from './productAccountConfig';

export function AccountPage() {
  const { t } = useTranslation('account');
  const { user } = useAuth();
  const sections = productAccountConfig.useSections();

  return (
    <AccountShell
      roleLabel={t('roleLabel')}
      sections={sections}
      title={t('title')}
      user={user}
      welcomeMessage={t('welcome', {
        name: user?.displayName ?? t('fallbackUserName'),
      })}
    />
  );
}
`;
}

function createProductAccountConfig(): string {
  return `import type { AccountSectionsHook } from '@ksojecki/platform-web-platform';
import { useProductAccountSections } from './productAccountSections';

export interface ProductAccountConfig {
  useSections: AccountSectionsHook;
}

export const productAccountConfig: ProductAccountConfig = {
  useSections: useProductAccountSections,
};
`;
}

function createProductAccountSections(options: NormalizedOptions): string {
  return `import type { AccountSection } from '@ksojecki/platform-web-platform';

export function useProductAccountSections(): AccountSection[] {
  return [
    {
      id: 'starter-notes',
      content: (
        <div className="rounded-box border border-base-300 p-4">
          <h2 className="text-lg font-medium">${options.displayName} starter notes</h2>
          <p className="text-base-content/75">
            Replace this section list with product-specific account content.
            The surrounding account shell and auth mechanics stay shared in
            libs/web-platform.
          </p>
        </div>
      ),
    },
  ];
}
`;
}

function createAppLayout(): string {
  return `import { Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  PlatformFooter,
  PlatformNavbar,
  type PlatformNavigationItem,
} from '@ksojecki/platform-web-platform';
import { frontendProductConfig } from '../productConfig';

export function AppLayout() {
  const { t } = useTranslation('layout');
  const navigationItems: PlatformNavigationItem[] = [
    {
      label: t('menuHome'),
      to: frontendProductConfig.routes.home,
    },
  ];

  return (
    <div className="min-h-screen bg-base-200">
      <PlatformNavbar
        accountLabel={t('menuAccount')}
        accountTo={frontendProductConfig.routes.account}
        brandLabel={t('appName')}
        brandTo={frontendProductConfig.routes.home}
        items={navigationItems}
        loginLabel={t('menuLogin')}
        loginPrompt={frontendProductConfig.loginPrompt}
        logoutLabel={t('menuLogout')}
        postLoginRedirectTo={frontendProductConfig.auth.postLoginRedirectTo}
        registerLabel={t('menuRegister')}
        registerTo={frontendProductConfig.routes.register}
        registrationEnabled={frontendProductConfig.registration.enabled}
        showGuestRegisterLink
      />
      <main className="px-4 py-6">
        <Outlet />
      </main>
      <PlatformFooter text={t('footerText')} />
    </div>
  );
}
`;
}

function writeJson(tree: Tree, filePath: string, value: unknown): void {
  writeFile(tree, filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeFile(tree: Tree, filePath: string, content: string): void {
  tree.write(filePath, content);
}

function updateRootPackageScripts(
  tree: Tree,
  options: NormalizedOptions,
): void {
  updateJson(
    tree,
    'package.json',
    (value: { scripts?: Record<string, string>; [key: string]: unknown }) => {
      const scripts = value.scripts ?? {};
      scripts[`dev:${options.name}`] =
        `node ./node_modules/nx/dist/bin/nx.js run ${options.apiPackageName}:serve --no-tui`;
      value.scripts = scripts;
      return value;
    },
  );
}

function updateRootTsConfigReferences(
  tree: Tree,
  options: NormalizedOptions,
): void {
  updateJson(
    tree,
    'tsconfig.json',
    (value: {
      references?: Array<{ path: string }>;
      [key: string]: unknown;
    }) => {
      const references = value.references ?? [];
      const nextPaths = new Set(references.map((reference) => reference.path));
      nextPaths.add(`./${options.projectRoot}/apps/api`);
      nextPaths.add(`./${options.projectRoot}/apps/web`);

      value.references = Array.from(nextPaths)
        .toSorted()
        .map((path) => ({ path }));

      return value;
    },
  );
}

function toDisplayName(projectName: string): string {
  return projectName
    .split('-')
    .filter((part) => part.length > 0)
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join(' ');
}
