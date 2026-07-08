export function createWebProductConfig(): string {
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

export function createRoutes(): string {
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

export function createHomePage(): string {
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

export function createAccountPage(): string {
  return `import { useTranslation } from 'react-i18next';
import {
  AccountShell,
  useAuth,
  useDefaultAccountSections,
} from '@ksojecki/platform-web-platform';

export function AccountPage() {
  const { t } = useTranslation('account');
  const { user } = useAuth();
  const sections = useDefaultAccountSections();

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

export function createAppLayout(): string {
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
