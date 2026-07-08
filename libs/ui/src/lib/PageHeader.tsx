import type { ReactNode } from 'react';
import { Heading } from './Typography';
import { joinClassNames } from './utils';
import { Paragraph } from './Paragraph';

export interface PageHeaderProps {
  actions?: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  meta?: ReactNode;
  title: ReactNode;
}

export function PageHeader({
  actions,
  className,
  description,
  eyebrow,
  meta,
  title,
}: PageHeaderProps) {
  return (
    <header
      className={joinClassNames(
        'flex flex-col gap-4 rounded-box border border-base-300 bg-base-100 p-6 shadow-sm',
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {eyebrow !== undefined ? (
            <div className="text-sm font-medium uppercase tracking-[0.16em] text-base-content/50">
              {eyebrow}
            </div>
          ) : null}
          <Heading className="font-semibold" level={1}>
            {title}
          </Heading>
          {description !== undefined ? <Paragraph tone="muted">{description}</Paragraph> : null}
        </div>

        {actions !== undefined ? (
          <div className="flex flex-wrap gap-2 lg:justify-end">{actions}</div>
        ) : null}
      </div>

      {meta !== undefined ? (
        <div className="flex flex-wrap gap-3 text-sm text-base-content/70">{meta}</div>
      ) : null}
    </header>
  );
}
