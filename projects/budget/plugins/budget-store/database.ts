import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type Database from 'better-sqlite3';
import { budgetCategorySeedData } from './seedData.ts';
import type { BudgetDatabaseBootstrapOptions } from './types.ts';

export const BUDGET_SCHEMA_VERSION = 5;

export function resolveBudgetDatabasePath(path: string): string {
  if (path === ':memory:') {
    return path;
  }

  const resolvedPath = resolve(process.cwd(), path);
  mkdirSync(dirname(resolvedPath), { recursive: true });
  return resolvedPath;
}

export function initializeBudgetSchema(db: Database.Database): void {
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS budget_schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      institution TEXT,
      account_type TEXT NOT NULL DEFAULT 'checking',
      currency TEXT NOT NULL DEFAULT 'PLN',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS imports (
      id TEXT PRIMARY KEY,
      spreadsheet_id TEXT NOT NULL,
      file_checksum TEXT NOT NULL,
      source_name TEXT NOT NULL,
      imported_at INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE (spreadsheet_id, file_checksum)
    );

    CREATE TABLE IF NOT EXISTS transfers (
      id TEXT PRIMARY KEY,
      legacy_transfer_id TEXT NOT NULL UNIQUE,
      source TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      category_group TEXT,
      category TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_identity
      ON categories (COALESCE(category_group, ''), category, subcategory);

    CREATE TABLE IF NOT EXISTS classification_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      matcher_json TEXT NOT NULL,
      economic_type TEXT,
      category_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS bank_transactions (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      booked_at TEXT NOT NULL,
      value_date TEXT,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'PLN',
      native_amount_cents INTEGER NOT NULL DEFAULT 0,
      native_currency TEXT NOT NULL DEFAULT 'PLN',
      reporting_amount_cents INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL,
      counterparty_name TEXT,
      counterparty_account TEXT,
      bank_reference TEXT,
      legacy_source TEXT,
      legacy_row INTEGER,
      import_id TEXT,
      source_hash TEXT,
      transfer_id TEXT,
      legacy_transfer_id TEXT,
      legacy_raw_payload TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      FOREIGN KEY (transfer_id) REFERENCES transfers(id),
      CHECK (legacy_row IS NULL OR legacy_row > 0),
      CHECK ((legacy_source IS NULL) = (legacy_row IS NULL)),
      CHECK ((source_hash IS NULL) OR length(source_hash) > 0)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_transactions_source_row
      ON bank_transactions (legacy_source, legacy_row)
      WHERE legacy_source IS NOT NULL AND legacy_row IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_bank_transactions_source_hash
      ON bank_transactions (source_hash)
      WHERE source_hash IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_bank_transactions_account_date
      ON bank_transactions (account_id, booked_at);

    CREATE TABLE IF NOT EXISTS transaction_classifications (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      economic_type TEXT NOT NULL CHECK (economic_type IN (
        'income', 'expense', 'transfer', 'technical', 'excluded', 'card_repayment'
      )),
      legacy_subtype TEXT,
      category_id TEXT,
      source TEXT NOT NULL CHECK (source IN ('legacy', 'manual', 'rule', 'system')),
      confidence REAL CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
      notes TEXT,
      rule_id TEXT,
      is_current INTEGER NOT NULL DEFAULT 1 CHECK (is_current IN (0, 1)),
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (transaction_id) REFERENCES bank_transactions(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (rule_id) REFERENCES classification_rules(id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_classifications_current_transaction
      ON transaction_classifications (transaction_id)
      WHERE is_current = 1;
    CREATE INDEX IF NOT EXISTS idx_classifications_category
      ON transaction_classifications (category_id);

    CREATE TRIGGER IF NOT EXISTS trg_bank_transactions_immutable
      BEFORE UPDATE ON bank_transactions
      WHEN old.account_id IS NOT new.account_id
        OR old.booked_at IS NOT new.booked_at
        OR old.value_date IS NOT new.value_date
        OR old.amount_cents IS NOT new.amount_cents
        OR old.currency IS NOT new.currency
        OR old.description IS NOT new.description
        OR old.counterparty_name IS NOT new.counterparty_name
        OR old.counterparty_account IS NOT new.counterparty_account
        OR old.bank_reference IS NOT new.bank_reference
        OR old.legacy_source IS NOT new.legacy_source
        OR old.legacy_row IS NOT new.legacy_row
        OR old.source_hash IS NOT new.source_hash
        OR old.transfer_id IS NOT new.transfer_id
        OR old.legacy_transfer_id IS NOT new.legacy_transfer_id
      BEGIN
        SELECT RAISE(ABORT, 'bank transaction source facts are immutable');
      END;

    CREATE TRIGGER IF NOT EXISTS trg_bank_transactions_no_delete
      BEFORE DELETE ON bank_transactions
      BEGIN
        SELECT RAISE(ABORT, 'bank transaction source facts cannot be deleted');
      END;
  `);

  // Raw payload hashes are audit metadata, not transaction identity. Older
  // databases created a unique hash index; remove that constraint while
  // retaining a non-unique lookup index for diagnostics.
  db.exec(`
    DROP INDEX IF EXISTS idx_bank_transactions_source_hash;
    CREATE INDEX IF NOT EXISTS idx_bank_transactions_source_hash
      ON bank_transactions (source_hash)
      WHERE source_hash IS NOT NULL;
  `);

  // This is intentionally an additive migration. Existing local databases were
  // created before raw Ledger rows were retained, and SQLite does not apply a
  // changed CREATE TABLE statement to an existing table.
  const bankTransactionColumns = db
    .prepare<[], { name: string }>('PRAGMA table_info(bank_transactions)')
    .all();
  if (!bankTransactionColumns.some((column) => column.name === 'legacy_raw_payload')) {
    db.exec('ALTER TABLE bank_transactions ADD COLUMN legacy_raw_payload TEXT');
  }
  if (!bankTransactionColumns.some((column) => column.name === 'native_amount_cents')) {
    db.exec(
      'ALTER TABLE bank_transactions ADD COLUMN native_amount_cents INTEGER NOT NULL DEFAULT 0',
    );
  }
  if (!bankTransactionColumns.some((column) => column.name === 'native_currency')) {
    db.exec("ALTER TABLE bank_transactions ADD COLUMN native_currency TEXT NOT NULL DEFAULT 'PLN'");
  }
  if (!bankTransactionColumns.some((column) => column.name === 'reporting_amount_cents')) {
    db.exec(
      'ALTER TABLE bank_transactions ADD COLUMN reporting_amount_cents INTEGER NOT NULL DEFAULT 0',
    );
  }
  if (!bankTransactionColumns.some((column) => column.name === 'import_id')) {
    db.exec('ALTER TABLE bank_transactions ADD COLUMN import_id TEXT');
  }
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_transactions_import_row
      ON bank_transactions (import_id, legacy_row)
      WHERE import_id IS NOT NULL AND legacy_row IS NOT NULL;
  `);
  // Before schema v4 amount_cents/currency were the only amount fields. They
  // represented the source amount, and legacy rows have no separate PLN value.
  db.exec(`
    UPDATE bank_transactions
    SET native_amount_cents = amount_cents,
        native_currency = currency,
        reporting_amount_cents = amount_cents
    WHERE native_amount_cents = 0
      AND native_currency = 'PLN'
      AND (amount_cents != 0 OR currency != 'PLN');
  `);
  // Recreate the trigger after the additive column exists so raw provenance is
  // immutable on both fresh and upgraded databases.
  db.exec(`
    DROP TRIGGER IF EXISTS trg_bank_transactions_immutable;
    DROP TRIGGER IF EXISTS trg_bank_transactions_no_delete;
    CREATE TRIGGER trg_bank_transactions_immutable
      BEFORE UPDATE ON bank_transactions
      WHEN old.account_id IS NOT new.account_id
        OR old.booked_at IS NOT new.booked_at
        OR old.value_date IS NOT new.value_date
        OR old.amount_cents IS NOT new.amount_cents
        OR old.currency IS NOT new.currency
        OR old.native_amount_cents IS NOT new.native_amount_cents
        OR old.native_currency IS NOT new.native_currency
        OR old.reporting_amount_cents IS NOT new.reporting_amount_cents
        OR old.description IS NOT new.description
        OR old.counterparty_name IS NOT new.counterparty_name
        OR old.counterparty_account IS NOT new.counterparty_account
        OR old.bank_reference IS NOT new.bank_reference
        OR old.legacy_source IS NOT new.legacy_source
        OR old.legacy_row IS NOT new.legacy_row
        OR old.import_id IS NOT new.import_id
        OR old.source_hash IS NOT new.source_hash
        OR old.transfer_id IS NOT new.transfer_id
        OR old.legacy_transfer_id IS NOT new.legacy_transfer_id
        OR old.legacy_raw_payload IS NOT new.legacy_raw_payload
      BEGIN
        SELECT RAISE(ABORT, 'bank transaction source facts are immutable');
      END;
    CREATE TRIGGER trg_bank_transactions_no_delete
      BEFORE DELETE ON bank_transactions
      BEGIN
        SELECT RAISE(ABORT, 'bank transaction source facts cannot be deleted');
      END;
  `);

  const currentVersion = db.pragma('user_version', { simple: true });
  if (typeof currentVersion === 'number' && currentVersion < BUDGET_SCHEMA_VERSION) {
    db.pragma(`user_version = ${BUDGET_SCHEMA_VERSION}`);
  }
  db.prepare(`INSERT OR IGNORE INTO budget_schema_migrations (version) VALUES (?)`).run(
    BUDGET_SCHEMA_VERSION,
  );
}

export function seedBudgetCategories(db: Database.Database): void {
  const insertCategory = db.prepare(
    `INSERT INTO categories (id, category_group, category, subcategory)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        category_group = excluded.category_group,
        category = excluded.category,
        subcategory = excluded.subcategory`,
  );
  const seed = db.transaction(() => {
    for (const category of budgetCategorySeedData) {
      insertCategory.run(category.id, category.group, category.category, category.subcategory);
    }
  });
  seed();
}

export function bootstrapBudgetDatabase(
  db: Database.Database,
  options: BudgetDatabaseBootstrapOptions = { seedCategories: true },
): void {
  initializeBudgetSchema(db);
  if (options.seedCategories) {
    seedBudgetCategories(db);
  }
}
