import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { OAuthProviderType } from '@ksojecki/platform-shared';
import { AuthenticationMethodsPanel } from './AuthenticationMethodsPanel';
import { LanguageSelector } from './LanguageSelector';
import type { AccountSection } from './types';
import { useAuthenticationMethods } from './useAuthenticationMethods';

export function useDefaultAccountSections(
  extraSections: AccountSection[] = [],
): AccountSection[] {
  const { t } = useTranslation('account');
  const {
    connectOAuthProvider,
    disconnectOAuthProvider,
    methods,
    pendingMethod,
    refreshAuthenticationMethods,
  } = useAuthenticationMethods();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  async function handlePasswordSuccess(message: string): Promise<void> {
    setErrorMessage(null);
    setSuccessMessage(message);
    setShowPasswordForm(false);
    await refreshAuthenticationMethods();
  }

  async function handleConnectProvider(
    provider: OAuthProviderType,
  ): Promise<void> {
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowPasswordForm(false);

    try {
      await connectOAuthProvider(provider);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, t('authentication.linkStartError')),
      );
    }
  }

  async function handleDisconnectProvider(
    provider: OAuthProviderType,
  ): Promise<void> {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await disconnectOAuthProvider(provider);
      setSuccessMessage(
        t('authentication.oauthDisconnected', {
          provider: getOAuthProviderLabel(provider),
        }),
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t('authentication.unlinkError')));
    }
  }

  return [
    {
      id: 'language',
      content: <LanguageSelector />,
    },
    {
      id: 'authentication-methods',
      content: (
        <AuthenticationMethodsPanel
          errorMessage={errorMessage}
          methods={methods}
          onConnectProvider={(provider) => {
            void handleConnectProvider(provider);
          }}
          onDisconnectProvider={(provider) => {
            void handleDisconnectProvider(provider);
          }}
          onPasswordCancel={() => {
            setShowPasswordForm(false);
          }}
          onPasswordSuccess={handlePasswordSuccess}
          onTogglePasswordForm={() => {
            setErrorMessage(null);
            setSuccessMessage(null);
            setShowPasswordForm((current) => !current);
          }}
          pendingMethod={pendingMethod}
          showPasswordForm={showPasswordForm}
          successMessage={successMessage}
        />
      ),
    },
    ...extraSections,
  ];
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

function getOAuthProviderLabel(provider: OAuthProviderType): string {
  switch (provider) {
    case 'apple':
      return 'Apple';
    case 'facebook':
      return 'Facebook';
    case 'google':
    default:
      return 'Google';
  }
}
