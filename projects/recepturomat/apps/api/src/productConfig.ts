import path from 'node:path';
import type { ServerPlatformProjectConfig } from '@ksojecki/platform-server-platform';

export interface RecepturomatRecipeStoreConfig {
  path: string;
  seedLegacyRecipes: boolean;
}

export interface RecepturomatProjectConfig extends ServerPlatformProjectConfig {
  recipeStore: RecepturomatRecipeStoreConfig;
}

export const recepturomatProjectConfig: RecepturomatProjectConfig = {
  projectId: 'recepturomat',
  database: {
    path:
      process.env.RECEPTUROMAT_AUTH_DB_PATH ?? 'tmp/recepturomat/auth.sqlite',
    seedInitialUser: process.env.RECEPTUROMAT_AUTH_SEED_INITIAL_USER === 'true',
  },
  recipeStore: {
    path:
      process.env.RECEPTUROMAT_RECIPE_DB_PATH ??
      'tmp/recepturomat/recipes.sqlite',
    seedLegacyRecipes:
      process.env.RECEPTUROMAT_RECIPE_SEED_LEGACY_RECIPES !== 'false',
  },
  ssr: {
    webRoot: path.resolve(process.cwd(), 'projects/recepturomat/apps/web'),
    production: {
      clientRoot: path.resolve(
        process.cwd(),
        'dist/projects/recepturomat/apps/web/client',
      ),
      serverEntryPath: path.resolve(
        process.cwd(),
        'dist/projects/recepturomat/apps/web/server/entry-server.mjs',
      ),
    },
  },
};
