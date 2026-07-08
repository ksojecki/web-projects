import { useTranslation } from 'react-i18next';
import { AccountShell, useAuth, useDefaultAccountSections } from '@ksojecki/platform-web-platform';

export const AccountPage = () => {
  const { t } = useTranslation('account');
  const { user } = useAuth();
  const sections = useDefaultAccountSections();

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
};
