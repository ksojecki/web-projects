import { startProductServer } from '@ksojecki/platform-server-platform';
import { recepturomatProjectConfig } from './productConfig';
import { recepturomatRecipeApiPlugin } from './recipe-api';
import { recipeStorePlugin } from './recipe-store';

startProductServer({
  productId: 'recepturomat',
  project: recepturomatProjectConfig,
  async registerFeaturePlugins(server) {
    await server.register(
      recipeStorePlugin,
      recepturomatProjectConfig.recipeStore,
    );
    await server.register(recepturomatRecipeApiPlugin);
  },
});
