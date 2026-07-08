import type { ReactNode } from 'react';
import { joinClassNames } from './utils';

export interface CardProps {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  title?: ReactNode;
}

const CARD_BASE_CLASS_NAME = 'card bg-base-100 shadow';
const CARD_BODY_CLASS_NAME = 'card-body';
const CARD_ACTIONS_CLASS_NAME = 'card-actions justify-end';

/**
 * Reusable content container for grouping related UI sections.
 */
export function Card({ actions, children, className, title }: CardProps) {
  return (
    <section className={joinClassNames(CARD_BASE_CLASS_NAME, className)}>
      <div className={CARD_BODY_CLASS_NAME}>
        {title !== undefined ? <div className="card-title">{title}</div> : null}
        <div>{children}</div>
        {actions !== undefined ? <div className={CARD_ACTIONS_CLASS_NAME}>{actions}</div> : null}
      </div>
    </section>
  );
}
