import { useCallback, useEffect, useState } from 'react';
import type {
  AuthenticationMethodStatus,
  OAuthProviderType,
} from '@ksojecki/platform-shared';
import {
  linkOAuthProvider,
  loadAuthenticationMethods,
  unlinkOAuthProvider,
} from '../auth/authApi';
import { storeOAuthState } from '../auth/storage';

export interface UseAuthenticationMethodsResult {
  connectOAuthProvider: (provider: OAuthProviderType) => Promise<void>;
  disconnectOAuthProvider: (provider: OAuthProviderType) => Promise<void>;
  methods: AuthenticationMethodStatus[];
  pendingMethod: OAuthProviderType | null;
  refreshAuthenticationMethods: () => Promise<void>;
}

export function useAuthenticationMethods(): UseAuthenticationMethodsResult {
  const [methods, setMethods] = useState<AuthenticationMethodStatus[]>([]);
  const [pendingMethod, setPendingMethod] = useState<OAuthProviderType | null>(
    null,
  );

  const refreshAuthenticationMethods = useCallback(async () => {
    const response = await loadAuthenticationMethods();

    setMethods(response.methods);
  }, []);

  const connectOAuthProvider = useCallback(
    async (provider: OAuthProviderType) => {
      setPendingMethod(provider);

      try {
        const { authorizationUrl, state, codeVerifier } =
          await linkOAuthProvider(provider);

        storeOAuthState(state, codeVerifier);
        window.location.href = authorizationUrl;
      } catch (error) {
        setPendingMethod(null);
        throw error;
      }
    },
    [],
  );

  const disconnectOAuthProvider = useCallback(
    async (provider: OAuthProviderType) => {
      setPendingMethod(provider);

      try {
        await unlinkOAuthProvider(provider);
        await refreshAuthenticationMethods();
      } finally {
        setPendingMethod(null);
      }
    },
    [refreshAuthenticationMethods],
  );

  useEffect(() => {
    void refreshAuthenticationMethods();
  }, [refreshAuthenticationMethods]);

  return {
    connectOAuthProvider,
    disconnectOAuthProvider,
    methods,
    pendingMethod,
    refreshAuthenticationMethods,
  };
}
