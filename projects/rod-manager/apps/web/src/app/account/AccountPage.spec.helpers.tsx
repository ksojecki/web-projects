import type { FormEvent, ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  AuthUser,
  AuthenticationMethodsResponseBody,
  OAuthProviderType,
  UpdatePasswordRequestBody,
} from '@ksojecki/platform-shared';

export interface AuthContextLike {
  user: AuthUser;
}

export interface OAuthInitiateResponse {
  authorizationUrl: string;
  codeVerifier: string;
  state: string;
}

interface AccountSectionLike {
  content: ReactNode;
  id: string;
}

interface PlatformMocks {
  mockLinkOAuthProvider: (provider: OAuthProviderType) => Promise<OAuthInitiateResponse>;
  mockLoadAuthenticationMethods: () => Promise<AuthenticationMethodsResponseBody>;
  mockStoreOAuthState: (state: string, codeVerifier: string) => void;
  mockUnlinkOAuthProvider: (provider: OAuthProviderType) => Promise<void>;
  mockUpdatePassword: (input: UpdatePasswordRequestBody) => Promise<void>;
  mockUseAuth: () => AuthContextLike;
}

export function createMockPlatformModule<TActual extends object>(
  actual: TActual,
  mocks: PlatformMocks,
) {
  function useDefaultAccountSections(
    extraSections: AccountSectionLike[] = [],
  ): AccountSectionLike[] {
    const { t } = useTranslation('account');
    const [methods, setMethods] = useState<AuthenticationMethodsResponseBody['methods']>([]);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const refreshAuthenticationMethods = useCallback(async () => {
      const response = await mocks.mockLoadAuthenticationMethods();
      setMethods(response.methods);
    }, []);

    useEffect(() => {
      void refreshAuthenticationMethods();
    }, [refreshAuthenticationMethods]);

    async function handleConnectProvider(provider: OAuthProviderType): Promise<void> {
      const { authorizationUrl, codeVerifier, state } = await mocks.mockLinkOAuthProvider(provider);
      mocks.mockStoreOAuthState(state, codeVerifier);
      window.location.href = authorizationUrl;
    }

    async function handleDisconnectProvider(provider: OAuthProviderType): Promise<void> {
      await mocks.mockUnlinkOAuthProvider(provider);
      await refreshAuthenticationMethods();
    }

    async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      await mocks.mockUpdatePassword({
        currentPassword: undefined,
        newPassword,
      });
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      await refreshAuthenticationMethods();
    }

    const passwordMethod = methods.find((method) => method.type === 'password') ?? null;
    const oauthMethods = methods.filter(
      (method): method is Extract<(typeof methods)[number], { type: 'oauth' }> =>
        method.type === 'oauth',
    );

    return [
      {
        id: 'language',
        content: <h2>Language</h2>,
      },
      {
        id: 'authentication-methods',
        content: (
          <div>
            <h2>{t('authentication.title')}</h2>
            {passwordMethod !== null ? (
              <div>
                <p>{t('authentication.passwordLabel')}</p>
                <button
                  onClick={() => {
                    setShowPasswordForm((current) => !current);
                  }}
                  type="button"
                >
                  {passwordMethod.connected
                    ? t('authentication.changePasswordAction')
                    : t('authentication.setPasswordAction')}
                </button>
              </div>
            ) : null}
            {showPasswordForm && passwordMethod !== null ? (
              <form onSubmit={(event) => void handlePasswordSubmit(event)}>
                <h3>
                  {passwordMethod.connected
                    ? t('authentication.changePasswordTitle')
                    : t('authentication.setPasswordTitle')}
                </h3>
                <label>
                  {t('authentication.newPasswordLabel')}
                  <input
                    onChange={(event) => {
                      setNewPassword(event.target.value);
                    }}
                    type="password"
                    value={newPassword}
                  />
                </label>
                <label>
                  {t('authentication.confirmPasswordLabel')}
                  <input
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                    }}
                    type="password"
                    value={confirmPassword}
                  />
                </label>
                <button type="submit">
                  {passwordMethod.connected
                    ? t('authentication.changePasswordAction')
                    : t('authentication.setPasswordAction')}
                </button>
              </form>
            ) : null}
            {oauthMethods.map((method) => (
              <div key={method.provider}>
                <p>{method.provider}</p>
                {method.connected ? (
                  <button
                    disabled={!method.canDisconnect}
                    onClick={() => {
                      void handleDisconnectProvider(method.provider);
                    }}
                    type="button"
                  >
                    {method.canDisconnect
                      ? t('authentication.disconnectAction')
                      : t('authentication.requiredAction')}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      void handleConnectProvider(method.provider);
                    }}
                    type="button"
                  >
                    {t('authentication.connectAction')}
                  </button>
                )}
              </div>
            ))}
          </div>
        ),
      },
      ...extraSections,
    ];
  }

  return {
    ...actual,
    linkOAuthProvider: mocks.mockLinkOAuthProvider,
    loadAuthenticationMethods: mocks.mockLoadAuthenticationMethods,
    storeOAuthState: mocks.mockStoreOAuthState,
    unlinkOAuthProvider: mocks.mockUnlinkOAuthProvider,
    updatePassword: mocks.mockUpdatePassword,
    useAuth: mocks.mockUseAuth,
    useDefaultAccountSections,
  };
}
