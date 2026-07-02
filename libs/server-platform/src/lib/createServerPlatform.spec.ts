import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerPlatformProjectConfig } from './contracts/bootstrap.contract';
import type { ServerPlatformSsrOptions } from './routes/ssr';

const mocks = vi.hoisted(() => ({
  authRoutes: Symbol('authRoutes'),
  createPluginRegistrar: vi.fn<
    (plugins: unknown[]) => { kind: string; plugins: unknown[] }
  >((plugins: unknown[]) => ({
    kind: 'plugin-registrar',
    plugins,
  })),
  databasePlugin: Symbol('databasePlugin'),
  oauthPlugin: Symbol('oauthPlugin'),
  oauthRoutes: Symbol('oauthRoutes'),
  rootRoute: Symbol('rootRoute'),
  sensiblePlugin: Symbol('sensiblePlugin'),
  sessionPlugin: Symbol('sessionPlugin'),
  ssrRoute: Symbol('ssrRoute'),
  userSettingsRoutes: Symbol('userSettingsRoutes'),
}));

vi.mock('./plugins/database', () => ({ default: mocks.databasePlugin }));
vi.mock('./plugins/oauth', () => ({ default: mocks.oauthPlugin }));
vi.mock('./plugins/sensible', () => ({ default: mocks.sensiblePlugin }));
vi.mock('./plugins/session', () => ({ default: mocks.sessionPlugin }));
vi.mock('./routes/auth', () => ({ default: mocks.authRoutes }));
vi.mock('./routes/oauth', () => ({ default: mocks.oauthRoutes }));
vi.mock('./routes/root', () => ({ default: mocks.rootRoute }));
vi.mock('./routes/ssr', () => ({ default: mocks.ssrRoute }));
vi.mock('./routes/user-settings', () => ({
  default: mocks.userSettingsRoutes,
}));
vi.mock('./serverPluginRegistry', () => ({
  createPluginRegistrar: mocks.createPluginRegistrar,
}));

import { createServerPlatform } from './createServerPlatform';

const testProjectConfig: ServerPlatformProjectConfig = {
  projectId: 'test-project',
  database: {
    path: ':memory:',
    seedInitialUser: false,
  },
};

describe('createServerPlatform', () => {
  beforeEach(() => {
    mocks.createPluginRegistrar.mockClear();
  });

  it('throws an actionable error when project config is missing', async () => {
    const fastify = Fastify();
    const register = vi
      .spyOn(fastify, 'register')
      // @ts-expect-error Fastify's register spy expects an overloaded return type here.
      .mockImplementation(() => fastify);

    await expect(createServerPlatform(fastify, undefined)).rejects.toThrowError(
      'createServerPlatform requires opts.project with database.path and database.seedInitialUser.',
    );
    expect(register).not.toHaveBeenCalled();

    await fastify.close();
  });

  it('throws the same actionable error when options are undefined', async () => {
    const fastify = Fastify();
    const register = vi
      .spyOn(fastify, 'register')
      // @ts-expect-error Fastify's register spy expects an overloaded return type here.
      .mockImplementation(() => fastify);

    await expect(createServerPlatform(fastify, undefined)).rejects.toThrowError(
      'createServerPlatform requires opts.project with database.path and database.seedInitialUser.',
    );
    expect(register).not.toHaveBeenCalled();

    await fastify.close();
  });

  it('skips SSR route registration when SSR options are not provided', async () => {
    const fastify = Fastify();
    const register = vi
      .spyOn(fastify, 'register')
      // @ts-expect-error Fastify's register spy expects an overloaded return type here.
      .mockImplementation(() => fastify);

    await createServerPlatform(fastify, { project: testProjectConfig });

    expect(register).toHaveBeenCalledWith(mocks.databasePlugin, {
      project: testProjectConfig,
    });
    expect(register).not.toHaveBeenCalledWith(mocks.ssrRoute);

    await fastify.close();
  });

  it('registers the SSR route with explicit product configuration', async () => {
    const fastify = Fastify();
    const register = vi
      .spyOn(fastify, 'register')
      // @ts-expect-error Fastify's register spy expects an overloaded return type here.
      .mockImplementation(() => fastify);
    const ssr: ServerPlatformSsrOptions = {
      webRoot: 'apps/storefront',
      production: {
        clientRoot: 'dist/apps/storefront/client',
        serverEntryPath: 'dist/apps/storefront/server/entry-server.mjs',
      },
    };

    await createServerPlatform(fastify, {
      project: {
        ...testProjectConfig,
        ssr,
      },
    });

    expect(register).toHaveBeenCalledWith(mocks.ssrRoute, ssr);

    await fastify.close();
  });
});
