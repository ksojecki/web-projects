import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@sojecki/platform-web-platform';
import type { ModalWindowApi } from '@sojecki/platform-ui';
import { LoginModal } from '../../auth/components/LoginModal';
import {
  clearLoginPrompt,
  frontendProductConfig,
  isLoginPromptRequested,
} from '../../frontendProductConfig';

export const Navbar = () => {
  const { t } = useTranslation('layout');
  const { logout, status, user } = useAuth();
  const loginModalApi = useRef<ModalWindowApi | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { routes } = frontendProductConfig;

  useEffect(() => {
    const shouldOpenLogin =
      status === 'guest' && isLoginPromptRequested(searchParams);
    if (!shouldOpenLogin) {
      return;
    }

    loginModalApi.current?.show();

    setSearchParams(clearLoginPrompt(searchParams), { replace: true });
  }, [searchParams, setSearchParams, status]);

  return (
    <>
      <header className="navbar bg-base-100 shadow-sm">
        <div className="w-full mx-auto max-w-5xl flex items-center justify-between px-4">
          <Link to="/" className="text-lg">
            {t('appName')}
          </Link>
          <nav className="flex items-center gap-2">
            <Link to={routes.home} className="btn btn-ghost btn-sm">
              {t('menuHome')}
            </Link>
            {status === 'authenticated' ? (
              <Link
                to={routes.contentManagement}
                className="btn btn-ghost btn-sm"
              >
                {t('menuContentManagement')}
              </Link>
            ) : null}
            {status === 'authenticated' ? (
              <div className="dropdown dropdown-end">
                <button
                  className="btn btn-outline btn-sm"
                  type="button"
                  tabIndex={0}
                >
                  {user?.displayName}
                </button>
                <ul
                  className="dropdown-content menu z-10 mt-2 w-44 rounded-box bg-base-100 p-2 shadow"
                  tabIndex={0}
                >
                  <li>
                    <Link to={routes.account}>{t('menuAccount')}</Link>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        void logout();
                      }}
                      type="button"
                    >
                      {t('menuLogout')}
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => loginModalApi.current?.show()}
                type="button"
              >
                {t('menuLogin')}
              </button>
            )}
          </nav>
        </div>
      </header>
      <LoginModal api={loginModalApi} />
    </>
  );
};
