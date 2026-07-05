import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';

export const PRODUCT_CONFIG = {
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
const loadedProjects = new Set();

export function getChromeUserDataDir(projectId) {
  return resolve(
    process.cwd(),
    process.env.CHROME_USER_DATA_DIR ?? `tmp/chrome/${projectId}`,
  );
}

export function getProductApiPort(projectId) {
  return readIntegerFromEnv(
    process.env.PORT,
    PRODUCT_CONFIG[projectId].apiPort,
  );
}

export function getProductChromeDebugPort(projectId) {
  return readIntegerFromEnv(
    process.env.CHROME_DEBUG_PORT,
    PRODUCT_CONFIG[projectId].chromeDebugPort,
  );
}

export function getProductFrontendBaseUrl(projectId) {
  return (
    process.env.OAUTH_REDIRECT_BASE_URL ??
    PRODUCT_CONFIG[projectId].frontendBaseUrl
  );
}

export function getProductWebPort(projectId) {
  return readIntegerFromEnv(
    process.env.WEB_PORT,
    PRODUCT_CONFIG[projectId].webPort,
  );
}

export function loadProductEnv(projectId) {
  if (loadedProjects.has(projectId)) {
    return;
  }

  const originalEnvKeys = new Set(Object.keys(process.env));
  const mergedEnv = {};
  const envFilePaths = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '.env.local'),
    resolve(process.cwd(), 'projects', projectId, '.env'),
    resolve(process.cwd(), 'projects', projectId, '.env.local'),
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

  loadedProjects.add(projectId);
}

function readIntegerFromEnv(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue)) {
    return fallback;
  }

  return parsedValue;
}
