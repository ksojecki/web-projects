import { render, screen } from '@testing-library/react';
import { AccountShell } from './AccountShell';

describe('AccountShell', () => {
  it('renders inside the shared page width container', () => {
    const { container } = render(
      <AccountShell
        roleLabel="Role"
        sections={[
          {
            content: <div>Starter section</div>,
            id: 'starter',
          },
        ]}
        title="Account"
        user={{
          displayName: 'Administrator',
          email: 'kamil@sojecki.pl',
          id: 'user-1',
          name: 'Administrator',
          role: 'admin',
          surname: '',
          preferredLanguage: 'en',
        }}
        welcomeMessage="Welcome back"
      />,
    );

    expect(screen.getByRole('heading', { name: 'Account' })).toBeTruthy();
    expect(screen.getByText('Starter section')).toBeTruthy();

    const mainElement = container.querySelector('main');

    expect(mainElement?.className).toContain('max-w-5xl');
    expect(mainElement?.className).toContain('mx-auto');
  });
});
