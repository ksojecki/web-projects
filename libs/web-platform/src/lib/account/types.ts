import type {
  AuthenticationMethodStatus,
  OAuthProviderType,
} from '@ksojecki/platform-shared';
import type { ReactNode } from 'react';

export type AccountPendingMethod = OAuthProviderType | null;

/**
 * Product account pages extend the shared shell with ordered content blocks.
 * Shared code renders sections in array order and does not interpret section ids
 * beyond stable keying and test targeting.
 */
export interface AccountSection {
  content: ReactNode;
  id: string;
}

export type AccountSectionsHook = () => AccountSection[];
export type AccountExtraSectionsHook = () => AccountSection[];

export interface AccountAuthenticationMethodsPanelProps {
  errorMessage: string | null;
  methods: AuthenticationMethodStatus[];
  onConnectProvider: (provider: OAuthProviderType) => Promise<void> | void;
  onDisconnectProvider: (provider: OAuthProviderType) => Promise<void> | void;
  onPasswordCancel: () => void;
  onPasswordSuccess: (message: string) => Promise<void> | void;
  onTogglePasswordForm: () => void;
  pendingMethod: AccountPendingMethod;
  showPasswordForm: boolean;
  successMessage: string | null;
}
