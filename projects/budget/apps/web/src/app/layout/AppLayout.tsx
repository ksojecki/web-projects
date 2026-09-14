import { Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  PlatformFooter,
  PlatformNavbar,
  type PlatformNavigationItem,
} from '@ksojecki/platform-web-platform';
import { frontendProductConfig } from '../productConfig';

export function AppLayout() {
  const { t } = useTranslation('layout');
  const navigationItems: PlatformNavigationItem[] = [
    {
      label: t('menuHome'),
      to: frontendProductConfig.routes.home,
      visibility: 'authenticated',
    },
    {
      label: t('menuTransactions'),
      to: frontendProductConfig.routes.transactions,
      visibility: 'authenticated',
    },
    {
      label: t('menuReport'),
      to: frontendProductConfig.routes.report,
      visibility: 'authenticated',
    },
    {
      label: t('menuAccounts'),
      to: frontendProductConfig.routes.accounts,
      visibility: 'authenticated',
    },
    {
      label: 'Categories',
      to: frontendProductConfig.routes.categories,
      visibility: 'authenticated',
    },
  ];

  return (
    <div className="min-h-screen bg-base-200">
      <PlatformNavbar
        accountLabel={t('menuAccount')}
        accountTo={frontendProductConfig.routes.account}
        brandLabel={t('appName')}
        brandTo={frontendProductConfig.routes.home}
        items={navigationItems}
        loginLabel={t('menuLogin')}
        loginPrompt={frontendProductConfig.loginPrompt}
        loadingLabel={t('sessionLoading')}
        logoutLabel={t('menuLogout')}
        postLoginRedirectTo={frontendProductConfig.auth.postLoginRedirectTo}
        registerLabel={t('menuRegister')}
        registerTo={frontendProductConfig.routes.register}
        registrationEnabled={frontendProductConfig.registration.enabled}
        showGuestRegisterLink
      />
      <main className="px-4 py-6">
        <Outlet />
      </main>
      <PlatformFooter text={t('footerText')} />
    </div>
  );
}
