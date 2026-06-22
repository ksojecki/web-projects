import type {
  AuthenticationMethodStatus,
  OAuthProviderType,
} from '@sojecki/platform-shared';

export type AccountPendingMethod = OAuthProviderType | null;

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
