import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  register as registerRequest,
  registerSchema,
  type RegisterFormValues,
  useAuth,
  useAuthForm,
} from '@sojecki/platform-web-platform';
import { Button, FormField } from '@sojecki/platform-ui';
import { frontendProductConfig } from '../../frontendProductConfig';

/**
 * Registration form for creating an account with email and password.
 */
export function PasswordRegisterForm() {
  const { t } = useTranslation('auth');
  const { refreshSession } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });
  const { withErrorHandling } = useAuthForm(setError);

  async function onSubmit(values: RegisterFormValues) {
    await registerRequest(values);
    await refreshSession();
    await navigate(frontendProductConfig.auth.postRegistrationRedirectTo, {
      replace: true,
    });
  }

  return (
    <>
      <form
        className="mt-4 space-y-4"
        onSubmit={(event) => {
          void handleSubmit(withErrorHandling(onSubmit))(event);
        }}
      >
        <FormField
          errorMessage={
            errors.name !== undefined
              ? t(getNameErrorKey(errors.name.message))
              : undefined
          }
          label={t('register.nameLabel')}
          registration={register('name')}
          type="text"
        />

        <FormField
          errorMessage={
            errors.surname !== undefined
              ? t(getSurnameErrorKey(errors.surname.message))
              : undefined
          }
          label={t('register.surnameLabel')}
          registration={register('surname')}
          type="text"
        />

        <FormField
          errorMessage={
            errors.email !== undefined
              ? t(getRegisterEmailErrorKey(errors.email.message))
              : undefined
          }
          label={t('register.emailLabel')}
          registration={register('email')}
          type="email"
        />

        <FormField
          errorMessage={
            errors.password !== undefined
              ? t(getRegisterPasswordErrorKey(errors.password.message))
              : undefined
          }
          hint={t('register.passwordHint')}
          label={t('register.passwordLabel')}
          registration={register('password')}
          type="password"
        />

        {errors.root !== undefined ? (
          <p className="text-sm text-error">{errors.root.message}</p>
        ) : null}

        <Button fullWidth isLoading={isSubmitting} type="submit">
          {isSubmitting ? t('register.submitting') : t('register.submit')}
        </Button>
      </form>
    </>
  );
}

function getNameErrorKey(message: string | undefined): 'register.nameRequired' {
  return message === 'register.nameRequired'
    ? 'register.nameRequired'
    : 'register.nameRequired';
}

function getSurnameErrorKey(
  message: string | undefined,
): 'register.surnameRequired' {
  return message === 'register.surnameRequired'
    ? 'register.surnameRequired'
    : 'register.surnameRequired';
}

function getRegisterEmailErrorKey(
  message: string | undefined,
): 'register.emailInvalid' | 'register.emailRequired' {
  return message === 'register.emailInvalid'
    ? 'register.emailInvalid'
    : 'register.emailRequired';
}

function getRegisterPasswordErrorKey(
  message: string | undefined,
): 'register.passwordMinLength' {
  return message === 'register.passwordMinLength'
    ? 'register.passwordMinLength'
    : 'register.passwordMinLength';
}
