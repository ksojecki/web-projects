import type { Recipe } from '../recipe-store';
import {
  buildKnownReferences,
  findRecipeReferenceByKey,
  type KnownReference,
} from './instruction-parser.helpers';
import {
  buildPhraseKey,
  collectPlainTextCandidates,
  extractExplicitMentions,
  findKnownReferenceMatches,
  normalizeDraftDisplayName,
  sortDraftIngredients,
  tokenizeInstruction,
} from './instruction-parser.text';

export interface DraftRecipeIngredient {
  name: string;
  recipeId?: string;
}

export interface InstructionParseResult {
  draftIngredients: DraftRecipeIngredient[];
}

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
