import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  AuthUser,
  AuthenticationMethodsResponseBody,
  OAuthProviderType,
  UpdatePasswordRequestBody,
} from '@sojecki/platform-shared';
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

vi.mock('../auth/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('../auth/authApi', () => ({
  linkOAuthProvider: mockLinkOAuthProvider,
  loadAuthenticationMethods: mockLoadAuthenticationMethods,
  storeOAuthState: mockStoreOAuthState,
  unlinkOAuthProvider: mockUnlinkOAuthProvider,
  updatePassword: mockUpdatePassword,
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

    expect(
      await screen.findByRole('heading', { name: 'Authentication methods' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Password')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Set password' }),
    ).toBeInTheDocument();
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

    await user.click(
      await screen.findByRole('button', { name: 'Set password' }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Set password' }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Confirm new password'),
    ).toBeInTheDocument();
  });
});
