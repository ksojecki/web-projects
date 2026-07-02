import type { FastifyBaseLogger, FastifyInstance } from 'fastify';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | { [key: string]: JsonValue }
  | JsonValue[];

export interface ServerPlatformAuthStoreUser {
  id: string;
  email: string;
  role: string;
  displayName: string;
}

export interface ServerPlatformAuthStore {
  findUserById(id: string): ServerPlatformAuthStoreUser | undefined;
}

export interface ServerPlatformDbStatement<
  TParams extends unknown[] = unknown[],
  TResult = JsonValue,
> {
  get(...params: TParams): TResult | undefined;
  all(...params: TParams): TResult[];
  run(...params: TParams): { changes: number };
}

export interface ServerPlatformDbClient {
  prepare<TParams extends unknown[] = unknown[], TResult = JsonValue>(
    sql: string,
  ): ServerPlatformDbStatement<TParams, TResult>;
  exec(sql: string): void;
}

export interface ServerPlatformPluginMeta {
  id: string;
  version: string;
  description?: string;
  dependsOn?: string[];
  capabilities?: string[];
}

export interface ServerPlatformPluginContext {
  fastify: FastifyInstance;
  services: {
    authStore: ServerPlatformAuthStore;
    db: ServerPlatformDbClient;
    logger: FastifyBaseLogger;
  };
}

export interface ServerPlatformMigration {
  id: string;
  up: (ctx: ServerPlatformPluginContext) => Promise<void> | void;
}

export interface ServerPlatformPlugin {
  meta: ServerPlatformPluginMeta;
  migrations?: ServerPlatformMigration[];
  register: (ctx: ServerPlatformPluginContext) => Promise<void> | void;
}

export interface ApiErrorResponse {
  message: string;
  code?: string;
  details?: Record<string, JsonValue>;
}
