import type {
  OAuthProviderType,
  OAuthUserInfo,
} from '@ksojecki/platform-shared';
import type { OAuthConfig, OAuthService, ProviderTokenResponse } from './types';
import {
  buildOAuthUserInfo,
  decodeJwtPayload,
  normalizeValue,
} from './userInfo';

/**
 * Create OAuth service instance backed by provider configurations.
 */
export function createOAuthService(
  configs: Map<OAuthProviderType, OAuthConfig>,
): OAuthService {
  return {
    generateAuthorizationUrl(provider, state, codeChallenge) {
      const config = getProviderConfig(configs, provider);

      const baseParams: Record<string, string> = {
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        state,
      };

      const params = new URLSearchParams(baseParams);

      if (provider === 'google') {
        params.set('scope', 'openid profile email');
        params.set('code_challenge', codeChallenge);
        params.set('code_challenge_method', 'S256');
      } else if (provider === 'apple') {
        params.set('scope', 'openid profile email');
        params.set('response_mode', 'form_post');
        params.set('code_challenge', codeChallenge);
        params.set('code_challenge_method', 'S256');
      } else {
        params.set('scope', 'email public_profile');
      }

      return `${config.authorizationEndpoint}?${params.toString()}`;
    },

    async exchangeCodeForToken(provider, code, codeVerifier) {
      const config = getProviderConfig(configs, provider);

      const body: Record<string, string> = {
        grant_type: 'authorization_code',
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
      };

      if (provider !== 'facebook') {
        body.code_verifier = codeVerifier;
      }

      const response = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(body),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Failed to exchange code for token: ${String(response.status)} ${errorData}`,
        );
      }

      const data = (await response.json()) as ProviderTokenResponse;

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        expiresIn: data.expires_in || 3600,
        idToken: data.id_token ?? null,
      };
    },

    async getUserInfo(provider, accessToken, idToken) {
      const config = getProviderConfig(configs, provider);

      if (provider === 'google') {
        return fetchGoogleUserInfo(config, accessToken);
      }

      if (provider === 'apple') {
        if (idToken === null || idToken === undefined || idToken.length === 0) {
          throw new Error('Failed to get user info from apple');
        }

        return mapAppleUserInfo(idToken);
      }

      return fetchFacebookUserInfo(config, accessToken);
    },

    async refreshAccessToken(provider, refreshToken) {
      const config = getProviderConfig(configs, provider);

      const body: Record<string, string> = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      };

      const response = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(body),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh access token');
      }

      const data = (await response.json()) as ProviderTokenResponse;

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? refreshToken,
        expiresIn: data.expires_in || 3600,
      };
    },
  };
}

async function fetchGoogleUserInfo(
  config: OAuthConfig,
  accessToken: string,
): Promise<OAuthUserInfo> {
  const response = await fetch(config.userInfoEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user info from google');
  }

  const data = (await response.json()) as Record<string, unknown>;
  return buildOAuthUserInfo({
    id: normalizeValue(data.sub) || normalizeValue(data.id),
    email: normalizeValue(data.email),
    name: normalizeValue(data.given_name),
    surname: normalizeValue(data.family_name),
    displayName: normalizeValue(data.name),
    picture: normalizeValue(data.picture) || undefined,
  });
}

function mapAppleUserInfo(idToken: string): OAuthUserInfo {
  const data = decodeJwtPayload(idToken);

  return buildOAuthUserInfo({
    id: normalizeValue(data.sub),
    email: normalizeValue(data.email),
    name: normalizeValue(data.given_name),
    surname: normalizeValue(data.family_name),
    displayName: normalizeValue(data.name),
  });
}

async function fetchFacebookUserInfo(
  config: OAuthConfig,
  accessToken: string,
): Promise<OAuthUserInfo> {
  const accessTokenParam = encodeURIComponent(accessToken);
  const response = await fetch(
    `${config.userInfoEndpoint}?fields=id,first_name,last_name,name,email,picture&access_token=${accessTokenParam}`,
  );

  if (!response.ok) {
    throw new Error('Failed to get user info from Facebook');
  }

  const data = (await response.json()) as Record<string, unknown>;
  const picture = data.picture as Record<string, unknown> | undefined;

  return buildOAuthUserInfo({
    id: normalizeValue(data.id),
    email: normalizeValue(data.email),
    name: normalizeValue(data.first_name),
    surname: normalizeValue(data.last_name),
    displayName: normalizeValue(data.name),
    picture:
      normalizeValue(
        (picture?.data as Record<string, unknown> | undefined)?.url,
      ) || undefined,
  });
}

function getProviderConfig(
  configs: Map<OAuthProviderType, OAuthConfig>,
  provider: OAuthProviderType,
): OAuthConfig {
  const config = configs.get(provider);

  if (config === undefined) {
    throw new Error(`OAuth provider ${provider} is not configured`);
  }

  return config;
}
