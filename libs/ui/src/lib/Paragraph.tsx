import type { ReactNode } from 'react';
import { joinClassNames } from './utils';

export type ParagraphTone = 'default' | 'muted';

export interface ParagraphProps {
  children: ReactNode;
  className?: string;
  tone?: ParagraphTone;
}

const PARAGRAPH_TONE_CLASS_NAMES: Record<ParagraphTone, string> = {
  default: 'text-base-content',
  muted: 'text-base-content/70',
};

export function Paragraph({ children, className, tone = 'default' }: ParagraphProps) {
  return (
    <p className={joinClassNames('leading-6', PARAGRAPH_TONE_CLASS_NAMES[tone], className)}>
      {children}
    </p>
  );
}
