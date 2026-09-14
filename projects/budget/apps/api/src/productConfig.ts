import path from 'node:path';
import type { ServerPlatformProjectConfig } from '@ksojecki/platform-server-platform';
import {
  getProductBudgetDbPath,
  getProductAuthDbPath,
  getProductSeedInitialUser,
  loadProductEnv,
} from '@ksojecki/platform-shared';
import type { BudgetStoreConfig } from './budget-store';

loadProductEnv('budget');

export interface BudgetProjectConfig extends ServerPlatformProjectConfig {
  budgetStore: BudgetStoreConfig;
}

export const budgetProjectConfig: BudgetProjectConfig = {
  projectId: 'budget',
  database: {
    path: getProductAuthDbPath('budget'),
    seedInitialUser: getProductSeedInitialUser(),
  },
  budgetStore: {
    path: getProductBudgetDbPath('budget'),
    seedCategories: true,
  },
  ssr: {
    webRoot: path.resolve(process.cwd(), 'projects/budget/apps/web'),
    production: {
      clientRoot: path.resolve(process.cwd(), 'dist/projects/budget/apps/web/client'),
      serverEntryPath: path.resolve(
        process.cwd(),
        'dist/projects/budget/apps/web/server/entry-server.mjs',
      ),
    },
  },
};
