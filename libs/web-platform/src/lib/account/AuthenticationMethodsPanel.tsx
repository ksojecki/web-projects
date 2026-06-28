import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  AuthenticationMethodStatus,
  OAuthProviderType,
} from '@ksojecki/platform-shared';
import { Button, Heading } from '@ksojecki/platform-ui';
import { PasswordMethodForm } from './PasswordMethodForm';
import type { AccountAuthenticationMethodsPanelProps } from './types';

const OAUTH_PROVIDER_LABELS: Record<OAuthProviderType, string> = {
  google: 'Google',
  apple: 'Apple',
  facebook: 'Facebook',
};

export function AuthenticationMethodsPanel({
  errorMessage,
  methods,
  onConnectProvider,
  onDisconnectProvider,
  onPasswordCancel,
  onPasswordSuccess,
  onTogglePasswordForm,
  pendingMethod,
  showPasswordForm,
  successMessage,
}: AccountAuthenticationMethodsPanelProps) {
  const { t } = useTranslation('account');
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

  const passwordMethod =
    methods.find((method) => method.type === 'password') ?? null;

  return (
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
              <p className="font-medium">{t('authentication.passwordLabel')}</p>
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
              onClick={onTogglePasswordForm}
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
            onCancel={onPasswordCancel}
            onSuccess={onPasswordSuccess}
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
                    void onDisconnectProvider(method.provider);
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
                    void onConnectProvider(method.provider);
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
  );
}
