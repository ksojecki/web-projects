import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import '../i18n/i18n';
import { RecipeAccessPrompt } from './RecipeAccessPrompt';

describe('RecipeAccessPrompt', () => {
  it('renders a login call to action for protected recipe pages', () => {
    render(
      <MemoryRouter>
        <RecipeAccessPrompt />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Authentication required' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Log in to continue' })).toHaveAttribute(
      'href',
      '/?login=1',
    );
  });
});
