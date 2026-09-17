import { afterEach, describe, expect, it } from 'vitest';
import i18n from './i18n';

afterEach(() => {
  void i18n.changeLanguage('en');
});

describe('budget translations', () => {
  it('resolves Polish account language and authentication labels immediately', async () => {
    await i18n.changeLanguage('pl');

    expect(i18n.t('languagePolish', { ns: 'layout' })).toBe('Polski');
    expect(i18n.t('authentication.title', { ns: 'account' })).toBe('Metody uwierzytelniania');
  });
});
