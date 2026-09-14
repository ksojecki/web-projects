import type { NormalizedOptions } from './shared.ts';

export function createWebViteConfig(options: NormalizedOptions): string {
  return `/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const workspaceRelativeRoot = '../../../../';
const workspaceConfigUrl = new URL(
  \`\${workspaceRelativeRoot}scripts/workspace-config.mjs\`,
  import.meta.url,
);
const cacheDir = \`\${workspaceRelativeRoot}node_modules/.vite/${options.projectRoot}/apps/web\`;
const clientOutDir = \`\${workspaceRelativeRoot}dist/${options.projectRoot}/apps/web/client\`;

export default defineConfig(async ({ command }) => {
  const { getProductApiPort, getProductWebPort, loadProductEnv } = await import(
    workspaceConfigUrl.href
  );

  loadProductEnv('${options.name}');

  const nodeEnv = command === 'build' ? 'production' : (process.env.NODE_ENV ?? 'development');
  const apiPort = getProductApiPort('${options.name}');
  const webPort = getProductWebPort('${options.name}');

  return {
    root: import.meta.dirname,
    cacheDir,
    server: {
      port: webPort,
      host: 'localhost',
      proxy: {
        '/api': {
          target: \`https://localhost:\${String(apiPort)}\`,
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
      passWithNoTests: true,
    },
  };
});
`;
}

export function createEntryClient(): string {
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

export function createEntryServer(): string {
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

export function createI18nSetup(options: NormalizedOptions): string {
  return `import { use as installI18nextPlugin } from 'i18next';
import { initReactI18next } from 'react-i18next';

void installI18nextPlugin(initReactI18next).init({
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
        sessionLoading: 'Loading...',
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
          'This starter project wires the shared backend and frontend platform libraries into a minimal project-local shell. Extend routes, branding, and sections here without copying auth shell code.',
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
