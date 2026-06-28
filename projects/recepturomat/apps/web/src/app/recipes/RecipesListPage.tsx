import { useState, type ChangeEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
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
    return <p>{t('loading')}</p>;
  }

  if (status === 'guest') {
    return <RecipeAccessPrompt />;
  }

  if (isLoading) {
    return <p>{t('loading')}</p>;
  }

  if (error !== null) {
    return (
      <p className="alert alert-error" role="alert">
        {error.message}
      </p>
    );
  }

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h1 className="text-3xl font-semibold">{t('list.title')}</h1>
        </div>
        <Link
          className="btn btn-primary"
          to={frontendProductConfig.routes.recipeNew}
        >
          {t('actions.add')}
        </Link>
      </div>

      <div className="flex gap-2">
        <input
          className="input input-bordered flex-1"
          onChange={handleSearchChange}
          placeholder={t('list.search')}
          type="search"
          value={searchQuery}
        />
        <button
          className="btn btn-ghost"
          onClick={() => {
            setSearchQuery('');
          }}
          type="button"
        >
          {t('actions.clear')}
        </button>
      </div>

      {recipes.length === 0 ? (
        <p className="rounded-box border border-dashed border-base-300 bg-base-100 p-6 text-center text-base-content/70">
          {t('list.empty')}
        </p>
      ) : (
        <ul className="grid gap-3">
          {recipes.map((recipe) => (
            <li key={recipe.recipeId}>
              <Link
                className="flex items-center justify-between rounded-box border border-base-300 bg-base-100 p-4 shadow-sm transition hover:border-base-content/30 hover:shadow"
                to={buildRecipeDetailPath(recipe.recipeId)}
              >
                <span className="text-lg font-medium">{recipe.name}</span>
                <span className="text-sm text-base-content/60">
                  {recipe.recipeId}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default RecipesListPage;
