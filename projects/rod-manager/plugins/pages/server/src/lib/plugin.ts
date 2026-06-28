import type { ServerPlatformPlugin } from '@ksojecki/platform-server-platform';
import { createPageStore } from './store';
import { registerPagesRoutes } from './routes';
import {
  pagesSchemaMigration,
  pagesValidationRulesMigration,
  pagesSeedMigration,
} from './migrations';

/** Creates the pages server plugin descriptor for use with createServerPlatform. */
export function pagesServerPlugin(): ServerPlatformPlugin {
  return {
    meta: {
      id: 'pages',
      version: '0.0.1',
      description: 'Content pages feature plugin',
    },
    migrations: [
      pagesSchemaMigration,
      pagesValidationRulesMigration,
      pagesSeedMigration,
    ],
    register(ctx) {
      const pageStore = createPageStore(ctx.services.db);
      registerPagesRoutes(ctx.fastify, pageStore);
    },
  };
}
