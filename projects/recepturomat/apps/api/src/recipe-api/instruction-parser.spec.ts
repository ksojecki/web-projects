import { describe, expect, it } from 'vitest';
import type { Recipe } from '../recipe-store';
import { collectInstructionDraftIngredients } from './instruction-parser';

const recipeCatalog: Recipe[] = [
  {
    recipeId: 'basecreamvanilla',
    name: 'Krem waniliowy bazowy',
    defaultWeight: 500,
    ingredients: [{ name: 'Cukier', amount: 80, unit: 'g' }],
    instructions: [],
  },
  {
    recipeId: 'meringue',
    name: 'Ciasto bezowe',
    defaultWeight: 400,
    ingredients: [{ name: 'Bialka', amount: 200, unit: 'g' }],
    instructions: [],
  },
];

describe('collectInstructionDraftIngredients', () => {
  it('creates recipe drafts for explicit references and ingredient drafts for plain text', () => {
    const result = collectInstructionDraftIngredients(
      {
        name: 'Test recipe',
        defaultWeight: 700,
        ingredients: [{ name: 'Mleko', amount: 250, unit: 'ml' }],
        instructions: ['Dodaj cukier i @{Krem waniliowy bazowy}.'],
      },
      recipeCatalog,
    );

    expect(result.draftIngredients).toEqual([
      { name: 'cukier' },
      { name: 'Krem waniliowy bazowy', recipeId: 'basecreamvanilla' },
    ]);
  });

  it('matches Polish inflected recipe forms to existing recipes', () => {
    const result = collectInstructionDraftIngredients(
      {
        name: 'Test recipe',
        defaultWeight: 700,
        ingredients: [{ name: 'Cukier', amount: 200, unit: 'g' }],
        instructions: ['Uzyj ciasta bezowego jako warstwy.'],
      },
      recipeCatalog,
    );

    expect(result.draftIngredients).toEqual([{ name: 'Ciasto bezowe', recipeId: 'meringue' }]);
  });

  it('does not add duplicates when the ingredient already exists', () => {
    const result = collectInstructionDraftIngredients(
      {
        name: 'Test recipe',
        defaultWeight: 700,
        ingredients: [{ name: 'Cukier', amount: 200, unit: 'g' }],
        instructions: ['Dodaj @cukier.', 'Dodaj cukrem do masy.'],
      },
      recipeCatalog,
    );

    expect(result.draftIngredients).toEqual([]);
  });
});
