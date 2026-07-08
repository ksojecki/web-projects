import type { Recipe, RecipeIngredient } from '../recipe-store';

export interface DraftRecipeIngredient {
  name: string;
  recipeId?: string;
}

export interface InstructionParseResult {
  draftIngredients: DraftRecipeIngredient[];
}

interface KnownReference {
  kind: 'ingredient' | 'recipe';
  name: string;
  key: string;
  recipeId?: string;
  tokenCount: number;
}

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

export function collectInstructionDraftIngredients(
  recipe: Omit<Recipe, 'recipeId'> | Recipe,
  allRecipes: Recipe[],
): InstructionParseResult {
  const knownReferences = buildKnownReferences(recipe.ingredients, allRecipes);
  const knownReferenceMap = new Map(knownReferences.map((reference) => [reference.key, reference]));
  const existingIngredientKeys = new Set(
    recipe.ingredients.map((ingredient) => buildPhraseKey(ingredient.name)),
  );
  const existingRecipeIds = new Set(
    recipe.ingredients
      .map((ingredient) => ingredient.recipeId)
      .filter((recipeId): recipeId is string => recipeId !== undefined),
  );
  const draftIngredients = new Map<string, DraftRecipeIngredient>();

  for (const instruction of recipe.instructions) {
    const explicitMentions = extractExplicitMentions(instruction);

    for (const mention of explicitMentions) {
      const key = buildPhraseKey(mention.value);
      const knownReference =
        knownReferenceMap.get(key) ?? findRecipeReferenceByKey(allRecipes, key);

      if (knownReference === undefined) {
        addDraftIngredient(draftIngredients, {
          name: normalizeDraftDisplayName(mention.value),
        });
        continue;
      }

      if (knownReference.kind === 'recipe') {
        addRecipeDraftIfMissing(
          draftIngredients,
          existingIngredientKeys,
          existingRecipeIds,
          knownReference,
        );
      }
    }

    const explicitSpans = explicitMentions.map((mention) => mention.span);
    const textTokens = tokenizeInstruction(instruction, explicitSpans);
    const matchedRanges = findKnownReferenceMatches(textTokens, knownReferences);

    for (const match of matchedRanges) {
      if (match.reference.kind === 'recipe') {
        addRecipeDraftIfMissing(
          draftIngredients,
          existingIngredientKeys,
          existingRecipeIds,
          match.reference,
        );
      }
    }

    for (const candidate of collectPlainTextCandidates(textTokens, matchedRanges)) {
      const key = buildPhraseKey(candidate);

      if (
        key.length === 0 ||
        knownReferenceMap.has(key) ||
        existingIngredientKeys.has(key) ||
        draftIngredients.has(key)
      ) {
        continue;
      }

      addDraftIngredient(draftIngredients, {
        name: normalizeDraftDisplayName(candidate),
      });
    }
  }

  return {
    draftIngredients: sortDraftIngredients([...draftIngredients.values()]),
  };
}

function addDraftIngredient(
  draftIngredients: Map<string, DraftRecipeIngredient>,
  ingredient: DraftRecipeIngredient,
): void {
  const key = buildPhraseKey(ingredient.recipeId ?? ingredient.name);

  if (key.length === 0 || draftIngredients.has(key)) {
    return;
  }

  draftIngredients.set(key, ingredient);
}

function addRecipeDraftIfMissing(
  draftIngredients: Map<string, DraftRecipeIngredient>,
  existingIngredientKeys: Set<string>,
  existingRecipeIds: Set<string>,
  reference: KnownReference,
): void {
  if (reference.recipeId === undefined) {
    return;
  }

  if (existingRecipeIds.has(reference.recipeId) || existingIngredientKeys.has(reference.key)) {
    return;
  }

  addDraftIngredient(draftIngredients, {
    name: reference.name,
    recipeId: reference.recipeId,
  });
}

function buildKnownReferences(
  ingredients: RecipeIngredient[],
  recipes: Recipe[],
): KnownReference[] {
  const references = new Map<string, KnownReference>();

  for (const ingredient of ingredients) {
    const key = buildPhraseKey(ingredient.name);

    if (!references.has(key)) {
      references.set(key, {
        kind: 'ingredient',
        key,
        name: ingredient.name,
        tokenCount: countPhraseTokens(ingredient.name),
      });
    }
  }

  for (const recipe of recipes) {
    const key = buildPhraseKey(recipe.name);

    if (!references.has(key)) {
      references.set(key, {
        kind: 'recipe',
        key,
        name: recipe.name,
        recipeId: recipe.recipeId,
        tokenCount: countPhraseTokens(recipe.name),
      });
    }
  }

  return sortKnownReferences([...references.values()]);
}

function findRecipeReferenceByKey(recipes: Recipe[], key: string): KnownReference | undefined {
  const recipe = recipes.find((candidate) => buildPhraseKey(candidate.name) === key);

  if (recipe === undefined) {
    return undefined;
  }

  return {
    kind: 'recipe',
    key,
    name: recipe.name,
    recipeId: recipe.recipeId,
    tokenCount: countPhraseTokens(recipe.name),
  };
}

function collectPlainTextCandidates(
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

function countPhraseTokens(value: string): number {
  return tokenizePhrase(value).length;
}

function buildPhraseKey(value: string): string {
  return tokenizePhrase(value)
    .map(buildTokenKey)
    .filter((token) => token.length > 0)
    .join(' ');
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

function normalizeDraftDisplayName(value: string): string {
  return tokenizePhrase(value)
    .map((token) => polishIrregularDisplayForms[normalizeTextForLookup(token)] ?? token)
    .join(' ')
    .trim();
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

function extractExplicitMentions(instruction: string): ExplicitMention[] {
  const matches = [...instruction.matchAll(/@\{([^}]+)\}|@([\p{L}\p{M}\p{N}-]+)/gu)];

  return matches.map((match) => ({
    span: {
      end: (match.index ?? 0) + match[0].length,
      start: match.index ?? 0,
    },
    value: (match[1] ?? match[2] ?? '').trim(),
  }));
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

function sortDraftIngredients(items: DraftRecipeIngredient[]): DraftRecipeIngredient[] {
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

function sortKnownReferences(references: KnownReference[]): KnownReference[] {
  return references.reduce<KnownReference[]>((sortedReferences, reference) => {
    const insertIndex = sortedReferences.findIndex(
      (candidate) => reference.tokenCount > candidate.tokenCount,
    );

    if (insertIndex === -1) {
      return [...sortedReferences, reference];
    }

    return [
      ...sortedReferences.slice(0, insertIndex),
      reference,
      ...sortedReferences.slice(insertIndex),
    ];
  }, []);
}

function findKnownReferenceMatches(
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

function tokenizeInstruction(
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

interface ExplicitMention {
  span: {
    end: number;
    start: number;
  };
  value: string;
}

interface InstructionMatch {
  endIndex: number;
  reference: KnownReference;
  startIndex: number;
}

interface InstructionToken {
  key: string;
  value: string;
}
