import { Navigate, Route, Routes } from 'react-router';
import {
  AuthProvider,
  OAuthCallbackPage,
  RequireAuth,
} from '@sojecki/platform-web-platform';

import { AccountPage } from './account/AccountPage';
import { AppLayout } from './layout/AppLayout';
import { RegisterPage } from './auth/RegisterPage';
import { ContentManagementPage } from './content-management/ContentManagementPage';
import { ContentPage } from './content-management/ContentPage';
import { frontendProductConfig } from './frontendProductConfig';

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
                <RegisterPage />
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
