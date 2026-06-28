import { useTranslation } from 'react-i18next';
import type { ModalWindowProps } from '@ksojecki/platform-ui';
import { ModalWindow } from '@ksojecki/platform-ui';
import { LoginForm } from './LoginForm';
import { OAuthButtons } from './OAuthButtons';

export interface LoginModalProps extends Pick<ModalWindowProps, 'api'> {
  postLoginRedirectTo: string;
  registerTo?: string;
  registrationEnabled?: boolean;
}

/**
 * Shared modal dialog containing the login form and OAuth login buttons.
 */
export function LoginModal({
  api,
  postLoginRedirectTo,
  registerTo,
  registrationEnabled = false,
}: LoginModalProps) {
  const { t } = useTranslation('auth');

  return (
    <ModalWindow api={api}>
      <ModalWindow.Title>{t('title')}</ModalWindow.Title>
      <ModalWindow.Content>
        <div className="flex flex-row gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <LoginForm
              onSuccess={() => {
                api.current?.close();
              }}
              redirectTo={postLoginRedirectTo}
            />
          </div>

          <div className="divider divider-horizontal">{t('or')}</div>
          <div className="flex flex-1 flex-col justify-center gap-2">
            <OAuthButtons />
          </div>
        </div>
      </ModalWindow.Content>
      {registrationEnabled && registerTo !== undefined ? (
        <ModalWindow.Actions>
          <ModalWindow.ActionButton to={registerTo}>
            {t('noAccount')} {t('registerLink')}
          </ModalWindow.ActionButton>
        </ModalWindow.Actions>
      ) : undefined}
    </ModalWindow>
  );
}
