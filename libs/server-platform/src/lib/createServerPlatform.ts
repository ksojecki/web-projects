import type { FastifyInstance } from 'fastify';
import type { ServerPlatformPlugin } from './contracts/plugin.contract';
import { createPluginRegistrar } from './serverPluginRegistry';
import databasePlugin from './plugins/database';
import sessionPlugin from './plugins/session';
import oauthPlugin from './plugins/oauth';
import sensiblePlugin from './plugins/sensible';
import authRoutes from './routes/auth';
import oauthRoutes from './routes/oauth';
import rootRoute from './routes/root';
import ssrRoute from './routes/ssr';
import type { ServerPlatformSsrOptions } from './routes/ssr';
import userSettingsRoutes from './routes/user-settings';

export interface ServerPlatformOptions {
  logLevel?: string;
  plugins?: ServerPlatformPlugin[];
  ssr?: ServerPlatformSsrOptions;
}

/** Registers all core plugins and routes on the given Fastify instance. */
export async function createServerPlatform(
  fastify: FastifyInstance,
  opts: ServerPlatformOptions = {},
): Promise<void> {
  // Core plugins
  await fastify.register(sensiblePlugin);
  await fastify.register(databasePlugin);
  await fastify.register(sessionPlugin);
  await fastify.register(oauthPlugin);

  // Core routes
  fastify.register(authRoutes);
  fastify.register(oauthRoutes);
  fastify.register(rootRoute);
  fastify.register(userSettingsRoutes);
  if (opts.ssr) {
    fastify.register(ssrRoute, opts.ssr);
  }

  // Feature plugins
  if (opts.plugins && opts.plugins.length > 0) {
    fastify.register(createPluginRegistrar(opts.plugins));
  }
}
