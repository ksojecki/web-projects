import type {
  Account,
  AccountRow,
  BankTransaction,
  BankTransactionRow,
  BudgetCategory,
  BudgetCategoryRow,
  BudgetTransactionView,
  TransactionClassification,
  TransactionClassificationRow,
  TransactionQueryRow,
} from './types';

export function mapCategoryRow(row: BudgetCategoryRow): BudgetCategory {
  return {
    id: row.id,
    group: row.category_group,
    category: row.category,
    subcategory: row.subcategory,
  };
}

export function mapTransactionRow(row: BankTransactionRow): BankTransaction {
  return {
    id: row.id,
    accountId: row.account_id,
    bookedAt: row.booked_at,
    valueDate: row.value_date,
    amountCents: row.amount_cents,
    currency: row.currency,
    description: row.description,
    counterpartyName: row.counterparty_name,
    counterpartyAccount: row.counterparty_account,
    bankReference: row.bank_reference,
    legacySource: row.legacy_source,
    legacyRow: row.legacy_row,
    sourceHash: row.source_hash,
    transferId: row.transfer_id,
    legacyTransferId: row.legacy_transfer_id,
    legacyRawPayload: row.legacy_raw_payload,
  };
}

export function mapAccountRow(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    institution: row.institution,
    accountType: row.account_type,
    currency: row.currency,
  };
}

export function mapClassificationRow(row: TransactionClassificationRow): TransactionClassification {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    economicType: row.economic_type,
    legacySubtype: row.legacy_subtype,
    categoryId: row.category_id,
    source: row.source,
    confidence: row.confidence,
    notes: row.notes,
    ruleId: row.rule_id,
    isCurrent: row.is_current === 1,
  };
}

export function mapTransactionQueryRow(row: TransactionQueryRow): BudgetTransactionView {
  const transaction = mapTransactionRow({
    id: row.transaction_id_fact,
    account_id: row.account_id,
    booked_at: row.booked_at,
    value_date: row.value_date,
    amount_cents: row.amount_cents,
    currency: row.currency,
    description: row.description,
    counterparty_name: row.counterparty_name,
    counterparty_account: row.counterparty_account,
    bank_reference: row.bank_reference,
    legacy_source: row.legacy_source,
    legacy_row: row.legacy_row,
    source_hash: row.source_hash,
    transfer_id: row.transfer_id,
    legacy_transfer_id: row.legacy_transfer_id,
    legacy_raw_payload: row.legacy_raw_payload,
  });
  const account = mapAccountRow({
    id: row.account_id,
    name: row.name,
    institution: row.institution,
    account_type: row.account_type,
    currency: row.currency,
  });
  const classification =
    row.classification_id === null
      ? null
      : {
          id: row.classification_id,
          transactionId: row.transaction_id ?? transaction.id,
          economicType: row.economic_type!,
          legacySubtype: row.legacy_subtype,
          categoryId: row.category_id,
          source: row.classification_source!,
          confidence: row.confidence,
          notes: row.notes,
          ruleId: row.rule_id,
          isCurrent: row.is_current === 1,
        };
  const category =
    row.category_id === null
      ? null
      : {
          id: row.category_id,
          group: row.category_group,
          category: row.category_name!,
          subcategory: row.category_subcategory!,
        };
  return { ...transaction, account, classification, category };
}
