import Fastify, { type FastifyInstance } from 'fastify';
import Database from 'better-sqlite3';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { expect } from 'vitest';
import {
  createServerPlatform,
  type ServerPlatformProjectConfig,
} from '@ksojecki/platform-server-platform';
import { budgetStorePlugin } from '../budget-store';
import { budgetApiPlugin } from './plugin';

export const sessionCookieName = 'rod_manager_session';
export const tempDirectories: string[] = [];

export async function createBudgetApiServer(): Promise<FastifyInstance> {
  const directory = mkdtempSync(join(tmpdir(), 'budget-api-'));
  tempDirectories.push(directory);
  const server = Fastify();
  const project: ServerPlatformProjectConfig = {
    projectId: 'budget-test',
    database: { path: join(directory, 'auth.sqlite'), seedInitialUser: true },
  };
  await createServerPlatform(server, { project, plugins: [] });
  await server.register(budgetStorePlugin, { path: join(directory, 'budget.sqlite') });
  await server.register(budgetApiPlugin, { ownerEmail: 'admin@budget.local' });
  return server;
}

export async function createSeededBudgetApiServer(): Promise<FastifyInstance> {
  const server = await createBudgetApiServer();
  const db = new Database(join(tempDirectories.at(-1)!, 'budget.sqlite'));
  db.prepare(`INSERT INTO accounts (id, name) VALUES ('main', 'Main')`).run();
  db.prepare(`INSERT INTO accounts (id, name) VALUES ('savings', 'Savings')`).run();
  db.close();
  insertTransactions(server);
  return server;
}

export async function login(server: FastifyInstance): Promise<Record<string, string>> {
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
