import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from './i18n/i18n';
import { AppRoutes } from './routes';

const fetchSpy = vi.spyOn(globalThis, 'fetch');

function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.pathname;
  }

  return new URL(input.url).pathname;
}

function mockGuestSession() {
  fetchSpy.mockResolvedValueOnce(
    new Response(JSON.stringify({ message: 'Not authenticated.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

function mockGuestSessionWithHomePage() {
  fetchSpy.mockImplementation(async (input) => {
    const url = getRequestUrl(input);

    if (url === '/api/auth/session') {
      return new Response(JSON.stringify({ message: 'Not authenticated.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url === '/api/pages/home') {
      return new Response(
        JSON.stringify({
          page: {
            slug: 'home',
            contentMd:
              '# Home\n\nWelcome to Rod Manager. This home page is stored in the database.',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(
      JSON.stringify({ message: 'Unexpected URL in test.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  });
}

function mockAuthenticatedAccountSession() {
  fetchSpy
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          authenticated: true,
          user: {
            id: 'user-1',
            email: 'user@example.com',
            name: 'Test',
            surname: 'User',
            displayName: 'Test User',
            role: 'user',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          methods: [
            { type: 'password', connected: false, canDisconnect: false },
            {
              type: 'oauth',
              provider: 'google',
              connected: true,
              canDisconnect: false,
            },
            {
              type: 'oauth',
              provider: 'apple',
              connected: false,
              canDisconnect: false,
            },
            {
              type: 'oauth',
              provider: 'facebook',
              connected: false,
              canDisconnect: false,
            },
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );
}

function mockAuthenticatedContentSession() {
  fetchSpy
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          authenticated: true,
          user: {
            id: 'user-1',
            email: 'user@example.com',
            name: 'Test',
            surname: 'User',
            displayName: 'Test User',
            role: 'user',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          pages: [{ slug: 'about' }, { slug: 'home' }, { slug: 'rules' }],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );
}

function mockGuestSessionWithPrettyUrlPage() {
  fetchSpy.mockImplementation(async (input) => {
    const url = getRequestUrl(input);

    if (url === '/api/auth/session') {
      return new Response(JSON.stringify({ message: 'Not authenticated.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url === '/api/pages/about') {
      return new Response(
        JSON.stringify({
          page: {
            slug: 'about',
            contentMd:
              '# About\n\nThis page is stored in the database as Markdown content.',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(
      JSON.stringify({ message: 'Unexpected URL in test.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  });
}

beforeEach(async () => {
  fetchSpy.mockReset();
  await i18n.changeLanguage('en');
});

afterEach(() => {
  fetchSpy.mockReset();
});

describe('AppRoutes', () => {
  it('renders the home route', async () => {
    mockGuestSessionWithHomePage();

    render(
      <MemoryRouter initialEntries={['/']}>
        <I18nextProvider i18n={i18n}>
          <AppRoutes />
        </I18nextProvider>
      </MemoryRouter>,
    );

    await screen.findByRole('button', { name: 'Log in' });
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
  });

  it('renders a pretty URL content page', async () => {
    mockGuestSessionWithPrettyUrlPage();

    render(
      <MemoryRouter initialEntries={['/about']}>
        <I18nextProvider i18n={i18n}>
          <AppRoutes />
        </I18nextProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'about' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'This page is stored in the database as Markdown content.',
      ),
    ).toBeInTheDocument();
  });

  it('opens login modal after redirecting unauthenticated account route', async () => {
    mockGuestSession();

    render(
      <MemoryRouter initialEntries={['/account']}>
        <I18nextProvider i18n={i18n}>
          <AppRoutes />
        </I18nextProvider>
      </MemoryRouter>,
    );

    const modal = await screen.findByRole('dialog');
    expect(modal).toHaveAttribute('open');
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
  });

  it('renders register page with password and OAuth sections', async () => {
    mockGuestSession();

    render(
      <MemoryRouter initialEntries={['/register']}>
        <I18nextProvider i18n={i18n}>
          <AppRoutes />
        </I18nextProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Create account' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Create account with password' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Create account with OAuth' }),
    ).toBeInTheDocument();
  });

  it('switches the interface to Polish', async () => {
    const user = userEvent.setup();
    mockAuthenticatedAccountSession();

    render(
      <MemoryRouter initialEntries={['/account']}>
        <I18nextProvider i18n={i18n}>
          <AppRoutes />
        </I18nextProvider>
      </MemoryRouter>,
    );

    await user.selectOptions(await screen.findByRole('combobox'), 'pl');

    expect(
      await screen.findByRole('heading', { name: 'Konto' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Język')).toBeInTheDocument();
  });

  it('renders content management page for authenticated users', async () => {
    mockAuthenticatedContentSession();

    render(
      <MemoryRouter initialEntries={['/pages']}>
        <I18nextProvider i18n={i18n}>
          <AppRoutes />
        </I18nextProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('link', { name: 'Content Management' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: 'about' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'rules' })).toBeInTheDocument();
  });
});
