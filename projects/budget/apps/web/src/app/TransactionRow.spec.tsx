import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Transaction } from './budgetApi';
import { TransactionRow } from './TransactionRow';

const transaction: Transaction = {
  id: 'tx-1',
  accountId: 'main',
  bookedAt: '2026-01-10',
  valueDate: null,
  amountCents: -12000,
  currency: 'PLN',
  description: 'Grocery shop',
  counterpartyName: null,
  counterpartyAccount: null,
  bankReference: null,
  legacySource: null,
  legacyRow: null,
  sourceHash: null,
  transferId: null,
  legacyTransferId: null,
  account: {
    id: 'main',
    name: 'Main account',
    institution: null,
    accountType: 'checking',
    currency: 'PLN',
  },
  classification: null,
  category: null,
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('TransactionRow', () => {
  it('renders date-only booked dates without timezone drift', () => {
    vi.stubEnv('TZ', 'America/Los_Angeles');

    render(
      <table>
        <tbody>
          <TransactionRow
            categories={[]}
            editing={false}
            onCancel={() => undefined}
            onEdit={() => undefined}
            onSave={() => undefined}
            saving={false}
            transaction={transaction}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByRole('cell', { name: '10/01/2026' })).toBeInTheDocument();
  });
});
