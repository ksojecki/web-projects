export interface DraftRecipeIngredientResponseBody {
  name: string;
  recipeId?: string;
}

export interface RecipeInstructionDraftsResponseBody {
  draftIngredients: DraftRecipeIngredientResponseBody[];
  message: string;
}
