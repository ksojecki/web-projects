import { useCallback, useEffect, useState } from 'react';
import { getReport, type ReportSummary } from './budgetApi';
import {
  BreakdownTable,
  EmptyState,
  ErrorState,
  formatMoney,
  LoadingState,
  MetricCard,
  PageFrame,
  Section,
} from './components';

export function ReportPage() {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState('');
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [error, setError] = useState(false);
  const load = useCallback(() => {
    setError(false);
    setSummary(null);
    void getReport(Number(year), month === '' ? null : Number(month))
      .then(setSummary)
      .catch(() => setError(true));
  }, [month, year]);
  useEffect(load, [load]);
  return (
    <PageFrame
      eyebrow="Reporting"
      title="Cash-flow report"
      description="Income, expenses, and balances calculated from classifications. Transfers and technical operations stay out of cash flow."
    >
      <Section title="Period" contentClassName="flex flex-wrap items-end gap-3">
        <label className="form-control w-32">
          <span className="label-text">Year</span>
          <input
            className="input input-bordered"
            inputMode="numeric"
            value={year}
            onChange={(event) => setYear(event.target.value)}
          />
        </label>
        <label className="form-control w-44">
          <span className="label-text">Month</span>
          <select
            className="select select-bordered"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          >
            <option value="">Full year</option>
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {new Date(2000, index).toLocaleString('en', { month: 'long' })}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary" onClick={load} type="button">
          Refresh report
        </button>
      </Section>
      {error ? (
        <ErrorState onRetry={load} />
      ) : summary === null ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Income" value={formatMoney(summary.incomeCents)} tone="positive" />
            <MetricCard
              label="Expenses"
              value={formatMoney(summary.expenseCents)}
              tone="negative"
            />
            <MetricCard
              label="Balance"
              value={formatMoney(summary.balanceCents)}
              tone={summary.balanceCents >= 0 ? 'positive' : 'negative'}
            />
          </div>
          <Section
            title="Category breakdown"
            description={month === '' ? `Full year ${year}` : `${year}, month ${month}`}
          >
            <BreakdownTable items={summary.categoryBreakdown} />
          </Section>
          <Section title="Account balances">
            {summary.accountBalances.length === 0 ? (
              <EmptyState>No account balances are available for this period.</EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Type</th>
                      <th className="text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.accountBalances.map((account) => (
                      <tr key={account.id}>
                        <td className="font-medium">{account.name}</td>
                        <td className="text-base-content/60">{account.accountType}</td>
                        <td className="text-right font-mono">
                          {formatMoney(account.balanceCents, account.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </>
      )}
    </PageFrame>
  );
}
