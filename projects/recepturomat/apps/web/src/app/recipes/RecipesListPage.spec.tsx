import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as PlatformWebPlatform from '@ksojecki/platform-web-platform';
import '../i18n/i18n';
import { RecipesListPage } from './RecipesListPage';

const { mockUseAuth, mockListRecipes } = vi.hoisted(() => ({
  mockUseAuth: vi.fn<() => { status: string }>(),
  mockListRecipes:
    vi.fn<() => Promise<Array<{ name: string; recipeId: string }>>>(),
}));

vi.mock('@ksojecki/platform-web-platform', async (importOriginal) => {
  const actual = await importOriginal<typeof PlatformWebPlatform>();

  return {
    ...actual,
    useAuth: mockUseAuth,
  };
});

vi.mock('./api', () => ({
  listRecipes: mockListRecipes,
}));

describe('RecipesListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
    });
  });

  it('filters the loaded recipe list without re-entering the page loading state', async () => {
    mockListRecipes
      .mockResolvedValueOnce([
        {
          name: 'Vanilla cupcakes',
          recipeId: 'dessertvanillacupcakes',
        },
        {
          name: 'Chocolate frosting',
          recipeId: 'frostingchocolate',
        },
      ])
      .mockImplementationOnce(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <RecipesListPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Recipes' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Vanilla cupcakes')).toBeInTheDocument();
    expect(screen.getByText('Chocolate frosting')).toBeInTheDocument();
    expect(
      screen.queryByText('dessertvanillacupcakes'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('frostingchocolate')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'vanilla' },
    });

    expect(mockListRecipes).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole('heading', { name: 'Loading...' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Vanilla cupcakes')).toBeInTheDocument();
    expect(screen.queryByText('Chocolate frosting')).not.toBeInTheDocument();
  });
});
