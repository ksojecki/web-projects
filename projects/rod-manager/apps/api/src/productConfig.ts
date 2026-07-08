import path from 'node:path';
import type { ServerPlatformProjectConfig } from '@ksojecki/platform-server-platform';
import {
  getProductAuthDbPath,
  getProductSeedInitialUser,
  loadProductEnv,
} from '@ksojecki/platform-shared';

loadProductEnv('rod-manager');

export const rodManagerProjectConfig: ServerPlatformProjectConfig = {
  projectId: 'rod-manager',
  database: {
    path: getProductAuthDbPath('rod-manager'),
    seedInitialUser: getProductSeedInitialUser(),
  },
  ssr: {
    webRoot: path.resolve(process.cwd(), 'projects/rod-manager/apps/web'),
    production: {
      clientRoot: path.resolve(process.cwd(), 'dist/projects/rod-manager/apps/web/client'),
      serverEntryPath: path.resolve(
        process.cwd(),
        'dist/projects/rod-manager/apps/web/server/entry-server.mjs',
      ),
    },
  },
};
