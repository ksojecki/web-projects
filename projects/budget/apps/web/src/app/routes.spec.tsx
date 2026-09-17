import { screen, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import userEvent from '@testing-library/user-event';
import i18n from './i18n/i18n';
import { AppRoutes } from './routes';

const fetchSpy = vi.spyOn(globalThis, 'fetch');

function renderRoute(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <I18nextProvider i18n={i18n}>
        <AppRoutes />
      </I18nextProvider>
    </MemoryRouter>,
  );
}

function session(authenticated: boolean) {
  return new Response(
    JSON.stringify(
      authenticated
        ? {
            authenticated: true,
            user: {
              id: 'u1',
              email: 'owner@example.com',
              name: 'Owner',
              surname: 'One',
              displayName: 'Owner One',
              role: 'user',
              preferredLanguage: 'en',
            },
          }
        : { message: 'Not authenticated.' },
    ),
    { status: authenticated ? 200 : 401, headers: { 'Content-Type': 'application/json' } },
  );
}

const summary = {
  year: 2026,
  month: null,
  incomeCents: 500000,
  expenseCents: 180000,
  balanceCents: 320000,
  income: 500000,
  expenses: 180000,
  balance: 320000,
  categoryBreakdown: [
    {
      categoryId: 'food',
      group: null,
      category: 'Living',
      subcategory: 'Food',
      incomeCents: 0,
      expenseCents: 180000,
      balanceCents: -180000,
    },
  ],
  categories: [],
  accountBalances: [
    {
      id: 'main',
      name: 'Main account',
      institution: null,
      accountType: 'checking',
      currency: 'PLN',
      balanceCents: 320000,
    },
  ],
};

beforeEach(() => {
  fetchSpy.mockReset();
  void i18n.changeLanguage('en');
});
afterEach(() => {
  fetchSpy.mockReset();
});

describe('budget routes', () => {
  it('gates the dashboard and opens the platform login prompt for guests', async () => {
    fetchSpy.mockResolvedValueOnce(session(false));
    renderRoute('/');
    expect(await screen.findByRole('dialog')).toHaveAttribute('open');
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
  });

  it('renders server-derived dashboard figures for an authenticated user', async () => {
    fetchSpy
      .mockResolvedValueOnce(session(true))
      .mockResolvedValueOnce(new Response(JSON.stringify(summary), { status: 200 }));
    renderRoute('/');
    expect(await screen.findByRole('heading', { name: /Good to see you/ })).toBeInTheDocument();
    expect(await screen.findByText(/5,000\.00/)).toBeInTheDocument();
    expect(screen.getAllByText(/1,800\.00/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/3,200\.00/).length).toBeGreaterThan(0);
  });

  it('shows transaction classifications and sends a manual classification', async () => {
    const transaction = {
      id: 'tx-1',
      accountId: 'main',
      bookedAt: '2026-01-10',
      valueDate: null,
      amountCents: -12000,
      currency: 'PLN',
      description: 'Grocery shop',
      counterpartyName: null,
      counterpartyAccount: null,
      bankReference: null,
      legacySource: null,
      legacyRow: null,
      sourceHash: null,
      transferId: null,
      legacyTransferId: null,
      account: summary.accountBalances[0],
      classification: null,
      category: null,
    };
    fetchSpy.mockResolvedValueOnce(session(true)).mockImplementation(async (input, init) => {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (init?.method === 'PUT') {
        return new Response(
          JSON.stringify({
            id: 'c1',
            transactionId: 'tx-1',
            economicType: 'expense',
            categoryId: 'food',
            source: 'manual',
            isCurrent: true,
          }),
          { status: 200 },
        );
      }
      if (url.startsWith('/api/transactions')) {
        return new Response(
          JSON.stringify({ items: [transaction], total: 1, page: 1, pageSize: 20, totalPages: 1 }),
          { status: 200 },
        );
      }
      if (url === '/api/accounts') {
        return new Response(JSON.stringify(summary.accountBalances), { status: 200 });
      }
      return new Response(
        JSON.stringify([{ id: 'food', group: null, category: 'Living', subcategory: 'Food' }]),
        { status: 200 },
      );
    });
    const user = userEvent.setup();
    renderRoute('/transactions');
    expect(await screen.findByText('Grocery shop')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Classify Grocery shop/ }));
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/transactions/tx-1/classification',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('serializes the selected transaction month and resets pagination', async () => {
    fetchSpy.mockResolvedValueOnce(session(true)).mockImplementation(async (input) => {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.startsWith('/api/transactions')) {
        return new Response(
          JSON.stringify({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });
    const user = userEvent.setup();
    renderRoute('/transactions');

    const month = await screen.findByLabelText('Month');
    await user.selectOptions(month, '2');

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        `/api/transactions?page=1&pageSize=20&year=${String(new Date().getFullYear())}&month=2`,
        expect.anything(),
      );
    });
  });

  it('shows an explicit empty state when a report has no account balances', async () => {
    fetchSpy
      .mockResolvedValueOnce(session(true))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...summary, accountBalances: [] }), { status: 200 }),
      );
    renderRoute('/report');

    expect(
      await screen.findByText('No account balances are available for this period.'),
    ).toBeInTheDocument();
  });

  it('renders the read-only category dictionary', async () => {
    fetchSpy
      .mockResolvedValueOnce(session(true))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([{ id: 'child', group: null, category: 'Życie', subcategory: 'Dziecko' }]),
          { status: 200 },
        ),
      );
    renderRoute('/categories');
    expect(await screen.findByRole('heading', { name: 'Categories' })).toBeInTheDocument();
    expect(await screen.findByText('Dziecko')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add|create/i })).not.toBeInTheDocument();
  });
});
