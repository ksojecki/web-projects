import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ServerPlatformProjectConfig } from '../contracts/bootstrap.contract';
import sessionPlugin, { SESSION_COOKIE_NAME } from '../plugins/session';
import databasePlugin from '../plugins/database';
import authRoutes from './auth';
import userSettingsRoutes from './user-settings';

const testProjectConfig: ServerPlatformProjectConfig = {
  projectId: 'test-project',
  database: {
    path: ':memory:',
    seedInitialUser: true,
  },
};

describe('user settings routes', () => {
  beforeEach(() => {
    process.env.AUTH_INITIAL_USER_EMAIL = 'admin@rod-manager.local';
    process.env.AUTH_INITIAL_USER_PASSWORD = 'admin1234';
  });

  afterEach(() => {
    delete process.env.AUTH_INITIAL_USER_EMAIL;
    delete process.env.AUTH_INITIAL_USER_PASSWORD;
  });

  it('persists selected language for authenticated user', async () => {
    const server = Fastify();
    await server.register(sessionPlugin);
    await server.register(databasePlugin, { project: testProjectConfig });

    authRoutes(server);
    userSettingsRoutes(server);

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

    const languageResponse = await server.inject({
      method: 'POST',
      url: '/api/user-settings/language',
      cookies: {
        [SESSION_COOKIE_NAME]: sessionCookie?.value ?? '',
      },
      payload: {
        language: 'pl',
      },
    });

    expect(languageResponse.statusCode).toBe(204);
    expect(server.userSettingsStore.getUserPreferredLanguage('initial-admin-user')).toBe('pl');

    await server.close();
  });

  it('returns unauthorized when updating language without a session cookie', async () => {
    const server = Fastify();
    await server.register(sessionPlugin);
    await server.register(databasePlugin, { project: testProjectConfig });

    userSettingsRoutes(server);

    const response = await server.inject({
      method: 'POST',
      url: '/api/user-settings/language',
      payload: {
        language: 'pl',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ message: 'Not authenticated.' });

    await server.close();
  });
});
