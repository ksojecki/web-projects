import type { DraftRecipeIngredient } from './instruction-parser';
import type {
  ExplicitMention,
  InstructionMatch,
  InstructionToken,
  KnownReference,
} from './instruction-parser.helpers';

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

const candidateBreakers = new Set(
  [
    'a',
    'aby',
    'and',
    'by',
    'd',
    'dla',
    'do',
    'for',
    'i',
    'into',
    'na',
    'nad',
    'or',
    'oraz',
    'po',
    'pod',
    'then',
    'to',
    'w',
    'we',
    'with',
    'z',
    'za',
    'ze',
  ].map(buildTokenKey),
);

const triggerVerbs = new Set(
  [
    'add',
    'combine',
    'dodac',
    'dodaj',
    'fold',
    'mix',
    'polacz',
    'pour',
    'posyp',
    'sprinkle',
    'stir',
    'use',
    'uzyj',
    'whisk',
    'wlej',
    'wmieszaj',
    'wsyp',
    'wymieszaj',
  ].map(buildTokenKey),
);

export function collectPlainTextCandidates(
  tokens: InstructionToken[],
  matchedRanges: InstructionMatch[],
): string[] {
  const matchedIndices = new Set<number>();

  for (const match of matchedRanges) {
    for (let index = match.startIndex; index <= match.endIndex; index += 1) {
      matchedIndices.add(index);
    }
  }

  const candidates: string[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (!triggerVerbs.has(token.key)) {
      continue;
    }

    const candidateTokens: InstructionToken[] = [];

    for (let candidateIndex = index + 1; candidateIndex < tokens.length; candidateIndex += 1) {
      const candidateToken = tokens[candidateIndex];

      if (matchedIndices.has(candidateIndex) || candidateBreakers.has(candidateToken.key)) {
        break;
      }

      if (candidateToken.key.length < 2) {
        break;
      }

      candidateTokens.push(candidateToken);

      if (candidateTokens.length === 3) {
        break;
      }
    }

    if (candidateTokens.length > 0) {
      candidates.push(candidateTokens.map((candidateToken) => candidateToken.value).join(' '));
    }
  }

  return candidates;
}

export function buildPhraseKey(value: string): string {
  return tokenizePhrase(value)
    .map(buildTokenKey)
    .filter((token) => token.length > 0)
    .join(' ');
}

export function normalizeDraftDisplayName(value: string): string {
  return tokenizePhrase(value)
    .map((token) => polishIrregularDisplayForms[normalizeTextForLookup(token)] ?? token)
    .join(' ')
    .trim();
}

export function extractExplicitMentions(instruction: string): ExplicitMention[] {
  const matches = [...instruction.matchAll(/@\{([^}]+)\}|@([\p{L}\p{M}\p{N}-]+)/gu)];

  return matches.map((match) => ({
    span: {
      end: (match.index ?? 0) + match[0].length,
      start: match.index ?? 0,
    },
    value: (match[1] ?? match[2] ?? '').trim(),
  }));
}

export function sortDraftIngredients(items: DraftRecipeIngredient[]): DraftRecipeIngredient[] {
  return items.reduce<DraftRecipeIngredient[]>((sortedItems, item) => {
    const insertIndex = sortedItems.findIndex(
      (candidate) => compareDraftIngredients(item, candidate) < 0,
    );

    if (insertIndex === -1) {
      return [...sortedItems, item];
    }

    return [...sortedItems.slice(0, insertIndex), item, ...sortedItems.slice(insertIndex)];
  }, []);
}

export function findKnownReferenceMatches(
  tokens: InstructionToken[],
  references: KnownReference[],
): InstructionMatch[] {
  const matches: InstructionMatch[] = [];
  let index = 0;

  while (index < tokens.length) {
    let currentMatch: InstructionMatch | undefined;

    for (const reference of references) {
      const phraseTokens = tokens.slice(index, index + reference.tokenCount);
      const phraseKey = phraseTokens.map((token) => token.key).join(' ');

      if (phraseTokens.length === reference.tokenCount && phraseKey === reference.key) {
        currentMatch = {
          endIndex: index + reference.tokenCount - 1,
          reference,
          startIndex: index,
        };
        break;
      }
    }

    if (currentMatch === undefined) {
      index += 1;
      continue;
    }

    matches.push(currentMatch);
    index = currentMatch.endIndex + 1;
  }

  return matches;
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

export function countPhraseTokens(value: string): number {
  return tokenizePhrase(value).length;
}

function tokenizePhrase(value: string): string[] {
  return [...value.matchAll(/\p{L}[\p{L}\p{M}\p{N}-]*/gu)].map((match) => match[0]);
}

function buildTokenKey(value: string): string {
  const normalized = normalizeTextForLookup(value);
  const stemmed = trimInflectionSuffix(normalized);

  return buildConsonantSkeleton(stemmed.length > 0 ? stemmed : normalized);
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

function compareDraftIngredients(
  left: DraftRecipeIngredient,
  right: DraftRecipeIngredient,
): number {
  if (left.recipeId === undefined && right.recipeId !== undefined) {
    return -1;
  }

  if (left.recipeId !== undefined && right.recipeId === undefined) {
    return 1;
  }

  return left.name.localeCompare(right.name, 'pl');
}
