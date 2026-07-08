import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';

export type ProductId = 'recepturomat' | 'rod-manager';

export interface ProductWorkspaceConfig {
  authDbPath: string;
  apiPort: number;
  chromeDebugPort: number;
  frontendBaseUrl: string;
  webPort: number;
}

type EnvMap = Record<string, string>;

const PRODUCT_WORKSPACE_CONFIG: Record<ProductId, ProductWorkspaceConfig> = {
  'rod-manager': {
    authDbPath: 'tmp/rod-manager/auth.sqlite',
    apiPort: 3000,
    chromeDebugPort: 9222,
    frontendBaseUrl: 'https://localhost:3000',
    webPort: 4200,
  },
  recepturomat: {
    authDbPath: 'tmp/recepturomat/auth.sqlite',
    apiPort: 3100,
    chromeDebugPort: 9333,
    frontendBaseUrl: 'https://localhost:3100',
    webPort: 4300,
  },
};
const loadedProjects = new Set<ProductId>();

export function loadProductEnv(productId: ProductId): void {
  if (loadedProjects.has(productId)) {
    return;
  }

  const projectRoot = resolve(process.cwd(), 'projects', productId);
  const originalEnvKeys = new Set(Object.keys(process.env));
  const mergedEnv: EnvMap = {};
  const envFilePaths = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '.env.local'),
    resolve(projectRoot, '.env'),
    resolve(projectRoot, '.env.local'),
  ];

  for (const envFilePath of envFilePaths) {
    if (!existsSync(envFilePath)) {
      continue;
    }

    Object.assign(mergedEnv, dotenv.parse(readFileSync(envFilePath)));
  }

  for (const [key, value] of Object.entries(mergedEnv)) {
    if (!originalEnvKeys.has(key)) {
      process.env[key] = value;
    }
  }

  loadedProjects.add(productId);
}

export function applyProductRuntimeDefaults(productId: ProductId): void {
  process.env.PORT ??= String(getProductApiPort(productId));
  process.env.OAUTH_REDIRECT_BASE_URL ??= getProductFrontendBaseUrl(productId);
}

export function getProductApiPort(productId: ProductId): number {
  return readIntegerFromEnv(process.env.PORT, PRODUCT_WORKSPACE_CONFIG[productId].apiPort);
}

export function getProductAuthDbPath(productId: ProductId): string {
  return process.env.AUTH_DB_PATH ?? PRODUCT_WORKSPACE_CONFIG[productId].authDbPath;
}

export function getProductChromeDebugPort(productId: ProductId): number {
  return readIntegerFromEnv(
    process.env.CHROME_DEBUG_PORT,
    PRODUCT_WORKSPACE_CONFIG[productId].chromeDebugPort,
  );
}

export function getProductFrontendBaseUrl(productId: ProductId): string {
  return process.env.OAUTH_REDIRECT_BASE_URL ?? PRODUCT_WORKSPACE_CONFIG[productId].frontendBaseUrl;
}

export function getProductRecipeDbPath(): string {
  return process.env.RECIPE_DB_PATH ?? 'tmp/recepturomat/recipes.sqlite';
}

export function getProductSeedInitialUser(): boolean {
  return readBooleanFromEnv(process.env.AUTH_SEED_INITIAL_USER, false);
}

export function getProductWebPort(productId: ProductId): number {
  return readIntegerFromEnv(process.env.WEB_PORT, PRODUCT_WORKSPACE_CONFIG[productId].webPort);
}

function readBooleanFromEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return fallback;
}

function readIntegerFromEnv(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue)) {
    return fallback;
  }

  return parsedValue;
}
