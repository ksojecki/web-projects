import { useTranslation } from 'react-i18next';
import {
  AccountShell,
  useAuth,
  useDefaultAccountSections,
} from '@ksojecki/platform-web-platform';
import { productAccountConfig } from './productAccountConfig';

export function AccountPage() {
  const { t } = useTranslation('account');
  const { user } = useAuth();
  const extraSections = productAccountConfig.useExtraSections();
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
}
