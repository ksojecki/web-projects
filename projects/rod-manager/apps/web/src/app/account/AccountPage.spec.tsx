import type { FormEvent, ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  AuthUser,
  AuthenticationMethodsResponseBody,
  OAuthProviderType,
  UpdatePasswordRequestBody,
} from '@ksojecki/platform-shared';
import type * as PlatformWebPlatform from '@ksojecki/platform-web-platform';
import i18n from '../i18n/i18n';
import { AccountPage } from './AccountPage';

interface AuthContextLike {
  user: AuthUser;
}

interface OAuthInitiateResponse {
  authorizationUrl: string;
  codeVerifier: string;
  state: string;
}

interface AccountSectionLike {
  content: ReactNode;
  id: string;
}

const {
  mockUseAuth,
  mockLinkOAuthProvider,
  mockLoadAuthenticationMethods,
  mockStoreOAuthState,
  mockUnlinkOAuthProvider,
  mockUpdatePassword,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn<() => AuthContextLike>(),
  mockLinkOAuthProvider: vi.fn<(provider: OAuthProviderType) => Promise<OAuthInitiateResponse>>(),
  mockLoadAuthenticationMethods: vi.fn<() => Promise<AuthenticationMethodsResponseBody>>(),
  mockStoreOAuthState: vi.fn<(state: string, codeVerifier: string) => void>(),
  mockUnlinkOAuthProvider: vi.fn<(provider: OAuthProviderType) => Promise<void>>(),
  mockUpdatePassword: vi.fn<(input: UpdatePasswordRequestBody) => Promise<void>>(),
}));

vi.mock('@ksojecki/platform-web-platform', async (importOriginal) => {
  const actual = await importOriginal<typeof PlatformWebPlatform>();
  const React = await import('react');
  const { useCallback, useEffect, useState } = React;
  const { useTranslation } = await import('react-i18next');

  function useDefaultAccountSections(
    extraSections: AccountSectionLike[] = [],
  ): AccountSectionLike[] {
    const { t } = useTranslation('account');
    const [methods, setMethods] = useState<AuthenticationMethodsResponseBody['methods']>([]);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const refreshAuthenticationMethods = useCallback(async () => {
      const response = await mockLoadAuthenticationMethods();
      setMethods(response.methods);
    }, []);

    useEffect(() => {
      void refreshAuthenticationMethods();
    }, [refreshAuthenticationMethods]);

    async function handleConnectProvider(provider: OAuthProviderType): Promise<void> {
      const { authorizationUrl, codeVerifier, state } = await mockLinkOAuthProvider(provider);
      mockStoreOAuthState(state, codeVerifier);
      window.location.href = authorizationUrl;
    }

    async function handleDisconnectProvider(provider: OAuthProviderType): Promise<void> {
      await mockUnlinkOAuthProvider(provider);
      await refreshAuthenticationMethods();
    }

    async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();

      await mockUpdatePassword({
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
    linkOAuthProvider: mockLinkOAuthProvider,
    loadAuthenticationMethods: mockLoadAuthenticationMethods,
    storeOAuthState: mockStoreOAuthState,
    unlinkOAuthProvider: mockUnlinkOAuthProvider,
    updatePassword: mockUpdatePassword,
    useAuth: mockUseAuth,
    useDefaultAccountSections,
  };
});

describe('AccountPage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('en');

    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test',
        surname: 'User',
        displayName: 'Test User',
        role: 'user',
      },
    });
    mockLinkOAuthProvider.mockResolvedValue({
      authorizationUrl: 'https://example.com/oauth',
      codeVerifier: 'code-verifier',
      state: 'oauth-state',
    });
    mockUnlinkOAuthProvider.mockResolvedValue(undefined);
  });

  it('renders password and OAuth authentication methods', async () => {
    mockLoadAuthenticationMethods.mockResolvedValue({
      methods: [
        { type: 'password', connected: false, canDisconnect: false },
        {
          type: 'oauth',
          provider: 'google',
          connected: true,
          canDisconnect: false,
        },
        {
          type: 'oauth',
          provider: 'apple',
          connected: false,
          canDisconnect: false,
        },
        {
          type: 'oauth',
          provider: 'facebook',
          connected: false,
          canDisconnect: false,
        },
      ],
    });

    render(
      <I18nextProvider i18n={i18n}>
        <AccountPage />
      </I18nextProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Language' })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Authentication methods' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Set password' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Required' })).toBeDisabled();
  });

  it('shows the password form when setting a password', async () => {
    const user = userEvent.setup();
    mockLoadAuthenticationMethods.mockResolvedValue({
      methods: [
        { type: 'password', connected: false, canDisconnect: false },
        {
          type: 'oauth',
          provider: 'google',
          connected: true,
          canDisconnect: true,
        },
        {
          type: 'oauth',
          provider: 'apple',
          connected: false,
          canDisconnect: false,
        },
        {
          type: 'oauth',
          provider: 'facebook',
          connected: false,
          canDisconnect: false,
        },
      ],
    });

    render(
      <I18nextProvider i18n={i18n}>
        <AccountPage />
      </I18nextProvider>,
    );

    await user.click(await screen.findByRole('button', { name: 'Set password' }));

    expect(await screen.findByRole('heading', { name: 'Set password' })).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm new password')).toBeInTheDocument();
  });

  it('refreshes authentication methods after setting a password', async () => {
    const user = userEvent.setup();
    mockUpdatePassword.mockResolvedValue(undefined);
    mockLoadAuthenticationMethods
      .mockResolvedValueOnce({
        methods: [
          { type: 'password', connected: false, canDisconnect: false },
          {
            type: 'oauth',
            provider: 'google',
            connected: true,
            canDisconnect: true,
          },
          {
            type: 'oauth',
            provider: 'apple',
            connected: false,
            canDisconnect: false,
          },
          {
            type: 'oauth',
            provider: 'facebook',
            connected: false,
            canDisconnect: false,
          },
        ],
      })
      .mockResolvedValueOnce({
        methods: [
          { type: 'password', connected: true, canDisconnect: false },
          {
            type: 'oauth',
            provider: 'google',
            connected: true,
            canDisconnect: true,
          },
          {
            type: 'oauth',
            provider: 'apple',
            connected: false,
            canDisconnect: false,
          },
          {
            type: 'oauth',
            provider: 'facebook',
            connected: false,
            canDisconnect: false,
          },
        ],
      });

    render(
      <I18nextProvider i18n={i18n}>
        <AccountPage />
      </I18nextProvider>,
    );

    await user.click(await screen.findByRole('button', { name: 'Set password' }));
    await user.type(screen.getByLabelText('New password'), 'password123');
    await user.type(screen.getByLabelText('Confirm new password'), 'password123');
    await user.click(screen.getAllByRole('button', { name: 'Set password' })[1]);

    await waitFor(() => {
      expect(mockLoadAuthenticationMethods).toHaveBeenCalledTimes(2);
    });
    expect(mockUpdatePassword).toHaveBeenCalledWith({
      currentPassword: undefined,
      newPassword: 'password123',
    });
  });
});
