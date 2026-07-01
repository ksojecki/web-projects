import { render, screen } from '@testing-library/react';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInstance } from 'i18next';
import type { UseAuthenticationMethodsResult } from './useAuthenticationMethods';
import type { AccountSection } from './types';
import { useDefaultAccountSections } from './useDefaultAccountSections';

const { mockUseAuthenticationMethods } = vi.hoisted(() => ({
  mockUseAuthenticationMethods: vi.fn<() => UseAuthenticationMethodsResult>(),
}));

vi.mock('./useAuthenticationMethods', () => ({
  useAuthenticationMethods: mockUseAuthenticationMethods,
}));

function DefaultAccountSectionsHarness({
  extraSections = [],
}: {
  extraSections?: AccountSection[];
}) {
  const sections = useDefaultAccountSections(extraSections);

  return (
    <>
      {sections.map((section: AccountSection) => (
        <div key={section.id}>{section.content}</div>
      ))}
    </>
  );
}

describe('useDefaultAccountSections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthenticationMethods.mockReturnValue({
      connectOAuthProvider:
        vi.fn<(provider: 'apple' | 'facebook' | 'google') => Promise<void>>(),
      disconnectOAuthProvider:
        vi.fn<(provider: 'apple' | 'facebook' | 'google') => Promise<void>>(),
      methods: [
        { type: 'password', connected: true, canDisconnect: false },
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
      pendingMethod: null,
      refreshAuthenticationMethods: vi.fn<() => Promise<void>>(),
    });
  });

  it('prepends shared language and authentication sections before extras', async () => {
    const i18n = createInstance();
    await i18n.use(initReactI18next).init({
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      lng: 'en',
      resources: {
        en: {
          account: {
            authentication: {
              cancelAction: 'Cancel',
              changePasswordAction: 'Change password',
              changePasswordDescription: 'Change description',
              changePasswordTitle: 'Change password',
              connectAction: 'Connect',
              connected: 'Connected',
              connectingAction: 'Connecting...',
              currentPasswordLabel: 'Current password',
              description: 'Manage how you sign in.',
              disconnectAction: 'Disconnect',
              disconnectingAction: 'Disconnecting...',
              lastMethodHint: 'Last method',
              linkStartError: 'Link error',
              newPasswordLabel: 'New password',
              notConnected: 'Not connected',
              oauthDisconnected: '{{provider}} disconnected.',
              passwordCannotBeDisabled: 'Password cannot be disabled.',
              passwordChanged: 'Password changed.',
              passwordConnected: 'Password connected.',
              passwordLabel: 'Password',
              requiredAction: 'Required',
              savingPasswordAction: 'Saving password...',
              setPasswordAction: 'Set password',
              setPasswordDescription: 'Set description',
              setPasswordTitle: 'Set password',
              title: 'Authentication methods',
              unlinkError: 'Unlink error',
            },
            password: {
              confirmMismatch: 'Mismatch',
              confirmRequired: 'Confirm required',
              currentRequired: 'Current required',
              newMinLength: 'Too short',
            },
          },
          layout: {
            languageEnglish: 'EN',
            languageLabel: 'Language',
            languagePolish: 'PL',
          },
        },
      },
    });

    render(
      <I18nextProvider i18n={i18n}>
        <DefaultAccountSectionsHarness
          extraSections={[
            {
              content: <div>Product extra section</div>,
              id: 'product-extra',
            },
          ]}
        />
      </I18nextProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Language' })).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Authentication methods' }),
    ).toBeTruthy();
    expect(screen.getByText('Product extra section')).toBeTruthy();
  });
});
