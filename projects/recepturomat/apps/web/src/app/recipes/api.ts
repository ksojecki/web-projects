import type { Recipe, RecipeListEntry } from './types';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

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
  const response = await fetch(`/api/recipes/${encodeURIComponent(recipeId)}`, {
    credentials: 'include',
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(await parseErrorMessage(response));
  }
}

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return await response.json();
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json();

    if (hasMessage(payload)) {
      return payload.message;
    }
  } catch {
    return 'Unexpected server error.';
  }

  return 'Unexpected server error.';
}

function hasMessage(value: unknown): value is { message: string } {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.message === 'string' && value.message.length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
