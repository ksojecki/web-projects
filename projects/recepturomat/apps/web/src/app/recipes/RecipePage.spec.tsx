import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { vi } from 'vitest';
import '../i18n/i18n';
import { RecipePage } from './RecipePage';

const { useAuthMock, useRecipeMock, useRecalculatedRecipeMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn<() => { status: string }>(),
  useRecipeMock: vi.fn<() => unknown>(),
  useRecalculatedRecipeMock: vi.fn<() => unknown>(),
}));

vi.mock('@ksojecki/platform-web-platform', async () => {
  const actual = await vi.importActual('@ksojecki/platform-web-platform');

  return {
    ...actual,
    useAuth: useAuthMock,
  };
});

vi.mock('./useRecipe', () => ({
  useRecipe: useRecipeMock,
}));

vi.mock('./useRecalculatedRecipe', () => ({
  useRecalculatedRecipe: useRecalculatedRecipeMock,
}));

describe('RecipePage', () => {
  it('renders the recipe header, scaling controls, and ingredient references', () => {
    useAuthMock.mockReturnValue({
      status: 'authenticated',
    });
    useRecipeMock.mockReturnValue({
      deleteCurrentRecipe: vi.fn<() => Promise<void>>(),
      error: null,
      isLoading: false,
      recipe: {
        defaultWeight: 400,
        ingredients: [
          {
            amount: 160,
            name: 'Flour',
            unit: 'g',
          },
        ],
        instructions: ['Mix the batter.', 'Bake the cake.'],
        name: 'Vanilla cupcakes',
        recipeId: 'dessertvanillacupcakes',
      },
    });
    useRecalculatedRecipeMock.mockReturnValue({
      reset: vi.fn<() => void>(),
      setNewWeight: vi.fn<(weight: number) => void>(),
      value: {
        ingredients: [
          {
            amount: 160,
            name: 'Flour',
            unit: 'g',
          },
          {
            amount: 80,
            name: 'Vanilla cream',
            recipeId: 'basecreamvanilla',
            unit: 'g',
          },
        ],
        instructions: ['Mix the batter.', 'Bake the cake.'],
        name: 'Vanilla cupcakes',
        weight: 400,
      },
    });

    render(
      <MemoryRouter initialEntries={['/recipe/dessertvanillacupcakes']}>
        <Routes>
          <Route path="/recipe/:recipeId" element={<RecipePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Vanilla cupcakes' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Scale recipe' })).toBeTruthy();
    expect(screen.getByText('Current yield')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Instructions' })).toBeTruthy();
    expect(screen.getByText('Mix the batter.')).toBeTruthy();
    expect(
      screen.getByRole('link', {
        name: 'Recipe reference: basecreamvanilla',
      }),
    ).toHaveAttribute('href', '/recipe/basecreamvanilla');
  });
});
