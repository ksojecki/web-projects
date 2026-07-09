import type { KnownReference } from '../reference';

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
