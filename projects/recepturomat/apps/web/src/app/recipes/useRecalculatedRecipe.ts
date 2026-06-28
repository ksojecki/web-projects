import { useCallback, useEffect, useState } from 'react';
import type { Recipe } from './types';

export interface AlteredRecipe extends Recipe {
  weight: number;
}

export function useRecalculatedRecipe(recipe: Recipe | null): {
  reset: () => void;
  setNewWeight: (weight: number) => void;
  value: AlteredRecipe | null;
} {
  const [value, setValue] = useState<AlteredRecipe | null>(null);

  useEffect(() => {
    if (recipe === null) {
      setValue(null);
      return;
    }

    setValue({
      ...recipe,
      weight: recipe.defaultWeight,
    });
  }, [recipe]);

  const reset = useCallback(() => {
    if (recipe === null) {
      setValue(null);
      return;
    }

    setValue({
      ...recipe,
      weight: recipe.defaultWeight,
    });
  }, [recipe]);

  const setNewWeight = useCallback(
    (weight: number) => {
      if (recipe === null) {
        setValue(null);
        return;
      }

      const ratio = weight / recipe.defaultWeight;

      setValue({
        ...recipe,
        ingredients: recipe.ingredients.map((ingredient) => ({
          ...ingredient,
          amount: ingredient.amount * ratio,
        })),
        weight,
      });
    },
    [recipe],
  );

  return {
    reset,
    setNewWeight,
    value,
  };
}
