export const recipeUnits = ['g', 'ml', 'pcs'] as const;

export type RecipeUnit = (typeof recipeUnits)[number];

export interface RecipeIngredient {
  amount: number;
  name: string;
  recipeId?: string;
  unit: RecipeUnit;
}

export interface Recipe {
  defaultWeight: number;
  ingredients: RecipeIngredient[];
  name: string;
  recipeId: string;
}

export interface RecipeListEntry {
  name: string;
  recipeId: string;
}
