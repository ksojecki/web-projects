import { render, screen } from '@testing-library/react';
import { Button } from './Button';
import { Card } from './Card';

describe('@sojecki/platform-ui', () => {
  it('renders a shared card title and content', () => {
    render(<Card title="Shared card">Reusable content</Card>);

    expect(screen.getByText('Shared card')).toBeTruthy();
    expect(screen.getByText('Reusable content')).toBeTruthy();
  });

  it('renders a shared button in loading state', () => {
    render(
      <Button isLoading tone="secondary">
        Save changes
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Save changes' });

    expect((button as HTMLButtonElement).disabled).toBe(true);
  });
});
