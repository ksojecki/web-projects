import type { Recipe } from './types';

export const dessertTartSeedData = [
  {
    name: 'Tarta cytrynowa',
    recipeId: 'dessertlemontart',
    defaultWeight: 900,
    ingredients: [
      {
        name: 'Kruche ciasto (bazowe)',
        amount: 400,
        unit: 'g',
        recipeId: 'baseshortcrust',
      },
      { name: 'Masło', amount: 120, unit: 'g' },
      { name: 'Cukier', amount: 150, unit: 'g' },
      { name: 'Sok z cytryn', amount: 150, unit: 'ml' },
      { name: 'Jajka', amount: 120, unit: 'g' },
    ],
    instructions: [],
  },
  {
    name: 'Tarta czekoladowa',
    recipeId: 'desserttartchoco',
    defaultWeight: 850,
    ingredients: [
      {
        name: 'Kruche ciasto',
        amount: 350,
        unit: 'g',
        recipeId: 'baseshortcrust',
      },
      {
        name: 'Ganache czekoladowy',
        amount: 300,
        unit: 'g',
        recipeId: 'baseganache',
      },
      { name: 'Czekolada 70%', amount: 50, unit: 'g' },
    ],
    instructions: [],
  },
  {
    name: 'Tarta owocowa',
    recipeId: 'dessertfruittart',
    defaultWeight: 900,
    ingredients: [
      {
        name: 'Kruche ciasto',
        amount: 350,
        unit: 'g',
        recipeId: 'baseshortcrust',
      },
      {
        name: 'Krem waniliowy',
        amount: 300,
        unit: 'g',
        recipeId: 'basecreamvanilla',
      },
      { name: 'Owoce świeże', amount: 250, unit: 'g' },
    ],
    instructions: [],
  },
  {
    name: 'Tarta słona karmelowa',
    recipeId: 'dessertsaltedcarameltart',
    defaultWeight: 900,
    ingredients: [
      {
        name: 'Kruche ciasto',
        amount: 350,
        unit: 'g',
        recipeId: 'baseshortcrust',
      },
      { name: 'Cukier', amount: 150, unit: 'g' },
      { name: 'Śmietanka 30%', amount: 150, unit: 'ml' },
      { name: 'Masło', amount: 60, unit: 'g' },
      { name: 'Sól', amount: 2, unit: 'g' },
    ],
    instructions: [],
  },
  {
    name: 'Tarta pistacjowa',
    recipeId: 'dessertpistachiotart',
    defaultWeight: 950,
    ingredients: [
      {
        name: 'Kruche ciasto',
        amount: 350,
        unit: 'g',
        recipeId: 'baseshortcrust',
      },
      { name: 'Pasta pistacjowa', amount: 100, unit: 'g' },
      { name: 'Śmietanka 30%', amount: 200, unit: 'ml' },
      { name: 'Cukier', amount: 80, unit: 'g' },
      { name: 'Masło', amount: 40, unit: 'g' },
    ],
    instructions: [],
  },
  {
    name: 'Tarta mango',
    recipeId: 'dessertmangotart',
    defaultWeight: 900,
    ingredients: [
      {
        name: 'Kruche ciasto',
        amount: 350,
        unit: 'g',
        recipeId: 'baseshortcrust',
      },
      { name: 'Puree mango', amount: 200, unit: 'g' },
      { name: 'Śmietanka 30%', amount: 150, unit: 'ml' },
      { name: 'Cukier', amount: 80, unit: 'g' },
      { name: 'Żelatyna', amount: 6, unit: 'g' },
    ],
    instructions: [],
  },
] satisfies Recipe[];
