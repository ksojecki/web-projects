import { useEffect, useState } from 'react';
import { listAccounts, type Account } from './budgetApi';
import { EmptyState, ErrorState, LoadingState, PageFrame, Section } from './components';

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [error, setError] = useState(false);
  const load = () => {
    setError(false);
    void listAccounts()
      .then(setAccounts)
      .catch(() => setError(true));
  };
  useEffect(load, []);
  return (
    <PageFrame
      eyebrow="Ledger"
      title="Accounts"
      description="Accounts detected in the imported ledger."
    >
      {error ? (
        <ErrorState onRetry={load} />
      ) : accounts === null ? (
        <LoadingState />
      ) : (
        <Section title="Your accounts">
          {accounts.length === 0 ? (
            <EmptyState>No accounts imported yet.</EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {accounts.map((account) => (
                <article
                  className="rounded-box border border-base-200 bg-base-200/40 p-5"
                  key={account.id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-semibold">{account.name}</h2>
                      <p className="mt-1 text-sm text-base-content/60">
                        {account.institution ?? account.accountType}
                      </p>
                    </div>
                    <span className="badge badge-ghost">{account.currency}</span>
                  </div>
                  <p className="mt-6 font-mono text-sm text-base-content/60">
                    Balance is calculated in the report from imported transactions.
                  </p>
                  <p className="mt-1 text-xs text-base-content/50">Account ID: {account.id}</p>
                </article>
              ))}
            </div>
          )}
        </Section>
      )}
    </PageFrame>
  );
}
