import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '../../i18n/i18n';
import { RecipeInstructionDraftsError } from '../api';
import type { Recipe } from '../types';
import { RecipeForm } from './RecipeForm';

describe('RecipeForm', () => {
  it('does not expose a recipe id input for new or edited recipes', () => {
    const initialRecipe: Recipe = {
      defaultWeight: 1000,
      ingredients: [],
      instructions: ['Mix the batter.'],
      name: 'Vanilla cupcakes',
      recipeId: 'vanilla-cupcakes',
    };

    render(
      <RecipeForm
        initialRecipe={initialRecipe}
        onSubmit={vi.fn<() => Promise<void>>().mockResolvedValue(undefined)}
        recipes={[]}
        title="Edit recipe"
      />,
    );

    expect(screen.getByLabelText('Recipe name')).toBeInTheDocument();
    expect(screen.getByLabelText('Default weight')).toBeInTheDocument();
    expect(screen.queryByText('Recipe id')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Recipe id')).not.toBeInTheDocument();
  });

  it('adds draft ingredients returned from instruction parsing', async () => {
    const initialRecipe: Recipe = {
      defaultWeight: 1000,
      ingredients: [{ name: 'Milk', amount: 200, unit: 'ml' }],
      instructions: ['Add sugar.'],
      name: 'Vanilla cupcakes',
      recipeId: 'vanilla-cupcakes',
    };

    render(
      <RecipeForm
        initialRecipe={initialRecipe}
        onSubmit={vi
          .fn<() => Promise<void>>()
          .mockRejectedValue(
            new RecipeInstructionDraftsError(
              'Complete the added ingredients before saving again.',
              [{ name: 'sugar' }],
            ),
          )}
        recipes={[]}
        title="Edit recipe"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByDisplayValue('sugar')).toBeInTheDocument();
    expect(
      screen.getByText('Complete the added ingredients before saving again.'),
    ).toBeInTheDocument();
  });

  it('keeps ingredient input focus while typing', () => {
    const initialRecipe: Recipe = {
      defaultWeight: 1000,
      ingredients: [{ name: 'Milk', amount: 200, unit: 'ml' }],
      instructions: ['Add sugar.'],
      name: 'Vanilla cupcakes',
      recipeId: 'vanilla-cupcakes',
    };

    render(
      <RecipeForm
        initialRecipe={initialRecipe}
        onSubmit={vi.fn<() => Promise<void>>().mockResolvedValue(undefined)}
        recipes={[]}
        title="Edit recipe"
      />,
    );

    const ingredientInput = screen.getByDisplayValue('Milk');
    ingredientInput.focus();

    fireEvent.change(ingredientInput, { target: { value: 'Milk s' } });

    const updatedIngredientInput = screen.getByDisplayValue('Milk s');
    expect(document.activeElement).toBe(updatedIngredientInput);

    fireEvent.change(updatedIngredientInput, { target: { value: 'Milk su' } });

    expect(document.activeElement).toBe(screen.getByDisplayValue('Milk su'));
  });
});
