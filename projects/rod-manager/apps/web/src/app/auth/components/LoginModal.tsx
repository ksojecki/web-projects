import { useTranslation } from 'react-i18next';
import type { ModalWindowProps } from '@sojecki/platform-ui';
import { ModalWindow } from '@sojecki/platform-ui';
import { LoginForm } from './LoginForm';
import { OAuthLoginButtons } from './OAuthLoginButtons';
import { frontendProductConfig } from '../../frontendProductConfig';

type LoginModalProps = Pick<ModalWindowProps, 'api'>;

/**
 * Modal dialog containing the login form and OAuth login buttons.
 */
export function LoginModal({ api }: LoginModalProps) {
  const { t } = useTranslation('auth');
  const { registration, routes } = frontendProductConfig;

  return (
    <ModalWindow api={api}>
      <ModalWindow.Title>{t('title')}</ModalWindow.Title>
      <ModalWindow.Content>
        <div className="flex flex-row gap-4">
          <div className="flex-1 flex gap-2 flex-col">
            <LoginForm onSuccess={() => api.current?.close()} />
          </div>

          <div className="divider divider-horizontal">{t('or')}</div>
          <div className="flex-1 flex gap-2 flex-col justify-center">
            <OAuthLoginButtons />
          </div>
        </div>
      </ModalWindow.Content>
      {registration.enabled ? (
        <ModalWindow.Actions>
          <ModalWindow.ActionButton to={routes.register}>
            {t('noAccount')} {t('registerLink')}
          </ModalWindow.ActionButton>
        </ModalWindow.Actions>
      ) : undefined}
    </ModalWindow>
  );
}
