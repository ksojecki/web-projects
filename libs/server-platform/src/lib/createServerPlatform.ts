import type { FastifyInstance } from 'fastify';
import type { ServerPlatformProjectConfig } from './contracts/bootstrap.contract';
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
import userSettingsRoutes from './routes/user-settings';

export interface ServerPlatformOptions {
  logLevel?: string;
  project: ServerPlatformProjectConfig;
  plugins?: ServerPlatformPlugin[];
}

/** Registers all core plugins and routes on the given Fastify instance. */
export async function createServerPlatform(
  fastify: FastifyInstance,
  opts: ServerPlatformOptions | undefined,
): Promise<void> {
  assertProjectConfig(opts?.project);

  // Core plugins
  await fastify.register(sensiblePlugin);
  await fastify.register(databasePlugin, { project: opts.project });
  await fastify.register(sessionPlugin);
  fastify.decorate('authPolicy', {
    allowRegistration: opts.project.auth?.allowRegistration ?? true,
    allowOAuthAutoProvisioning: opts.project.auth?.allowOAuthAutoProvisioning ?? true,
  });
  await fastify.register(oauthPlugin);

  // Core routes
  fastify.register(authRoutes);
  fastify.register(oauthRoutes);
  fastify.register(rootRoute);
  fastify.register(userSettingsRoutes);
  if (opts.project.ssr) {
    fastify.register(ssrRoute, opts.project.ssr);
  }

  // Feature plugins
  if (opts.plugins && opts.plugins.length > 0) {
    fastify.register(createPluginRegistrar(opts.plugins));
  }
}

function assertProjectConfig(
  project: ServerPlatformProjectConfig | undefined,
): asserts project is ServerPlatformProjectConfig {
  if (!project) {
    throw new Error(
      'createServerPlatform requires opts.project with database.path and database.seedInitialUser.',
    );
  }
}
