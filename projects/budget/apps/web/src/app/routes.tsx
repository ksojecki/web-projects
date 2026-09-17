import { Navigate, Route, Routes } from 'react-router';
import {
  AuthProvider,
  OAuthCallbackPage,
  RegisterPage,
  RequireAuth,
} from '@ksojecki/platform-web-platform';
import { AccountPage } from './account/AccountPage';
import { HomePage } from './HomePage';
import { AccountsPage } from './AccountsPage';
import { CategoriesPage } from './CategoriesPage';
import { ReportPage } from './ReportPage';
import { TransactionsPage } from './TransactionsPage';
import { AppLayout } from './layout/AppLayout';
import { buildLoginPromptHref, frontendProductConfig } from './productConfig';
import { LanguageSynchronizer } from './LanguageSynchronizer';

export function AppRoutes() {
  const { auth, registration, routes } = frontendProductConfig;

  return (
    <AuthProvider>
      <LanguageSynchronizer />
      <Routes>
        <Route element={<AppLayout />}>
          <Route
            path={routes.home}
            element={
              <RequireAuth guestRedirectTo={auth.guestRedirectTo}>
                <HomePage />
              </RequireAuth>
            }
          />
          <Route
            path={routes.transactions}
            element={
              <RequireAuth guestRedirectTo={auth.guestRedirectTo}>
                <TransactionsPage />
              </RequireAuth>
            }
          />
          <Route
            path={routes.accounts}
            element={
              <RequireAuth guestRedirectTo={auth.guestRedirectTo}>
                <AccountsPage />
              </RequireAuth>
            }
          />
          <Route
            path={routes.report}
            element={
              <RequireAuth guestRedirectTo={auth.guestRedirectTo}>
                <ReportPage />
              </RequireAuth>
            }
          />
          <Route
            path={routes.categories}
            element={
              <RequireAuth guestRedirectTo={auth.guestRedirectTo}>
                <CategoriesPage />
              </RequireAuth>
            }
          />
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
