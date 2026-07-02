import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { Card, PageHeader, Paragraph, Section } from '@ksojecki/platform-ui';
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
    return (
      <Section
        className="mx-auto max-w-5xl"
        description={t('detail.loadingDescription')}
        title={t('loading')}
      >
        <div className="flex items-center gap-2 text-sm text-base-content/70">
          <span className="loading loading-spinner loading-sm" />
          {t('detail.loadingHint')}
        </div>
      </Section>
    );
  }

  if (status === 'guest') {
    return <RecipeAccessPrompt />;
  }

  if (recipeId === undefined) {
    return (
      <Section className="mx-auto max-w-5xl" title={t('detail.invalidTitle')}>
        <p className="alert alert-error" role="alert">
          {t('detail.missingRecipeId')}
        </p>
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

  if (isLoading || recalculatedRecipe === null) {
    return (
      <Section
        className="mx-auto max-w-5xl"
        description={t('detail.loadingDescription')}
        title={t('loading')}
      >
        <div className="flex items-center gap-2 text-sm text-base-content/70">
          <span className="loading loading-spinner loading-sm" />
          {t('detail.loadingHint')}
        </div>
      </Section>
    );
  }

  const defaultWeight = recipe?.defaultWeight ?? recalculatedRecipe.weight;

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
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        actions={
          <>
            <Link
              className="btn btn-ghost"
              to={frontendProductConfig.routes.home}
            >
              {t('actions.back')}
            </Link>
            <Link
              className="btn btn-secondary"
              to={buildRecipeEditPath(recipeId)}
            >
              {t('actions.edit')}
            </Link>
            <button
              className="btn btn-outline btn-error"
              onClick={() => void handleDelete()}
              type="button"
            >
              {t('actions.delete')}
            </button>
          </>
        }
        description={t('detail.description')}
        eyebrow={`${t('detail.recipeIdLabel')}: ${recipeId}`}
        meta={
          <>
            <span>
              {t('detail.defaultYield', {
                weight: defaultWeight,
              })}
            </span>
            <span>
              {t('detail.ingredientsCount', {
                count: recalculatedRecipe.ingredients.length,
              })}
            </span>
          </>
        }
        title={recalculatedRecipe.name}
      />

      <Section
        actions={
          <button
            className="btn btn-ghost"
            onClick={() => {
              setWeightInput('');
            }}
            type="button"
          >
            {t('actions.clear')}
          </button>
        }
        description={t('detail.scalingDescription')}
        title={t('detail.scalingTitle')}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_auto]">
          <div className="flex flex-col gap-3 sm:flex-row">
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
              className="select select-bordered w-full sm:w-40"
              onChange={(event) => {
                const unit = event.currentTarget.value;

                if (unit === 'g' || unit === 'pcs') {
                  setWeightUnit(unit);
                }
              }}
              value={weightUnit}
            >
              <option value="g">{t('units.g')}</option>
              <option value="pcs">{t('detail.pieces')}</option>
            </select>
          </div>

          <Card className="border border-base-200 bg-base-200/50 shadow-none">
            <div className="text-xs font-medium uppercase tracking-[0.16em] text-base-content/50">
              {t('detail.currentYieldLabel')}
            </div>
            <div className="mt-2 text-2xl font-semibold text-base-content">
              {recalculatedRecipe.weight} {t('units.g')}
            </div>
          </Card>
        </div>
      </Section>

      {deleteError !== null ? (
        <p className="alert alert-error" role="alert">
          {deleteError}
        </p>
      ) : null}

      <Section
        description={t('detail.ingredientsDescription')}
        title={t('detail.ingredients')}
      >
        <ul className="grid gap-4">
          {recalculatedRecipe.ingredients.map((ingredient, index) => (
            <li key={`${ingredient.name}-${index}`}>
              <Card className="border border-base-200 bg-base-100 shadow-none">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="text-lg font-semibold">
                      {ingredient.name}
                    </div>
                    <Paragraph tone="muted">
                      {formatAmount(ingredient.amount)}{' '}
                      {t(`units.${ingredient.unit}`)}
                    </Paragraph>
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
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function formatAmount(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

export default RecipePage;
