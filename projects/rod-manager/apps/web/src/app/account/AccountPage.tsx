import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { OAuthProviderType } from '@sojecki/platform-shared';
import { Page } from '@sojecki/platform-ui';
import {
  AuthenticationMethodsPanel,
  useAuth,
  useAuthenticationMethods,
} from '@sojecki/platform-web-platform';
import { LanguageSelector } from './LanguageSelector';

export const AccountPage = () => {
  const { t } = useTranslation('account');
  const { user } = useAuth();
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
          provider: providerLabel(provider),
        }),
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t('authentication.unlinkError')));
    }
  }

  return (
    <Page>
      <Page.Title>{t('title')}</Page.Title>
      <Page.Content>
        <p>
          {t('welcome', { name: user?.displayName ?? t('fallbackUserName') })}
        </p>
        <LanguageSelector />
        <p className="text-sm text-base-content/70">{user?.email ?? ''}</p>
        <p className="text-sm text-base-content/70">
          {t('roleLabel')}: {user?.role ?? 'user'}
        </p>
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
      </Page.Content>
    </Page>
  );
};

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

function providerLabel(provider: OAuthProviderType): string {
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
