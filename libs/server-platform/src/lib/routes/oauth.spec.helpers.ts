import Fastify from 'fastify';
import { expect } from 'vitest';
import type { OAuthProviderType } from '@ksojecki/platform-shared';
import type { ServerPlatformProjectConfig } from '../contracts/bootstrap.contract';
import databasePlugin from '../plugins/database';
import type { OAuthService } from '../plugins/oauth';
import sessionPlugin, { SESSION_COOKIE_NAME } from '../plugins/session';
import authRoutes from './auth';
import oauthRoutes from './oauth';

const testProjectConfig: ServerPlatformProjectConfig = {
  projectId: 'test-project',
  database: {
    path: ':memory:',
    seedInitialUser: true,
  },
};

function createOAuthService(): OAuthService {
  return {
    generateAuthorizationUrl(provider, state) {
      return `https://oauth.example/${provider}?state=${state}`;
    },
    async exchangeCodeForToken(provider, code) {
      return {
        accessToken: `${provider}-${code}-access-token`,
        refreshToken: `${provider}-${code}-refresh-token`,
        expiresIn: 3600,
        idToken: null,
      };
    },
    async getUserInfo(provider) {
      const userByProvider: Record<
        OAuthProviderType,
        { id: string; email: string; name: string; surname: string }
      > = {
        google: {
          id: 'google-user-1',
          email: 'oauth-google@rod-manager.local',
          name: 'Google',
          surname: 'OAuth User',
        },
        apple: {
          id: 'apple-user-1',
          email: 'oauth-apple@rod-manager.local',
          name: 'Apple',
          surname: 'OAuth User',
        },
        facebook: {
          id: 'facebook-user-1',
          email: 'oauth-facebook@rod-manager.local',
          name: 'Facebook',
          surname: 'OAuth User',
        },
      };

      return userByProvider[provider];
    },
    async refreshAccessToken(provider, refreshToken) {
      return {
        accessToken: `${provider}-${refreshToken}-refreshed`,
        refreshToken,
        expiresIn: 3600,
      };
    },
  };
}

export async function createServer() {
  const server = Fastify();
  await server.register(sessionPlugin);
  await server.register(databasePlugin, { project: testProjectConfig });
  server.decorate('oauth', createOAuthService());

  authRoutes(server);
  oauthRoutes(server);

  return server;
}

export async function loginAsInitialAdministrator(
  server: Awaited<ReturnType<typeof createServer>>,
) {
  const loginResponse = await server.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      email: 'admin@rod-manager.local',
      password: 'admin1234',
    },
  });

  const sessionCookie = loginResponse.cookies.find((cookie) => cookie.name === SESSION_COOKIE_NAME);

  expect(loginResponse.statusCode).toBe(200);
  expect(sessionCookie?.value).toBeDefined();

  return sessionCookie?.value ?? '';
}
