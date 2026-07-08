import type { Recipe } from '../recipe-store';
import { buildPhraseKey, countPhraseTokens } from './instruction-parser.text';

export { buildPhraseKey } from './instruction-parser.text';

export interface KnownReference {
  kind: 'ingredient' | 'recipe';
  key: string;
  name: string;
  recipeId?: string;
  tokenCount: number;
}

export interface ExplicitMention {
  span: {
    end: number;
    start: number;
  };
  value: string;
}

export interface InstructionMatch {
  endIndex: number;
  reference: KnownReference;
  startIndex: number;
}

export interface InstructionToken {
  key: string;
  value: string;
}

export function buildKnownReferences(
  ingredients: Recipe['ingredients'],
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

export function findRecipeReferenceByKey(
  recipes: Recipe[],
  key: string,
): KnownReference | undefined {
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
