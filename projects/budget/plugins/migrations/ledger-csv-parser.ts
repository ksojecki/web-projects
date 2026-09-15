import type { BudgetEconomicType } from '../budget-store/types.ts';

export const LEDGER_HEADERS = [
  'Data transakcji',
  'Data księgowania',
  'Bank',
  'Konto',
  'Typ',
  'Podtyp',
  'Kwota',
  'Waluta',
  'Kwota PLN',
  'Kontrahent',
  'Tytuł',
  'Szczegóły',
  'ID transakcji',
  'Transfer ID',
  'Pewność',
  'Kwota obca',
  'Waluta obca',
  'Źródło',
  'Kategoria',
  'Podkategoria',
  'Źródło kategorii',
  'Pewność kategorii',
  'Opis z e-maila',
  'Źródło e-maila',
  'ID e-maila',
] as const;

export type LedgerRow = readonly string[];

export class LedgerCsvError extends Error {}

export const text = (value: string | undefined): string => value?.trim() ?? '';

/** Parse RFC 4180 CSV, including quoted separators and newlines. */
export function parseLedgerCsv(input: string): LedgerRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
    } else if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && input[index + 1] === '\n') {
        index += 1;
      }
      row.push(field);
      field = '';
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
    } else {
      field += character;
    }
  }
  if (quoted) {
    throw new LedgerCsvError('CSV contains an unterminated quoted field.');
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((value) => value.length > 0)) {
      rows.push(row);
    }
  }
  return rows;
}

export function normalizeLedgerHeader(header: LedgerRow): string[] {
  return header.map((value, index) => (index === 0 ? value.replace(/^\uFEFF/, '') : value));
}

export function parseLedgerDate(value: string): string | undefined {
  const candidate = text(value);
  let match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/.exec(candidate);
  let year: number;
  let month: number;
  let day: number;
  if (match) {
    [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else {
    match = /^(\d{2})[./-](\d{2})[./-](\d{4})$/.exec(candidate);
    if (!match) {
      return undefined;
    }
    [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

export function parseLedgerAmount(value: string): number | undefined {
  let candidate = text(value).replace(/[\u00a0\s]/g, '');
  if (!candidate) {
    return undefined;
  }
  if (candidate.startsWith('(') && candidate.endsWith(')')) {
    candidate = `-${candidate.slice(1, -1)}`;
  }
  candidate = candidate.replace(/[^\d,.-]/g, '');
  const comma = candidate.lastIndexOf(',');
  const dot = candidate.lastIndexOf('.');
  if (comma >= 0 && dot >= 0) {
    const decimal = Math.max(comma, dot);
    candidate = `${candidate.slice(0, decimal).replace(/[.,]/g, '')}.${candidate.slice(decimal + 1)}`;
  } else if (comma >= 0) {
    candidate = candidate.replace(',', '.');
  }
  if (!/^[-+]?\d+(?:\.\d+)?$/.test(candidate)) {
    return undefined;
  }
  const cents = Math.round(Number(candidate) * 100);
  return Number.isSafeInteger(cents) ? cents : undefined;
}

export function parseLedgerCurrency(value: string): string | undefined {
  const currency = text(value).toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : undefined;
}

export function parseLedgerConfidence(value: string): number | null {
  const candidate = text(value);
  if (!candidate) {
    return null;
  }
  const number = Number(candidate.replace(',', '.').replace('%', ''));
  const confidence = candidate.includes('%') ? number / 100 : number;
  return Number.isFinite(confidence) && confidence >= 0 && confidence <= 1 ? confidence : null;
}

function normalizeType(value: string): string {
  return text(value)
    .replace(/Ł/g, 'L')
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[ -]+/g, '_');
}

export function mapLedgerEconomicType(value: string): BudgetEconomicType | undefined {
  switch (normalizeType(value)) {
    case 'PRZYCHOD':
    case 'DOCHOD':
    case 'INCOME':
    case 'WPLATA':
      return 'income';
    case 'WYDATEK':
    case 'KOSZT':
    case 'EXPENSE':
    case 'PLATNOSC':
    case 'WYPLATA':
      return 'expense';
    case 'TRANSFER_WEWNETRZNY':
    case 'TRANSFER_INTERNAL':
    case 'TRANSFER':
      return 'transfer';
    case 'SPLATA_KARTY':
    case 'CARD_REPAYMENT':
      return 'card_repayment';
    case 'OPERACJA_TECHNICZNA':
    case 'OPERACJE_TECHNICZNE':
    case 'TECHNICAL':
    case 'TECHNICZNA':
      return 'technical';
    case 'WYLACZONE':
    case 'WYLACZONY':
    case 'EXCLUDED':
      return 'excluded';
    default:
      return undefined;
  }
}
