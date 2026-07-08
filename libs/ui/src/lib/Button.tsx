import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { joinClassNames } from './utils';

export type ButtonTone = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  fullWidth?: boolean;
  isLoading?: boolean;
  tone?: ButtonTone;
}

const BUTTON_BASE_CLASS_NAME = 'btn';

const BUTTON_TONE_CLASS_NAMES: Record<ButtonTone, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
};

/**
 * Reusable button component for shared UI actions across applications.
 */
export const Button = ({
  children,
  className,
  disabled,
  fullWidth = false,
  isLoading = false,
  tone = 'primary',
  ...props
}: ButtonProps) => {
  const resolvedClassName = joinClassNames(
    BUTTON_BASE_CLASS_NAME,
    BUTTON_TONE_CLASS_NAMES[tone],
    fullWidth ? 'w-full' : undefined,
    className,
  );

  return (
    <button className={resolvedClassName} disabled={disabled || isLoading} type="button" {...props}>
      {isLoading ? <span className="loading loading-spinner loading-sm" /> : null}
      {children}
    </button>
  );
};
