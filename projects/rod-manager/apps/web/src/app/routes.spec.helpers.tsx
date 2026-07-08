import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import i18n from './i18n/i18n';
import { AppRoutes } from './routes';

export const fetchSpy = vi.spyOn(globalThis, 'fetch');

export function renderAppRoutes(initialEntry: string) {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <I18nextProvider i18n={i18n}>
        <AppRoutes />
      </I18nextProvider>
    </MemoryRouter>,
  );
}

export function mockGuestSession() {
  fetchSpy.mockResolvedValueOnce(
    new Response(JSON.stringify({ message: 'Not authenticated.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

export function mockGuestSessionWithHomePage() {
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

    return new Response(JSON.stringify({ message: 'Unexpected URL in test.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

export function mockAuthenticatedAccountSession() {
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

export function mockAuthenticatedContentSession() {
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

export function mockGuestSessionWithPrettyUrlPage() {
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
            contentMd: '# About\n\nThis page is stored in the database as Markdown content.',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify({ message: 'Unexpected URL in test.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.pathname;
  }

  return new URL(input.url).pathname;
}
