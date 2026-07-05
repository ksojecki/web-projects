import { startProductServer } from '@ksojecki/platform-server-platform';
import { pagesServerPlugin } from '@ksojecki/rod-manager-pages-server';
import { rodManagerProjectConfig } from './productConfig';

void startProductServer({
  productId: 'rod-manager',
  project: rodManagerProjectConfig,
  plugins: [pagesServerPlugin()],
});
