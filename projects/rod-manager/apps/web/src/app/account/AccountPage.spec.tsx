import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  AuthenticationMethodsResponseBody,
  OAuthProviderType,
  UpdatePasswordRequestBody,
} from '@ksojecki/platform-shared';
import type * as PlatformWebPlatform from '@ksojecki/platform-web-platform';
import i18n from '../i18n/i18n';
import {
  createMockPlatformModule,
  type AuthContextLike,
  type OAuthInitiateResponse,
} from './AccountPage.spec.helpers';
import { AccountPage } from './AccountPage';

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

  return createMockPlatformModule(actual, {
    mockLinkOAuthProvider,
    mockLoadAuthenticationMethods,
    mockStoreOAuthState,
    mockUnlinkOAuthProvider,
    mockUpdatePassword,
    mockUseAuth,
  });
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
        { type: 'oauth', provider: 'google', connected: true, canDisconnect: false },
        { type: 'oauth', provider: 'apple', connected: false, canDisconnect: false },
        { type: 'oauth', provider: 'facebook', connected: false, canDisconnect: false },
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
        { type: 'oauth', provider: 'google', connected: true, canDisconnect: true },
        { type: 'oauth', provider: 'apple', connected: false, canDisconnect: false },
        { type: 'oauth', provider: 'facebook', connected: false, canDisconnect: false },
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
          { type: 'oauth', provider: 'google', connected: true, canDisconnect: true },
          { type: 'oauth', provider: 'apple', connected: false, canDisconnect: false },
          { type: 'oauth', provider: 'facebook', connected: false, canDisconnect: false },
        ],
      })
      .mockResolvedValueOnce({
        methods: [
          { type: 'password', connected: true, canDisconnect: false },
          { type: 'oauth', provider: 'google', connected: true, canDisconnect: true },
          { type: 'oauth', provider: 'apple', connected: false, canDisconnect: false },
          { type: 'oauth', provider: 'facebook', connected: false, canDisconnect: false },
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
