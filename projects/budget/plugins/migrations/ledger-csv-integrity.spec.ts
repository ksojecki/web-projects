import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import { LEDGER_HEADERS, LedgerCsvError, migrateLedgerCsv } from './ledger-csv';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('Ledger bankowy CSV migration integrity', () => {
  it('keeps imported source facts immutable and retains transfer provenance', () => {
    const directory = mkdtempSync(join(tmpdir(), 'budget-ledger-parity-'));
    temporaryDirectories.push(directory);
    const csvPath = join(directory, 'ledger-parity.csv');
    const databasePath = join(directory, 'budget.sqlite');
    writeFileSync(csvPath, readFileSync(new URL('./fixtures/ledger-parity.csv', import.meta.url)));
    migrateLedgerCsv({ csvPath, databasePath, sourceName: 'Sanitized parity fixture' });

    const db = new Database(databasePath);
    expect(
      db.prepare<[], { count: number }>('SELECT COUNT(*) AS count FROM transfers').get()?.count,
    ).toBe(1);
    expect(
      db
        .prepare<[], { count: number }>(
          `SELECT COUNT(*) AS count FROM bank_transactions WHERE legacy_transfer_id = 'parity-transfer-1'`,
        )
        .get()?.count,
    ).toBe(2);
    expect(() =>
      db
        .prepare(`UPDATE bank_transactions SET amount_cents = 1 WHERE id = 'parity-car-sale'`)
        .run(),
    ).toThrow('immutable');
    expect(() =>
      db
        .prepare(
          `UPDATE bank_transactions SET legacy_raw_payload = 'changed' WHERE id = 'parity-car-sale'`,
        )
        .run(),
    ).toThrow('immutable');
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
        ...Array(12).fill(''),
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
        '',
        'Not a category',
        'Nope',
        ...Array(4).fill(''),
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
