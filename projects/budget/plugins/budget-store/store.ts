import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import { getReportSummary, listTransactions } from './queries';
import { mapAccountRow, mapCategoryRow, mapClassificationRow, mapTransactionRow } from './mappers';
import type {
  AccountRow,
  BankTransactionAuditRow,
  BankTransactionInsert,
  BankTransactionInsertResult,
  BudgetCategoryRow,
  BudgetStore,
  ClassificationInput,
  TransactionClassificationRow,
} from './types';

export function createBudgetStore(db: Database.Database): BudgetStore {
  const listAccountsStatement = db.prepare<[], AccountRow>(
    'SELECT id, name, institution, account_type, currency FROM accounts ORDER BY name, id',
  );
  const listCategoriesStatement = db.prepare<[], BudgetCategoryRow>(
    'SELECT id, category_group, category, subcategory FROM categories ORDER BY category, subcategory, id',
  );
  const getCategoryStatement = db.prepare<[string], BudgetCategoryRow>(
    'SELECT id, category_group, category, subcategory FROM categories WHERE id = ?',
  );
  const transactionColumns = `id, account_id, booked_at, value_date, amount_cents, currency,
    native_amount_cents, native_currency, reporting_amount_cents, description,
    counterparty_name, counterparty_account, bank_reference, legacy_source, legacy_row,
    source_hash, transfer_id, legacy_transfer_id, legacy_raw_payload`;
  const getTransactionStatement = db.prepare<[string], BankTransactionAuditRow>(
    `SELECT ${transactionColumns} FROM bank_transactions WHERE id = ?`,
  );
  const findExistingTransactionStatement = db.prepare<
    [string | null, number | null],
    BankTransactionAuditRow
  >(
    `SELECT ${transactionColumns} FROM bank_transactions
      WHERE legacy_source = ? AND legacy_row = ? LIMIT 1`,
  );
  const insertTransactionStatement = db.prepare(`INSERT INTO bank_transactions (
      id, account_id, booked_at, value_date, amount_cents, currency,
      native_amount_cents, native_currency, reporting_amount_cents, description,
      counterparty_name, counterparty_account, bank_reference, legacy_source, legacy_row,
      source_hash, transfer_id, legacy_transfer_id, legacy_raw_payload
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`);
  const getCurrentClassificationStatement = db.prepare<[string], TransactionClassificationRow>(
    `SELECT id, transaction_id, economic_type, legacy_subtype, category_id, source, confidence, notes, rule_id, is_current
      FROM transaction_classifications WHERE transaction_id = ? AND is_current = 1`,
  );
  const retireClassificationStatement = db.prepare<[string]>(
    'UPDATE transaction_classifications SET is_current = 0 WHERE transaction_id = ? AND is_current = 1',
  );
  const insertClassificationStatement = db.prepare(`INSERT INTO transaction_classifications (
      id, transaction_id, economic_type, legacy_subtype, category_id, source, confidence, notes, rule_id, is_current
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`);

  function getBankTransaction(id: string) {
    const row = getTransactionStatement.get(id);
    return row === undefined ? undefined : mapTransactionRow(row);
  }
  function getCurrentClassification(transactionId: string) {
    const row = getCurrentClassificationStatement.get(transactionId);
    return row === undefined ? undefined : mapClassificationRow(row);
  }
  function insertBankTransaction(transaction: BankTransactionInsert): BankTransactionInsertResult {
    const existingById = getTransactionStatement.get(transaction.id);
    if (existingById !== undefined) {
      return { transaction: mapTransactionRow(existingById), inserted: false };
    }
    const existing = findExistingTransactionStatement.get(
      transaction.legacySource,
      transaction.legacyRow,
    );
    if (existing !== undefined) {
      return { transaction: mapTransactionRow(existing), inserted: false };
    }
    insertTransactionStatement.run(
      transaction.id,
      transaction.accountId,
      transaction.bookedAt,
      transaction.valueDate,
      transaction.amountCents,
      transaction.currency,
      transaction.amountCents,
      transaction.currency,
      transaction.reportingAmountCents ?? transaction.amountCents,
      transaction.description,
      transaction.counterpartyName,
      transaction.counterpartyAccount,
      transaction.bankReference,
      transaction.legacySource,
      transaction.legacyRow,
      transaction.sourceHash,
      transaction.transferId,
      transaction.legacyTransferId,
      transaction.legacyRawPayload ?? null,
    );
    const stored = getBankTransaction(transaction.id);
    if (stored === undefined) {
      throw new Error('Bank transaction insert failed.');
    }
    return { transaction: stored, inserted: true };
  }
  function classifyTransaction(input: ClassificationInput) {
    const id = input.id ?? randomUUID();
    db.transaction(() => {
      retireClassificationStatement.run(input.transactionId);
      insertClassificationStatement.run(
        id,
        input.transactionId,
        input.economicType,
        input.legacySubtype ?? null,
        input.categoryId ?? null,
        input.source,
        input.confidence ?? null,
        input.notes ?? null,
        input.ruleId ?? null,
      );
    })();
    const stored = db
      .prepare<[string], TransactionClassificationRow>(
        `SELECT id, transaction_id, economic_type, legacy_subtype, category_id, source, confidence, notes, rule_id, is_current FROM transaction_classifications WHERE id = ?`,
      )
      .get(id);
    if (stored === undefined) {
      throw new Error('Transaction classification insert failed.');
    }
    return mapClassificationRow(stored);
  }
  return {
    listAccounts: () => listAccountsStatement.all().map(mapAccountRow),
    listCategories: () => listCategoriesStatement.all().map(mapCategoryRow),
    getCategory: (id) => {
      const row = getCategoryStatement.get(id);
      return row === undefined ? undefined : mapCategoryRow(row);
    },
    insertBankTransaction,
    getBankTransaction,
    classifyTransaction,
    getCurrentClassification,
    listTransactions: (filters) => listTransactions(db, filters),
    getReportSummary: (period) => getReportSummary(db, period),
  };
}
