import { rmSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createBudgetApiServer,
  createSeededBudgetApiServer,
  login,
  sessionCookieName,
  tempDirectories,
} from './test-helpers';

describe('budget API', () => {
  beforeEach(() => {
    process.env.AUTH_INITIAL_USER_EMAIL = 'admin@budget.local';
    process.env.AUTH_INITIAL_USER_PASSWORD = 'admin1234';
  });

  afterEach(() => {
    delete process.env.AUTH_INITIAL_USER_EMAIL;
    delete process.env.AUTH_INITIAL_USER_PASSWORD;
    for (const directory of tempDirectories.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('requires an authenticated session for every budget route', async () => {
    const server = await createBudgetApiServer();
    try {
      const responses = await Promise.all(
        [
          '/api/transactions',
          '/api/accounts',
          '/api/categories',
          '/api/reports/summary?year=2026',
        ].map((url) => server.inject({ method: 'GET', url })),
      );
      for (const response of responses) {
        expect(response.statusCode).toBe(401);
      }
      const response = await server.inject({
        method: 'PUT',
        url: '/api/transactions/missing/classification',
        payload: { economicType: 'income' },
      });
      expect(response.statusCode).toBe(401);
    } finally {
      await server.close();
    }
  });

  it('rejects an authenticated non-owner from every budget route', async () => {
    const server = await createBudgetApiServer();
    try {
      const user = server.authStore.createUser('other@budget.local', 'Other', 'User', 'secret123');
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: user.email, password: 'secret123' },
      });
      const cookie = loginResponse.cookies.find(
        (candidate) => candidate.name === sessionCookieName,
      );
      expect(cookie).toBeDefined();
      const responses = await Promise.all(
        [
          '/api/transactions',
          '/api/accounts',
          '/api/categories',
          '/api/reports/summary?year=2026',
        ].map((url) =>
          server.inject({
            method: 'GET',
            url,
            cookies: { [sessionCookieName]: cookie?.value ?? '' },
          }),
        ),
      );
      for (const response of responses) {
        expect(response.statusCode).toBe(403);
      }
      const classification = await server.inject({
        method: 'PUT',
        url: '/api/transactions/missing/classification',
        cookies: { [sessionCookieName]: cookie?.value ?? '' },
        payload: { economicType: 'income' },
      });
      expect(classification.statusCode).toBe(403);
    } finally {
      await server.close();
    }
  });

  it('filters and paginates immutable transaction facts with classification details', async () => {
    const server = await createSeededBudgetApiServer();
    try {
      const cookie = await login(server);
      const response = await server.inject({
        method: 'GET',
        url: '/api/transactions?year=2026&month=1&type=expense&page=1&pageSize=1',
        cookies: cookie,
      });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ total: 1, page: 1, pageSize: 1, totalPages: 1 });
      expect(response.json().items[0]).toMatchObject({
        id: 'tx-food-jan',
        amountCents: -1200,
        accountId: 'main',
        classification: { economicType: 'expense', source: 'legacy' },
        category: { category: 'Życie', subcategory: 'Dziecko' },
      });
      expect(response.json().items[0]).not.toHaveProperty('legacyRawPayload');
    } finally {
      await server.close();
    }
  });

  it('validates manual classifications and never changes bank facts', async () => {
    const server = await createSeededBudgetApiServer();
    try {
      const cookie = await login(server);
      const invalidType = await server.inject({
        method: 'PUT',
        url: '/api/transactions/tx-food-jan/classification',
        cookies: cookie,
        payload: { economicType: 'not-a-type' },
      });
      expect(invalidType.statusCode).toBe(400);
      const missingCategory = await server.inject({
        method: 'PUT',
        url: '/api/transactions/tx-food-jan/classification',
        cookies: cookie,
        payload: { economicType: 'expense', categoryId: 'missing' },
      });
      expect(missingCategory.statusCode).toBe(404);
      const update = await server.inject({
        method: 'PUT',
        url: '/api/transactions/tx-food-jan/classification',
        cookies: cookie,
        payload: { economicType: 'expense', categoryId: 'zycie-dziecko', notes: 'Reviewed' },
      });
      expect(update.statusCode).toBe(200);
      expect(update.json()).toMatchObject({ source: 'manual', notes: 'Reviewed' });

      const transaction = await server.inject({
        method: 'GET',
        url: '/api/transactions?accountId=main&categoryId=zycie-dziecko',
        cookies: cookie,
      });
      expect(transaction.json().items[0]).toMatchObject({ id: 'tx-food-jan', amountCents: -1200 });
    } finally {
      await server.close();
    }
  });

  it('reports annual and monthly cash flow, breakdowns, and ledger account balances', async () => {
    const server = await createSeededBudgetApiServer();
    try {
      const cookie = await login(server);
      const annual = await server.inject({
        method: 'GET',
        url: '/api/reports/summary?year=2026&month=null',
        cookies: cookie,
      });
      expect(annual.statusCode).toBe(200);
      expect(annual.json()).not.toHaveProperty('legacyRawPayload');
      expect(annual.json()).toMatchObject({
        incomeCents: 5000,
        expenseCents: 1700,
        balanceCents: 3300,
        month: null,
      });
      expect(annual.json().accountBalances).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'main', balanceCents: 2850 }),
          expect.objectContaining({ id: 'savings', balanceCents: 3000 }),
        ]),
      );
      expect(annual.json().categoryBreakdown).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ category: 'Finanse', subcategory: 'Praca', incomeCents: 5000 }),
          expect.objectContaining({
            category: 'Życie',
            subcategory: 'Dziecko',
            expenseCents: 1200,
          }),
        ]),
      );

      const annualWithoutMonth = await server.inject({
        method: 'GET',
        url: '/api/reports/summary?year=2026',
        cookies: cookie,
      });
      expect(annualWithoutMonth.statusCode).toBe(200);
      expect(annualWithoutMonth.json()).toMatchObject({
        year: 2026,
        month: null,
        incomeCents: 5000,
        expenseCents: 1700,
        balanceCents: 3300,
      });

      const january = await server.inject({
        method: 'GET',
        url: '/api/reports/summary?year=2026&month=1',
        cookies: cookie,
      });
      expect(january.json()).toMatchObject({
        incomeCents: 5000,
        expenseCents: 1200,
        balanceCents: 3800,
        month: 1,
      });
    } finally {
      await server.close();
    }
  });
});
