import { useTranslation } from 'react-i18next';
import { AccountShell, useAuth } from '@sojecki/platform-web-platform';
import { productAccountConfig } from './productAccountConfig';

export function AccountPage() {
  const { t } = useTranslation('account');
  const { user } = useAuth();
  const sections = productAccountConfig.useSections();

  return (
    <AccountShell
      roleLabel={t('roleLabel')}
      sections={sections}
      title={t('title')}
      user={user}
      welcomeMessage={t('welcome', {
        name: user?.displayName ?? t('fallbackUserName'),
      })}
    />
  );
}
