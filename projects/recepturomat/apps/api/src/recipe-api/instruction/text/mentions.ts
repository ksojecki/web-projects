import type { ExplicitMention } from './types';

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
