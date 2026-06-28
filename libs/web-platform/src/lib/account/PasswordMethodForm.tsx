import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, FormField, Heading } from '@ksojecki/platform-ui';
import { useAuthForm } from '../auth/hooks/useAuthForm';
import { updatePassword } from '../auth/authApi';
import { passwordSchema, type PasswordFormValues } from './passwordSchema';

export interface PasswordMethodFormProps {
  hasPassword: boolean;
  onCancel: () => void;
  onSuccess: (message: string) => Promise<void> | void;
}

/**
 * Form for setting or changing the local password authentication method.
 */
export function PasswordMethodForm({
  hasPassword,
  onCancel,
  onSuccess,
}: PasswordMethodFormProps) {
  const { t } = useTranslation('account');
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    resolver: zodResolver(passwordSchema),
  });
  const { withErrorHandling } = useAuthForm(setError);

  async function onSubmit(values: PasswordFormValues) {
    if (hasPassword && values.currentPassword.length === 0) {
      setError('currentPassword', {
        message: 'password.currentRequired',
      });
      return;
    }

    await updatePassword({
      currentPassword: hasPassword ? values.currentPassword : undefined,
      newPassword: values.newPassword,
    });
    reset();
    await onSuccess(
      hasPassword
        ? t('authentication.passwordChanged')
        : t('authentication.passwordConnected'),
    );
  }

  return (
    <form
      className="mt-4 space-y-4 rounded-box border border-base-300 bg-base-200/40 p-4"
      onSubmit={(event) => {
        void handleSubmit(withErrorHandling(onSubmit))(event);
      }}
    >
      <div className="space-y-1">
        <Heading level={3}>
          {hasPassword
            ? t('authentication.changePasswordTitle')
            : t('authentication.setPasswordTitle')}
        </Heading>
        <p className="text-sm text-base-content/70">
          {hasPassword
            ? t('authentication.changePasswordDescription')
            : t('authentication.setPasswordDescription')}
        </p>
      </div>

      {hasPassword ? (
        <FormField
          errorMessage={
            errors.currentPassword !== undefined
              ? t(getPasswordErrorKey(errors.currentPassword.message))
              : undefined
          }
          label={t('authentication.currentPasswordLabel')}
          registration={register('currentPassword')}
          type="password"
        />
      ) : null}

      <FormField
        errorMessage={
          errors.newPassword !== undefined
            ? t(getPasswordErrorKey(errors.newPassword.message))
            : undefined
        }
        label={t('authentication.newPasswordLabel')}
        registration={register('newPassword')}
        type="password"
      />

      <FormField
        errorMessage={
          errors.confirmPassword !== undefined
            ? t(getPasswordErrorKey(errors.confirmPassword.message))
            : undefined
        }
        label={t('authentication.confirmPasswordLabel')}
        registration={register('confirmPassword')}
        type="password"
      />

      {errors.root !== undefined ? (
        <p className="text-sm text-error">{errors.root.message}</p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          disabled={isSubmitting}
          onClick={onCancel}
          tone="ghost"
          type="button"
        >
          {t('authentication.cancelAction')}
        </Button>
        <Button isLoading={isSubmitting} type="submit">
          {isSubmitting
            ? t('authentication.savingPasswordAction')
            : hasPassword
              ? t('authentication.changePasswordAction')
              : t('authentication.setPasswordAction')}
        </Button>
      </div>
    </form>
  );
}

function getPasswordErrorKey(
  message: string | undefined,
):
  | 'password.confirmMismatch'
  | 'password.confirmRequired'
  | 'password.currentRequired'
  | 'password.newMinLength' {
  switch (message) {
    case 'password.currentRequired':
      return 'password.currentRequired';
    case 'password.confirmRequired':
      return 'password.confirmRequired';
    case 'password.confirmMismatch':
      return 'password.confirmMismatch';
    case 'password.newMinLength':
    default:
      return 'password.newMinLength';
  }
}
