import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import type { OAuthProviderType } from '@sojecki/platform-shared';
import { Heading } from '@sojecki/platform-ui';
import { useAuth } from './AuthContext';
import { completeOAuthCallback, retrieveOAuthState } from './authApi';

/**
 * OAuth callback handler page
 * Processes the OAuth callback and creates a session
 */
export function OAuthCallbackPage() {
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

      // Check for OAuth error
      if (callbackError) {
        setError(`OAuth error: ${callbackError}`);
        return;
      }

      // Validate parameters
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
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to process OAuth callback',
        );
      }
    };

    void handleCallback();
  }, [navigate, provider, refreshSession, searchParams]);

  if (error) {
    const handleBackToLogin = () => {
      void navigate(status === 'authenticated' ? '/account' : '/', {
        replace: true,
      });
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
