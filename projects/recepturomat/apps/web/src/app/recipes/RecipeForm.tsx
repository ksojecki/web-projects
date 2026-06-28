import { useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
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
      className="flex flex-col gap-4"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <header className="flex flex-col gap-2 rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
        <h1 className="text-3xl font-semibold">{title}</h1>

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

        <div className="grid gap-4 md:grid-cols-2">
          <label className="form-control">
            <span className="label-text">{t('form.recipeId')}</span>
            <input
              className="input input-bordered"
              onChange={(event) => {
                setRecipe((current) => ({
                  ...current,
                  recipeId: event.target.value,
                }));
              }}
              readOnly={initialRecipe.recipeId !== 'new'}
              type="text"
              value={recipe.recipeId}
            />
          </label>

          <label className="form-control">
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
      </header>

      <section className="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t('form.ingredients')}</h2>
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
        </div>

        <div className="grid gap-3">
          {recipe.ingredients.map((ingredient, index) => (
            <article
              className="rounded-box border border-base-200 bg-base-200/40 p-3"
              key={`${ingredient.recipeId ?? ingredient.name}-${index}`}
            >
              <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
                <label className="form-control">
                  <span className="label-text">{t('form.ingredientName')}</span>
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

              <label className="form-control mt-3">
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
                    <option key={candidate.recipeId} value={candidate.recipeId}>
                      {candidate.name}
                    </option>
                  ))}
                </datalist>
              </label>

              <div className="mt-3 flex justify-end">
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
            </article>
          ))}
        </div>
      </section>

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

      <footer className="flex gap-2">
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
    recipeId: recipe.recipeId.trim(),
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
  if (recipe.recipeId.length === 0 || recipe.name.length === 0) {
    return t('errors.missingFields');
  }

  if (!Number.isFinite(recipe.defaultWeight) || recipe.defaultWeight <= 0) {
    return t('errors.invalidNumber');
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
