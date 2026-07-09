import type { KnownReference } from '../reference';
import type { InstructionMatch, InstructionToken } from './types';

export function findKnownReferenceMatches(
  tokens: InstructionToken[],
  references: KnownReference[],
): InstructionMatch[] {
  const matches: InstructionMatch[] = [];
  let index = 0;

  while (index < tokens.length) {
    const currentMatch = findMatchAtIndex(tokens, references, index);

    if (currentMatch === undefined) {
      index += 1;
      continue;
    }

    matches.push(currentMatch);
    index = currentMatch.endIndex + 1;
  }

  return matches;
}

function findMatchAtIndex(
  tokens: InstructionToken[],
  references: KnownReference[],
  index: number,
): InstructionMatch | undefined {
  for (const reference of references) {
    const phraseTokens = tokens.slice(index, index + reference.tokenCount);

    if (!matchesReference(phraseTokens, reference)) {
      continue;
    }

    return {
      endIndex: index + reference.tokenCount - 1,
      reference,
      startIndex: index,
    };
  }

  return undefined;
}

function matchesReference(phraseTokens: InstructionToken[], reference: KnownReference): boolean {
  return (
    phraseTokens.length === reference.tokenCount &&
    phraseTokens.map((token) => token.key).join(' ') === reference.key
  );
}
