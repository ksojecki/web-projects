import { Navigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Heading } from '@ksojecki/platform-ui';
import { useAuth } from './AuthProvider';
import { OAuthButtons } from './OAuthButtons';
import { PasswordRegisterForm } from './PasswordRegisterForm';

export interface RegisterPageProps {
  authenticatedRedirectTo: string;
  disabledRedirectTo: string;
  loginHref?: string;
  registrationEnabled: boolean;
}

/**
 * Shared registration page with local and OAuth account creation.
 */
export function RegisterPage({
  authenticatedRedirectTo,
  disabledRedirectTo,
  loginHref,
  registrationEnabled,
}: RegisterPageProps) {
  const { t } = useTranslation('auth');
  const { status } = useAuth();

  if (!registrationEnabled) {
    return <Navigate replace to={disabledRedirectTo} />;
  }

  if (status === 'authenticated') {
    return <Navigate replace to={authenticatedRedirectTo} />;
  }

  return (
    <section className="mx-auto w-full max-w-5xl rounded-box bg-base-100 p-6 shadow">
      <Heading level={1}>{t('register.title')}</Heading>
      <div className="flex flex-row gap-2">
        <div className="flex-1">
          <Heading level={2}>{t('register.passwordSectionTitle')}</Heading>
          <p className="mb-4 text-sm text-base-content/70">
            {t('register.passwordSectionHint')}
          </p>
          <PasswordRegisterForm redirectTo={authenticatedRedirectTo} />
        </div>
        <div className="divider divider-horizontal">{t('or')}</div>
        <div className="flex-1">
          <Heading level={2}>{t('register.oauthSectionTitle')}</Heading>
          <p className="mb-4 text-sm text-base-content/70">
            {t('register.oauthSectionHint')}
          </p>
          <OAuthButtons />
        </div>
      </div>
      {loginHref !== undefined ? (
        <div className="mt-6 text-sm">
          <a className="link link-primary" href={loginHref}>
            {t('register.alreadyHaveAccount')} {t('register.loginLink')}
          </a>
        </div>
      ) : null}
    </section>
  );
}
