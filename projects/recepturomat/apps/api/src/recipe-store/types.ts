export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: 'g' | 'ml' | 'pcs';
  recipeId?: string;
}

export interface Recipe {
  recipeId: string;
  name: string;
  defaultWeight: number;
  ingredients: RecipeIngredient[];
}

export interface RecipeDatabaseBootstrapOptions {
  seedLegacyRecipes: boolean;
}

export interface RecipeDatabaseConfig {
  path: string;
  seedLegacyRecipes: boolean;
}

export interface RecipeStore {
  listRecipes(this: void): Recipe[];
  getByRecipeId(this: void, recipeId: string): Recipe | undefined;
  upsert(this: void, recipe: Recipe): Recipe;
  delete(this: void, recipeId: string): boolean;
}

export interface RecipeRow {
  recipe_id: string;
  name: string;
  default_weight: number;
  ingredients_json: string;
}
