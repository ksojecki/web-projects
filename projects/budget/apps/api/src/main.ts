import { startProductServer } from '@ksojecki/platform-server-platform';
import { budgetStorePlugin } from './budget-store';
import { budgetApiPlugin } from './budget-api';
import { budgetProjectConfig } from './productConfig';

startProductServer({
  productId: 'budget',
  project: budgetProjectConfig,
  async registerFeaturePlugins(server) {
    await server.register(budgetStorePlugin, budgetProjectConfig.budgetStore);
    await server.register(budgetApiPlugin);
  },
});
