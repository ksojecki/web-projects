import type { Recipe } from './types';

export const baseRecipeSeedData = [
  {
    name: 'Krem waniliowy bazowy',
    recipeId: 'basecreamvanilla',
    defaultWeight: 500,
    ingredients: [
      { name: 'Mleko', amount: 400, unit: 'ml' },
      { name: 'Żółtka', amount: 80, unit: 'g' },
      { name: 'Cukier', amount: 80, unit: 'g' },
      { name: 'Mąka ziemniaczana', amount: 20, unit: 'g' },
      { name: 'Laska wanilii', amount: 1, unit: 'pcs' },
    ],
    instructions: [],
  },
  {
    name: 'Krem czekoladowy bazowy',
    recipeId: 'basecreamchocolate',
    defaultWeight: 600,
    ingredients: [
      { name: 'Śmietanka 30%', amount: 300, unit: 'ml' },
      { name: 'Mleko', amount: 200, unit: 'ml' },
      { name: 'Czekolada 70%', amount: 150, unit: 'g' },
      { name: 'Cukier', amount: 60, unit: 'g' },
    ],
    instructions: [],
  },
  {
    name: 'Biszkopt bazowy',
    recipeId: 'basesponge',
    defaultWeight: 800,
    ingredients: [
      { name: 'Jajka', amount: 200, unit: 'g' },
      { name: 'Cukier', amount: 180, unit: 'g' },
      { name: 'Mąka pszenna', amount: 180, unit: 'g' },
      { name: 'Mąka ziemniaczana', amount: 40, unit: 'g' },
    ],
    instructions: [],
  },
  {
    name: 'Ganache czekoladowy',
    recipeId: 'baseganache',
    defaultWeight: 400,
    ingredients: [
      { name: 'Czekolada 60–70%', amount: 200, unit: 'g' },
      { name: 'Śmietanka 30%', amount: 200, unit: 'ml' },
    ],
    instructions: [],
  },
  {
    name: 'Kruche ciasto bazowe',
    recipeId: 'baseshortcrust',
    defaultWeight: 600,
    ingredients: [
      { name: 'Mąka pszenna', amount: 300, unit: 'g' },
      { name: 'Masło', amount: 200, unit: 'g' },
      { name: 'Cukier puder', amount: 80, unit: 'g' },
      { name: 'Jajko', amount: 1, unit: 'pcs' },
    ],
    instructions: [],
  },
] satisfies Recipe[];
