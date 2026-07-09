export interface DraftRecipeIngredient {
  name: string;
  recipeId?: string;
}

export interface InstructionParseResult {
  draftIngredients: DraftRecipeIngredient[];
}
