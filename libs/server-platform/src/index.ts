export { createServerPlatform } from './lib/createServerPlatform';
export type { ServerPlatformOptions } from './lib/createServerPlatform';
export type {
  ServerPlatformSsrOptions,
  ServerPlatformSsrProductionPaths,
} from './lib/routes/ssr';
export type {
  ServerPlatformPlugin,
  ServerPlatformPluginMeta,
  ServerPlatformPluginContext,
  ServerPlatformMigration,
  ServerPlatformAuthStore,
  ServerPlatformAuthStoreUser,
  ServerPlatformDbClient,
  ServerPlatformDbStatement,
  ApiErrorResponse,
  JsonValue,
  JsonPrimitive,
} from './lib/contracts/plugin.contract';
export type { ServerPlatformCapability } from './lib/contracts/capability.contract';
export { SESSION_COOKIE_NAME } from './lib/plugins/session';
