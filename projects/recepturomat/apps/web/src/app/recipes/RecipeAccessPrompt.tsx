import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { buildLoginPromptHref } from '../productConfig';

export function RecipeAccessPrompt() {
  const { t } = useTranslation('recipes');

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-4 rounded-box border border-base-300 bg-base-100 p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">{t('authRequired.title')}</h1>
      <p className="text-base-content/80">{t('authRequired.description')}</p>
      <div>
        <Link className="btn btn-primary" to={buildLoginPromptHref()}>
          {t('authRequired.action')}
        </Link>
      </div>
    </section>
  );
}
