import { useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, PageHeader, Paragraph, Section } from '@ksojecki/platform-ui';
import type { Recipe, RecipeIngredient, RecipeUnit } from './types';

const emptyIngredient = (): RecipeIngredient => ({
  amount: 0,
  name: '',
  unit: 'g',
});

export interface RecipeFormProps {
  initialRecipe: Recipe;
  isSubmitting?: boolean;
  onCancel?: () => void;
  onSubmit: (recipe: Recipe) => Promise<void>;
  recipes: Array<Pick<Recipe, 'name' | 'recipeId'>>;
  submitError?: string | null;
  title: string;
}

export function RecipeForm({
  initialRecipe,
  isSubmitting = false,
  onCancel,
  onSubmit,
  recipes,
  submitError = null,
  title,
}: RecipeFormProps) {
  const { t } = useTranslation('recipes');
  const [recipe, setRecipe] = useState<Recipe>(initialRecipe);
  const [validationError, setValidationError] = useState<string | null>(null);

  const availableRecipeReferences = useMemo(
    () =>
      recipes.filter(
        (candidate) =>
          candidate.recipeId.length > 0 &&
          candidate.recipeId !== recipe.recipeId,
      ),
    [recipe.recipeId, recipes],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedRecipe = normalizeRecipe(recipe);
    const error = validateRecipe(normalizedRecipe, t);

    if (error !== null) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    await onSubmit(normalizedRecipe);
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <PageHeader description={t('form.description')} title={title} />

      <Section
        description={t('form.detailsDescription')}
        title={t('form.detailsTitle')}
      >
        <div className="grid gap-4">
          <label className="form-control">
            <span className="label-text">{t('form.name')}</span>
            <input
              className="input input-bordered"
              onChange={(event) => {
                setRecipe((current) => ({
                  ...current,
                  name: event.target.value,
                }));
              }}
              type="text"
              value={recipe.name}
            />
          </label>

          <label className="form-control max-w-sm">
            <span className="label-text">{t('form.defaultWeight')}</span>
            <input
              className="input input-bordered"
              min="1"
              onChange={(event) => {
                setRecipe((current) => ({
                  ...current,
                  defaultWeight: Number(event.target.value),
                }));
              }}
              step="0.01"
              type="number"
              value={recipe.defaultWeight}
            />
          </label>
        </div>
      </Section>

      <Section
        actions={
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              setRecipe((current) => ({
                ...current,
                ingredients: [...current.ingredients, emptyIngredient()],
              }));
            }}
            type="button"
          >
            {t('form.addIngredient')}
          </button>
        }
        description={t('form.ingredientsDescription')}
        title={t('form.ingredients')}
      >
        <div className="grid gap-4">
          {recipe.ingredients.length === 0 ? (
            <div className="rounded-box border border-dashed border-base-300 bg-base-200/60 p-4">
              <Paragraph tone="muted">{t('form.emptyIngredients')}</Paragraph>
            </div>
          ) : null}

          {recipe.ingredients.map((ingredient, index) => (
            <Card
              className="border border-base-200 bg-base-100 shadow-none"
              key={`${ingredient.recipeId ?? ingredient.name}-${index}`}
              title={`${t('form.ingredientCardTitle')} ${index + 1}`}
            >
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
                  <label className="form-control">
                    <span className="label-text">
                      {t('form.ingredientName')}
                    </span>
                    <input
                      className="input input-bordered"
                      onChange={(event) => {
                        updateIngredient(index, {
                          ...ingredient,
                          name: event.target.value,
                        });
                      }}
                      type="text"
                      value={ingredient.name}
                    />
                  </label>

                  <label className="form-control">
                    <span className="label-text">{t('form.amount')}</span>
                    <input
                      className="input input-bordered"
                      min="0"
                      onChange={(event) => {
                        updateIngredient(index, {
                          ...ingredient,
                          amount: Number(event.target.value),
                        });
                      }}
                      step="0.01"
                      type="number"
                      value={ingredient.amount}
                    />
                  </label>

                  <label className="form-control">
                    <span className="label-text">{t('form.unit')}</span>
                    <select
                      className="select select-bordered"
                      onChange={(event) => {
                        updateIngredient(index, {
                          ...ingredient,
                          unit: event.target.value as RecipeUnit,
                        });
                      }}
                      value={ingredient.unit}
                    >
                      <option value="g">{t('units.g')}</option>
                      <option value="ml">{t('units.ml')}</option>
                      <option value="pcs">{t('units.pcs')}</option>
                    </select>
                  </label>
                </div>

                <label className="form-control">
                  <span className="label-text">
                    {t('form.ingredientRecipeId')}
                  </span>
                  <input
                    className="input input-bordered"
                    list={`recipe-references-${index}`}
                    onChange={(event) => {
                      updateIngredient(index, {
                        ...ingredient,
                        recipeId:
                          event.target.value.trim().length === 0
                            ? undefined
                            : event.target.value,
                      });
                    }}
                    type="text"
                    value={ingredient.recipeId ?? ''}
                  />
                  <datalist id={`recipe-references-${index}`}>
                    {availableRecipeReferences.map((candidate) => (
                      <option
                        key={candidate.recipeId}
                        value={candidate.recipeId}
                      >
                        {candidate.name}
                      </option>
                    ))}
                  </datalist>
                </label>

                <div className="flex justify-end">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setRecipe((current) => ({
                        ...current,
                        ingredients: current.ingredients.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      }));
                    }}
                    type="button"
                  >
                    {t('form.removeIngredient')}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {validationError !== null ? (
        <p className="alert alert-error" role="alert">
          {validationError}
        </p>
      ) : null}

      {submitError !== null ? (
        <p className="alert alert-error" role="alert">
          {submitError}
        </p>
      ) : null}

      <footer className="flex flex-wrap gap-2">
        <button
          className="btn btn-primary"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? t('actions.saving') : t('actions.save')}
        </button>
        {onCancel !== undefined ? (
          <button className="btn btn-ghost" onClick={onCancel} type="button">
            {t('actions.cancel')}
          </button>
        ) : null}
      </footer>
    </form>
  );

  function updateIngredient(index: number, nextIngredient: RecipeIngredient) {
    setRecipe((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredientItem, itemIndex) =>
        itemIndex === index ? nextIngredient : ingredientItem,
      ),
    }));
  }
}

function normalizeRecipe(recipe: Recipe): Recipe {
  return {
    ...recipe,
    name: recipe.name.trim(),
    ingredients: recipe.ingredients.map((ingredient) => ({
      ...ingredient,
      name: ingredient.name.trim(),
      recipeId: ingredient.recipeId?.trim() || undefined,
    })),
  };
}

function validateRecipe(
  recipe: Recipe,
  t: (key: string) => string,
): string | null {
  if (recipe.name.length === 0) {
    return t('errors.missingFields');
  }

  if (!Number.isFinite(recipe.defaultWeight) || recipe.defaultWeight <= 0) {
    return t('errors.invalidNumber');
  }

  if (recipe.ingredients.length === 0) {
    return t('form.emptyIngredients');
  }

  for (const ingredient of recipe.ingredients) {
    if (ingredient.name.length === 0) {
      return t('errors.missingFields');
    }

    if (!Number.isFinite(ingredient.amount) || ingredient.amount < 0) {
      return t('errors.invalidNumber');
    }
  }

  return null;
}
