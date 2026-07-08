import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerPlatformProjectConfig } from '../../contracts/bootstrap.contract';
import sessionPlugin, { SESSION_COOKIE_NAME } from './index';
import databasePlugin from '../database';

const testProjectConfig: ServerPlatformProjectConfig = {
  projectId: 'test-project',
  database: {
    path: ':memory:',
    seedInitialUser: true,
  },
};

describe('session plugin', () => {
  beforeEach(() => {
    process.env.AUTH_INITIAL_USER_EMAIL = 'admin@rod-manager.local';
    process.env.AUTH_INITIAL_USER_PASSWORD = 'admin1234';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.AUTH_INITIAL_USER_EMAIL;
    delete process.env.AUTH_INITIAL_USER_PASSWORD;
  });

  it('starts a session and exposes it through request helpers', async () => {
    const server = Fastify();
    await server.register(sessionPlugin);
    await server.register(databasePlugin, { project: testProjectConfig });

    server.post('/start', async (request, reply) => {
      reply.startSession('initial-admin-user');

      await reply.send({
        hasSession: request.hasSession(),
        userId: request.getSession()?.userId,
      });
    });

    const response = await server.inject({
      method: 'POST',
      url: '/start',
    });

    const sessionCookie = response.cookies.find((cookie) => cookie.name === SESSION_COOKIE_NAME);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      hasSession: true,
      userId: 'initial-admin-user',
    });
    expect(sessionCookie?.value).toBeDefined();

    await server.close();
  });

  it('removes an active session from the store', async () => {
    const server = Fastify();
    await server.register(sessionPlugin);
    await server.register(databasePlugin, { project: testProjectConfig });

    server.post('/start', async (_request, reply) => {
      reply.startSession('initial-admin-user');
      await reply.status(204).send();
    });

    server.post('/remove', async (_request, reply) => {
      reply.removeSession();
      await reply.status(204).send();
    });

    const startResponse = await server.inject({
      method: 'POST',
      url: '/start',
    });
    const sessionCookie = startResponse.cookies.find(
      (cookie) => cookie.name === SESSION_COOKIE_NAME,
    );

    const sessionToken = sessionCookie?.value;

    expect(sessionToken).toBeDefined();
    expect(server.authStore.findSession(sessionToken ?? '')).toBeDefined();

    const removeResponse = await server.inject({
      method: 'POST',
      url: '/remove',
      cookies: {
        [SESSION_COOKIE_NAME]: sessionToken ?? '',
      },
    });

    expect(removeResponse.statusCode).toBe(204);
    expect(server.authStore.findSession(sessionToken ?? '')).toBeUndefined();

    await server.close();
  });

  it('returns unauthorized when the session cookie is missing', async () => {
    const server = Fastify();
    await server.register(sessionPlugin);
    await server.register(databasePlugin, { project: testProjectConfig });

    server.get(
      '/protected',
      {
        preHandler: server.requireAuthenticatedSession,
      },
      async (request, reply) => {
        await reply.send({ userId: request.authenticatedSession?.userId });
      },
    );

    const response = await server.inject({
      method: 'GET',
      url: '/protected',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ message: 'Not authenticated.' });

    await server.close();
  });

  it('reads the session token through request.getSessionToken()', async () => {
    const server = Fastify();
    await server.register(sessionPlugin);
    await server.register(databasePlugin, { project: testProjectConfig });

    server.get('/token', async (request, reply) => {
      await reply.send({ token: request.getSessionToken() });
    });

    const response = await server.inject({
      method: 'GET',
      url: '/token',
      cookies: {
        [SESSION_COOKIE_NAME]: 'session-token-value',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ token: 'session-token-value' });

    await server.close();
  });

  it('deletes expired sessions and returns unauthorized', async () => {
    const server = Fastify();
    await server.register(sessionPlugin);
    await server.register(databasePlugin, { project: testProjectConfig });

    server.post('/start', async (_request, reply) => {
      reply.startSession('initial-admin-user');
      await reply.status(204).send();
    });

    server.get(
      '/protected',
      {
        preHandler: server.requireAuthenticatedSession,
      },
      async (request, reply) => {
        await reply.send({ userId: request.authenticatedSession?.userId });
      },
    );

    const startResponse = await server.inject({
      method: 'POST',
      url: '/start',
    });
    const sessionCookie = startResponse.cookies.find(
      (cookie) => cookie.name === SESSION_COOKIE_NAME,
    );
    const sessionToken = sessionCookie?.value;
    const session = server.authStore.findSession(sessionToken ?? '');

    if (session === undefined) {
      throw new Error('Expected a session to be created for the test.');
    }

    vi.spyOn(Date, 'now').mockReturnValue(session.expiresAt + 1);

    const response = await server.inject({
      method: 'GET',
      url: '/protected',
      cookies: {
        [SESSION_COOKIE_NAME]: sessionToken ?? '',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ message: 'Not authenticated.' });
    expect(server.authStore.findSession(sessionToken ?? '')).toBeUndefined();

    await server.close();
  });
});
