import type { InstructionMatch, InstructionToken } from './types';
import { buildTokenKey } from './key';

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
  const candidates: string[] = [];
  const matchedIndices = buildMatchedIndices(matchedRanges);

  for (let index = 0; index < tokens.length; index += 1) {
    if (!isTriggerVerb(tokens[index])) {
      continue;
    }

    const candidateTokens = collectCandidateTokens(tokens, index, matchedIndices);

    if (candidateTokens.length > 0) {
      candidates.push(candidateTokens.map((candidateToken) => candidateToken.value).join(' '));
    }
  }

  return candidates;
}

function buildMatchedIndices(matchedRanges: InstructionMatch[]): Set<number> {
  const matchedIndices = new Set<number>();

  for (const match of matchedRanges) {
    for (let index = match.startIndex; index <= match.endIndex; index += 1) {
      matchedIndices.add(index);
    }
  }

  return matchedIndices;
}

function isTriggerVerb(token: InstructionToken | undefined): boolean {
  return token !== undefined && triggerVerbs.has(token.key);
}

function collectCandidateTokens(
  tokens: InstructionToken[],
  startIndex: number,
  matchedIndices: Set<number>,
): InstructionToken[] {
  const candidateTokens: InstructionToken[] = [];

  for (let candidateIndex = startIndex + 1; candidateIndex < tokens.length; candidateIndex += 1) {
    const candidateToken = tokens[candidateIndex];

    if (shouldStopCandidateCollection(candidateToken, candidateIndex, matchedIndices)) {
      break;
    }

    candidateTokens.push(candidateToken);

    if (candidateTokens.length === 3) {
      break;
    }
  }

  return candidateTokens;
}

function shouldStopCandidateCollection(
  token: InstructionToken,
  tokenIndex: number,
  matchedIndices: Set<number>,
): boolean {
  return matchedIndices.has(tokenIndex) || candidateBreakers.has(token.key) || token.key.length < 2;
}
