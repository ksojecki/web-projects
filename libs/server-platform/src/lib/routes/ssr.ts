import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fastifyMiddie from '@fastify/middie';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';

export interface ServerPlatformSsrProductionPaths {
  clientRoot: string;
  serverEntryPath: string;
}

export interface ServerPlatformSsrOptions {
  webRoot: string;
  production: ServerPlatformSsrProductionPaths;
}

type RenderFunction = (url: string) => Promise<string> | string;

interface RenderModule {
  render: RenderFunction;
}

export default async function (
  fastify: FastifyInstance,
  options: ServerPlatformSsrOptions,
) {
  const webRoot = path.resolve(options.webRoot);
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const clientRoot = path.resolve(options.production.clientRoot);
    const serverEntryPath = path.resolve(options.production.serverEntryPath);
    const templatePath = path.join(clientRoot, 'index.html');
    const template = await readFile(templatePath, 'utf-8');

    await fastify.register(fastifyStatic, {
      root: clientRoot,
      prefix: '/',
      index: false,
      wildcard: false,
    });

    const serverModule = (await import(
      pathToFileURL(serverEntryPath).href
    )) as RenderModule;

    fastify.get('/*', async (request, reply) => {
      const url = request.raw.url ?? '/';

      if (isApiRequest(url)) {
        reply.callNotFound();
        return;
      }

      try {
        const html = await renderPage(url, template, serverModule.render);
        await reply.type('text/html').send(html);
        return;
      } catch (error) {
        request.log.error(error);
        await reply.status(500).type('text/plain').send('SSR render failed');
        return;
      }
    });

    return;
  }

  await fastify.register(fastifyMiddie);

  const { createServer } = await import('vite');
  const vite = await createServer({
    root: webRoot,
    appType: 'custom',
    server: {
      middlewareMode: true,
      hmr: {
        server: fastify.server,
      },
    },
  });

  fastify.use(vite.middlewares);

  const templatePath = path.join(webRoot, 'index.html');

  fastify.addHook('onClose', async () => {
    await vite.close();
  });

  fastify.get('/*', async (request, reply) => {
    const url = request.raw.url ?? '/';

    if (isApiRequest(url)) {
      reply.callNotFound();
      return;
    }

    try {
      const template = await readFile(templatePath, 'utf-8');
      const transformedTemplate = await vite.transformIndexHtml(url, template);
      const serverModule = (await vite.ssrLoadModule(
        '/src/entry-server.tsx',
      )) as RenderModule;
      const html = await renderPage(
        url,
        transformedTemplate,
        serverModule.render,
      );

      await reply.type('text/html').send(html);
      return;
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      request.log.error(error);
      await reply.status(500).type('text/plain').send('SSR render failed');
      return;
    }
  });
}

function isApiRequest(url: string): boolean {
  return url === '/api' || url.startsWith('/api/');
}

async function renderPage(
  url: string,
  template: string,
  render: RenderFunction,
): Promise<string> {
  const appHtml = await render(url);
  return template.replace('<!--ssr-outlet-->', appHtml);
}
