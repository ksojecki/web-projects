import path from 'node:path';
import type { ServerPlatformProjectConfig } from '@ksojecki/platform-server-platform';
import {
  getProductBudgetDbPath,
  getProductAuthDbPath,
  getProductSeedInitialUser,
  loadProductEnv,
} from '@ksojecki/platform-shared';
import type { BudgetStoreConfig } from '../../../plugins/budget-store';

loadProductEnv('budget');

export interface BudgetProjectConfig extends ServerPlatformProjectConfig {
  ownerEmail: string;
  budgetStore: BudgetStoreConfig;
}

export const budgetProjectConfig: BudgetProjectConfig = {
  projectId: 'budget',
  auth: {
    allowRegistration: false,
    allowOAuthAutoProvisioning: false,
  },
  database: {
    path: getProductAuthDbPath('budget'),
    seedInitialUser: getProductSeedInitialUser(),
  },
  ownerEmail:
    process.env.BUDGET_OWNER_EMAIL ??
    process.env.AUTH_INITIAL_USER_EMAIL ??
    'admin@rod-manager.local',
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
