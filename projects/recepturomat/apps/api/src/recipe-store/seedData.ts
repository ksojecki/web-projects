import type { Recipe } from './types';
import { baseRecipeSeedData } from './seedData-base';
import { dessertRecipeSeedData } from './seedData-desserts';

export const legacyRecipeSeedData = [
  ...baseRecipeSeedData,
  ...dessertRecipeSeedData,
] satisfies Recipe[];
