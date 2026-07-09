import type { DraftRecipeIngredient } from '../types';

export function sortDraftIngredients(items: DraftRecipeIngredient[]): DraftRecipeIngredient[] {
  return items.reduce<DraftRecipeIngredient[]>((sortedItems, item) => {
    const insertIndex = sortedItems.findIndex(
      (candidate) => compareDraftIngredients(item, candidate) < 0,
    );

    if (insertIndex === -1) {
      return [...sortedItems, item];
    }

    return [...sortedItems.slice(0, insertIndex), item, ...sortedItems.slice(insertIndex)];
  }, []);
}

function compareDraftIngredients(
  left: DraftRecipeIngredient,
  right: DraftRecipeIngredient,
): number {
  if (left.recipeId === undefined && right.recipeId !== undefined) {
    return -1;
  }

  if (left.recipeId !== undefined && right.recipeId === undefined) {
    return 1;
  }

  return left.name.localeCompare(right.name, 'pl');
}
