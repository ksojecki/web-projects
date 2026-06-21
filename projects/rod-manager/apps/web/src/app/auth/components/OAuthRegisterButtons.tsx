import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { OAuthProviderType } from '@sojecki/platform-shared';
import { initiateOAuth, storeOAuthState } from '../authApi';
import { OAuthButtons } from './OAuthButtons';

/**
 * OAuth provider buttons for account creation.
 */
export function OAuthRegisterButtons() {
  const { t } = useTranslation('auth');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleProvider(provider: OAuthProviderType) {
    setErrorMessage(null);
    try {
      const { authorizationUrl, state, codeVerifier } =
        await initiateOAuth(provider);

      storeOAuthState(state, codeVerifier);
      window.location.href = authorizationUrl;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t('unexpectedError'),
      );
    }
  }

  return (
    <>
      {errorMessage !== null ? (
        <p className="mb-4 text-sm text-error">{errorMessage}</p>
      ) : null}
      <OAuthButtons
        onProvider={(provider) => {
          void handleProvider(provider);
        }}
      />
    </>
  );
}
