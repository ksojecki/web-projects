import { useCallback, useEffect, useState } from 'react';
import { deleteRecipe, getRecipe } from './api';
import type { Recipe } from './types';

export interface UseRecipeResult {
  deleteCurrentRecipe: () => Promise<void>;
  error: Error | null;
  isLoading: boolean;
  recipe: Recipe | null;
  refresh: () => Promise<void>;
}

export interface UseRecipeOptions {
  enabled?: boolean;
  recipeId?: string;
}

export function useRecipe({
  enabled = true,
  recipeId,
}: UseRecipeOptions): UseRecipeResult {
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!enabled) {
      setRecipe(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (recipeId === undefined) {
      setRecipe(null);
      setError(new Error('Missing recipe identifier.'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const nextRecipe = await getRecipe(recipeId);
      setRecipe(nextRecipe);
      setError(null);
    } catch (caughtError) {
      setRecipe(null);
      setError(toError(caughtError));
    } finally {
      setIsLoading(false);
    }
  }, [enabled, recipeId]);

  const deleteCurrentRecipe = useCallback(async (): Promise<void> => {
    if (recipeId === undefined) {
      throw new Error('Missing recipe identifier.');
    }

    await deleteRecipe(recipeId);
    setRecipe(null);
  }, [recipeId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    deleteCurrentRecipe,
    error,
    isLoading,
    recipe,
    refresh,
  };
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Unexpected server error.');
}
