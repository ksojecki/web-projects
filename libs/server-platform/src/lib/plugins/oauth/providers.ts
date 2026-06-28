import type { OAuthProviderType } from '@ksojecki/platform-shared';
import type { OAuthConfig } from './types';

/**
 * Build OAuth provider configuration map from environment variables.
 */
export function createOAuthConfigs(): Map<OAuthProviderType, OAuthConfig> {
  const configs: Map<OAuthProviderType, OAuthConfig> = new Map();

  const googleClientId = process.env.OAUTH_GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.OAUTH_GOOGLE_CLIENT_SECRET;
  if (googleClientId && googleClientSecret) {
    configs.set('google', {
      provider: 'google',
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      userInfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
      redirectUri: `${
        process.env.OAUTH_REDIRECT_BASE_URL ?? 'http://localhost:3000'
      }/auth/oauth/callback/google`,
    });
  }

  const appleClientId = process.env.OAUTH_APPLE_CLIENT_ID;
  const appleClientSecret = process.env.OAUTH_APPLE_CLIENT_SECRET;
  const appleTeamId = process.env.OAUTH_APPLE_TEAM_ID;
  if (appleClientId && appleClientSecret && appleTeamId) {
    configs.set('apple', {
      provider: 'apple',
      clientId: appleClientId,
      clientSecret: appleClientSecret,
      authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
      tokenEndpoint: 'https://appleid.apple.com/auth/token',
      userInfoEndpoint: '',
      redirectUri: `${
        process.env.OAUTH_REDIRECT_BASE_URL ?? 'http://localhost:3000'
      }/auth/oauth/callback/apple`,
    });
  }

  const facebookClientId = process.env.OAUTH_FACEBOOK_CLIENT_ID;
  const facebookClientSecret = process.env.OAUTH_FACEBOOK_CLIENT_SECRET;
  if (facebookClientId && facebookClientSecret) {
    configs.set('facebook', {
      provider: 'facebook',
      clientId: facebookClientId,
      clientSecret: facebookClientSecret,
      authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenEndpoint: 'https://graph.instagram.com/v18.0/oauth/access_token',
      userInfoEndpoint: 'https://graph.instagram.com/v18.0/me',
      redirectUri: `${
        process.env.OAUTH_REDIRECT_BASE_URL ?? 'http://localhost:3000'
      }/auth/oauth/callback/facebook`,
    });
  }

  return configs;
}
