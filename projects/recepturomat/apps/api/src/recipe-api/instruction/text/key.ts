import type { InstructionToken } from './types';

const polishIrregularDisplayForms: Record<string, string> = {
  cukrem: 'cukier',
  cukru: 'cukier',
  ziemniaki: 'ziemniak',
};

const inflectionSuffixes = [
  'owego',
  'owej',
  'ami',
  'ach',
  'ego',
  'emu',
  'owa',
  'owe',
  'owy',
  'ych',
  'ich',
  'cie',
  'em',
  'om',
  'ie',
  'ow',
  'a',
  'e',
  'i',
  'u',
  'y',
];

export function buildPhraseKey(value: string): string {
  return tokenizePhrase(value)
    .map(buildTokenKey)
    .filter((token) => token.length > 0)
    .join(' ');
}

export function countPhraseTokens(value: string): number {
  return tokenizePhrase(value).length;
}

export function normalizeDraftDisplayName(value: string): string {
  return tokenizePhrase(value)
    .map((token) => polishIrregularDisplayForms[normalizeTextForLookup(token)] ?? token)
    .join(' ')
    .trim();
}

export function tokenizeInstruction(
  instruction: string,
  excludedSpans: Array<{ start: number; end: number }>,
): InstructionToken[] {
  const tokens: InstructionToken[] = [];

  for (const match of instruction.matchAll(/\p{L}[\p{L}\p{M}\p{N}-]*/gu)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;

    if (excludedSpans.some((span) => start >= span.start && end <= span.end)) {
      continue;
    }

    tokens.push({
      key: buildTokenKey(match[0]),
      value: match[0],
    });
  }

  return tokens;
}

export function buildTokenKey(value: string): string {
  const normalized = normalizeTextForLookup(value);
  const stemmed = trimInflectionSuffix(normalized);

  return buildConsonantSkeleton(stemmed.length > 0 ? stemmed : normalized);
}

function tokenizePhrase(value: string): string[] {
  return [...value.matchAll(/\p{L}[\p{L}\p{M}\p{N}-]*/gu)].map((match) => match[0]);
}

function buildConsonantSkeleton(value: string): string {
  const consonantsOnly = value.replace(/[aeiouyąęó]/g, '');
  return consonantsOnly.length > 0 ? consonantsOnly : value;
}

function normalizeTextForLookup(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
}

function trimInflectionSuffix(value: string): string {
  for (const suffix of inflectionSuffixes) {
    if (value.length > suffix.length + 2 && value.endsWith(suffix)) {
      return value.slice(0, -suffix.length);
    }
  }

  return value;
}
