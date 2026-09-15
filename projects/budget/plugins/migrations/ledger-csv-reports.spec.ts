import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import { createBudgetStore } from '../budget-store/store';
import { LEDGER_HEADERS, migrateLedgerCsv } from './ledger-csv';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('Ledger bankowy CSV migration reports', () => {
  it('keeps a non-PLN source amount for account balances and uses PLN for reports', () => {
    const directory = mkdtempSync(join(tmpdir(), 'budget-ledger-currency-'));
    temporaryDirectories.push(directory);
    const csvPath = join(directory, 'ledger.csv');
    const databasePath = join(directory, 'budget.sqlite');
    const row = [
      '2026-01-01',
      '2026-01-01',
      'Bank',
      'Euro account',
      'PRZYCHÓD',
      '',
      '10.00',
      'EUR',
      '40.00',
      'Employer',
      'Salary',
      '',
      'currency-income',
      '',
      '',
      '',
      '',
      'legacy',
      'Finanse',
      'Praca',
      'legacy',
      '1.0',
      '',
      '',
      '',
    ];
    writeFileSync(csvPath, [LEDGER_HEADERS.join(','), row.join(',')].join('\n'));

    expect(migrateLedgerCsv({ csvPath, databasePath, sourceName: 'currency.csv' })).toMatchObject({
      inserted: 1,
      invalid: 0,
      ambiguous: 0,
    });
    const db = new Database(databasePath);
    const store = createBudgetStore(db);
    expect(
      db
        .prepare(
          'SELECT amount_cents, currency, native_amount_cents, native_currency, reporting_amount_cents FROM bank_transactions',
        )
        .get(),
    ).toEqual({
      amount_cents: 1000,
      currency: 'EUR',
      native_amount_cents: 1000,
      native_currency: 'EUR',
      reporting_amount_cents: 4000,
    });
    expect(store.getReportSummary({ year: 2026, month: null })).toMatchObject({
      incomeCents: 4000,
      balanceCents: 4000,
      accountBalances: [expect.objectContaining({ name: 'Euro account', balanceCents: 1000 })],
    });
    db.close();
  });

  it('matches the sanitized ledger parity totals for annual and monthly reports', () => {
    const directory = mkdtempSync(join(tmpdir(), 'budget-ledger-parity-'));
    temporaryDirectories.push(directory);
    const csvPath = join(directory, 'ledger-parity.csv');
    const databasePath = join(directory, 'budget.sqlite');
    writeFileSync(csvPath, readFileSync(new URL('./fixtures/ledger-parity.csv', import.meta.url)));

    const report = migrateLedgerCsv({
      csvPath,
      databasePath,
      sourceName: 'Sanitized parity fixture',
      spreadsheetId: 'fictional-spreadsheet-parity',
    });
    expect(report).toMatchObject({ inserted: 10, skipped: 0, invalid: 0, ambiguous: 0 });

    const db = new Database(databasePath);
    const store = createBudgetStore(db);
    expect(
      db
        .prepare(
          `SELECT t.description, t.amount_cents AS amountCents,
                  c.economic_type AS economicType, categories.category, categories.subcategory
           FROM bank_transactions t
           JOIN transaction_classifications c ON c.transaction_id = t.id AND c.is_current = 1
           JOIN categories ON categories.id = c.category_id
           WHERE t.id = 'parity-car-sale'`,
        )
        .get(),
    ).toEqual({
      description: 'Car sale',
      amountCents: 200000,
      economicType: 'income',
      category: 'Finanse',
      subcategory: 'Praca',
    });
    expect(
      db
        .prepare(
          `SELECT t.description, t.amount_cents AS amountCents,
                  c.economic_type AS economicType, categories.category, categories.subcategory
           FROM bank_transactions t
           JOIN transaction_classifications c ON c.transaction_id = t.id AND c.is_current = 1
           JOIN categories ON categories.id = c.category_id
           WHERE t.id = 'parity-ewelina'`,
        )
        .get(),
    ).toEqual({
      description: 'Household contribution',
      amountCents: 150000,
      economicType: 'income',
      category: 'Finanse',
      subcategory: 'Praca',
    });
    const annual = store.getReportSummary({ year: 2026, month: null });
    expect(annual).toMatchObject({
      year: 2026,
      month: null,
      incomeCents: 350000,
      expenseCents: 40500,
      balanceCents: 309500,
    });
    expect(annual.accountBalances).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Main PLN', balanceCents: 334000 }),
        expect.objectContaining({ name: 'Reserve PLN', balanceCents: 10000 }),
      ]),
    );
    expect(annual.categoryBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'Finanse',
          subcategory: 'Praca',
          incomeCents: 350000,
          expenseCents: 0,
          balanceCents: 350000,
        }),
        expect.objectContaining({
          category: 'Życie',
          subcategory: 'Dziecko',
          incomeCents: 0,
          expenseCents: 12500,
          balanceCents: -12500,
        }),
        expect.objectContaining({
          category: 'Działka',
          subcategory: 'Ogród i działka',
          incomeCents: 0,
          expenseCents: 8000,
          balanceCents: -8000,
        }),
        expect.objectContaining({
          category: 'Życie',
          subcategory: 'Żywność',
          incomeCents: 0,
          expenseCents: 20000,
          balanceCents: -20000,
        }),
      ]),
    );
    expect(annual.categoryBreakdown.some((entry) => entry.category === 'Wyłączone')).toBe(false);

    const january = store.getReportSummary({ year: 2026, month: 1 });
    expect(january).toMatchObject({
      year: 2026,
      month: 1,
      incomeCents: 200000,
      expenseCents: 20500,
      balanceCents: 179500,
    });
    expect(january.accountBalances).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Main PLN', balanceCents: 169000 }),
        expect.objectContaining({ name: 'Reserve PLN', balanceCents: 10000 }),
      ]),
    );
    expect(january.categoryBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: 'Finanse', subcategory: 'Praca', incomeCents: 200000 }),
        expect.objectContaining({ category: 'Życie', subcategory: 'Dziecko', expenseCents: 12500 }),
        expect.objectContaining({
          category: 'Działka',
          subcategory: 'Ogród i działka',
          expenseCents: 8000,
        }),
      ]),
    );

    expect(
      annual.categoryBreakdown.find((entry) => entry.category === 'Wyłączone'),
    ).toBeUndefined();
    expect(
      db
        .prepare<[], { count: number }>(
          `SELECT COUNT(*) AS count FROM transaction_classifications WHERE economic_type = 'card_repayment'`,
        )
        .get()?.count,
    ).toBe(1);
    db.close();
  });
});
