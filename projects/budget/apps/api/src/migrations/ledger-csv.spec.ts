import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import { createBudgetStore } from '../budget-store/store';
import { LEDGER_HEADERS, LedgerCsvError, migrateLedgerCsv, parseLedgerCsv } from './ledger-csv';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('Ledger bankowy CSV migration', () => {
  it('requires the exact A:Y header and parses quoted newlines', () => {
    const fixture = readFileSync(new URL('./fixtures/ledger-sample.csv', import.meta.url), 'utf8');
    const rows = parseLedgerCsv(fixture);
    expect(rows[0]).toEqual(LEDGER_HEADERS);
    expect(rows).toHaveLength(8);
    expect(rows[5]?.[11]).toContain('note with\nnewline');
    expect(() =>
      migrateLedgerCsv({ csvPath: '/does/not/exist', databasePath: ':memory:' }),
    ).toThrow('ENOENT');
  });

  it('imports sanitized legacy rows and is idempotent', () => {
    const directory = mkdtempSync(join(tmpdir(), 'budget-ledger-'));
    temporaryDirectories.push(directory);
    const csvPath = join(directory, 'ledger.csv');
    const databasePath = join(directory, 'budget.sqlite');
    writeFileSync(csvPath, readFileSync(new URL('./fixtures/ledger-sample.csv', import.meta.url)));

    const first = migrateLedgerCsv({ csvPath, databasePath, sourceName: 'Ledger bankowy fixture' });
    expect(first).toMatchObject({ inserted: 7, skipped: 0, invalid: 0, ambiguous: 0 });
    expect(first.spreadsheetId).toBe('1SZ5OJuKHQIxdKQDVkgm9dEsPetk1ZjPgLbdOLd4KuXs');

    const second = migrateLedgerCsv({
      csvPath,
      databasePath,
      sourceName: 'Ledger bankowy fixture',
    });
    expect(second).toMatchObject({ inserted: 0, skipped: 7, invalid: 0, ambiguous: 0 });

    const db = new Database(databasePath);
    expect(db.prepare('SELECT COUNT(*) AS count FROM bank_transactions').get()).toEqual({
      count: 7,
    });
    expect(db.prepare('SELECT COUNT(*) AS count FROM transaction_classifications').get()).toEqual({
      count: 7,
    });
    expect(db.prepare('SELECT COUNT(*) AS count FROM transfers').get()).toEqual({ count: 1 });
    expect(
      db
        .prepare<[string], { source: string; row: number; raw: string }>(
          'SELECT legacy_source AS source, legacy_row AS row, legacy_raw_payload AS raw FROM bank_transactions WHERE id = ?',
        )
        .get('fictional-child'),
    ).toMatchObject({ source: 'Ledger bankowy fixture', row: 6 });
    expect(
      db.prepare('SELECT amount_cents FROM bank_transactions WHERE id = ?').get('fictional-child'),
    ).toEqual({
      amount_cents: -4550,
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
        expect.objectContaining({ name: 'Main PLN', balanceCents: 294000 }),
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

  it('counts unsupported types and unknown categories as ambiguous without partial rows', () => {
    const directory = mkdtempSync(join(tmpdir(), 'budget-ledger-'));
    temporaryDirectories.push(directory);
    const csvPath = join(directory, 'ambiguous.csv');
    const databasePath = join(directory, 'budget.sqlite');
    const rows = [
      [...LEDGER_HEADERS],
      [
        '2026-01-01',
        '2026-01-01',
        'Bank',
        'Checking',
        'MYSTERY',
        '',
        '1',
        'PLN',
        '1',
        '',
        'Unknown',
        '',
        'unknown-type',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
      ],
      [
        '2026-01-02',
        '2026-01-02',
        'Bank',
        'Checking',
        'WYDATEK',
        '',
        '1',
        'PLN',
        '1',
        '',
        'Unknown category',
        '',
        'unknown-category',
        '',
        '',
        '',
        '',
        '',
        'Not a category',
        'Nope',
        '',
        '',
        '',
        '',
        '',
      ],
    ];
    writeFileSync(csvPath, rows.map((row) => row.join(',')).join('\n'));
    const report = migrateLedgerCsv({ csvPath, databasePath });
    expect(report).toMatchObject({ inserted: 0, skipped: 0, invalid: 0, ambiguous: 2 });
    const db = new Database(databasePath);
    expect(db.prepare('SELECT COUNT(*) AS count FROM bank_transactions').get()).toEqual({
      count: 0,
    });
    expect(db.prepare('SELECT COUNT(*) AS count FROM accounts').get()).toEqual({ count: 0 });
    db.close();
  });

  it('rejects a header with a reordered column', () => {
    const directory = mkdtempSync(join(tmpdir(), 'budget-ledger-'));
    temporaryDirectories.push(directory);
    const csvPath = join(directory, 'wrong.csv');
    const databasePath = join(directory, 'budget.sqlite');
    const reversedHeaders = LEDGER_HEADERS.reduce<string[]>(
      (headers, header) => [header, ...headers],
      [],
    );
    writeFileSync(csvPath, `${reversedHeaders.join(',')}\n`);
    expect(() => migrateLedgerCsv({ csvPath, databasePath })).toThrow(LedgerCsvError);
  });
});
