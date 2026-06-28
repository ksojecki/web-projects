import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { LoginModal } from '../auth/LoginModal';
import {
  clearLoginPrompt,
  isLoginPromptRequested,
  type LoginPromptConfig,
} from './loginPrompt';
import type { PlatformNavigationItem } from './types';

export interface PlatformNavbarProps {
  accountLabel: string;
  accountTo: string;
  brandLabel: string;
  brandTo: string;
  items?: PlatformNavigationItem[];
  loginLabel: string;
  loginPrompt: LoginPromptConfig;
  logoutLabel: string;
  postLoginRedirectTo: string;
  registerLabel?: string;
  registerTo?: string;
  registrationEnabled?: boolean;
  showGuestRegisterLink?: boolean;
}

export function PlatformNavbar({
  accountLabel,
  accountTo,
  brandLabel,
  brandTo,
  items = [],
  loginLabel,
  loginPrompt,
  logoutLabel,
  postLoginRedirectTo,
  registerLabel,
  registerTo,
  registrationEnabled = false,
  showGuestRegisterLink = false,
}: PlatformNavbarProps) {
  const { logout, status, user } = useAuth();
  const loginModalApi = useRef<{
    close: () => void;
    show: () => void;
  } | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const shouldOpenLogin =
      status === 'guest' && isLoginPromptRequested(searchParams, loginPrompt);

    if (!shouldOpenLogin) {
      return;
    }

    loginModalApi.current?.show();
    setSearchParams(clearLoginPrompt(searchParams, loginPrompt), {
      replace: true,
    });
  }, [loginPrompt, searchParams, setSearchParams, status]);

  const visibleItems = items.filter((item) => {
    switch (item.visibility) {
      case 'authenticated':
        return status === 'authenticated';
      case 'guest':
        return status === 'guest';
      case 'always':
      default:
        return true;
    }
  });

  return (
    <>
      <header className="navbar bg-base-100 shadow-sm">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4">
          <Link className="text-lg" to={brandTo}>
            {brandLabel}
          </Link>
          <nav className="flex items-center gap-2">
            {visibleItems.map((item) => (
              <Link className="btn btn-ghost btn-sm" key={item.to} to={item.to}>
                {item.label}
              </Link>
            ))}

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
                    <Link to={accountTo}>{accountLabel}</Link>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        void logout();
                      }}
                      type="button"
                    >
                      {logoutLabel}
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <>
                {registrationEnabled &&
                showGuestRegisterLink &&
                registerTo !== undefined &&
                registerLabel !== undefined ? (
                  <Link className="btn btn-ghost btn-sm" to={registerTo}>
                    {registerLabel}
                  </Link>
                ) : null}
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    loginModalApi.current?.show();
                  }}
                  type="button"
                >
                  {loginLabel}
                </button>
              </>
            )}
          </nav>
        </div>
      </header>
      <LoginModal
        api={loginModalApi}
        postLoginRedirectTo={postLoginRedirectTo}
        registerTo={registerTo}
        registrationEnabled={registrationEnabled}
      />
    </>
  );
}
