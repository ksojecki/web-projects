import { useCallback, useEffect, useState } from 'react';
import { listRecipes } from './api';
import type { RecipeListEntry } from './types';

export interface UseRecipesListResult {
  error: Error | null;
  isLoading: boolean;
  recipes: RecipeListEntry[];
  refresh: () => Promise<void>;
}

export interface UseRecipesListOptions {
  enabled?: boolean;
  searchQuery?: string;
}

export function useRecipesList({
  enabled = true,
  searchQuery,
}: UseRecipesListOptions = {}): UseRecipesListResult {
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allRecipes, setAllRecipes] = useState<RecipeListEntry[]>([]);

  const refresh = useCallback(async (): Promise<void> => {
    if (!enabled) {
      setAllRecipes([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const nextRecipes = await listRecipes();
      setAllRecipes(sortRecipesByName(nextRecipes));
      setError(null);
    } catch (caughtError) {
      setError(toError(caughtError));
      setAllRecipes([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const recipes = filterRecipes(allRecipes, searchQuery);

  return {
    error,
    isLoading,
    recipes,
    refresh,
  };
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Unexpected server error.');
}

function filterRecipes(
  recipes: RecipeListEntry[],
  searchQuery: string | undefined,
): RecipeListEntry[] {
  const normalizedQuery = searchQuery?.trim().toLocaleLowerCase();

  if (normalizedQuery === undefined || normalizedQuery.length === 0) {
    return recipes;
  }

  return recipes.filter((recipe) =>
    recipe.name.toLocaleLowerCase().includes(normalizedQuery),
  );
}

function sortRecipesByName(recipes: RecipeListEntry[]): RecipeListEntry[] {
  return recipes.reduce<RecipeListEntry[]>((sortedRecipes, recipe) => {
    const insertIndex = sortedRecipes.findIndex(
      (candidate) => candidate.name.localeCompare(recipe.name) > 0,
    );

    if (insertIndex === -1) {
      return [...sortedRecipes, recipe];
    }

    return [
      ...sortedRecipes.slice(0, insertIndex),
      recipe,
      ...sortedRecipes.slice(insertIndex),
    ];
  }, []);
}
