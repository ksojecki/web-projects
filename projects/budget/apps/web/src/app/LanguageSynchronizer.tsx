import { useEffect } from 'react';
import { useAuth } from '@ksojecki/platform-web-platform';
import i18n from './i18n/i18n';

export function LanguageSynchronizer() {
  const { status, user } = useAuth();
  const language = status === 'authenticated' ? (user?.preferredLanguage ?? 'en') : 'en';

  useEffect(() => {
    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
  }, [language]);

  return null;
}
