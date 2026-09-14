import { useCallback, useEffect, useState } from 'react';
import {
  listAccounts,
  listCategories,
  listTransactions,
  updateClassification,
  type Account,
  type Category,
  type EconomicType,
  type Transaction,
  type TransactionFilters,
} from './budgetApi';
import { EmptyState, ErrorState, LoadingState, PageFrame, Section } from './components';
import { TransactionRow } from './TransactionRow';

const types: EconomicType[] = [
  'income',
  'expense',
  'transfer',
  'technical',
  'excluded',
  'card_repayment',
];

export function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    pageSize: 20,
    year: String(new Date().getFullYear()),
  });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [data, setData] = useState<{
    items: Transaction[];
    total: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    void Promise.all([listTransactions(filters), listAccounts(), listCategories()])
      .then(([page, nextAccounts, nextCategories]) => {
        setData(page);
        setAccounts(nextAccounts);
        setCategories(nextCategories);
        return page;
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [filters]);
  useEffect(load, [load]);

  const updateFilter = (key: keyof TransactionFilters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value || undefined, page: 1 }));

  async function save(transaction: Transaction, form: HTMLFormElement) {
    const values = new FormData(form);
    setSaving(true);
    try {
      await updateClassification(transaction.id, {
        economicType: readEconomicType(readString(values.get('economicType'))),
        categoryId: readString(values.get('categoryId')) || null,
        notes: readString(values.get('notes')) || undefined,
      });
      setEditing(null);
      load();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageFrame
      eyebrow="Ledger"
      title="Transactions"
      description="Review imported bank facts and refine their economic classification."
    >
      <Section title="Filter ledger" contentClassName="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="form-control">
          <span className="label-text">Year</span>
          <input
            className="input input-bordered"
            value={filters.year ?? ''}
            onChange={(event) => updateFilter('year', event.target.value)}
            inputMode="numeric"
          />
        </label>
        <label className="form-control">
          <span className="label-text">Month</span>
          <select
            className="select select-bordered"
            value={filters.month ?? ''}
            onChange={(event) => updateFilter('month', event.target.value)}
          >
            <option value="">All months</option>
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {new Date(2000, index).toLocaleString('en', { month: 'long' })}
              </option>
            ))}
          </select>
        </label>
        <label className="form-control">
          <span className="label-text">Account</span>
          <select
            className="select select-bordered"
            value={filters.accountId ?? ''}
            onChange={(event) => updateFilter('accountId', event.target.value)}
          >
            <option value="">All accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
        <label className="form-control">
          <span className="label-text">Type</span>
          <select
            className="select select-bordered"
            value={filters.type ?? ''}
            onChange={(event) => updateFilter('type', event.target.value)}
          >
            <option value="">All types</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="form-control">
          <span className="label-text">Category</span>
          <select
            className="select select-bordered"
            value={filters.categoryId ?? ''}
            onChange={(event) => updateFilter('categoryId', event.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.category} / {category.subcategory}
              </option>
            ))}
          </select>
        </label>
      </Section>
      {error ? (
        <ErrorState onRetry={load} />
      ) : loading ? (
        <LoadingState />
      ) : (
        <Section
          title={
            <span>
              Imported activity{' '}
              <span className="text-sm font-normal text-base-content/50">
                {data?.total ?? 0} records
              </span>
            </span>
          }
        >
          {data?.items.length === 0 ? (
            <EmptyState>No transactions match these filters.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Account</th>
                    <th>Classification</th>
                    <th className="text-right">Amount</th>
                    <th>
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items.map((transaction) => (
                    <TransactionRow
                      categories={categories}
                      editing={editing === transaction.id}
                      key={transaction.id}
                      onEdit={() => setEditing(transaction.id)}
                      onCancel={() => setEditing(null)}
                      onSave={(form) => void save(transaction, form)}
                      saving={saving}
                      transaction={transaction}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {(data?.totalPages ?? 0) > 1 ? (
            <div className="mt-5 flex items-center justify-between text-sm">
              <span>
                Page {filters.page} of {data?.totalPages}
              </span>
              <div className="join">
                <button
                  className="btn join-item"
                  disabled={(filters.page ?? 1) <= 1}
                  onClick={() =>
                    setFilters((current) => ({ ...current, page: (current.page ?? 1) - 1 }))
                  }
                  type="button"
                >
                  Previous
                </button>
                <button
                  className="btn join-item"
                  disabled={(filters.page ?? 1) >= (data?.totalPages ?? 1)}
                  onClick={() =>
                    setFilters((current) => ({ ...current, page: (current.page ?? 1) + 1 }))
                  }
                  type="button"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </Section>
      )}
    </PageFrame>
  );
}

function readString(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value : '';
}

function readEconomicType(value: string): EconomicType {
  return types.find((type) => type === value) ?? 'expense';
}
