import { Navigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@sojecki/platform-web-platform';
import { Heading } from '@sojecki/platform-ui';
import { OAuthRegisterButtons } from './components/OAuthRegisterButtons';
import { PasswordRegisterForm } from './components/PasswordRegisterForm';
import { frontendProductConfig } from '../frontendProductConfig';

export function RegisterPage() {
  const { t } = useTranslation('auth');
  const { status } = useAuth();
  const { auth, registration } = frontendProductConfig;

  if (!registration.enabled) {
    return <Navigate replace to={registration.disabledRedirectTo} />;
  }

  if (status === 'authenticated') {
    return <Navigate replace to={auth.postRegistrationRedirectTo} />;
  }

  return (
    <section className="mx-auto w-full max-w-5xl rounded-box bg-base-100 p-6 shadow">
      <Heading level={1}>{t('register.title')}</Heading>
      <div className="flex gap-2 flex-row">
        <div className={'flex-1'}>
          <Heading level={2}>{t('register.passwordSectionTitle')}</Heading>
          <p className="mb-4 text-sm text-base-content/70">
            {t('register.oauthSectionHint')}
          </p>
          <PasswordRegisterForm />
        </div>
        <div className="divider divider-horizontal">{t('or')}</div>
        <div className={'flex-1'}>
          <Heading level={2}>{t('register.oauthSectionTitle')}</Heading>
          <p className="mb-4 text-sm text-base-content/70">
            {t('register.oauthSectionHint')}
          </p>
          <OAuthRegisterButtons />
        </div>
      </div>
    </section>
  );
}
