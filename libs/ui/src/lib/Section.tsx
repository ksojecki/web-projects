import type { ReactNode } from 'react';
import { Heading } from './Typography';
import { joinClassNames } from './utils';
import { Paragraph } from './Paragraph';

export interface SectionProps {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  description?: ReactNode;
  title: ReactNode;
}

export function Section({
  actions,
  children,
  className,
  contentClassName,
  description,
  title,
}: SectionProps) {
  return (
    <section
      className={joinClassNames(
        'rounded-box border border-base-300 bg-base-100 p-6 shadow-sm',
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Heading className="font-semibold" level={2}>
            {title}
          </Heading>
          {description !== undefined ? <Paragraph tone="muted">{description}</Paragraph> : null}
        </div>
        {actions !== undefined ? (
          <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>
        ) : null}
      </div>

      <div className={joinClassNames('mt-5', contentClassName)}>{children}</div>
    </section>
  );
}
