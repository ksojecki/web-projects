import { useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader, Section } from '@ksojecki/platform-ui';
import { RecipeInstructionDraftsError } from './api';
import {
  createNextEditableIngredientId,
  mergeDraftIngredients,
  normalizeEditableRecipe,
  toEditableRecipe,
  validateAndBuildRecipe,
  type EditableRecipe,
  type EditableRecipeIngredient,
} from './RecipeForm.model';
import {
  RecipeIngredientsSection,
  RecipeInstructionsSection,
  recipeFormInitializers,
} from './RecipeForm.sections';
import type { Recipe } from './types';

export interface RecipeFormProps {
  initialRecipe: Recipe;
  isSubmitting?: boolean;
  onCancel?: () => void;
  onSubmit: (recipe: Recipe) => Promise<void>;
  recipes: Array<Pick<Recipe, 'name' | 'recipeId'>>;
  title: string;
}

export function RecipeForm({
  initialRecipe,
  isSubmitting = false,
  onCancel,
  onSubmit,
  recipes,
  title,
}: RecipeFormProps) {
  const { t } = useTranslation('recipes');
  const [recipe, setRecipe] = useState<EditableRecipe>(() => toEditableRecipe(initialRecipe));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const availableRecipeReferences = useMemo(
    () =>
      recipes.filter(
        (candidate) => candidate.recipeId.length > 0 && candidate.recipeId !== recipe.recipeId,
      ),
    [recipe.recipeId, recipes],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedRecipe = normalizeEditableRecipe(recipe);
    const preparedRecipe = validateAndBuildRecipe(normalizedRecipe, t);

    if (preparedRecipe.error !== null || preparedRecipe.recipe === undefined) {
      setValidationError(preparedRecipe.error);
      setSubmitError(null);
      setRecipe(normalizedRecipe);
      return;
    }

    setValidationError(null);
    setSubmitError(null);
    setRecipe(normalizedRecipe);

    try {
      await onSubmit(preparedRecipe.recipe);
    } catch (caughtError) {
      if (caughtError instanceof RecipeInstructionDraftsError) {
        setRecipe((current) => mergeDraftIngredients(current, caughtError.draftIngredients));
        setValidationError(caughtError.message || t('form.completeAddedIngredients'));
        setSubmitError(null);
        return;
      }

      setSubmitError(caughtError instanceof Error ? caughtError.message : t('errors.submitFailed'));
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={(event) => void handleSubmit(event)}>
      <PageHeader description={t('form.description')} title={title} />

      <Section description={t('form.detailsDescription')} title={t('form.detailsTitle')}>
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
                  defaultWeight: event.target.value,
                }));
              }}
              step="0.01"
              type="number"
              value={recipe.defaultWeight}
            />
          </label>
        </div>
      </Section>

      <RecipeInstructionsSection
        instructions={recipe.instructions}
        onAddInstruction={() => {
          setRecipe((current) => ({
            ...current,
            instructions: [
              ...current.instructions,
              recipeFormInitializers.createEmptyInstruction(),
            ],
          }));
        }}
        onRemoveInstruction={(index) => {
          setRecipe((current) => ({
            ...current,
            instructions: current.instructions.filter((_, itemIndex) => itemIndex !== index),
          }));
        }}
        onUpdateInstruction={updateInstruction}
        t={t}
      />

      <RecipeIngredientsSection
        availableRecipeReferences={availableRecipeReferences}
        ingredients={recipe.ingredients}
        onAddIngredient={() => {
          setRecipe((current) => ({
            ...current,
            ingredients: [
              ...current.ingredients,
              recipeFormInitializers.createEmptyIngredient(
                createNextEditableIngredientId(current.ingredients),
              ),
            ],
          }));
        }}
        onRemoveIngredient={(index) => {
          setRecipe((current) => ({
            ...current,
            ingredients: current.ingredients.filter((_, itemIndex) => itemIndex !== index),
          }));
        }}
        onUpdateIngredient={updateIngredient}
        t={t}
      />

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
        <button className="btn btn-primary" disabled={isSubmitting} type="submit">
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

  function updateIngredient(index: number, nextIngredient: EditableRecipeIngredient) {
    setRecipe((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredientItem, itemIndex) =>
        itemIndex === index ? nextIngredient : ingredientItem,
      ),
    }));
  }

  function updateInstruction(index: number, nextInstruction: string) {
    setRecipe((current) => ({
      ...current,
      instructions: current.instructions.map((instruction, itemIndex) =>
        itemIndex === index ? nextInstruction : instruction,
      ),
    }));
  }
}
