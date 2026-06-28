import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SessionResponse } from '@ksojecki/platform-shared';
import type { ServerPlatformProjectConfig } from '../contracts/bootstrap.contract';
import databasePlugin from '../plugins/database';
import sessionPlugin from '../plugins/session';
import authRoutes from './auth';
import { SESSION_COOKIE_NAME } from '../plugins/session';

const testProjectConfig: ServerPlatformProjectConfig = {
  projectId: 'test-project',
  database: {
    path: ':memory:',
    seedInitialUser: true,
  },
};

describe('auth routes', () => {
  beforeEach(() => {
    process.env.AUTH_INITIAL_USER_EMAIL = 'admin@rod-manager.local';
    process.env.AUTH_INITIAL_USER_PASSWORD = 'admin1234';
  });

  afterEach(() => {
    delete process.env.AUTH_INITIAL_USER_EMAIL;
    delete process.env.AUTH_INITIAL_USER_PASSWORD;
  });

  it('creates a session on successful login and returns it', async () => {
    const server = Fastify();
    await server.register(sessionPlugin);
    await server.register(databasePlugin, { project: testProjectConfig });

    authRoutes(server);

    const loginResponse = await server.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'admin@rod-manager.local',
        password: 'admin1234',
      },
    });

    expect(loginResponse.statusCode).toBe(200);

    const sessionCookie = loginResponse.cookies.find(
      (cookie) => cookie.name === SESSION_COOKIE_NAME,
    );

    expect(sessionCookie).toBeDefined();

    const sessionResponse = await server.inject({
      method: 'GET',
      url: '/api/auth/session',
      cookies: {
        [SESSION_COOKIE_NAME]: sessionCookie?.value ?? '',
      },
    });

    expect(sessionResponse.statusCode).toBe(200);
    expect(sessionResponse.json()).toEqual({
      authenticated: true,
      user: {
        id: 'initial-admin-user',
        email: 'admin@rod-manager.local',
        name: 'Administrator',
        surname: '',
        displayName: 'Administrator',
        role: 'admin',
      },
    });

    await server.close();
  });

  it('returns unauthorized when requesting the session without a cookie', async () => {
    const server = Fastify();
    await server.register(sessionPlugin);
    await server.register(databasePlugin, { project: testProjectConfig });

    authRoutes(server);

    const response = await server.inject({
      method: 'GET',
      url: '/api/auth/session',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ message: 'Not authenticated.' });

    await server.close();
  });

  it('returns unauthorized for wrong credentials', async () => {
    const server = Fastify();
    await server.register(sessionPlugin);
    await server.register(databasePlugin, { project: testProjectConfig });

    authRoutes(server);

    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'admin@rod-manager.local',
        password: 'wrong-password',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ message: 'Invalid email or password.' });

    await server.close();
  });

  it('registers a new user and creates a session', async () => {
    const server = Fastify();
    await server.register(sessionPlugin);
    await server.register(databasePlugin, { project: testProjectConfig });

    authRoutes(server);

    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'newuser@example.com',
        name: 'John',
        surname: 'Doe',
        password: 'secret123',
      },
    });

    expect(response.statusCode).toBe(201);

    const body = response.json<SessionResponse>();
    expect(body.authenticated).toBe(true);
    expect(body.user.email).toBe('newuser@example.com');
    expect(body.user.name).toBe('John');
    expect(body.user.surname).toBe('Doe');
    expect(body.user.displayName).toBe('John Doe');
    expect(body.user.role).toBe('user');

    const sessionCookie = response.cookies.find(
      (cookie) => cookie.name === SESSION_COOKIE_NAME,
    );
    expect(sessionCookie).toBeDefined();

    await server.close();
  });

  it('returns 400 when password is missing during registration', async () => {
    const server = Fastify();
    await server.register(sessionPlugin);
    await server.register(databasePlugin, { project: testProjectConfig });

    authRoutes(server);

    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'oauthuser@example.com',
        name: 'Jane',
        surname: 'Smith',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      message: 'Email, name, surname, and password are required.',
    });

    await server.close();
  });

  it('returns 409 when registering with an existing email', async () => {
    const server = Fastify();
    await server.register(sessionPlugin);
    await server.register(databasePlugin, { project: testProjectConfig });

    authRoutes(server);

    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'admin@rod-manager.local',
        name: 'Another',
        surname: 'Admin',
        password: 'password123',
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      message: 'A user with this email already exists.',
    });

    await server.close();
  });

  it('returns 400 when required fields are missing in registration', async () => {
    const server = Fastify();
    await server.register(sessionPlugin);
    await server.register(databasePlugin, { project: testProjectConfig });

    authRoutes(server);

    const response = await server.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'newuser@example.com',
      },
    });

    expect(response.statusCode).toBe(400);

    await server.close();
  });
});
