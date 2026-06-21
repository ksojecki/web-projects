import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  AuthenticationMethodStatus,
  OAuthProviderType,
} from '@sojecki/platform-shared';
import { Button, Heading, Page } from '@sojecki/platform-ui';
import { useAuth } from '../auth/AuthContext';
import {
  linkOAuthProvider,
  loadAuthenticationMethods,
  storeOAuthState,
  unlinkOAuthProvider,
} from '../auth/authApi';
import { LanguageSelector } from './LanguageSelector';
import { PasswordMethodForm } from './PasswordMethodForm';

const OAUTH_PROVIDER_LABELS: Record<OAuthProviderType, string> = {
  google: 'Google',
  apple: 'Apple',
  facebook: 'Facebook',
};

export const AccountPage = () => {
  const { t } = useTranslation('account');
  const { user } = useAuth();
  const [methods, setMethods] = useState<AuthenticationMethodStatus[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingMethod, setPendingMethod] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const oauthMethods = useMemo(
    () =>
      methods
        .filter(
          (
            method,
          ): method is Extract<AuthenticationMethodStatus, { type: 'oauth' }> =>
            method.type === 'oauth',
        )
        .sort((left, right) =>
          OAUTH_PROVIDER_LABELS[left.provider].localeCompare(
            OAUTH_PROVIDER_LABELS[right.provider],
          ),
        ),
    [methods],
  );

  const passwordMethod = useMemo(
    () => methods.find((method) => method.type === 'password') ?? null,
    [methods],
  );

  const refreshAuthenticationMethods = useCallback(async () => {
    try {
      const response = await loadAuthenticationMethods();
      setMethods(response.methods);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage(t('authentication.loadError'));
    }
  }, [t]);

  useEffect(() => {
    void refreshAuthenticationMethods();
  }, [refreshAuthenticationMethods]);

  async function handlePasswordSuccess(message: string): Promise<void> {
    setErrorMessage(null);
    setSuccessMessage(message);
    setPendingMethod(null);
    setShowPasswordForm(false);
    await refreshAuthenticationMethods();
  }

  async function handleLinkProvider(
    provider: OAuthProviderType,
  ): Promise<void> {
    setErrorMessage(null);
    setSuccessMessage(null);
    setPendingMethod(provider);

    try {
      const { authorizationUrl, state, codeVerifier } =
        await linkOAuthProvider(provider);

      storeOAuthState(state, codeVerifier);
      window.location.href = authorizationUrl;
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(t('authentication.linkStartError'));
      }
      setPendingMethod(null);
    }
  }

  async function handleUnlinkProvider(
    provider: OAuthProviderType,
  ): Promise<void> {
    setErrorMessage(null);
    setSuccessMessage(null);
    setPendingMethod(provider);

    try {
      await unlinkOAuthProvider(provider);
      await refreshAuthenticationMethods();
      setSuccessMessage(
        t('authentication.oauthDisconnected', {
          provider: OAUTH_PROVIDER_LABELS[provider],
        }),
      );
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(t('authentication.unlinkError'));
      }
    } finally {
      setPendingMethod(null);
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
        <div className="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
          <div className="space-y-1">
            <Heading level={2}>{t('authentication.title')}</Heading>
            <p className="text-sm text-base-content/70">
              {t('authentication.description')}
            </p>
          </div>

          {errorMessage !== null ? (
            <p className="mt-4 text-sm text-error">{errorMessage}</p>
          ) : null}

          {successMessage !== null ? (
            <p className="mt-4 text-sm text-success">{successMessage}</p>
          ) : null}

          <div className="mt-4 space-y-3">
            {passwordMethod !== null ? (
              <div className="flex items-center justify-between gap-4 rounded-box border border-base-300 px-4 py-3">
                <div>
                  <p className="font-medium">
                    {t('authentication.passwordLabel')}
                  </p>
                  <p className="text-sm text-base-content/70">
                    {passwordMethod.connected
                      ? t('authentication.connected')
                      : t('authentication.notConnected')}
                  </p>
                  {passwordMethod.connected ? (
                    <p className="text-xs text-base-content/60">
                      {t('authentication.passwordCannotBeDisabled')}
                    </p>
                  ) : null}
                </div>

                <Button
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setShowPasswordForm((current) => !current);
                  }}
                  tone={passwordMethod.connected ? 'secondary' : 'primary'}
                  type="button"
                >
                  {passwordMethod.connected
                    ? t('authentication.changePasswordAction')
                    : t('authentication.setPasswordAction')}
                </Button>
              </div>
            ) : null}

            {showPasswordForm && passwordMethod !== null ? (
              <PasswordMethodForm
                hasPassword={passwordMethod.connected}
                onCancel={() => {
                  setShowPasswordForm(false);
                }}
                onSuccess={handlePasswordSuccess}
              />
            ) : null}

            {oauthMethods.map((method) => {
              const isPending = pendingMethod === method.provider;

              return (
                <div
                  className="flex items-center justify-between gap-4 rounded-box border border-base-300 px-4 py-3"
                  key={method.provider}
                >
                  <div>
                    <p className="font-medium">
                      {OAUTH_PROVIDER_LABELS[method.provider]}
                    </p>
                    <p className="text-sm text-base-content/70">
                      {method.connected
                        ? t('authentication.connected')
                        : t('authentication.notConnected')}
                    </p>
                    {method.connected && !method.canDisconnect ? (
                      <p className="text-xs text-base-content/60">
                        {t('authentication.lastMethodHint')}
                      </p>
                    ) : null}
                  </div>

                  {method.connected ? (
                    <Button
                      disabled={isPending || !method.canDisconnect}
                      onClick={() => {
                        void handleUnlinkProvider(method.provider);
                      }}
                      tone="secondary"
                      type="button"
                    >
                      {isPending
                        ? t('authentication.disconnectingAction')
                        : method.canDisconnect
                          ? t('authentication.disconnectAction')
                          : t('authentication.requiredAction')}
                    </Button>
                  ) : (
                    <Button
                      disabled={isPending}
                      onClick={() => {
                        void handleLinkProvider(method.provider);
                      }}
                      type="button"
                    >
                      {isPending
                        ? t('authentication.connectingAction')
                        : t('authentication.connectAction')}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Page.Content>
    </Page>
  );
};
