import path from 'node:path';
import type { ServerPlatformProjectConfig } from '@ksojecki/platform-server-platform';

export const recepturomatProjectConfig: ServerPlatformProjectConfig = {
  projectId: 'recepturomat',
  database: {
    path:
      process.env.RECEPTUROMAT_AUTH_DB_PATH ?? 'tmp/recepturomat/auth.sqlite',
    seedInitialUser: process.env.RECEPTUROMAT_AUTH_SEED_INITIAL_USER === 'true',
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
