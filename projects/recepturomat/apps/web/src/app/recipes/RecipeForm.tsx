import { useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, PageHeader, Paragraph, Section } from '@ksojecki/platform-ui';
import { RecipeInstructionDraftsError, type DraftRecipeIngredient } from './api';
import type { Recipe, RecipeIngredient, RecipeUnit } from './types';

const emptyIngredient = (): EditableRecipeIngredient => ({
  amount: '',
  name: '',
  unit: '',
});

const emptyInstruction = () => '';

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

      <Section
        actions={
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              setRecipe((current) => ({
                ...current,
                instructions: [...current.instructions, emptyInstruction()],
              }));
            }}
            type="button"
          >
            {t('form.addInstruction')}
          </button>
        }
        description={t('form.instructionsDescription')}
        title={t('form.instructions')}
      >
        <div className="grid gap-4">
          {recipe.instructions.length === 0 ? (
            <div className="rounded-box border border-dashed border-base-300 bg-base-200/60 p-4">
              <Paragraph tone="muted">{t('form.emptyInstructions')}</Paragraph>
            </div>
          ) : null}

          {recipe.instructions.map((instruction, index) => (
            <Card
              className="border border-base-200 bg-linear-to-br from-base-100 to-base-200/40 shadow-none"
              key={`instruction-${index}`}
              title={`${t('form.instructionCardTitle')} ${index + 1}`}
            >
              <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-base-300 bg-base-200 text-sm font-semibold">
                  {index + 1}
                </div>
                <div className="grid gap-3">
                  <textarea
                    className="textarea textarea-bordered min-h-24 w-full"
                    onChange={(event) => {
                      updateInstruction(index, event.target.value);
                    }}
                    placeholder={t('form.instructionPlaceholder')}
                    value={instruction}
                  />
                  <div className="flex justify-end">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setRecipe((current) => ({
                          ...current,
                          instructions: current.instructions.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        }));
                      }}
                      type="button"
                    >
                      {t('form.removeInstruction')}
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
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
              className={`border shadow-none ${
                ingredient.recipeId !== undefined
                  ? 'border-base-300 bg-base-200/50'
                  : 'border-base-200 bg-base-100'
              }`}
              key={`${ingredient.recipeId ?? ingredient.name}-${index}`}
              title={`${t('form.ingredientCardTitle')} ${index + 1}`}
            >
              <div className="grid gap-4">
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
                          amount: event.target.value,
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
                        const unit = event.currentTarget.value;

                        updateIngredient(index, {
                          ...ingredient,
                          unit: isEditableRecipeUnit(unit) ? unit : '',
                        });
                      }}
                      value={ingredient.unit}
                    >
                      <option value="">{t('form.selectUnit')}</option>
                      <option value="g">{t('units.g')}</option>
                      <option value="ml">{t('units.ml')}</option>
                      <option value="pcs">{t('units.pcs')}</option>
                    </select>
                  </label>
                </div>

                <label className="form-control">
                  <span className="label-text">{t('form.ingredientRecipeId')}</span>
                  <input
                    className="input input-bordered"
                    list={`recipe-references-${index}`}
                    onChange={(event) => {
                      updateIngredient(index, {
                        ...ingredient,
                        recipeId:
                          event.target.value.trim().length === 0 ? undefined : event.target.value,
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

interface EditableRecipe {
  defaultWeight: string;
  ingredients: EditableRecipeIngredient[];
  instructions: string[];
  name: string;
  recipeId: string;
}

interface EditableRecipeIngredient {
  amount: string;
  name: string;
  recipeId?: string;
  unit: RecipeUnit | '';
}

function toEditableRecipe(recipe: Recipe): EditableRecipe {
  return {
    defaultWeight: String(recipe.defaultWeight),
    ingredients: recipe.ingredients.map((ingredient) => ({
      amount: String(ingredient.amount),
      name: ingredient.name,
      recipeId: ingredient.recipeId,
      unit: ingredient.unit,
    })),
    instructions: recipe.instructions,
    name: recipe.name,
    recipeId: recipe.recipeId,
  };
}

function mergeDraftIngredients(
  recipe: EditableRecipe,
  draftIngredients: DraftRecipeIngredient[],
): EditableRecipe {
  const existingKeys = new Set(
    recipe.ingredients.map((ingredient) =>
      buildDraftMergeKey(ingredient.name, ingredient.recipeId),
    ),
  );
  const nextIngredients = [...recipe.ingredients];

  for (const draftIngredient of draftIngredients) {
    const key = buildDraftMergeKey(draftIngredient.name, draftIngredient.recipeId);

    if (existingKeys.has(key)) {
      continue;
    }

    existingKeys.add(key);
    nextIngredients.push({
      amount: '',
      name: draftIngredient.name,
      recipeId: draftIngredient.recipeId,
      unit: '',
    });
  }

  return {
    ...recipe,
    ingredients: nextIngredients,
  };
}

function buildDraftMergeKey(name: string, recipeId?: string): string {
  return `${recipeId ?? ''}::${name.trim().toLowerCase()}`;
}

function normalizeEditableRecipe(recipe: EditableRecipe): EditableRecipe {
  return {
    ...recipe,
    defaultWeight: recipe.defaultWeight.trim(),
    name: recipe.name.trim(),
    ingredients: recipe.ingredients.map((ingredient) => ({
      ...ingredient,
      amount: ingredient.amount.trim(),
      name: ingredient.name.trim(),
      recipeId: ingredient.recipeId?.trim() || undefined,
    })),
    instructions: recipe.instructions.map((instruction) => instruction.trim()),
  };
}

function validateAndBuildRecipe(
  recipe: EditableRecipe,
  t: (key: string) => string,
): { error: string | null; recipe?: Recipe } {
  if (recipe.name.length === 0) {
    return { error: t('errors.missingFields') };
  }

  const defaultWeight = Number(recipe.defaultWeight);

  if (!Number.isFinite(defaultWeight) || defaultWeight <= 0) {
    return { error: t('errors.invalidNumber') };
  }

  if (recipe.instructions.length === 0) {
    return { error: t('form.emptyInstructions') };
  }

  if (recipe.instructions.some((instruction) => instruction.length === 0)) {
    return { error: t('errors.missingFields') };
  }

  if (recipe.ingredients.length === 0) {
    return { error: t('form.emptyIngredients') };
  }

  const ingredients: RecipeIngredient[] = [];

  for (const ingredient of recipe.ingredients) {
    if (ingredient.name.length === 0) {
      return { error: t('errors.missingFields') };
    }

    const amount = Number(ingredient.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return { error: t('errors.invalidNumber') };
    }

    if (!isRecipeUnit(ingredient.unit)) {
      return { error: t('form.completeAddedIngredients') };
    }

    ingredients.push({
      amount,
      name: ingredient.name,
      recipeId: ingredient.recipeId,
      unit: ingredient.unit,
    });
  }

  return {
    error: null,
    recipe: {
      defaultWeight,
      ingredients,
      instructions: recipe.instructions,
      name: recipe.name,
      recipeId: recipe.recipeId,
    },
  };
}

function isEditableRecipeUnit(value: string): value is RecipeUnit | '' {
  return value === '' || value === 'g' || value === 'ml' || value === 'pcs';
}

function isRecipeUnit(value: RecipeUnit | ''): value is RecipeUnit {
  return value === 'g' || value === 'ml' || value === 'pcs';
}
