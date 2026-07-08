import path from 'node:path';
import type { ServerPlatformProjectConfig } from '@ksojecki/platform-server-platform';
import {
  getProductAuthDbPath,
  getProductRecipeDbPath,
  getProductSeedInitialUser,
  loadProductEnv,
} from '@ksojecki/platform-shared';

loadProductEnv('recepturomat');

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
    path: getProductAuthDbPath('recepturomat'),
    seedInitialUser: getProductSeedInitialUser(),
  },
  recipeStore: {
    path: getProductRecipeDbPath(),
    seedLegacyRecipes: process.env.RECIPE_SEED_LEGACY_RECIPES !== 'false',
  },
  ssr: {
    webRoot: path.resolve(process.cwd(), 'projects/recepturomat/apps/web'),
    production: {
      clientRoot: path.resolve(process.cwd(), 'dist/projects/recepturomat/apps/web/client'),
      serverEntryPath: path.resolve(
        process.cwd(),
        'dist/projects/recepturomat/apps/web/server/entry-server.mjs',
      ),
    },
  },
};
