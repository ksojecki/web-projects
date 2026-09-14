import { JSON_HEADERS, requestJson } from '@ksojecki/platform-web-platform';

export type EconomicType =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'technical'
  | 'excluded'
  | 'card_repayment';

export interface Account {
  id: string;
  name: string;
  institution: string | null;
  accountType: string;
  currency: string;
}

export interface Category {
  id: string;
  group: string | null;
  category: string;
  subcategory: string;
}

export interface Classification {
  id: string;
  transactionId: string;
  economicType: EconomicType;
  legacySubtype: string | null;
  categoryId: string | null;
  source: 'legacy' | 'manual' | 'rule' | 'system';
  confidence: number | null;
  notes: string | null;
  ruleId: string | null;
  isCurrent: boolean;
}

export interface Transaction {
  id: string;
  accountId: string;
  bookedAt: string;
  valueDate: string | null;
  amountCents: number;
  currency: string;
  description: string;
  counterpartyName: string | null;
  counterpartyAccount: string | null;
  bankReference: string | null;
  legacySource: string | null;
  legacyRow: number | null;
  sourceHash: string | null;
  transferId: string | null;
  legacyTransferId: string | null;
  account: Account;
  classification: Classification | null;
  category: Category | null;
}

export interface TransactionPage {
  items: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Breakdown {
  categoryId: string | null;
  group: string | null;
  category: string | null;
  subcategory: string | null;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
}

export interface ReportSummary {
  year: number;
  month: number | null;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  income: number;
  expenses: number;
  balance: number;
  categoryBreakdown: Breakdown[];
  categories: Breakdown[];
  accountBalances: Array<Account & { balanceCents: number }>;
}

export interface TransactionFilters {
  year?: string;
  month?: string;
  accountId?: string;
  categoryId?: string;
  type?: EconomicType;
  page?: number;
  pageSize?: number;
}

export async function listTransactions(filters: TransactionFilters = {}): Promise<TransactionPage> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });
  return requestJson<TransactionPage>(`/api/transactions?${params.toString()}`);
}

export async function listAccounts(): Promise<Account[]> {
  return requestJson<Account[]>('/api/accounts');
}

export async function listCategories(): Promise<Category[]> {
  return requestJson<Category[]>('/api/categories');
}

export async function getReport(year: number, month?: number | null): Promise<ReportSummary> {
  const monthQuery = month === undefined ? '' : `&month=${month === null ? 'null' : String(month)}`;
  return requestJson<ReportSummary>(`/api/reports/summary?year=${String(year)}${monthQuery}`);
}

export async function updateClassification(
  transactionId: string,
  input: { economicType: EconomicType; categoryId: string | null; notes?: string },
): Promise<Classification> {
  return requestJson<Classification>(`/api/transactions/${transactionId}/classification`, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
}
