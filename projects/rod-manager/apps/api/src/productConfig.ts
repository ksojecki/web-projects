import path from 'node:path';
import type { ServerPlatformProjectConfig } from '@ksojecki/platform-server-platform';

export const rodManagerProjectConfig: ServerPlatformProjectConfig = {
  projectId: 'rod-manager',
  database: {
    path: process.env.ROD_MANAGER_AUTH_DB_PATH ?? 'tmp/rod-manager/auth.sqlite',
    seedInitialUser: process.env.ROD_MANAGER_AUTH_SEED_INITIAL_USER === 'true',
  },
  ssr: {
    webRoot: path.resolve(process.cwd(), 'projects/rod-manager/apps/web'),
    production: {
      clientRoot: path.resolve(
        process.cwd(),
        'dist/projects/rod-manager/apps/web/client',
      ),
      serverEntryPath: path.resolve(
        process.cwd(),
        'dist/projects/rod-manager/apps/web/server/entry-server.mjs',
      ),
    },
  },
};
