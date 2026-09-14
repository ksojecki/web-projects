import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { frontendProductConfig } from './productConfig';
import type { Breakdown } from './budgetApi';

export function formatMoney(cents: number, currency = 'PLN'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function PageFrame({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="rounded-box border border-base-300 bg-base-100 p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-2xl text-base-content/65">{description}</p>
      </header>
      {children}
    </div>
  );
}

export function LoadingState({ label = 'Loading your budget…' }: { label?: string }) {
  return (
    <output className="flex items-center gap-3 rounded-box border border-base-300 bg-base-100 p-8 text-base-content/65">
      <span className="loading loading-spinner loading-sm" />
      {label}
    </output>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="alert alert-error" role="alert">
      <span>We could not load this budget view.</span>
      {onRetry ? (
        <button className="btn btn-sm" onClick={onRetry} type="button">
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-box border border-dashed border-base-300 p-8 text-center text-base-content/60">
      {children}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'positive' | 'negative' | 'neutral';
}) {
  return (
    <section className="card border border-base-200 bg-base-100 shadow-sm">
      <div className="card-body gap-2 p-5">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-base-content/50">
          {label}
        </p>
        <p
          className={`font-mono text-2xl font-semibold ${tone === 'positive' ? 'text-success' : tone === 'negative' ? 'text-error' : ''}`}
        >
          {value}
        </p>
      </div>
    </section>
  );
}

export function BreakdownTable({ items }: { items: Breakdown[] }) {
  if (items.length === 0) {
    return <EmptyState>No classified income or expenses for this period.</EmptyState>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>Category</th>
            <th className="text-right">Income</th>
            <th className="text-right">Expenses</th>
            <th className="text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.categoryId ?? 'uncategorized'}>
              <td>
                <span className="font-medium">{item.category ?? 'Uncategorized'}</span>
                {item.subcategory ? (
                  <span className="block text-xs text-base-content/55">{item.subcategory}</span>
                ) : null}
              </td>
              <td className="text-right font-mono text-success">
                {item.incomeCents ? formatMoney(item.incomeCents) : '—'}
              </td>
              <td className="text-right font-mono text-error">
                {item.expenseCents ? formatMoney(item.expenseCents) : '—'}
              </td>
              <td className="text-right font-mono">{formatMoney(item.balanceCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function QuickLinks() {
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      <Link className="link link-primary" to={frontendProductConfig.routes.transactions}>
        Review transactions
      </Link>
      <span aria-hidden="true">·</span>
      <Link className="link link-primary" to={frontendProductConfig.routes.report}>
        Open report
      </Link>
    </div>
  );
}

export function Section({
  title,
  description,
  actions,
  children,
  contentClassName = '',
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <section className="rounded-box border border-base-300 bg-base-100 p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {description ? <p className="mt-1 text-sm text-base-content/60">{description}</p> : null}
        </div>
        {actions}
      </div>
      <div className={`mt-5 ${contentClassName}`}>{children}</div>
    </section>
  );
}
