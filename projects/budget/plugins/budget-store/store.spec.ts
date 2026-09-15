import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import { bootstrapBudgetDatabase } from './database';
import { createBudgetStore } from './store';

const databases: Database.Database[] = [];

function createStore() {
  const db = new Database(':memory:');
  databases.push(db);
  bootstrapBudgetDatabase(db);
  db.prepare(`INSERT INTO accounts (id, name) VALUES ('main', 'Main')`).run();
  return { db, store: createBudgetStore(db) };
}

afterEach(() => {
  for (const db of databases.splice(0)) {
    db.close();
  }
});

describe('budget store', () => {
  it('keeps cash flow period-only while account balances include prior activity through period end', () => {
    const { store } = createStore();
    const insert = (id: string, bookedAt: string, amountCents: number) => {
      store.insertBankTransaction({
        id,
        accountId: 'main',
        bookedAt,
        valueDate: bookedAt,
        amountCents,
        currency: 'PLN',
        description: id,
        counterpartyName: null,
        counterpartyAccount: null,
        bankReference: null,
        legacySource: null,
        legacyRow: null,
        sourceHash: null,
        transferId: null,
        legacyTransferId: null,
      });
    };
    insert('opening', '2025-12-31', 100_000);
    insert('january-income', '2026-01-10', 50_000);
    insert('january-expense', '2026-01-20', -10_000);
    insert('february-income', '2026-02-10', 30_000);
    store.classifyTransaction({
      transactionId: 'january-income',
      economicType: 'income',
      source: 'manual',
    });
    store.classifyTransaction({
      transactionId: 'january-expense',
      economicType: 'expense',
      source: 'manual',
    });
    store.classifyTransaction({
      transactionId: 'february-income',
      economicType: 'income',
      source: 'manual',
    });

    expect(store.getReportSummary({ year: 2026, month: 1 })).toMatchObject({
      incomeCents: 50_000,
      expenseCents: 10_000,
      balanceCents: 40_000,
      accountBalances: [expect.objectContaining({ balanceCents: 140_000 })],
    });
    expect(store.getReportSummary({ year: 2026, month: null })).toMatchObject({
      incomeCents: 80_000,
      expenseCents: 10_000,
      balanceCents: 70_000,
      accountBalances: [expect.objectContaining({ balanceCents: 170_000 })],
    });
  });

  it('deduplicates an immutable source row', () => {
    const { store } = createStore();
    const transaction = {
      id: 'tx-1',
      accountId: 'main',
      bookedAt: '2026-01-01',
      valueDate: null,
      amountCents: -1250,
      currency: 'PLN',
      description: 'Groceries',
      counterpartyName: null,
      counterpartyAccount: null,
      bankReference: null,
      legacySource: 'ledger.csv',
      legacyRow: 42,
      sourceHash: 'hash-42',
      transferId: null,
      legacyTransferId: null,
    } as const;

    expect(store.insertBankTransaction(transaction).inserted).toBe(true);
    const duplicate = store.insertBankTransaction({ ...transaction, id: 'different-id' });
    expect(duplicate.inserted).toBe(false);
    expect(duplicate.transaction.id).toBe('tx-1');
  });

  it('persists audit payloads without exposing them through projections', () => {
    const { db, store } = createStore();
    store.insertBankTransaction({
      id: 'tx-audit',
      accountId: 'main',
      bookedAt: '2026-01-01',
      valueDate: null,
      amountCents: -1250,
      currency: 'PLN',
      description: 'Groceries',
      counterpartyName: null,
      counterpartyAccount: null,
      bankReference: null,
      legacySource: 'ledger.csv',
      legacyRow: 42,
      sourceHash: 'hash-42',
      transferId: null,
      legacyTransferId: null,
      legacyRawPayload: '{"raw":true}',
    });

    expect(
      db
        .prepare<{ id: string }, { legacy_raw_payload: string }>(
          'SELECT legacy_raw_payload FROM bank_transactions WHERE id = @id',
        )
        .get({ id: 'tx-audit' })?.legacy_raw_payload,
    ).toBe('{"raw":true}');
    expect(store.listTransactions().items[0]).not.toHaveProperty('legacyRawPayload');
    expect(store.getReportSummary({ year: 2026, month: null })).not.toHaveProperty(
      'legacyRawPayload',
    );
  });

  it('prevents source fact updates and validates classification categories', () => {
    const { db, store } = createStore();
    store.insertBankTransaction({
      id: 'tx-2',
      accountId: 'main',
      bookedAt: '2026-01-02',
      valueDate: null,
      amountCents: 1000,
      currency: 'PLN',
      description: 'Salary',
      counterpartyName: null,
      counterpartyAccount: null,
      bankReference: null,
      legacySource: null,
      legacyRow: null,
      sourceHash: null,
      transferId: null,
      legacyTransferId: null,
    });

    expect(() =>
      db.prepare(`UPDATE bank_transactions SET amount_cents = 2000 WHERE id = 'tx-2'`).run(),
    ).toThrow('immutable');
    expect(() =>
      store.classifyTransaction({
        transactionId: 'tx-2',
        economicType: 'income',
        categoryId: 'missing-category',
        source: 'manual',
      }),
    ).toThrow('FOREIGN KEY');
  });

  it('keeps exactly one current classification when replacing it', () => {
    const { db, store } = createStore();
    store.insertBankTransaction({
      id: 'tx-3',
      accountId: 'main',
      bookedAt: '2026-01-03',
      valueDate: null,
      amountCents: -100,
      currency: 'PLN',
      description: 'Child',
      counterpartyName: null,
      counterpartyAccount: null,
      bankReference: null,
      legacySource: null,
      legacyRow: null,
      sourceHash: null,
      transferId: null,
      legacyTransferId: null,
    });
    const first = store.classifyTransaction({
      transactionId: 'tx-3',
      economicType: 'expense',
      categoryId: 'zycie-dziecko',
      source: 'legacy',
    });
    const second = store.classifyTransaction({
      transactionId: 'tx-3',
      economicType: 'expense',
      categoryId: 'dzialka-ogrod-i-dzialka',
      source: 'manual',
    });

    expect(first.isCurrent).toBe(true);
    expect(second.isCurrent).toBe(true);
    expect(store.getCurrentClassification('tx-3')?.id).toBe(second.id);
    expect(
      db
        .prepare<[], { count: number }>(
          `SELECT COUNT(*) AS count FROM transaction_classifications WHERE transaction_id = 'tx-3' AND is_current = 1`,
        )
        .get()?.count,
    ).toBe(1);
  });
});
