import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import Database from 'better-sqlite3';
import { bootstrapBudgetDatabase, resolveBudgetDatabasePath } from '../budget-store/database.ts';
import type { BudgetEconomicType } from '../budget-store/types.ts';
import {
  LEDGER_HEADERS,
  LedgerCsvError,
  mapLedgerEconomicType,
  normalizeLedgerHeader,
  parseLedgerAmount,
  parseLedgerConfidence,
  parseLedgerCsv,
  parseLedgerCurrency,
  parseLedgerDate,
  text,
} from './ledger-csv-parser.ts';
import type { LedgerRow } from './ledger-csv-parser.ts';

export {
  LEDGER_HEADERS,
  LedgerCsvError,
  mapLedgerEconomicType,
  normalizeLedgerHeader,
  parseLedgerAmount,
  parseLedgerConfidence,
  parseLedgerCsv,
  parseLedgerCurrency,
  parseLedgerDate,
  text,
} from './ledger-csv-parser.ts';
export type { LedgerRow } from './ledger-csv-parser.ts';

export const LEGACY_SPREADSHEET_ID = '1SZ5OJuKHQIxdKQDVkgm9dEsPetk1ZjPgLbdOLd4KuXs';

export interface LedgerMigrationOptions {
  csvPath: string;
  databasePath: string;
  spreadsheetId?: string;
  sourceName?: string;
}

export interface LedgerMigrationReport {
  importId: string;
  spreadsheetId: string;
  sourceName: string;
  fileChecksum: string;
  inserted: number;
  skipped: number;
  invalid: number;
  ambiguous: number;
}

interface PreparedRow {
  row: LedgerRow;
  rowNumber: number;
  sourceHash: string;
  transactionId: string;
  valueDate: string;
  bookedAt: string;
  amountCents: number;
  currency: string;
  accountName: string;
  institution: string;
  description: string;
  counterpartyName: string | null;
  bankReference: string | null;
  legacyTransferId: string | null;
  economicType: BudgetEconomicType;
  legacySubtype: string | null;
  categoryId: string | null;
  confidence: number | null;
}

interface RejectedRow {
  kind: 'invalid' | 'ambiguous';
}

function categoryKey(category: string, subcategory: string): string {
  return `${category}\u0000${subcategory}`;
}

function accountId(institution: string, name: string, currency: string): string {
  return `account-${createHash('sha256').update(`${institution}\u0000${name}\u0000${currency}`).digest('hex').slice(0, 24)}`;
}

function transferId(legacyTransferId: string): string {
  return `transfer-${createHash('sha256').update(legacyTransferId).digest('hex').slice(0, 24)}`;
}

function prepareRow(
  row: LedgerRow,
  rowNumber: number,
  categoryIds: ReadonlyMap<string, string>,
): PreparedRow | RejectedRow {
  if (row.length !== LEDGER_HEADERS.length) {
    return { kind: 'invalid' };
  }
  const valueDate = parseLedgerDate(row[0]);
  const bookedAt = parseLedgerDate(row[1] || row[0]);
  const institution = text(row[2]);
  const accountName = text(row[3]);
  const currency = parseLedgerCurrency(row[7]);
  const amount = parseLedgerAmount(row[8] || row[6]);
  if (
    !valueDate ||
    !bookedAt ||
    !institution ||
    !accountName ||
    !currency ||
    amount === undefined
  ) {
    return { kind: 'invalid' };
  }

  const category = text(row[18]);
  const subcategory = text(row[19]);
  const categoryId =
    category || subcategory ? categoryIds.get(categoryKey(category, subcategory)) : null;
  const economicType = mapLedgerEconomicType(row[4]);
  // Transfers, card repayments and technical rows commonly have no economic
  // category. Income and expense rows do need the verified dictionary entry.
  if (!economicType || ((economicType === 'income' || economicType === 'expense') && !categoryId)) {
    return { kind: 'ambiguous' };
  }
  if ((category || subcategory) && !categoryId) {
    return { kind: 'ambiguous' };
  }

  const rawPayload = JSON.stringify([...row]);
  const sourceHash = createHash('sha256').update(rawPayload).digest('hex');
  const explicitId = text(row[12]);
  return {
    row,
    rowNumber,
    sourceHash,
    transactionId: explicitId || `legacy-${sourceHash.slice(0, 32)}`,
    valueDate,
    bookedAt,
    amountCents: amount,
    currency,
    accountName,
    institution,
    description: text(row[10]) || text(row[11]) || `Legacy transaction ${rowNumber}`,
    counterpartyName: text(row[9]) || null,
    bankReference: text(row[12]) || null,
    legacyTransferId: text(row[13]) || null,
    economicType,
    legacySubtype: text(row[5]) || null,
    categoryId: categoryId ?? null,
    confidence: parseLedgerConfidence(row[21]),
  };
}

export function migrateLedgerCsv(options: LedgerMigrationOptions): LedgerMigrationReport {
  const csvPath = resolve(process.cwd(), options.csvPath);
  const databasePath = resolveBudgetDatabasePath(options.databasePath);
  const bytes = readFileSync(csvPath);
  const fileChecksum = createHash('sha256').update(bytes).digest('hex');
  const sourceName = options.sourceName?.trim() || basename(csvPath);
  const spreadsheetId = options.spreadsheetId?.trim() || LEGACY_SPREADSHEET_ID;
  const rows = parseLedgerCsv(bytes.toString('utf8'));
  const header = rows[0];
  if (!header || normalizeLedgerHeader(header).join('\u0000') !== LEDGER_HEADERS.join('\u0000')) {
    throw new LedgerCsvError(
      `Invalid Ledger bankowy header: expected exact A:Y contract (${LEDGER_HEADERS.length} columns).`,
    );
  }

  const db = new Database(databasePath);
  try {
    bootstrapBudgetDatabase(db);
    const categoryRows = db
      .prepare<[], { id: string; category: string; subcategory: string }>(
        'SELECT id, category, subcategory FROM categories',
      )
      .all();
    const categoryIds = new Map(
      categoryRows.map((entry) => [categoryKey(entry.category, entry.subcategory), entry.id]),
    );
    const importId = `import-${createHash('sha256')
      .update(`${spreadsheetId}\u0000${fileChecksum}`)
      .digest('hex')
      .slice(0, 32)}`;
    db.prepare(
      `INSERT INTO imports (id, spreadsheet_id, file_checksum, source_name)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(spreadsheet_id, file_checksum) DO NOTHING`,
    ).run(importId, spreadsheetId, fileChecksum, sourceName);

    const findExisting = db.prepare<[string, number, string], { id: string }>(
      `SELECT id FROM bank_transactions
       WHERE (legacy_source = ? AND legacy_row = ?) OR source_hash = ? LIMIT 1`,
    );
    const insertAccount = db.prepare(
      `INSERT INTO accounts (id, name, institution, currency)
       VALUES (?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`,
    );
    const insertTransfer = db.prepare(
      `INSERT INTO transfers (id, legacy_transfer_id, source)
       VALUES (?, ?, ?) ON CONFLICT(legacy_transfer_id) DO NOTHING`,
    );
    const insertTransaction = db.prepare(
      `INSERT INTO bank_transactions (
        id, account_id, booked_at, value_date, amount_cents, currency, description,
        counterparty_name, bank_reference, legacy_source, legacy_row, source_hash, transfer_id,
        legacy_transfer_id, legacy_raw_payload
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertClassification = db.prepare(
      `INSERT INTO transaction_classifications (
        id, transaction_id, economic_type, legacy_subtype, category_id, source,
        confidence, notes, is_current
      ) VALUES (?, ?, ?, ?, ?, 'legacy', ?, ?, 1)`,
    );

    let inserted = 0;
    let skipped = 0;
    let invalid = 0;
    let ambiguous = 0;
    for (const [index, row] of rows.slice(1).entries()) {
      const prepared = prepareRow(row, index + 2, categoryIds);
      if ('kind' in prepared) {
        if (prepared.kind === 'invalid') {
          invalid += 1;
        } else {
          ambiguous += 1;
        }
        continue;
      }
      const existing = findExisting.get(sourceName, prepared.rowNumber, prepared.sourceHash);
      if (existing) {
        skipped += 1;
        continue;
      }
      const runRow = db.transaction(() => {
        const account = accountId(prepared.institution, prepared.accountName, prepared.currency);
        insertAccount.run(account, prepared.accountName, prepared.institution, prepared.currency);
        const transfer = prepared.legacyTransferId ? transferId(prepared.legacyTransferId) : null;
        if (prepared.legacyTransferId && transfer) {
          insertTransfer.run(transfer, prepared.legacyTransferId, sourceName);
        }
        insertTransaction.run(
          prepared.transactionId,
          account,
          prepared.bookedAt,
          prepared.valueDate,
          prepared.amountCents,
          prepared.currency,
          prepared.description,
          prepared.counterpartyName,
          prepared.bankReference,
          sourceName,
          prepared.rowNumber,
          prepared.sourceHash,
          transfer,
          prepared.legacyTransferId,
          JSON.stringify([...prepared.row]),
        );
        insertClassification.run(
          `classification-${prepared.sourceHash.slice(0, 32)}`,
          prepared.transactionId,
          prepared.economicType,
          prepared.legacySubtype,
          prepared.categoryId,
          prepared.confidence,
          `Imported from Ledger bankowy row ${prepared.rowNumber}`,
        );
      });
      try {
        runRow();
        inserted += 1;
      } catch (error) {
        if (
          error instanceof Error &&
          /UNIQUE constraint failed: bank_transactions\.id/.test(error.message)
        ) {
          ambiguous += 1;
          continue;
        }
        throw error;
      }
    }
    return {
      importId,
      spreadsheetId,
      sourceName,
      fileChecksum,
      inserted,
      skipped,
      invalid,
      ambiguous,
    };
  } finally {
    db.close();
  }
}
