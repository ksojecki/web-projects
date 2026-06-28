import 'dotenv/config';
import Fastify from 'fastify';
import { existsSync, readFileSync } from 'node:fs';
import type { FastifyInstance } from 'fastify';
import { createServerPlatform } from '@ksojecki/platform-server-platform';
import { pagesServerPlugin } from '@ksojecki/rod-manager-pages-server';
import { rodManagerProjectConfig } from './productConfig';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

const defaultDevKeyPath = '.cert/localhost-key.pem';
const defaultDevCertPath = '.cert/localhost-cert.pem';
const httpsOptions = getHttpsOptions();

const server = Fastify({
  logger: true,
  https: httpsOptions,
}) as FastifyInstance;

function getHttpsOptions() {
  const httpsKeyPath =
    process.env.HTTPS_KEY_PATH ??
    (isProduction ? undefined : defaultDevKeyPath);
  const httpsCertPath =
    process.env.HTTPS_CERT_PATH ??
    (isProduction ? undefined : defaultDevCertPath);

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

server.register(async (instance) => {
  await createServerPlatform(instance, {
    project: rodManagerProjectConfig,
    plugins: [pagesServerPlugin()],
  });
});

server.listen({ port, host }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  } else {
    console.log(`[ ready ] https://${host}:${String(port)}`);
  }
});
