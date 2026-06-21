import type {
  OAuthProviderType,
  OAuthUserInfo,
} from '@sojecki/platform-shared';

/**
 * OAuth provider configuration
 */
export interface OAuthConfig {
  provider: OAuthProviderType;
  clientId: string;
  clientSecret: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  redirectUri: string;
}

/**
 * OAuth state stored during authorization
 */
export interface OAuthState {
  provider: OAuthProviderType;
  codeVerifier: string;
  expiresAt: number;
}

/**
 * OAuth token response from provider
 */
export interface ProviderTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  token_type?: string;
}

/**
 * OAuth service for handling provider authentication
 */
export interface OAuthService {
  generateAuthorizationUrl(
    provider: OAuthProviderType,
    state: string,
    codeChallenge: string,
  ): string;

  exchangeCodeForToken(
    provider: OAuthProviderType,
    code: string,
    codeVerifier: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string | null;
    expiresIn: number;
    idToken: string | null;
  }>;

  getUserInfo(
    provider: OAuthProviderType,
    accessToken: string,
    idToken?: string | null,
  ): Promise<OAuthUserInfo>;

  refreshAccessToken(
    provider: OAuthProviderType,
    refreshToken: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string | null;
    expiresIn: number;
  }>;
}

declare module 'fastify' {
  interface FastifyInstance {
    oauth: OAuthService;
  }
}
