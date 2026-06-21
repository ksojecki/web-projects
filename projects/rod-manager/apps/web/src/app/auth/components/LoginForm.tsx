import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, FormField } from '@sojecki/platform-ui';
import { useAuth } from '../AuthContext';
import { loginSchema, type LoginFormValues } from '../types/loginSchema';
import { useAuthForm } from '../hooks/useAuthForm';

type LoginFormProps = {
  onSuccess?: () => void;
};

/**
 * Login form for authenticating with email and password.
 */
export function LoginForm({ onSuccess }: LoginFormProps = {}) {
  const { t } = useTranslation('auth');
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });
  const { withErrorHandling } = useAuthForm(setError);

  async function onSubmit(values: LoginFormValues) {
    await login(values.email, values.password);
    if (onSuccess) {
      onSuccess();
    } else {
      await navigate('/account', { replace: true });
    }
  }

  return (
    <form
      className={'flex flex-col gap-4'}
      onSubmit={(event) => {
        void handleSubmit(withErrorHandling(onSubmit))(event);
      }}
    >
      <FormField
        errorMessage={
          errors.email !== undefined
            ? t(getEmailErrorKey(errors.email.message))
            : undefined
        }
        label={t('emailLabel')}
        registration={register('email')}
        type="email"
      />

      <FormField
        errorMessage={
          errors.password !== undefined
            ? t(getPasswordErrorKey(errors.password.message))
            : undefined
        }
        label={t('passwordLabel')}
        registration={register('password')}
        type="password"
      />

      {errors.root !== undefined ? (
        <p className="text-sm text-error">{errors.root.message}</p>
      ) : null}

      <Button fullWidth isLoading={isSubmitting} type="submit">
        {isSubmitting ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}

function getEmailErrorKey(
  message: string | undefined,
): 'emailInvalid' | 'emailRequired' {
  return message === 'emailInvalid' ? 'emailInvalid' : 'emailRequired';
}

function getPasswordErrorKey(message: string | undefined): 'passwordRequired' {
  return message === 'passwordRequired'
    ? 'passwordRequired'
    : 'passwordRequired';
}
