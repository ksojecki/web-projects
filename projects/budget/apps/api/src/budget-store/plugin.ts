import Database from 'better-sqlite3';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { bootstrapBudgetDatabase, resolveBudgetDatabasePath } from './database';
import { createBudgetStore } from './store';
import type { BudgetStore, BudgetStoreConfig } from './types';

declare module 'fastify' {
  interface FastifyInstance {
    budgetStore: BudgetStore;
  }
}

export const budgetStorePlugin: FastifyPluginAsync<BudgetStoreConfig> = fp(
  async function budgetStorePlugin(fastify: FastifyInstance, opts: BudgetStoreConfig) {
    const databasePath = resolveBudgetDatabasePath(opts.path);
    const budgetDatabase = new Database(databasePath);

    bootstrapBudgetDatabase(budgetDatabase, {
      seedCategories: opts.seedCategories ?? true,
    });

    fastify.decorate('budgetStore', createBudgetStore(budgetDatabase));
    fastify.addHook('onClose', async () => {
      budgetDatabase.close();
    });
  },
);
