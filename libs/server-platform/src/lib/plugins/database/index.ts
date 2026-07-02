import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import Database from 'better-sqlite3';
import {
  initializeSchema,
  ensureUserSettingsModel,
  ensureUserRoleColumn,
  ensureNameColumns,
  resolveDatabasePath,
  seedInitialUser,
  ensureAdministratorExists,
} from './init';
import { createStore } from './store';
import { createUserSettingsStore } from './userSettingsStore';
import type { ServerPlatformProjectConfig } from '../../contracts/bootstrap.contract';
import type { ServerPlatformDbClient } from '../../contracts/plugin.contract';

export type {
  AuthStore,
  AuthStoreUser,
  AuthStoreSession,
  OAuthProviderData,
  OAuthProviderType,
  UserSettingsStore,
} from './types';
export { createSessionExpiration } from './types';

interface DatabasePluginOptions {
  project: ServerPlatformProjectConfig;
}

/**
 * Registers SQLite-backed store for authentication and session persistence.
 */
export default fp<DatabasePluginOptions>(function databasePlugin(
  fastify: FastifyInstance,
  opts,
) {
  if (!opts?.project) {
    throw new Error(
      'databasePlugin requires opts.project with database.path and database.seedInitialUser.',
    );
  }

  const db = new Database(resolveDatabasePath(opts.project.database.path));

  initializeSchema(db);
  ensureUserSettingsModel(db);
  ensureUserRoleColumn(db);
  ensureNameColumns(db);

  if (opts.project.database.seedInitialUser) {
    seedInitialUser(db);
  }

  ensureAdministratorExists(db);

  fastify.decorate('authStore', createStore(db));
  fastify.decorate('userSettingsStore', createUserSettingsStore(db));
  fastify.decorate('db', createDatabaseClient(db));

  fastify.addHook('onClose', async () => {
    db.close();
  });
});

function createDatabaseClient(db: Database.Database): ServerPlatformDbClient {
  return {
    prepare(sql: string) {
      return db.prepare(sql);
    },
    exec(sql: string) {
      db.exec(sql);
    },
  };
}
