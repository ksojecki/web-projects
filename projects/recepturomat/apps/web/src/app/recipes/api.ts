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

  return (await response.json()) as T;
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: unknown };

    if (typeof payload.message === 'string' && payload.message.length > 0) {
      return payload.message;
    }
  } catch {
    return 'Unexpected server error.';
  }

  return 'Unexpected server error.';
}
