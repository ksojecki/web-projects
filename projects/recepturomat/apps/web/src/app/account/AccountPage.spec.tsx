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
  state: string;
  codeVerifier: string;
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
  mockLinkOAuthProvider:
    vi.fn<(provider: OAuthProviderType) => Promise<OAuthInitiateResponse>>(),
  mockLoadAuthenticationMethods:
    vi.fn<() => Promise<AuthenticationMethodsResponseBody>>(),
  mockStoreOAuthState: vi.fn<(state: string, codeVerifier: string) => void>(),
  mockUnlinkOAuthProvider:
    vi.fn<(provider: OAuthProviderType) => Promise<void>>(),
  mockUpdatePassword:
    vi.fn<(input: UpdatePasswordRequestBody) => Promise<void>>(),
}));

vi.mock('@ksojecki/platform-web-platform', async (importOriginal) => {
  const actual = await importOriginal<typeof PlatformWebPlatform>();

  return {
    ...actual,
    useAuth: mockUseAuth,
    updatePassword: mockUpdatePassword,
  };
});

vi.mock('../../../../../../../libs/web-platform/src/lib/auth/authApi', () => ({
  linkOAuthProvider: mockLinkOAuthProvider,
  loadAuthenticationMethods: mockLoadAuthenticationMethods,
  unlinkOAuthProvider: mockUnlinkOAuthProvider,
  updatePassword: mockUpdatePassword,
}));

vi.mock('../../../../../../../libs/web-platform/src/lib/auth/storage', () => ({
  storeOAuthState: mockStoreOAuthState,
}));

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
  });

  it('renders shared account defaults plus the product extra section', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AccountPage />
      </I18nextProvider>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Language' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Authentication methods' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Recepturomat starter notes')).toBeInTheDocument();
  });
});
