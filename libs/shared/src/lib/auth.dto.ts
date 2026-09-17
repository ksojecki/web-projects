import type { UserLanguage } from './user-settings.dto.js';

export type OAuthProviderType = 'google' | 'apple' | 'facebook';

export type UserRole = 'admin' | 'user';

export type OAuthIntent = 'login' | 'link';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  surname: string;
  displayName: string;
  role: UserRole;
  preferredLanguage: UserLanguage;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface RegisterRequestBody {
  email: string;
  name: string;
  surname: string;
  password: string;
}

export interface UpdatePasswordRequestBody {
  currentPassword?: string;
  newPassword: string;
}

export interface OAuthInitiateRequestBody {
  provider: OAuthProviderType;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

export interface OAuthCallbackQueryParams {
  code: string;
  state: string;
  provider: OAuthProviderType;
}

export interface OAuthCallbackRequestBody {
  code: string;
  state: string;
}

export interface OAuthCallbackResponseBody {
  intent: OAuthIntent;
  redirectTo: string;
  message?: string;
}

export interface OAuthTokenResponseBody {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken?: string;
}

export interface OAuthProviderStatus {
  provider: OAuthProviderType;
  linked: boolean;
}

export interface OAuthProvidersResponseBody {
  providers: OAuthProviderStatus[];
}

export interface PasswordAuthenticationMethodStatus {
  type: 'password';
  connected: boolean;
  canDisconnect: false;
}

export interface OAuthAuthenticationMethodStatus {
  type: 'oauth';
  provider: OAuthProviderType;
  connected: boolean;
  canDisconnect: boolean;
}

export type AuthenticationMethodStatus =
  | PasswordAuthenticationMethodStatus
  | OAuthAuthenticationMethodStatus;

export interface AuthenticationMethodsResponseBody {
  methods: AuthenticationMethodStatus[];
}

export interface OAuthUserInfo {
  id: string;
  email: string;
  name: string;
  surname: string;
  picture?: string;
}

export interface SessionResponse {
  authenticated: boolean;
  user: AuthUser;
}

export interface ApiErrorResponse {
  message: string;
}
