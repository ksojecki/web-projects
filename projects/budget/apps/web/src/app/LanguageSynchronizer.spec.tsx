import { render, waitFor } from '@testing-library/react';
import type { i18n as I18nInstance } from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import type { AuthContextValue } from '@ksojecki/platform-web-platform';
import { LanguageSynchronizer } from './LanguageSynchronizer';

type LanguageAuthState = Pick<AuthContextValue, 'status'> & {
  user: Pick<NonNullable<AuthContextValue['user']>, 'preferredLanguage'> | null;
};

const useAuth = vi.hoisted(() => vi.fn<() => LanguageAuthState>());
const changeLanguage = vi.hoisted(() => vi.fn<I18nInstance['changeLanguage']>());
const i18nMock = vi.hoisted(() => ({ language: 'en', changeLanguage }));

vi.mock('@ksojecki/platform-web-platform', () => ({ useAuth }));
vi.mock('./i18n/i18n', () => ({ default: i18nMock }));

describe('LanguageSynchronizer', () => {
  it('restores the authenticated user language', async () => {
    useAuth.mockReturnValue({ status: 'authenticated', user: { preferredLanguage: 'pl' } });

    render(<LanguageSynchronizer />);

    await waitFor(() => expect(changeLanguage).toHaveBeenCalledWith('pl'));
  });

  it('returns guests to English', async () => {
    i18nMock.language = 'pl';
    useAuth.mockReturnValue({ status: 'guest', user: null });

    render(<LanguageSynchronizer />);

    await waitFor(() => expect(changeLanguage).toHaveBeenCalledWith('en'));
  });
});
