import { Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  PlatformFooter,
  PlatformNavbar,
  type PlatformNavigationItem,
} from '@ksojecki/platform-web-platform';
import { frontendProductConfig } from '../frontendProductConfig';

export function AppLayout() {
  const { t } = useTranslation('layout');
  const navigationItems: PlatformNavigationItem[] = [
    {
      label: t('menuHome'),
      to: frontendProductConfig.routes.home,
    },
    {
      label: t('menuContentManagement'),
      to: frontendProductConfig.routes.contentManagement,
      visibility: 'authenticated',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <PlatformNavbar
        accountLabel={t('menuAccount')}
        accountTo={frontendProductConfig.routes.account}
        brandLabel={t('appName')}
        brandTo={frontendProductConfig.routes.home}
        items={navigationItems}
        loginLabel={t('menuLogin')}
        loginPrompt={frontendProductConfig.loginPrompt}
        logoutLabel={t('menuLogout')}
        postLoginRedirectTo={frontendProductConfig.auth.postLoginRedirectTo}
        registerTo={frontendProductConfig.routes.register}
        registrationEnabled={frontendProductConfig.registration.enabled}
      />
      <div className="flex-1 flex flex-col w-full mx-auto max-w-5xl pt-4 pb-4">
        <Outlet />
      </div>
      <PlatformFooter text={t('footerText')} />
    </div>
  );
}
