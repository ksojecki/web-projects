import {
  JSON_HEADERS,
  requestJson,
  requestNoContent,
} from '@ksojecki/platform-web-platform';
import type { Recipe, RecipeListEntry } from './types';

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
  return requestJson<Recipe>('/api/recipes', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(recipe),
  });
}

export async function updateRecipe(
  recipeId: string,
  recipe: Recipe,
): Promise<Recipe> {
  return requestJson<Recipe>(`/api/recipes/${encodeURIComponent(recipeId)}`, {
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
