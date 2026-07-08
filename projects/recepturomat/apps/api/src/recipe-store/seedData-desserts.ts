import type { Recipe } from './types';
import { dessertMiscSeedData } from './seedData-desserts-misc';
import { dessertTartSeedData } from './seedData-desserts-tarts';

export const dessertRecipeSeedData = [
  ...dessertTartSeedData,
  ...dessertMiscSeedData,
] satisfies Recipe[];
