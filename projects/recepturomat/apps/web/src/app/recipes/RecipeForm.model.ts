import type { DraftRecipeIngredient } from './api';
import type { Recipe, RecipeIngredient, RecipeUnit } from './types';

export interface EditableRecipe {
  defaultWeight: string;
  ingredients: EditableRecipeIngredient[];
  instructions: string[];
  name: string;
  recipeId: string;
}

export interface EditableRecipeIngredient {
  id: string;
  amount: string;
  name: string;
  recipeId?: string;
  unit: RecipeUnit | '';
}

export function createEmptyIngredient(id: string): EditableRecipeIngredient {
  return {
    id,
    amount: '',
    name: '',
    unit: '',
  };
}

export function createEmptyInstruction(): string {
  return '';
}

export function toEditableRecipe(recipe: Recipe): EditableRecipe {
  return {
    defaultWeight: String(recipe.defaultWeight),
    ingredients: recipe.ingredients.map((ingredient, index) =>
      createEditableIngredient(
        buildEditableIngredientId(index),
        String(ingredient.amount),
        ingredient.name,
        ingredient.unit,
        ingredient.recipeId,
      ),
    ),
    instructions: recipe.instructions,
    name: recipe.name,
    recipeId: recipe.recipeId,
  };
}

export function mergeDraftIngredients(
  recipe: EditableRecipe,
  draftIngredients: DraftRecipeIngredient[],
): EditableRecipe {
  const existingKeys = new Set(
    recipe.ingredients.map((ingredient) =>
      buildDraftMergeKey(ingredient.name, ingredient.recipeId),
    ),
  );
  const nextIngredients = [...recipe.ingredients];
  let nextIngredientId = createNextEditableIngredientId(nextIngredients);

  for (const draftIngredient of draftIngredients) {
    const key = buildDraftMergeKey(draftIngredient.name, draftIngredient.recipeId);

    if (existingKeys.has(key)) {
      continue;
    }

    existingKeys.add(key);
    nextIngredients.push(
      createEditableIngredient(
        nextIngredientId,
        '',
        draftIngredient.name,
        '',
        draftIngredient.recipeId,
      ),
    );
    nextIngredientId = createNextEditableIngredientId(nextIngredients);
  }

  return {
    ...recipe,
    ingredients: nextIngredients,
  };
}

export function normalizeEditableRecipe(recipe: EditableRecipe): EditableRecipe {
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

export function validateAndBuildRecipe(
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

export function isEditableRecipeUnit(value: string): value is RecipeUnit | '' {
  return value === '' || value === 'g' || value === 'ml' || value === 'pcs';
}

export function createNextEditableIngredientId(ingredients: EditableRecipeIngredient[]): string {
  return buildEditableIngredientId(getNextEditableIngredientNumericId(ingredients));
}

function buildDraftMergeKey(name: string, recipeId?: string): string {
  return `${recipeId ?? ''}::${name.trim().toLowerCase()}`;
}

function isRecipeUnit(value: RecipeUnit | ''): value is RecipeUnit {
  return value === 'g' || value === 'ml' || value === 'pcs';
}

function createEditableIngredient(
  id: string,
  amount: string,
  name: string,
  unit: RecipeUnit | '',
  recipeId?: string,
): EditableRecipeIngredient {
  return {
    id,
    amount,
    name,
    recipeId,
    unit,
  };
}

function buildEditableIngredientId(index: number): string {
  return `ingredient-${String(index)}`;
}

function getNextEditableIngredientNumericId(ingredients: EditableRecipeIngredient[]): number {
  return ingredients.reduce((maxId, ingredient) => {
    const numericId = Number(ingredient.id.replace('ingredient-', ''));

    if (!Number.isInteger(numericId)) {
      return maxId;
    }

    return Math.max(maxId, numericId + 1);
  }, 0);
}
