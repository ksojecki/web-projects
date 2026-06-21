import { Navigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Heading } from '@sojecki/platform-ui';
import { useAuth } from './AuthContext';
import { OAuthRegisterButtons } from './components/OAuthRegisterButtons';
import { PasswordRegisterForm } from './components/PasswordRegisterForm';

export function RegisterPage() {
  const { t } = useTranslation('auth');
  const { status } = useAuth();

  if (status === 'authenticated') {
    return <Navigate replace to="/account" />;
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
