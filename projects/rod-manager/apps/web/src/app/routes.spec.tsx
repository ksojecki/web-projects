import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import i18n from './i18n/i18n';
import { frontendProductConfig } from './frontendProductConfig';
import {
  fetchSpy,
  mockAuthenticatedAccountSession,
  mockAuthenticatedContentSession,
  mockGuestSession,
  mockGuestSessionWithHomePage,
  mockGuestSessionWithPrettyUrlPage,
  renderAppRoutes,
} from './routes.spec.helpers';

beforeEach(async () => {
  fetchSpy.mockReset();
  await i18n.changeLanguage('en');
});

afterEach(() => {
  fetchSpy.mockReset();
  frontendProductConfig.registration.enabled = true;
});

describe('AppRoutes', () => {
  it('renders the home route', async () => {
    mockGuestSessionWithHomePage();
    renderAppRoutes('/');
    await screen.findByRole('button', { name: 'Log in' });
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
  });

  it('renders a pretty URL content page', async () => {
    mockGuestSessionWithPrettyUrlPage();
    renderAppRoutes('/about');

    expect(await screen.findByRole('heading', { name: 'about' })).toBeInTheDocument();
    expect(
      screen.getByText('This page is stored in the database as Markdown content.'),
    ).toBeInTheDocument();
  });

  it('opens login modal after redirecting unauthenticated account route', async () => {
    mockGuestSession();
    renderAppRoutes('/account');

    const modal = await screen.findByRole('dialog');
    expect(modal).toHaveAttribute('open');
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
  });

  it('renders register page with password and OAuth sections', async () => {
    mockGuestSession();
    renderAppRoutes('/register');

    expect(await screen.findByRole('heading', { name: 'Create account' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Create account with password' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Create account with OAuth' })).toBeInTheDocument();
  });

  it('hides registration entry points when registration is disabled', async () => {
    const user = userEvent.setup();
    frontendProductConfig.registration.enabled = false;
    mockGuestSessionWithHomePage();
    renderAppRoutes('/');

    await user.click(await screen.findByRole('button', { name: 'Log in' }));
    expect(
      screen.queryByRole('link', { name: 'No account yet? Register' }),
    ).not.toBeInTheDocument();
  });

  it('redirects register route to home when registration is disabled', async () => {
    frontendProductConfig.registration.enabled = false;
    mockGuestSessionWithHomePage();
    renderAppRoutes('/register');

    await screen.findByRole('button', { name: 'Log in' });
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Create account' })).not.toBeInTheDocument();
  });

  it('switches the interface to Polish', async () => {
    const user = userEvent.setup();
    mockAuthenticatedAccountSession();
    renderAppRoutes('/account');

    await user.selectOptions(await screen.findByRole('combobox'), 'pl');

    expect(await screen.findByRole('heading', { name: 'Konto' })).toBeInTheDocument();
    expect(screen.getByText('Język')).toBeInTheDocument();
  });

  it('renders account sections in project-defined order', async () => {
    mockAuthenticatedAccountSession();
    renderAppRoutes('/account');

    const languageHeading = await screen.findByRole('heading', {
      name: 'Language',
    });
    const authenticationHeading = await screen.findByRole('heading', {
      name: 'Authentication methods',
    });

    expect(
      languageHeading.compareDocumentPosition(authenticationHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
  });

  it('renders content management page for authenticated users', async () => {
    mockAuthenticatedContentSession();
    renderAppRoutes('/pages');

    expect(await screen.findByRole('link', { name: 'Content Management' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'about' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'rules' })).toBeInTheDocument();
  });
});
