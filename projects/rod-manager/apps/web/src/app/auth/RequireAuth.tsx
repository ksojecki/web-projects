import type { ReactElement } from 'react';
import { Navigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';

interface RequireAuthProps {
  children: ReactElement;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { t } = useTranslation('auth');
  const { status } = useAuth();

  if (status === 'loading') {
    return <p>{t('checkingSession')}</p>;
  }

  if (status === 'guest') {
    return <Navigate replace to="/?login=1" />;
  }

  return children;
}
