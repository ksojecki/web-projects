import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import type {
  ServerPlatformAuthStore,
  ServerPlatformPlugin,
  ServerPlatformPluginContext,
} from './contracts/plugin.contract';
import type { AuthStore } from './plugins/database';

/** Creates a Fastify plugin that registers the given ServerPlatformPlugin list in order. */
export function createPluginRegistrar(plugins: ServerPlatformPlugin[]) {
  return fp(async function serverPluginRegistrar(fastify: FastifyInstance) {
    for (const plugin of plugins) {
      await fastify.register(
        fp(async function serverPlugin(instance: FastifyInstance) {
          const ctx: ServerPlatformPluginContext = {
            fastify: instance,
            services: {
              authStore: createAuthStoreAdapter(instance.authStore),
              db: instance.db,
              logger: instance.log,
            },
          };

          if (plugin.migrations) {
            for (const migration of plugin.migrations) {
              await migration.up(ctx);
            }
          }

          await plugin.register(ctx);
        }),
      );
    }
  });
}

function createAuthStoreAdapter(authStore: AuthStore): ServerPlatformAuthStore {
  return {
    findUserById(id: string) {
      const user = authStore.findUserById(id);
      if (user === undefined) {
        return undefined;
      }
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
      };
    },
  };
}
