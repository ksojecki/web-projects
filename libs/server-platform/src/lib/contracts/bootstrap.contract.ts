import type { ServerPlatformSsrOptions } from '../routes/ssr';

export interface ServerPlatformProjectConfig {
  projectId: string;
  auth?: {
    allowRegistration?: boolean;
    allowOAuthAutoProvisioning?: boolean;
  };
  database: {
    path: string;
    seedInitialUser: boolean;
  };
  ssr?: ServerPlatformSsrOptions;
}
