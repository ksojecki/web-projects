import { useTranslation } from 'react-i18next';
import { Heading } from '@sojecki/platform-ui';
import { updateLanguagePreference } from './settingsApi';

export const LanguageSelector = () => {
  const { i18n, t } = useTranslation('layout');
  const locale = i18n.resolvedLanguage === 'pl' ? 'pl' : 'en';

  return (
    <div className="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
      <div className="space-y-1">
        <Heading level={2}>{t('languageLabel')}</Heading>
      </div>

      <div className="mt-4">
        <select
          className="select select-bordered w-full"
          onChange={(event) => {
            const nextLanguage = event.target.value === 'pl' ? 'pl' : 'en';
            void i18n.changeLanguage(nextLanguage);
            void updateLanguagePreference(nextLanguage).catch(() => {
              // Keep local selection even if persistence fails.
            });
          }}
          value={locale}
        >
          <option value="en">{t('languageEnglish')}</option>
          <option value="pl">{t('languagePolish')}</option>
        </select>
      </div>
    </div>
  );
};
