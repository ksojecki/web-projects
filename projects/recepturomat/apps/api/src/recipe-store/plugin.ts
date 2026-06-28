import { existsSync } from 'node:fs';
import Database from 'better-sqlite3';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import type { RecepturomatRecipeStoreConfig } from '../productConfig';
import { bootstrapRecipeDatabase, resolveRecipeDatabasePath } from './database';
import { createRecipeStore } from './store';
import type { RecipeStore } from './types';

declare module 'fastify' {
  interface FastifyInstance {
    recipeStore: RecipeStore;
  }
}

export const recipeStorePlugin: FastifyPluginAsync<RecepturomatRecipeStoreConfig> =
  fp(async function recipeStorePlugin(
    fastify: FastifyInstance,
    opts: RecepturomatRecipeStoreConfig,
  ) {
    const databasePath = resolveRecipeDatabasePath(opts.path);
    const recipeDatabase = new Database(databasePath);

    bootstrapRecipeDatabase(recipeDatabase, {
      seedLegacyRecipes: opts.seedLegacyRecipes,
    });

    fastify.decorate('recipeStore', createRecipeStore(recipeDatabase));

    fastify.addHook('onClose', async () => {
      if (existsSync(databasePath)) {
        recipeDatabase.close();
        return;
      }

      recipeDatabase.close();
    });
  });
