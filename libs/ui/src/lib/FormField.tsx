import type { UseFormRegisterReturn } from 'react-hook-form';

export interface FormFieldProps {
  label: string;
  type: 'email' | 'password' | 'text';
  registration: UseFormRegisterReturn;
  errorMessage?: string;
  hint?: string;
}

const FORM_FIELD_BASE_CLASS_NAME = 'input w-full';

/**
 * Shared labeled auth form field with optional hint and validation message.
 */
export function FormField({ label, type, registration, errorMessage, hint }: FormFieldProps) {
  const hasError = !!errorMessage || !!hint;
  return (
    <>
      <label className={FORM_FIELD_BASE_CLASS_NAME}>
        <input placeholder={label} type={type} {...registration} />
      </label>
      {hasError && (
        <p className="text-error text-xs">
          {hint}
          {errorMessage}
        </p>
      )}
    </>
  );
}
