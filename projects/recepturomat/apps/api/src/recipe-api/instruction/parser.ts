import type { Recipe } from '../../recipe-store';
import { buildKnownReferences, findRecipeReferenceByKey, type KnownReference } from './reference';
import {
  buildPhraseKey,
  collectPlainTextCandidates,
  extractExplicitMentions,
  findKnownReferenceMatches,
  normalizeDraftDisplayName,
  sortDraftIngredients,
  tokenizeInstruction,
} from './text';
import type { DraftRecipeIngredient, InstructionParseResult } from './types';

export function collectInstructionDraftIngredients(
  recipe: Omit<Recipe, 'recipeId'> | Recipe,
  allRecipes: Recipe[],
): InstructionParseResult {
  const knownReferences = buildKnownReferences(recipe.ingredients, allRecipes);
  const knownReferenceMap = new Map(knownReferences.map((reference) => [reference.key, reference]));
  const existingIngredientKeys = buildExistingIngredientKeys(recipe);
  const existingRecipeIds = buildExistingRecipeIds(recipe);
  const draftIngredients = new Map<string, DraftRecipeIngredient>();

  for (const instruction of recipe.instructions) {
    collectDraftsFromInstruction(instruction, allRecipes, draftIngredients, {
      existingIngredientKeys,
      existingRecipeIds,
      knownReferenceMap,
      knownReferences,
    });
  }

  return {
    draftIngredients: sortDraftIngredients([...draftIngredients.values()]),
  };
}

function buildExistingIngredientKeys(recipe: Omit<Recipe, 'recipeId'> | Recipe): Set<string> {
  return new Set(recipe.ingredients.map((ingredient) => buildPhraseKey(ingredient.name)));
}

function buildExistingRecipeIds(recipe: Omit<Recipe, 'recipeId'> | Recipe): Set<string> {
  return new Set(
    recipe.ingredients
      .map((ingredient) => ingredient.recipeId)
      .filter((recipeId): recipeId is string => recipeId !== undefined),
  );
}

function collectDraftsFromInstruction(
  instruction: string,
  allRecipes: Recipe[],
  draftIngredients: Map<string, DraftRecipeIngredient>,
  options: {
    existingIngredientKeys: Set<string>;
    existingRecipeIds: Set<string>;
    knownReferenceMap: Map<string, KnownReference>;
    knownReferences: KnownReference[];
  },
): void {
  const explicitMentions = extractExplicitMentions(instruction);
  collectExplicitMentionDrafts(explicitMentions, allRecipes, draftIngredients, options);

  const textTokens = tokenizeInstruction(
    instruction,
    explicitMentions.map((mention) => mention.span),
  );
  const matchedRanges = findKnownReferenceMatches(textTokens, options.knownReferences);

  collectMatchedRecipeDrafts(matchedRanges, draftIngredients, options);
  collectCandidateDrafts(textTokens, matchedRanges, draftIngredients, options);
}

function collectExplicitMentionDrafts(
  explicitMentions: ReturnType<typeof extractExplicitMentions>,
  allRecipes: Recipe[],
  draftIngredients: Map<string, DraftRecipeIngredient>,
  options: {
    existingIngredientKeys: Set<string>;
    existingRecipeIds: Set<string>;
    knownReferenceMap: Map<string, KnownReference>;
  },
): void {
  for (const mention of explicitMentions) {
    const knownReference = findKnownReferenceForMention(
      mention.value,
      allRecipes,
      options.knownReferenceMap,
    );

    if (knownReference?.kind === 'recipe') {
      addRecipeDraftIfMissing(
        draftIngredients,
        options.existingIngredientKeys,
        options.existingRecipeIds,
        knownReference,
      );
      continue;
    }

    if (knownReference === undefined) {
      addDraftIngredient(draftIngredients, {
        name: normalizeDraftDisplayName(mention.value),
      });
    }
  }
}

function findKnownReferenceForMention(
  mentionValue: string,
  allRecipes: Recipe[],
  knownReferenceMap: Map<string, KnownReference>,
): KnownReference | undefined {
  const key = buildPhraseKey(mentionValue);
  return knownReferenceMap.get(key) ?? findRecipeReferenceByKey(allRecipes, key);
}

function collectMatchedRecipeDrafts(
  matchedRanges: ReturnType<typeof findKnownReferenceMatches>,
  draftIngredients: Map<string, DraftRecipeIngredient>,
  options: {
    existingIngredientKeys: Set<string>;
    existingRecipeIds: Set<string>;
  },
): void {
  for (const match of matchedRanges) {
    if (match.reference.kind !== 'recipe') {
      continue;
    }

    addRecipeDraftIfMissing(
      draftIngredients,
      options.existingIngredientKeys,
      options.existingRecipeIds,
      match.reference,
    );
  }
}

function collectCandidateDrafts(
  textTokens: ReturnType<typeof tokenizeInstruction>,
  matchedRanges: ReturnType<typeof findKnownReferenceMatches>,
  draftIngredients: Map<string, DraftRecipeIngredient>,
  options: {
    existingIngredientKeys: Set<string>;
    knownReferenceMap: Map<string, KnownReference>;
  },
): void {
  for (const candidate of collectPlainTextCandidates(textTokens, matchedRanges)) {
    if (shouldSkipCandidate(candidate, draftIngredients, options)) {
      continue;
    }

    addDraftIngredient(draftIngredients, {
      name: normalizeDraftDisplayName(candidate),
    });
  }
}

function shouldSkipCandidate(
  candidate: string,
  draftIngredients: Map<string, DraftRecipeIngredient>,
  options: {
    existingIngredientKeys: Set<string>;
    knownReferenceMap: Map<string, KnownReference>;
  },
): boolean {
  const key = buildPhraseKey(candidate);

  return (
    key.length === 0 ||
    options.knownReferenceMap.has(key) ||
    options.existingIngredientKeys.has(key) ||
    draftIngredients.has(key)
  );
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
