import { Navigate, Route, Routes } from 'react-router';
import {
  AuthProvider,
  OAuthCallbackPage,
  RegisterPage,
  RequireAuth,
} from '@ksojecki/platform-web-platform';

import { AccountPage } from './account/AccountPage';
import { AppLayout } from './layout/AppLayout';
import { ContentManagementPage } from './content-management/ContentManagementPage';
import { ContentPage } from './content-management/ContentPage';
import {
  buildLoginPromptHref,
  frontendProductConfig,
} from './frontendProductConfig';

export function AppRoutes() {
  const { auth, registration, routes } = frontendProductConfig;

  return (
    <AuthProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route
            path={routes.home}
            element={<ContentPage forcedSlug="home" />}
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
          <Route
            path={routes.contentManagement}
            element={
              <RequireAuth guestRedirectTo={auth.guestRedirectTo}>
                <ContentManagementPage />
              </RequireAuth>
            }
          />
          <Route path="/:slug" element={<ContentPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
