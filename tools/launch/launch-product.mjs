import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import https from 'node:https';
import { resolve } from 'node:path';
import {
  Browser,
  detectBrowserPlatform,
  install,
  resolveBuildId,
} from '@puppeteer/browsers';
import { executablePath, launch } from 'puppeteer';
import { loadProductEnv } from '../../scripts/workspace-config.mjs';

const SERVER_START_TIMEOUT_MS = 120000;

await main();

async function main() {
  const options = parseArgs(process.argv.slice(2));

  loadProductEnv(options.projectId);

  const apiPort = readIntegerFromEnv(process.env.PORT, options.defaultApiPort);
  const chromeDebugPort = readIntegerFromEnv(
    process.env.CHROME_DEBUG_PORT,
    options.defaultChromeDebugPort,
  );
  const frontendBaseUrl =
    process.env.OAUTH_REDIRECT_BASE_URL ?? options.defaultFrontendBaseUrl;
  const chromeUserDataDir = resolve(
    process.cwd(),
    process.env.CHROME_USER_DATA_DIR ?? `tmp/chrome/${options.projectId}`,
  );
  const chromeExecutablePath = await resolveChromeExecutablePath();
  const serverProcess = spawn(
    'node',
    [
      './node_modules/nx/dist/bin/nx.js',
      'run',
      options.serveTarget,
      '--no-tui',
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        OAUTH_REDIRECT_BASE_URL: frontendBaseUrl,
        PORT: String(apiPort),
      },
      stdio: 'inherit',
    },
  );

  mkdirSync(chromeUserDataDir, { recursive: true });

  try {
    await waitForServer(frontendBaseUrl);
  } catch (error) {
    serverProcess.kill('SIGTERM');
    throw error;
  }

  const browser = await launch({
    browser: 'chrome',
    debuggingPort: chromeDebugPort,
    executablePath: chromeExecutablePath,
    headless: false,
    ignoreHTTPSErrors: true,
    args: [
      '--allow-insecure-localhost',
      '--no-default-browser-check',
      '--no-first-run',
      '--use-mock-keychain',
    ],
    userDataDir: chromeUserDataDir,
  });

  const pages = await browser.pages();
  const page = pages[0] ?? (await browser.newPage());

  await page.goto(frontendBaseUrl, { waitUntil: 'domcontentloaded' });
  await page.bringToFront();

  console.log(
    `[launch] ${options.projectId} ready at ${frontendBaseUrl} with Chrome DevTools on 127.0.0.1:${String(chromeDebugPort)}`,
  );

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    serverProcess.kill(signal);

    if (browser.connected) {
      await browser.close();
    }
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  browser.on('disconnected', () => {
    if (!shuttingDown) {
      serverProcess.kill('SIGTERM');
      process.exit(0);
    }
  });

  serverProcess.on('exit', async (code, signal) => {
    if (signal !== null) {
      await shutdown(signal);
      process.exit(0);
      return;
    }

    await shutdown('SIGTERM');
    process.exit(code ?? 0);
  });
}

function getPuppeteerCacheDir() {
  return resolve(
    process.cwd(),
    process.env.PUPPETEER_CACHE_DIR ?? 'tmp/puppeteer',
  );
}

function parseArgs(args) {
  const options = {
    defaultApiPort: undefined,
    defaultChromeDebugPort: undefined,
    defaultFrontendBaseUrl: undefined,
    projectId: undefined,
    serveTarget: undefined,
  };

  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];

    switch (flag) {
      case '--default-api-port':
        options.defaultApiPort = Number.parseInt(value, 10);
        break;
      case '--default-chrome-debug-port':
        options.defaultChromeDebugPort = Number.parseInt(value, 10);
        break;
      case '--default-frontend-base-url':
        options.defaultFrontendBaseUrl = value;
        break;
      case '--project-id':
        options.projectId = value;
        break;
      case '--serve-target':
        options.serveTarget = value;
        break;
      default:
        throw new Error(`Unknown argument: ${flag}`);
    }
  }

  if (
    options.projectId === undefined ||
    options.serveTarget === undefined ||
    options.defaultApiPort === undefined ||
    options.defaultFrontendBaseUrl === undefined ||
    options.defaultChromeDebugPort === undefined
  ) {
    throw new Error(
      'Usage: node ./tools/launch/launch-product.mjs --project-id <id> --serve-target <target> --default-api-port <port> --default-frontend-base-url <url> --default-chrome-debug-port <port>',
    );
  }

  return options;
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

async function resolveChromeExecutablePath() {
  if (
    process.env.CHROME_FOR_TESTING_BIN !== undefined &&
    process.env.CHROME_FOR_TESTING_BIN.length > 0
  ) {
    return process.env.CHROME_FOR_TESTING_BIN;
  }

  const bundledExecutablePath = await executablePath();

  if (existsSync(bundledExecutablePath)) {
    return bundledExecutablePath;
  }

  const platform = detectBrowserPlatform();

  if (platform === undefined) {
    throw new Error(
      'Unable to detect a supported platform for Chrome for Testing.',
    );
  }

  const buildId = await resolveBuildId(Browser.CHROME, platform, 'stable');
  const installedBrowser = await install({
    browser: Browser.CHROME,
    buildId,
    cacheDir: getPuppeteerCacheDir(),
    platform,
  });

  return installedBrowser.executablePath;
}

function waitForServer(frontendBaseUrl) {
  const deadline = Date.now() + SERVER_START_TIMEOUT_MS;

  return new Promise((resolvePromise, rejectPromise) => {
    const attemptConnection = () => {
      const request = https.get(
        frontendBaseUrl,
        { rejectUnauthorized: false },
        (response) => {
          response.resume();
          resolvePromise();
        },
      );

      request.on('error', () => {
        if (Date.now() > deadline) {
          rejectPromise(
            new Error(
              `Timed out waiting for ${frontendBaseUrl} to start within ${String(SERVER_START_TIMEOUT_MS)}ms.`,
            ),
          );
          return;
        }

        setTimeout(attemptConnection, 1000);
      });
    };

    attemptConnection();
  });
}
