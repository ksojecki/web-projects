import type Database from 'better-sqlite3';
import type {
  BudgetAccountBalance,
  BudgetReportSummary,
  ReportPeriod,
  TransactionListFilters,
  TransactionListResult,
  TransactionQueryRow,
} from './types';
import { mapAccountRow, mapTransactionQueryRow } from './mappers';

const transactionFrom = `
  FROM bank_transactions t
  JOIN accounts a ON a.id = t.account_id
  LEFT JOIN transaction_classifications c
    ON c.transaction_id = t.id AND c.is_current = 1
  LEFT JOIN categories cat ON cat.id = c.category_id`;

const transactionSelect = `
  SELECT t.id AS transaction_id_fact, t.account_id, t.booked_at, t.value_date, t.amount_cents, t.currency,
    t.description, t.counterparty_name, t.counterparty_account, t.bank_reference,
    t.legacy_source, t.legacy_row, t.source_hash, t.transfer_id, t.legacy_transfer_id,
    t.legacy_raw_payload, a.name, a.institution, a.account_type, a.currency,
    c.id AS classification_id, c.transaction_id, c.economic_type, c.legacy_subtype,
    c.category_id, c.source AS classification_source, c.confidence, c.notes, c.rule_id,
    c.is_current, cat.category_group, cat.category AS category_name,
    cat.subcategory AS category_subcategory`;

export function listTransactions(
  db: Database.Database,
  filters: TransactionListFilters = {},
): TransactionListResult {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 25;
  const where: string[] = [];
  const parameters: unknown[] = [];
  if (filters.year !== undefined) {
    where.push('substr(t.booked_at, 1, 4) = ?');
    parameters.push(String(filters.year).padStart(4, '0'));
  }
  if (filters.month !== undefined && filters.month !== null) {
    where.push('substr(t.booked_at, 6, 2) = ?');
    parameters.push(String(filters.month).padStart(2, '0'));
  }
  if (filters.accountId !== undefined) {
    where.push('t.account_id = ?');
    parameters.push(filters.accountId);
  }
  if (filters.categoryId !== undefined) {
    where.push('c.category_id = ?');
    parameters.push(filters.categoryId);
  }
  if (filters.economicType !== undefined) {
    where.push('c.economic_type = ?');
    parameters.push(filters.economicType);
  }
  const whereSql = where.length === 0 ? '' : ` WHERE ${where.join(' AND ')}`;
  const total =
    db
      .prepare<unknown[], { count: number }>(
        `SELECT COUNT(*) AS count ${transactionFrom}${whereSql}`,
      )
      .get(...parameters)?.count ?? 0;
  const offset = (page - 1) * pageSize;
  const rows = db
    .prepare<unknown[], TransactionQueryRow>(
      `${transactionSelect}${transactionFrom}${whereSql}
      ORDER BY t.booked_at DESC, t.id DESC LIMIT ? OFFSET ?`,
    )
    .all(...parameters, pageSize, offset);
  return {
    items: rows.map(mapTransactionQueryRow),
    total,
    page,
    pageSize,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  };
}

export function getReportSummary(db: Database.Database, period: ReportPeriod): BudgetReportSummary {
  const where = ['substr(t.booked_at, 1, 4) = ?'];
  const parameters: unknown[] = [String(period.year).padStart(4, '0')];
  if (period.month !== null) {
    where.push('substr(t.booked_at, 6, 2) = ?');
    parameters.push(String(period.month).padStart(2, '0'));
  }
  const rows = db
    .prepare<unknown[], TransactionQueryRow>(
      `${transactionSelect}${transactionFrom} WHERE ${where.join(' AND ')}`,
    )
    .all(...parameters);
  let incomeCents = 0;
  let expenseCents = 0;
  const breakdowns = new Map<string, BudgetReportSummary['categoryBreakdown'][number]>();
  const accountBalances = new Map<string, BudgetAccountBalance>();
  for (const account of db
    .prepare<[], Parameters<typeof mapAccountRow>[0]>(
      'SELECT id, name, institution, account_type, currency FROM accounts ORDER BY name, id',
    )
    .all()
    .map(mapAccountRow)) {
    accountBalances.set(account.id, { ...account, balanceCents: 0 });
  }
  for (const row of rows) {
    const account = accountBalances.get(row.account_id);
    if (account !== undefined) {
      account.balanceCents += row.amount_cents;
    }
    if (row.economic_type !== 'income' && row.economic_type !== 'expense') {
      continue;
    }
    const amount = Math.abs(row.amount_cents);
    if (row.economic_type === 'income') {
      incomeCents += amount;
    } else {
      expenseCents += amount;
    }
    const key = row.category_id ?? '__uncategorized__';
    const current = breakdowns.get(key) ?? {
      categoryId: row.category_id,
      group: row.category_group,
      category: row.category_name,
      subcategory: row.category_subcategory,
      incomeCents: 0,
      expenseCents: 0,
      balanceCents: 0,
    };
    if (row.economic_type === 'income') {
      current.incomeCents += amount;
    } else {
      current.expenseCents += amount;
    }
    current.balanceCents = current.incomeCents - current.expenseCents;
    breakdowns.set(key, current);
  }
  const categoryBreakdown = Array.from(breakdowns.values()).reduce<
    typeof breakdowns extends Map<string, infer V> ? V[] : never
  >((sorted, item) => {
    const index = sorted.findIndex(
      (entry) => (entry.category ?? '').localeCompare(item.category ?? '') > 0,
    );
    sorted.splice(index < 0 ? sorted.length : index, 0, item);
    return sorted;
  }, []);
  const sortedAccounts = Array.from(accountBalances.values()).reduce<BudgetAccountBalance[]>(
    (sorted, item) => {
      const index = sorted.findIndex((entry) => entry.name.localeCompare(item.name) > 0);
      sorted.splice(index < 0 ? sorted.length : index, 0, item);
      return sorted;
    },
    [],
  );
  return {
    year: period.year,
    month: period.month,
    incomeCents,
    expenseCents,
    balanceCents: incomeCents - expenseCents,
    income: incomeCents,
    expenses: expenseCents,
    balance: incomeCents - expenseCents,
    categoryBreakdown,
    categories: categoryBreakdown,
    accountBalances: sortedAccounts,
  };
}
