import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@ksojecki/platform-web-platform';
import { getReport, type ReportSummary } from './budgetApi';
import {
  BreakdownTable,
  ErrorState,
  formatMoney,
  LoadingState,
  MetricCard,
  PageFrame,
  QuickLinks,
  Section,
} from './components';
import { frontendProductConfig } from './productConfig';

export function HomePage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [error, setError] = useState(false);
  const year = new Date().getFullYear();
  const load = useCallback(() => {
    setError(false);
    void getReport(year, null)
      .then(setSummary)
      .catch(() => setError(true));
  }, [year]);
  useEffect(load, [load]);
  return (
    <PageFrame
      eyebrow="Budget overview"
      title={`Good to see you, ${user?.name ?? 'there'}.`}
      description="A calm view of the money that moved through your accounts."
    >
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
          <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <Section title="Where it went" description={`Classified activity in ${year}`}>
              <BreakdownTable items={summary.categoryBreakdown.slice(0, 6)} />
            </Section>
            <Section
              title="Account balances"
              description="Current ledger-derived balances"
              actions={
                <Link
                  className="link link-primary text-sm"
                  to={frontendProductConfig.routes.accounts}
                >
                  View all
                </Link>
              }
            >
              <div className="space-y-3">
                {summary.accountBalances.length === 0 ? (
                  <p className="text-base-content/60">No accounts imported yet.</p>
                ) : (
                  summary.accountBalances.map((account) => (
                    <div
                      className="flex items-center justify-between border-b border-base-200 pb-3 last:border-0 last:pb-0"
                      key={account.id}
                    >
                      <span>
                        <span className="block font-medium">{account.name}</span>
                        <span className="text-xs text-base-content/55">
                          {account.institution ?? account.accountType}
                        </span>
                      </span>
                      <span className="font-mono font-medium">
                        {formatMoney(account.balanceCents, account.currency)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Section>
          </div>
          <QuickLinks />
        </>
      )}
    </PageFrame>
  );
}
