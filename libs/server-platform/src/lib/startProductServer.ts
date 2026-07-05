import Fastify, { type FastifyInstance } from 'fastify';
import { existsSync, readFileSync } from 'node:fs';
import {
  applyProductRuntimeDefaults,
  loadProductEnv,
  type ProductId,
} from '@ksojecki/platform-shared';
import type { ServerPlatformProjectConfig } from './contracts/bootstrap.contract';
import type { ServerPlatformPlugin } from './contracts/plugin.contract';
import { createServerPlatform } from './createServerPlatform';

export interface StartProductServerOptions {
  productId: ProductId;
  project: ServerPlatformProjectConfig;
  plugins?: ServerPlatformPlugin[];
  registerFeaturePlugins?: (server: FastifyInstance) => Promise<void> | void;
}

export async function startProductServer({
  productId,
  project,
  plugins = [],
  registerFeaturePlugins,
}: StartProductServerOptions): Promise<void> {
  loadProductEnv(productId);
  applyProductRuntimeDefaults(productId);

  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  const server = Fastify({
    logger: true,
    https: getHttpsOptions(),
  }) as FastifyInstance;

  server.register(async (instance) => {
    await createServerPlatform(instance, {
      project,
      plugins,
    });
    await registerFeaturePlugins?.(instance);
  });

  server.listen({ port, host }, (err) => {
    if (err) {
      server.log.error(err);
      process.exit(1);
    }

    console.log(`[ ready ] https://${host}:${String(port)}`);
  });
}

function getHttpsOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  const httpsKeyPath =
    process.env.HTTPS_KEY_PATH ??
    (isProduction ? undefined : '.cert/localhost-key.pem');
  const httpsCertPath =
    process.env.HTTPS_CERT_PATH ??
    (isProduction ? undefined : '.cert/localhost-cert.pem');

  if (httpsKeyPath === undefined || httpsCertPath === undefined) {
    throw new Error(
      'HTTPS requires HTTPS_KEY_PATH and HTTPS_CERT_PATH in production.',
    );
  }

  if (!existsSync(httpsKeyPath) || !existsSync(httpsCertPath)) {
    throw new Error(
      `Missing TLS files: ${httpsKeyPath} and ${httpsCertPath}. Run npm install for local development or provide certificate paths via HTTPS_KEY_PATH and HTTPS_CERT_PATH.`,
    );
  }

  return {
    key: readFileSync(httpsKeyPath),
    cert: readFileSync(httpsCertPath),
  };
}
