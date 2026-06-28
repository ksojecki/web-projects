import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { OAuthProviderType } from '@ksojecki/platform-shared';
import { FaApple, FaFacebook, FaGoogle } from 'react-icons/fa';
import { initiateOAuth } from './authApi';
import { storeOAuthState } from './storage';

const OAUTH_BUTTONS: Array<{
  icon: typeof FaGoogle;
  label: string;
  provider: OAuthProviderType;
}> = [
  {
    icon: FaGoogle,
    label: 'Google',
    provider: 'google',
  },
  {
    icon: FaApple,
    label: 'Apple',
    provider: 'apple',
  },
  {
    icon: FaFacebook,
    label: 'Facebook',
    provider: 'facebook',
  },
];

/**
 * Shared OAuth sign-in buttons used by login and registration entry points.
 */
export function OAuthButtons() {
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
      <div className="flex flex-col gap-4">
        {OAUTH_BUTTONS.map(({ icon: Icon, label, provider }) => (
          <button
            className="btn btn-outline w-full"
            key={provider}
            onClick={() => {
              void handleProvider(provider);
            }}
            type="button"
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
