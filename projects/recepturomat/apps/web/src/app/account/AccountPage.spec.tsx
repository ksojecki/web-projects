import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
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

    const refreshAuthenticationMethods = useCallback(async () => {
      const response = await mockLoadAuthenticationMethods();
      setMethods(response.methods);
    }, []);

    useEffect(() => {
      void refreshAuthenticationMethods();
    }, [refreshAuthenticationMethods]);

    const passwordMethod = methods.find((method) => method.type === 'password') ?? null;
    const oauthMethods = methods.filter(
      (method): method is Extract<(typeof methods)[number], { type: 'oauth' }> =>
        method.type === 'oauth',
    );

    return [
      {
        id: 'language',
        content: <h2>{t('layout:languageLabel')}</h2>,
      },
      {
        id: 'authentication-methods',
        content: (
          <div>
            <h2>{t('authentication.title')}</h2>
            {passwordMethod !== null ? <p>{t('authentication.passwordLabel')}</p> : null}
            {oauthMethods.map((method) => (
              <p key={method.provider}>{method.provider}</p>
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
    mockStoreOAuthState.mockImplementation(() => {});
    mockUnlinkOAuthProvider.mockResolvedValue(undefined);
    mockUpdatePassword.mockResolvedValue(undefined);
  });

  it('renders shared account defaults through the platform package root', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AccountPage />
      </I18nextProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Account' })).toBeInTheDocument();
    expect(screen.getByText('Welcome back, Test User.')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Language' })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Authentication methods' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Recepturomat starter notes')).not.toBeInTheDocument();
  });
});
