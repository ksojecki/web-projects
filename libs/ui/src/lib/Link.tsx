import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';
import { joinClassNames } from './utils';

export type LinkTone = 'primary' | 'secondary' | 'ghost';

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  to: string;
  asButton?: boolean;
  fullWidth?: boolean;
  tone?: LinkTone;
}

const BUTTON_BASE_CLASS_NAME = 'btn';

const BUTTON_TONE_CLASS_NAMES: Record<LinkTone, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
};

const LINK_BASE_CLASS_NAME = 'link';

const LINK_TONE_CLASS_NAMES: Record<LinkTone, string> = {
  primary: 'link-primary',
  secondary: 'link-secondary',
  ghost: 'link-ghost',
};

/**
 * Link component that can render as a styled link or button.
 * When asButton is true, uses DaisyUI btn classes; otherwise uses link classes.
 */
export const Link = ({
  children,
  className,
  to,
  asButton = false,
  fullWidth = false,
  tone = 'primary',
  ...props
}: LinkProps) => {
  const resolvedClassName = asButton
    ? joinClassNames(
        BUTTON_BASE_CLASS_NAME,
        BUTTON_TONE_CLASS_NAMES[tone],
        fullWidth ? 'w-full' : undefined,
        className,
      )
    : joinClassNames(LINK_BASE_CLASS_NAME, LINK_TONE_CLASS_NAMES[tone], className);

  return (
    <RouterLink className={resolvedClassName} to={to} {...props}>
      {children}
    </RouterLink>
  );
};
