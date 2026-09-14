import Fastify, { type FastifyInstance } from 'fastify';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createServerPlatform,
  type ServerPlatformProjectConfig,
} from '@ksojecki/platform-server-platform';
import { budgetStorePlugin } from '../budget-store';
import { budgetApiPlugin } from './plugin';

const sessionCookieName = 'rod_manager_session';
const tempDirectories: string[] = [];

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

async function createBudgetApiServer(): Promise<FastifyInstance> {
  const directory = mkdtempSync(join(tmpdir(), 'budget-api-'));
  tempDirectories.push(directory);
  const server = Fastify();
  const project: ServerPlatformProjectConfig = {
    projectId: 'budget-test',
    database: { path: join(directory, 'auth.sqlite'), seedInitialUser: true },
  };
  await createServerPlatform(server, { project, plugins: [] });
  await server.register(budgetStorePlugin, { path: join(directory, 'budget.sqlite') });
  await server.register(budgetApiPlugin);
  return server;
}

async function createSeededBudgetApiServer(): Promise<FastifyInstance> {
  const server = await createBudgetApiServer();
  const db = new Database(join(tempDirectories.at(-1)!, 'budget.sqlite'));
  db.prepare(`INSERT INTO accounts (id, name) VALUES ('main', 'Main')`).run();
  db.prepare(`INSERT INTO accounts (id, name) VALUES ('savings', 'Savings')`).run();
  db.close();
  insertTransactions(server);
  return server;
}

function insertTransactions(server: FastifyInstance): void {
  const records = [
    ['tx-salary', 'main', '2026-01-01', 5000, 'Salary', 'income', 'finanse-praca'],
    ['tx-food-jan', 'main', '2026-01-10', -1200, 'Child costs', 'expense', 'zycie-dziecko'],
    ['tx-transfer', 'main', '2026-01-15', -300, 'Own account transfer', 'transfer', null],
    [
      'tx-technical',
      'main',
      '2026-01-16',
      -100,
      'Technical operation',
      'technical',
      'wylaczone-operacje-techniczne',
    ],
    [
      'tx-excluded',
      'main',
      '2026-01-17',
      -50,
      'Excluded operation',
      'excluded',
      'wylaczone-operacje-techniczne',
    ],
    ['tx-food-feb', 'main', '2026-02-10', -500, 'Food', 'expense', 'zycie-zywnosc'],
    [
      'tx-savings-transfer',
      'savings',
      '2026-01-15',
      3000,
      'Own account transfer',
      'transfer',
      null,
    ],
  ] as const;
  for (const [
    id,
    accountId,
    bookedAt,
    amountCents,
    description,
    economicType,
    categoryId,
  ] of records) {
    server.budgetStore.insertBankTransaction({
      id,
      accountId,
      bookedAt,
      valueDate: null,
      amountCents,
      currency: 'PLN',
      description,
      counterpartyName: null,
      counterpartyAccount: null,
      bankReference: null,
      legacySource: null,
      legacyRow: null,
      sourceHash: null,
      transferId: null,
      legacyTransferId: null,
    });
    server.budgetStore.classifyTransaction({
      transactionId: id,
      economicType,
      categoryId,
      source: 'legacy',
    });
  }
}

async function login(server: FastifyInstance): Promise<Record<string, string>> {
  const response = await server.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email: 'admin@budget.local', password: 'admin1234' },
  });
  expect(response.statusCode).toBe(200);
  const cookie = response.cookies.find((candidate) => candidate.name === sessionCookieName);
  expect(cookie).toBeDefined();
  return { [sessionCookieName]: cookie?.value ?? '' };
}
