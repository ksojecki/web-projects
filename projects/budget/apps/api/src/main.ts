import { startProductServer } from '@ksojecki/platform-server-platform';
import { budgetApiPlugin } from '../../../plugins/budget-api';
import { budgetStorePlugin } from '../../../plugins/budget-store';
import { budgetProjectConfig } from './productConfig';

startProductServer({
  productId: 'budget',
  project: budgetProjectConfig,
  async registerFeaturePlugins(server) {
    await server.register(budgetStorePlugin, budgetProjectConfig.budgetStore);
    await server.register(budgetApiPlugin, { ownerEmail: budgetProjectConfig.ownerEmail });
  },
});
