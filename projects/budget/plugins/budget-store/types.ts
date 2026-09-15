export type BudgetEconomicType =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'technical'
  | 'excluded'
  | 'card_repayment';

export type ClassificationSource = 'legacy' | 'manual' | 'rule' | 'system';

export interface BudgetCategory {
  id: string;
  group: string | null;
  category: string;
  subcategory: string;
}

export interface Account {
  id: string;
  name: string;
  institution: string | null;
  accountType: string;
  currency: string;
}

export interface BankTransaction {
  id: string;
  accountId: string;
  bookedAt: string;
  valueDate: string | null;
  amountCents: number;
  currency: string;
  reportingAmountCents?: number;
  description: string;
  counterpartyName: string | null;
  counterpartyAccount: string | null;
  bankReference: string | null;
  legacySource: string | null;
  legacyRow: number | null;
  sourceHash: string | null;
  transferId: string | null;
  legacyTransferId: string | null;
}

export interface TransactionClassification {
  id: string;
  transactionId: string;
  economicType: BudgetEconomicType;
  legacySubtype: string | null;
  categoryId: string | null;
  source: ClassificationSource;
  confidence: number | null;
  notes: string | null;
  ruleId: string | null;
  isCurrent: boolean;
}

export interface ClassificationInput {
  id?: string;
  transactionId: string;
  economicType: BudgetEconomicType;
  legacySubtype?: string | null;
  categoryId?: string | null;
  source: ClassificationSource;
  confidence?: number | null;
  notes?: string | null;
  ruleId?: string | null;
}

export interface BankTransactionInsert extends BankTransaction {
  /** The exact parsed A:Y row, retained for audit and future replays. */
  legacyRawPayload?: string | null;
}

export interface BankTransactionInsertResult {
  transaction: BankTransaction;
  inserted: boolean;
}

export interface BudgetStore {
  listAccounts(this: void): Account[];
  listCategories(this: void): BudgetCategory[];
  getCategory(this: void, id: string): BudgetCategory | undefined;
  insertBankTransaction(
    this: void,
    transaction: BankTransactionInsert,
  ): BankTransactionInsertResult;
  getBankTransaction(this: void, id: string): BankTransaction | undefined;
  classifyTransaction(this: void, input: ClassificationInput): TransactionClassification;
  getCurrentClassification(
    this: void,
    transactionId: string,
  ): TransactionClassification | undefined;
  listTransactions(this: void, filters?: TransactionListFilters): TransactionListResult;
  getReportSummary(this: void, period: ReportPeriod): BudgetReportSummary;
}

export interface TransactionListFilters {
  year?: number;
  month?: number | null;
  accountId?: string;
  categoryId?: string;
  economicType?: BudgetEconomicType;
  page?: number;
  pageSize?: number;
}

export interface BudgetTransactionView extends BankTransaction {
  account: Account;
  classification: TransactionClassification | null;
  category: BudgetCategory | null;
}

export interface TransactionListResult {
  items: BudgetTransactionView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ReportPeriod {
  year: number;
  month: number | null;
}

export interface BudgetReportBreakdown {
  categoryId: string | null;
  group: string | null;
  category: string | null;
  subcategory: string | null;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
}

export interface BudgetAccountBalance extends Account {
  balanceCents: number;
}

export interface BudgetReportSummary {
  year: number;
  month: number | null;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  income: number;
  expenses: number;
  balance: number;
  categoryBreakdown: BudgetReportBreakdown[];
  categories: BudgetReportBreakdown[];
  accountBalances: BudgetAccountBalance[];
}

export interface BudgetStoreConfig {
  path: string;
  seedCategories?: boolean;
}

export interface BudgetDatabaseBootstrapOptions {
  seedCategories: boolean;
}

export interface AccountRow {
  id: string;
  name: string;
  institution: string | null;
  account_type: string;
  currency: string;
}

export interface CategoryWithGroupRow {
  category_id: string;
  category_group: string | null;
  category: string;
  subcategory: string;
}

export interface TransactionQueryRow extends BankTransactionRow, AccountRow {
  transaction_id_fact: string;
  classification_id: string | null;
  transaction_id: string | null;
  economic_type: BudgetEconomicType | null;
  legacy_subtype: string | null;
  category_id: string | null;
  classification_source: ClassificationSource | null;
  confidence: number | null;
  notes: string | null;
  rule_id: string | null;
  is_current: number | null;
  category_group: string | null;
  category_name: string | null;
  category_subcategory: string | null;
  account_currency?: string;
}

export interface BankTransactionRow {
  id: string;
  account_id: string;
  booked_at: string;
  value_date: string | null;
  amount_cents: number;
  currency: string;
  native_amount_cents: number;
  native_currency: string;
  reporting_amount_cents: number;
  description: string;
  counterparty_name: string | null;
  counterparty_account: string | null;
  bank_reference: string | null;
  legacy_source: string | null;
  legacy_row: number | null;
  source_hash: string | null;
  transfer_id: string | null;
  legacy_transfer_id: string | null;
}

export interface BankTransactionAuditRow extends BankTransactionRow {
  legacy_raw_payload: string | null;
}

export interface TransactionClassificationRow {
  id: string;
  transaction_id: string;
  economic_type: BudgetEconomicType;
  legacy_subtype: string | null;
  category_id: string | null;
  source: ClassificationSource;
  confidence: number | null;
  notes: string | null;
  rule_id: string | null;
  is_current: number;
}

export interface BudgetCategoryRow {
  id: string;
  category_group: string | null;
  category: string;
  subcategory: string;
}
