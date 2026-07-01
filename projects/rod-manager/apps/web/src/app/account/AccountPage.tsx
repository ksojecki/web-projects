import { useTranslation } from 'react-i18next';
import {
  AccountShell,
  useAuth,
  useDefaultAccountSections,
} from '@ksojecki/platform-web-platform';
import { rodManagerAccountConfig } from './rodManagerAccountConfig';

export const AccountPage = () => {
  const { t } = useTranslation('account');
  const { user } = useAuth();
  const extraSections = rodManagerAccountConfig.useExtraSections();
  const sections = useDefaultAccountSections(extraSections);

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
