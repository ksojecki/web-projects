import { Route, Routes } from 'react-router';

import { AccountPage } from './account/AccountPage';
import { AppLayout } from './layout/AppLayout';
import { AuthProvider } from './auth/AuthContext';
import { RegisterPage } from './auth/RegisterPage';
import { OAuthCallbackPage } from './auth/OAuthCallbackPage';
import { RequireAuth } from './auth/RequireAuth';
import { ContentManagementPage } from './content-management/ContentManagementPage';
import { ContentPage } from './content-management/ContentPage';

export function AppRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<ContentPage forcedSlug="home" />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/auth/oauth/callback/:provider"
            element={<OAuthCallbackPage />}
          />
          <Route
            path="/account"
            element={
              <RequireAuth>
                <AccountPage />
              </RequireAuth>
            }
          />
          <Route
            path="/pages"
            element={
              <RequireAuth>
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
