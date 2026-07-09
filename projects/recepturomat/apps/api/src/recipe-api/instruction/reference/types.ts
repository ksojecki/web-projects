export interface KnownReference {
  kind: 'ingredient' | 'recipe';
  key: string;
  name: string;
  recipeId?: string;
  tokenCount: number;
}
