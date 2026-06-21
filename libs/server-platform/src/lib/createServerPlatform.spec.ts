import type { FastifyInstance } from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('createServerPlatform', () => {
  beforeEach(() => {
    mocks.createPluginRegistrar.mockClear();
  });

  it('skips SSR route registration when SSR options are not provided', async () => {
    const register = vi.fn<(plugin: unknown, options?: unknown) => void>();
    const fastify = { register } as unknown as FastifyInstance;

    await createServerPlatform(fastify);

    expect(register).not.toHaveBeenCalledWith(mocks.ssrRoute);
  });

  it('registers the SSR route with explicit product configuration', async () => {
    const register = vi.fn<(plugin: unknown, options?: unknown) => void>();
    const fastify = { register } as unknown as FastifyInstance;
    const ssr: ServerPlatformSsrOptions = {
      webRoot: 'apps/storefront',
      production: {
        clientRoot: 'dist/apps/storefront/client',
        serverEntryPath: 'dist/apps/storefront/server/entry-server.mjs',
      },
    };

    await createServerPlatform(fastify, { ssr });

    expect(register).toHaveBeenCalledWith(mocks.ssrRoute, ssr);
  });
});
