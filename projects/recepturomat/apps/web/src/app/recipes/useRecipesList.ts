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
  const [recipes, setRecipes] = useState<RecipeListEntry[]>([]);

  const refresh = useCallback(async (): Promise<void> => {
    if (!enabled) {
      setRecipes([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const nextRecipes = await listRecipes();
      const normalizedQuery = searchQuery?.trim().toLocaleLowerCase();
      const filteredRecipes = sortRecipesByName(nextRecipes).filter((recipe) =>
        normalizedQuery === undefined || normalizedQuery.length === 0
          ? true
          : recipe.name.toLocaleLowerCase().includes(normalizedQuery),
      );

      setRecipes(filteredRecipes);
      setError(null);
    } catch (caughtError) {
      setError(toError(caughtError));
      setRecipes([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, searchQuery]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
