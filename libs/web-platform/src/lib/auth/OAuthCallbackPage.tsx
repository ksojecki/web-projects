import { useEffect, useState } from 'react';
import type { OAuthProviderType } from '@ksojecki/platform-shared';
import { Heading } from '@ksojecki/platform-ui';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useAuth } from './AuthProvider';
import { completeOAuthCallback } from './authApi';
import { retrieveOAuthState } from './storage';

export interface OAuthCallbackPageProps {
  authenticatedFallbackTo?: string;
  guestFallbackTo?: string;
}

export function OAuthCallbackPage({
  authenticatedFallbackTo = '/',
  guestFallbackTo = '/',
}: OAuthCallbackPageProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { provider } = useParams<{ provider: OAuthProviderType }>();
  const { refreshSession, status } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async (): Promise<void> => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const callbackError = searchParams.get('error');

      if (callbackError) {
        setError(`OAuth error: ${callbackError}`);
        return;
      }

      if (!code || !state) {
        setError('Missing OAuth callback parameters');
        return;
      }

      if (provider === undefined) {
        setError('Missing OAuth provider parameter');
        return;
      }

      try {
        retrieveOAuthState(state);

        const response = await completeOAuthCallback(provider, {
          code,
          state,
        });

        await refreshSession();
        await navigate(response.redirectTo, { replace: true });
      } catch (nextError) {
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Failed to process OAuth callback',
        );
      }
    };

    void handleCallback();
  }, [navigate, provider, refreshSession, searchParams]);

  if (error !== null) {
    const handleBackToLogin = () => {
      void navigate(
        status === 'authenticated' ? authenticatedFallbackTo : guestFallbackTo,
        {
          replace: true,
        },
      );
    };

    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Heading level={1}>Authentication Error</Heading>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={handleBackToLogin} type="button">
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <Heading level={1}>Processing OAuth callback...</Heading>
      <p>Please wait while we complete your authentication.</p>
    </div>
  );
}
