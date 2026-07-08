import type { ApiErrorResponse } from '@ksojecki/platform-shared';
import { JSON_HEADERS, requestJson, requestNoContent } from '@ksojecki/platform-web-platform';
import type { Recipe, RecipeListEntry } from './types';

export interface DraftRecipeIngredient {
  name: string;
  recipeId?: string;
}

interface RecipeInstructionDraftsResponseBody {
  draftIngredients: DraftRecipeIngredient[];
  message: string;
}

export class RecipeInstructionDraftsError extends Error {
  draftIngredients: DraftRecipeIngredient[];

  constructor(message: string, draftIngredients: DraftRecipeIngredient[]) {
    super(message);
    this.name = 'RecipeInstructionDraftsError';
    this.draftIngredients = draftIngredients;
  }
}

export async function listRecipes(): Promise<RecipeListEntry[]> {
  return requestJson<RecipeListEntry[]>('/api/recipes', {
    method: 'GET',
  });
}

export async function getRecipe(recipeId: string): Promise<Recipe> {
  return requestJson<Recipe>(`/api/recipes/${encodeURIComponent(recipeId)}`, {
    method: 'GET',
  });
}

export async function createRecipe(recipe: Recipe): Promise<Recipe> {
  return requestRecipeMutation('/api/recipes', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(recipe),
  });
}

export async function updateRecipe(recipeId: string, recipe: Recipe): Promise<Recipe> {
  return requestRecipeMutation(`/api/recipes/${encodeURIComponent(recipeId)}`, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify(recipe),
  });
}

export async function deleteRecipe(recipeId: string): Promise<void> {
  await requestNoContent(`/api/recipes/${encodeURIComponent(recipeId)}`, {
    method: 'DELETE',
  });
}

async function requestRecipeMutation(url: string, init: RequestInit): Promise<Recipe> {
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
  });

  if (response.status === 422) {
    const errorResponse = await parseJson(response.clone());

    if (isRecipeInstructionDraftsResponseBody(errorResponse)) {
      throw new RecipeInstructionDraftsError(errorResponse.message, errorResponse.draftIngredients);
    }
  }

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return await response.json();
}

async function parseErrorMessage(response: Response): Promise<string> {
  const error = await parseJson(response);

  if (hasErrorMessage(error)) {
    return error.message;
  }

  return 'Unexpected server error.';
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function hasErrorMessage(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string' &&
    value.message.length > 0
  );
}

function isRecipeInstructionDraftsResponseBody(
  value: unknown,
): value is RecipeInstructionDraftsResponseBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string' &&
    'draftIngredients' in value &&
    Array.isArray(value.draftIngredients) &&
    value.draftIngredients.every(
      (ingredient) =>
        typeof ingredient === 'object' &&
        ingredient !== null &&
        'name' in ingredient &&
        typeof ingredient.name === 'string' &&
        (!('recipeId' in ingredient) || typeof ingredient.recipeId === 'string'),
    )
  );
}
