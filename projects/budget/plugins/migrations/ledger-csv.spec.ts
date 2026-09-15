import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
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

  it('imports identical content from distinct source rows independently', () => {
    const directory = mkdtempSync(join(tmpdir(), 'budget-ledger-duplicate-content-'));
    temporaryDirectories.push(directory);
    const csvPath = join(directory, 'ledger.csv');
    const databasePath = join(directory, 'budget.sqlite');
    const row = [
      '2026-01-01',
      '2026-01-01',
      'Bank',
      'Checking',
      'WYDATEK',
      '',
      '-1.00',
      'PLN',
      '-1.00',
      'Shop',
      'Coffee',
      '',
      '',
      '',
      '',
      '',
      '',
      'legacy',
      'Życie',
      'Żywność',
      'legacy',
      '1.0',
      '',
      '',
      '',
    ];
    writeFileSync(csvPath, [LEDGER_HEADERS.join(','), row.join(','), row.join(',')].join('\n'));

    const first = migrateLedgerCsv({ csvPath, databasePath, sourceName: 'same-content.csv' });
    expect(first).toMatchObject({ inserted: 2, skipped: 0, invalid: 0, ambiguous: 0 });
    const second = migrateLedgerCsv({ csvPath, databasePath, sourceName: 'same-content.csv' });
    expect(second).toMatchObject({ inserted: 0, skipped: 2, invalid: 0, ambiguous: 0 });

    const db = new Database(databasePath);
    expect(db.prepare('SELECT COUNT(*) AS count FROM bank_transactions').get()).toEqual({
      count: 2,
    });
    expect(
      db.prepare('SELECT COUNT(DISTINCT source_hash) AS count FROM bank_transactions').get(),
    ).toEqual({ count: 1 });
    expect(db.prepare('SELECT COUNT(DISTINCT id) AS count FROM bank_transactions').get()).toEqual({
      count: 2,
    });
    db.close();
  });

  it('keeps a non-PLN source amount for account balances and uses PLN for reports', () => {
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
