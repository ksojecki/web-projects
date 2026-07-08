import type { ReactNode } from 'react';
import { joinClassNames } from '../utils';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingProps {
  children?: ReactNode;
  className?: string;
  level: HeadingLevel;
}

export const Heading = ({ children, className, level }: HeadingProps) => {
  switch (level) {
    case 1:
      return <h1 className={joinClassNames('text-3xl', className)}>{children}</h1>;
    case 2:
      return <h2 className={joinClassNames('text-2xl', className)}>{children}</h2>;
    case 3:
      return <h3 className={joinClassNames('text-xl', className)}>{children}</h3>;
    case 4:
      return <h4 className={joinClassNames('text-lg', className)}>{children}</h4>;
    case 5:
      return <h5 className={joinClassNames('text-base', className)}>{children}</h5>;
    case 6:
      return <h6 className={joinClassNames('text-base font-light', className)}>{children}</h6>;
    default:
      return <h6 className={joinClassNames('text-3xl', className)}>{children}</h6>;
  }
};
