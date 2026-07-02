import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '../i18n/i18n';
import { RecipeForm } from './RecipeForm';
import type { Recipe } from './types';

describe('RecipeForm', () => {
  it('does not expose a recipe id input for new or edited recipes', () => {
    const initialRecipe: Recipe = {
      defaultWeight: 1000,
      ingredients: [],
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
});
