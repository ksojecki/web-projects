import { render, screen } from '@testing-library/react';
import { Button } from './Button';
import { Card } from './Card';
import { PageHeader } from './PageHeader';
import { Paragraph } from './Paragraph';
import { Section } from './Section';

describe('@ksojecki/platform-ui', () => {
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

    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('renders structural content primitives', () => {
    render(
      <>
        <PageHeader
          description="Header description"
          eyebrow="Recipe"
          meta={<span>Yield 400 g</span>}
          title="Vanilla cupcakes"
        />
        <Section description="Section description" title="Ingredients">
          <Paragraph tone="muted">Flour, sugar, butter</Paragraph>
        </Section>
      </>,
    );

    expect(screen.getByText('Vanilla cupcakes')).toBeTruthy();
    expect(screen.getByText('Header description')).toBeTruthy();
    expect(screen.getByText('Ingredients')).toBeTruthy();
    expect(screen.getByText('Flour, sugar, butter')).toBeTruthy();
  });
});
