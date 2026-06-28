import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { OAuthProviderType } from '@ksojecki/platform-shared';
import type { ServerPlatformProjectConfig } from '../contracts/bootstrap.contract';
import sessionPlugin, { SESSION_COOKIE_NAME } from '../plugins/session';
import databasePlugin from '../plugins/database';
import type { OAuthService } from '../plugins/oauth';
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

async function createServer() {
  const server = Fastify();
  await server.register(sessionPlugin);
  await server.register(databasePlugin, { project: testProjectConfig });
  server.decorate('oauth', createOAuthService());

  authRoutes(server);
  oauthRoutes(server);

  return server;
}

async function loginAsInitialAdministrator(
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

  const sessionCookie = loginResponse.cookies.find(
    (cookie) => cookie.name === SESSION_COOKIE_NAME,
  );

  expect(loginResponse.statusCode).toBe(200);
  expect(sessionCookie?.value).toBeDefined();

  return sessionCookie?.value ?? '';
}

describe('oauth routes', () => {
  beforeEach(() => {
    process.env.AUTH_INITIAL_USER_EMAIL = 'admin@rod-manager.local';
    process.env.AUTH_INITIAL_USER_PASSWORD = 'admin1234';
  });

  afterEach(() => {
    delete process.env.AUTH_INITIAL_USER_EMAIL;
    delete process.env.AUTH_INITIAL_USER_PASSWORD;
  });

  it('creates an OAuth user with provider first name, surname, and email', async () => {
    const server = await createServer();

    const authorizeResponse = await server.inject({
      method: 'POST',
      url: '/api/auth/oauth/authorize/google',
    });

    expect(authorizeResponse.statusCode).toBe(200);
    const authorizePayload = authorizeResponse.json<{ state: string }>();

    const callbackResponse = await server.inject({
      method: 'POST',
      url: '/api/auth/oauth/callback/google',
      payload: {
        code: 'oauth-code-profile',
        state: authorizePayload.state,
      },
    });

    expect(callbackResponse.statusCode).toBe(200);

    const sessionCookie = callbackResponse.cookies.find(
      (cookie) => cookie.name === SESSION_COOKIE_NAME,
    );
    expect(sessionCookie?.value).toBeDefined();

    const sessionResponse = await server.inject({
      method: 'GET',
      url: '/api/auth/session',
      cookies: {
        [SESSION_COOKIE_NAME]: sessionCookie?.value ?? '',
      },
    });

    expect(sessionResponse.statusCode).toBe(200);
    expect(sessionResponse.json()).toMatchObject({
      authenticated: true,
      user: {
        email: 'oauth-google@rod-manager.local',
        name: 'Google',
        surname: 'OAuth User',
      },
    });

    await server.close();
  });

  it('returns unauthorized when fetching OAuth providers without a session cookie', async () => {
    const server = await createServer();

    const response = await server.inject({
      method: 'GET',
      url: '/api/auth/oauth/providers',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ message: 'Not authenticated.' });

    await server.close();
  });

  it('links an OAuth provider to the existing authenticated account', async () => {
    const server = await createServer();
    const sessionToken = await loginAsInitialAdministrator(server);

    const initiateResponse = await server.inject({
      method: 'POST',
      url: '/api/auth/oauth/link/google',
      cookies: {
        [SESSION_COOKIE_NAME]: sessionToken,
      },
    });

    expect(initiateResponse.statusCode).toBe(200);
    const initiatePayload = initiateResponse.json<{
      authorizationUrl: string;
      state: string;
    }>();
    expect(initiatePayload.authorizationUrl).toContain('/google?state=');

    const callbackResponse = await server.inject({
      method: 'POST',
      url: '/api/auth/oauth/callback/google',
      payload: {
        code: 'oauth-code',
        state: initiatePayload.state,
      },
      cookies: {
        [SESSION_COOKIE_NAME]: sessionToken,
      },
    });

    expect(callbackResponse.statusCode).toBe(200);
    expect(callbackResponse.json()).toEqual({
      intent: 'link',
      redirectTo: '/account',
      message: 'OAuth provider linked.',
    });

    const providersResponse = await server.inject({
      method: 'GET',
      url: '/api/auth/oauth/providers',
      cookies: {
        [SESSION_COOKIE_NAME]: sessionToken,
      },
    });

    expect(providersResponse.statusCode).toBe(200);
    expect(providersResponse.json()).toEqual({
      providers: [
        { provider: 'google', linked: true },
        { provider: 'apple', linked: false },
        { provider: 'facebook', linked: false },
      ],
    });

    await server.close();
  });

  it('returns bad request for an invalid OAuth provider before authentication', async () => {
    const server = await createServer();

    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/oauth/link/invalid-provider',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ message: 'Invalid OAuth provider.' });

    await server.close();
  });

  it('returns bad request when unlinking an invalid OAuth provider before authentication', async () => {
    const server = await createServer();

    const response = await server.inject({
      method: 'DELETE',
      url: '/api/auth/oauth/link/invalid-provider',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ message: 'Invalid OAuth provider.' });

    await server.close();
  });

  it('unlinks an OAuth provider from the authenticated account', async () => {
    const server = await createServer();
    const sessionToken = await loginAsInitialAdministrator(server);

    const initiateResponse = await server.inject({
      method: 'POST',
      url: '/api/auth/oauth/link/google',
      cookies: {
        [SESSION_COOKIE_NAME]: sessionToken,
      },
    });

    expect(initiateResponse.statusCode).toBe(200);
    const initiatePayload = initiateResponse.json<{ state: string }>();

    const callbackResponse = await server.inject({
      method: 'POST',
      url: '/api/auth/oauth/callback/google',
      payload: {
        code: 'oauth-code-unlink',
        state: initiatePayload.state,
      },
      cookies: {
        [SESSION_COOKIE_NAME]: sessionToken,
      },
    });

    expect(callbackResponse.statusCode).toBe(200);

    const unlinkResponse = await server.inject({
      method: 'DELETE',
      url: '/api/auth/oauth/link/google',
      cookies: {
        [SESSION_COOKIE_NAME]: sessionToken,
      },
    });

    expect(unlinkResponse.statusCode).toBe(200);
    expect(unlinkResponse.json()).toEqual({
      message: 'OAuth provider unlinked.',
    });

    const providersResponse = await server.inject({
      method: 'GET',
      url: '/api/auth/oauth/providers',
      cookies: {
        [SESSION_COOKIE_NAME]: sessionToken,
      },
    });

    expect(providersResponse.statusCode).toBe(200);
    expect(providersResponse.json()).toEqual({
      providers: [
        { provider: 'google', linked: false },
        { provider: 'apple', linked: false },
        { provider: 'facebook', linked: false },
      ],
    });

    await server.close();
  });

  it('rejects linking when the OAuth account is already linked to another user', async () => {
    const server = await createServer();

    const authorizeResponse = await server.inject({
      method: 'POST',
      url: '/api/auth/oauth/authorize/google',
    });

    expect(authorizeResponse.statusCode).toBe(200);
    const authorizePayload = authorizeResponse.json<{ state: string }>();

    const oauthLoginCallbackResponse = await server.inject({
      method: 'POST',
      url: '/api/auth/oauth/callback/google',
      payload: {
        code: 'oauth-login-code',
        state: authorizePayload.state,
      },
    });

    expect(oauthLoginCallbackResponse.statusCode).toBe(200);

    const sessionToken = await loginAsInitialAdministrator(server);
    const linkResponse = await server.inject({
      method: 'POST',
      url: '/api/auth/oauth/link/google',
      cookies: {
        [SESSION_COOKIE_NAME]: sessionToken,
      },
    });

    expect(linkResponse.statusCode).toBe(200);
    const linkPayload = linkResponse.json<{ state: string }>();

    const conflictResponse = await server.inject({
      method: 'POST',
      url: '/api/auth/oauth/callback/google',
      payload: {
        code: 'oauth-link-code',
        state: linkPayload.state,
      },
      cookies: {
        [SESSION_COOKIE_NAME]: sessionToken,
      },
    });

    expect(conflictResponse.statusCode).toBe(409);
    expect(conflictResponse.json()).toEqual({
      message:
        'OAuth callback failed: This OAuth account is already linked to another user.',
    });

    await server.close();
  });
});
