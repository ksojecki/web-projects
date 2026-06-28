import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@ksojecki/platform-web-platform';
import { buildLoginPromptHref, frontendProductConfig } from './productConfig';

export function HomePage() {
  const { t } = useTranslation('home');
  const { status, user } = useAuth();

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-box bg-base-100 p-6 shadow">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-base-content/60">
          {t('badge')}
        </p>
        <h1 className="text-4xl font-semibold">{t('title')}</h1>
        <p className="max-w-2xl text-base-content/75">{t('description')}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {status === 'authenticated' ? (
          <Link
            className="btn btn-primary"
            to={frontendProductConfig.routes.account}
          >
            {t('signedInCta')}
          </Link>
        ) : (
          <Link className="btn btn-primary" to={buildLoginPromptHref()}>
            {t('signedOutCta')}
          </Link>
        )}
        {frontendProductConfig.registration.enabled ? (
          <Link
            className="btn btn-outline"
            to={frontendProductConfig.routes.register}
          >
            {t('registerCta')}
          </Link>
        ) : null}
      </div>

      <div className="rounded-box border border-base-300 p-4">
        <h2 className="text-lg font-medium">{t('authStateTitle')}</h2>
        <p className="text-base-content/75">
          {status === 'authenticated'
            ? t('authenticatedState', {
                email: user?.email ?? 'unknown user',
              })
            : t('guestState')}
        </p>
      </div>
    </section>
  );
}
