import { useTranslation } from 'react-i18next';
import {
  type FieldValues,
  type SubmitHandler,
  type UseFormSetError,
} from 'react-hook-form';

export interface AuthFormResult<TFieldValues extends FieldValues> {
  withErrorHandling: (
    submitHandler: SubmitHandler<TFieldValues>,
  ) => SubmitHandler<TFieldValues>;
}

/**
 * Create shared submit error handling for auth forms.
 */
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
          message:
            error instanceof Error ? error.message : t('unexpectedError'),
        });
      }
    };
  }

  return { withErrorHandling };
}
