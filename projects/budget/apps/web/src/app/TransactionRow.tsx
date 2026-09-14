import type { Category, EconomicType, Transaction } from './budgetApi';
import { formatMoney } from './components';

const types: EconomicType[] = [
  'income',
  'expense',
  'transfer',
  'technical',
  'excluded',
  'card_repayment',
];

export function TransactionRow({
  transaction,
  categories,
  editing,
  onEdit,
  onCancel,
  onSave,
  saving,
}: {
  transaction: Transaction;
  categories: Category[];
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (form: HTMLFormElement) => void;
  saving: boolean;
}) {
  return (
    <>
      <tr>
        <td className="whitespace-nowrap">
          {new Date(transaction.bookedAt).toLocaleDateString('en-GB')}
        </td>
        <td>
          <span
            className="block max-w-[18rem] truncate font-medium"
            title={transaction.description}
          >
            {transaction.description}
          </span>
          {transaction.counterpartyName ? (
            <span className="text-xs text-base-content/55">{transaction.counterpartyName}</span>
          ) : null}
        </td>
        <td>{transaction.account.name}</td>
        <td>
          {transaction.classification ? (
            <>
              <span className="badge badge-outline">{transaction.classification.economicType}</span>
              <span className="mt-1 block text-xs text-base-content/55">
                {transaction.category
                  ? `${transaction.category.category} / ${transaction.category.subcategory}`
                  : 'Uncategorized'}
              </span>
            </>
          ) : (
            <span className="text-sm text-base-content/45">Unclassified</span>
          )}
        </td>
        <td
          className={`text-right font-mono ${transaction.amountCents >= 0 ? 'text-success' : 'text-error'}`}
        >
          {formatMoney(transaction.amountCents, transaction.currency)}
        </td>
        <td className="text-right">
          <button
            aria-label={`${transaction.classification ? 'Edit' : 'Classify'} ${transaction.description}`}
            className="btn btn-ghost btn-sm"
            onClick={onEdit}
            type="button"
          >
            {transaction.classification ? 'Edit' : 'Classify'}
          </button>
        </td>
      </tr>
      {editing ? (
        <tr>
          <td aria-label="Classification editor" colSpan={6}>
            <form
              className="grid gap-3 rounded-box bg-base-200 p-4 sm:grid-cols-[1fr_1.5fr_2fr_auto_auto] sm:items-end"
              onSubmit={(event) => {
                event.preventDefault();
                onSave(event.currentTarget);
              }}
            >
              <label className="form-control">
                <span className="label-text">Economic type</span>
                <select
                  aria-label="Economic type"
                  className="select select-bordered select-sm"
                  defaultValue={transaction.classification?.economicType ?? 'expense'}
                  name="economicType"
                >
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
                  aria-label="Category"
                  className="select select-bordered select-sm"
                  defaultValue={transaction.classification?.categoryId ?? ''}
                  name="categoryId"
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.category} / {category.subcategory}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-control">
                <span className="label-text">Note</span>
                <input
                  aria-label="Note"
                  className="input input-bordered input-sm"
                  defaultValue={transaction.classification?.notes ?? ''}
                  name="notes"
                />
              </label>
              <button className="btn btn-primary btn-sm" disabled={saving} type="submit">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={onCancel} type="button">
                Cancel
              </button>
            </form>
          </td>
        </tr>
      ) : null}
    </>
  );
}
