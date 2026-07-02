import { useState, type ChangeEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Link,
  PageHeader,
  Paragraph,
  Section,
} from '@ksojecki/platform-ui';
import { useAuth } from '@ksojecki/platform-web-platform';
import { buildRecipeDetailPath, frontendProductConfig } from '../productConfig';
import { RecipeAccessPrompt } from './RecipeAccessPrompt';
import { useRecipesList } from './useRecipesList';

export function RecipesListPage() {
  const { t } = useTranslation('recipes');
  const { status } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const { error, isLoading, recipes } = useRecipesList({
    enabled: status === 'authenticated',
    searchQuery,
  });

  const handleSearchChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setSearchQuery(event.target.value);
  };

  if (status === 'loading') {
    return (
      <Section
        className="mx-auto max-w-5xl"
        description={t('list.loadingDescription')}
        title={t('loading')}
      >
        <div className="flex items-center gap-2 text-sm text-base-content/70">
          <span className="loading loading-spinner loading-sm" />
          {t('list.loadingHint')}
        </div>
      </Section>
    );
  }

  if (status === 'guest') {
    return <RecipeAccessPrompt />;
  }

  if (isLoading) {
    return (
      <Section
        className="mx-auto max-w-5xl"
        description={t('list.loadingDescription')}
        title={t('loading')}
      >
        <div className="flex items-center gap-2 text-sm text-base-content/70">
          <span className="loading loading-spinner loading-sm" />
          {t('list.loadingHint')}
        </div>
      </Section>
    );
  }

  if (error !== null) {
    return (
      <Section className="mx-auto max-w-5xl" title={t('errors.loadFailed')}>
        <p className="alert alert-error" role="alert">
          {error.message}
        </p>
      </Section>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <PageHeader
        actions={
          <Link asButton to={frontendProductConfig.routes.recipeNew}>
            {t('actions.add')}
          </Link>
        }
        description={t('list.description')}
        meta={
          <span>
            {t('list.count', {
              count: recipes.length,
            })}
          </span>
        }
        title={t('list.title')}
      />

      <Section
        actions={
          <button
            className="btn btn-ghost"
            onClick={() => {
              setSearchQuery('');
            }}
            type="button"
          >
            {t('actions.clear')}
          </button>
        }
        description={t('list.searchHint')}
        title={t('list.searchTitle')}
      >
        <input
          className="input input-bordered w-full"
          onChange={handleSearchChange}
          placeholder={t('list.search')}
          type="search"
          value={searchQuery}
        />
      </Section>

      {recipes.length === 0 ? (
        <Section
          className="border-dashed"
          description={t('list.emptyHint')}
          title={t('list.emptyTitle')}
        >
          <Paragraph tone="muted">{t('list.empty')}</Paragraph>
        </Section>
      ) : (
        <section className="grid gap-3">
          {recipes.map((recipe) => (
            <Card
              className="border border-base-200 bg-base-100 shadow-none"
              key={recipe.recipeId}
            >
              <Link
                className="flex items-start gap-3 no-underline"
                to={buildRecipeDetailPath(recipe.recipeId)}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-semibold text-base-content">
                    {recipe.name}
                  </span>
                  <Paragraph tone="muted">{t('list.openRecipe')}</Paragraph>
                </div>
              </Link>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}

export default RecipesListPage;
