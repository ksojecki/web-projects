import { Page } from '@sojecki/platform-ui';
import { useTranslation } from 'react-i18next';

export const HomePage = () => {
  const { t } = useTranslation('home');

  return (
    <Page>
      <Page.Title>{t('title')}</Page.Title>
      <Page.Content>{t('description')}</Page.Content>
    </Page>
  );
};
