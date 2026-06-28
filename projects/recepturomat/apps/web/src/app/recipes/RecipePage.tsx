import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { useAuth } from '@ksojecki/platform-web-platform';
import {
  buildRecipeDetailPath,
  buildRecipeEditPath,
  frontendProductConfig,
} from '../productConfig';
import { RecipeAccessPrompt } from './RecipeAccessPrompt';
import { useRecipe } from './useRecipe';
import { useRecalculatedRecipe } from './useRecalculatedRecipe';

export function RecipePage() {
  const { t } = useTranslation('recipes');
  const { status } = useAuth();
  const navigate = useNavigate();
  const { recipeId } = useParams<{ recipeId: string }>();
  const [weightInput, setWeightInput] = useState('');
  const [weightUnit, setWeightUnit] = useState<'g' | 'pcs'>('g');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { deleteCurrentRecipe, error, isLoading, recipe } = useRecipe({
    enabled: status === 'authenticated',
    recipeId,
  });
  const {
    reset,
    setNewWeight,
    value: recalculatedRecipe,
  } = useRecalculatedRecipe(recipe);

  useEffect(() => {
    const parsedValue = Number(weightInput);

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      reset();
      return;
    }

    setNewWeight(weightUnit === 'g' ? parsedValue : parsedValue * 1000);
  }, [reset, setNewWeight, weightInput, weightUnit]);

  if (status === 'loading') {
    return <p>{t('loading')}</p>;
  }

  if (status === 'guest') {
    return <RecipeAccessPrompt />;
  }

  if (recipeId === undefined) {
    return (
      <p className="alert alert-error" role="alert">
        {t('detail.missingRecipeId')}
      </p>
    );
  }

  if (error !== null) {
    return (
      <p className="alert alert-error" role="alert">
        {error.message}
      </p>
    );
  }

  if (isLoading || recalculatedRecipe === null) {
    return <p>{t('loading')}</p>;
  }

  async function handleDelete(): Promise<void> {
    setDeleteError(null);

    try {
      await deleteCurrentRecipe();
      await navigate(frontendProductConfig.routes.home);
    } catch (caughtError) {
      setDeleteError(
        caughtError instanceof Error
          ? caughtError.message
          : t('errors.loadFailed'),
      );
    }
  }

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <div className="text-sm text-base-content/60">{recipeId}</div>
            <h1 className="text-3xl font-semibold">
              {recalculatedRecipe.name}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="btn btn-ghost"
              to={frontendProductConfig.routes.home}
            >
              {t('actions.back')}
            </Link>
            <button className="btn btn-ghost" disabled type="button">
              {t('detail.print')}
            </button>
            <Link
              className="btn btn-outline"
              to={buildRecipeEditPath(recipeId)}
            >
              {t('actions.edit')}
            </Link>
            <button
              className="btn btn-error btn-outline"
              onClick={() => void handleDelete()}
              type="button"
            >
              {t('actions.delete')}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="input input-bordered flex-1"
            onChange={(event) => {
              setWeightInput(event.target.value);
            }}
            placeholder={t('detail.newWeight')}
            type="number"
            value={weightInput}
          />
          <select
            className="select select-bordered w-full sm:w-32"
            onChange={(event) => {
              setWeightUnit(event.target.value as 'g' | 'pcs');
            }}
            value={weightUnit}
          >
            <option value="g">{t('units.g')}</option>
            <option value="pcs">{t('detail.pieces')}</option>
          </select>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setWeightInput('');
            }}
            type="button"
          >
            {t('actions.clear')}
          </button>
        </div>

        <p className="text-sm text-base-content/70">
          {recalculatedRecipe.weight} {t('units.g')}
        </p>
      </div>

      {deleteError !== null ? (
        <p className="alert alert-error" role="alert">
          {deleteError}
        </p>
      ) : null}

      <section className="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">
          {t('detail.ingredients')}
        </h2>
        <ul className="grid gap-3">
          {recalculatedRecipe.ingredients.map((ingredient, index) => (
            <li
              className="rounded-box border border-base-200 bg-base-200/40 p-3"
              key={`${ingredient.name}-${index}`}
            >
              <div className="font-medium">{ingredient.name}</div>
              <div className="text-sm text-base-content/70">
                {formatAmount(ingredient.amount)}{' '}
                {t(`units.${ingredient.unit}`)}
              </div>
              {ingredient.recipeId !== undefined ? (
                <Link
                  className="link link-hover text-sm"
                  to={buildRecipeDetailPath(ingredient.recipeId)}
                >
                  {t('detail.ingredientRecipe', {
                    recipeId: ingredient.recipeId,
                  })}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}

function formatAmount(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

export default RecipePage;
