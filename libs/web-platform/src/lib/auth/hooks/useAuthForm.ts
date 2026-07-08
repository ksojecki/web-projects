import type { FieldValues, SubmitHandler, UseFormSetError } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export interface AuthFormResult<TFieldValues extends FieldValues> {
  withErrorHandling: (submitHandler: SubmitHandler<TFieldValues>) => SubmitHandler<TFieldValues>;
}

export function useAuthForm<TFieldValues extends FieldValues>(
  setError: UseFormSetError<TFieldValues>,
): AuthFormResult<TFieldValues> {
  const { t } = useTranslation('auth');

  function withErrorHandling(
    submitHandler: SubmitHandler<TFieldValues>,
  ): SubmitHandler<TFieldValues> {
    return async (values, event) => {
      try {
        await submitHandler(values, event);
      } catch (error) {
        setError('root', {
          message: error instanceof Error ? error.message : t('unexpectedError'),
        });
      }
    };
  }

  return { withErrorHandling };
}
