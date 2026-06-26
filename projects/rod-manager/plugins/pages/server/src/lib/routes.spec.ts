import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type {
  ContentPageListResponseBody,
  ContentPageResponseBody,
} from '@sojecki/rod-manager-pages-shared';
import {
  createServerPlatform,
  SESSION_COOKIE_NAME,
} from '@sojecki/platform-server-platform';
import { pagesServerPlugin } from './plugin';

const testProjectConfig = {
  projectId: 'rod-manager-pages-server-test',
  database: {
    path: ':memory:',
    seedInitialUser: true,
  },
} as const;

describe('pages plugin contract tests', () => {
  beforeEach(() => {
    process.env.AUTH_INITIAL_USER_EMAIL = 'admin@rod-manager.local';
    process.env.AUTH_INITIAL_USER_PASSWORD = 'admin1234';
  });

  afterEach(() => {
    delete process.env.AUTH_INITIAL_USER_EMAIL;
    delete process.env.AUTH_INITIAL_USER_PASSWORD;
  });

  it('GET /api/pages returns { pages: [...] } envelope for authenticated users', async () => {
    const server = Fastify();
    await server.register(async (instance) => {
      await createServerPlatform(instance, {
        project: testProjectConfig,
        plugins: [pagesServerPlugin()],
      });
    });

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

    const pagesResponse = await server.inject({
      method: 'GET',
      url: '/api/pages',
      cookies: {
        [SESSION_COOKIE_NAME]: sessionCookie?.value ?? '',
      },
    });

    expect(pagesResponse.statusCode).toBe(200);
    const body = pagesResponse.json<ContentPageListResponseBody>();
    expect(body).toHaveProperty('pages');
    expect(Array.isArray(body.pages)).toBe(true);
    expect(body.pages.every((p) => typeof p.slug === 'string')).toBe(true);

    await server.close();
  });

  it('GET /api/pages/:slug returns { page: ... } envelope', async () => {
    const server = Fastify();
    await server.register(async (instance) => {
      await createServerPlatform(instance, {
        project: testProjectConfig,
        plugins: [pagesServerPlugin()],
      });
    });

    const response = await server.inject({
      method: 'GET',
      url: '/api/pages/about',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<ContentPageResponseBody>();
    expect(body).toHaveProperty('page');
    expect(body.page).toHaveProperty('slug', 'about');
    expect(body.page).toHaveProperty('contentMd');
    expect(typeof body.page.contentMd).toBe('string');

    await server.close();
  });

  it('GET /api/pages/:slug returns 404 with { message } for missing slug', async () => {
    const server = Fastify();
    await server.register(async (instance) => {
      await createServerPlatform(instance, {
        project: testProjectConfig,
        plugins: [pagesServerPlugin()],
      });
    });

    const response = await server.inject({
      method: 'GET',
      url: '/api/pages/nonexistent-slug',
    });

    expect(response.statusCode).toBe(404);
    const body = response.json<{ message: string }>();
    expect(body).toHaveProperty('message');
    expect(typeof body.message).toBe('string');

    await server.close();
  });

  it('GET /api/pages returns 401 for unauthenticated requests', async () => {
    const server = Fastify();
    await server.register(async (instance) => {
      await createServerPlatform(instance, {
        project: testProjectConfig,
        plugins: [pagesServerPlugin()],
      });
    });

    const response = await server.inject({
      method: 'GET',
      url: '/api/pages',
    });

    expect(response.statusCode).toBe(401);

    await server.close();
  });
});
