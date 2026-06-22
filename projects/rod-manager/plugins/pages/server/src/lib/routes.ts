import type { FastifyInstance } from 'fastify';
import type {
  ContentPageListResponseBody,
  ContentPageResponseBody,
} from '@sojecki/rod-manager-pages-shared';
import type { PageStore } from './store';

/** Registers pages API routes on the given Fastify instance. */
export function registerPagesRoutes(
  fastify: FastifyInstance,
  pageStore: PageStore,
): void {
  fastify.get(
    '/api/pages',
    {
      preHandler: fastify.requireAuthenticatedSession,
    },
    async (request, reply) => {
      if (request.authenticatedSession === undefined) {
        return;
      }
      const response: ContentPageListResponseBody = {
        pages: pageStore.listPages(),
      };
      await reply.send(response);
    },
  );

  fastify.get<{ Params: { slug: string } }>(
    '/api/pages/:slug',
    async (request, reply) => {
      const page = pageStore.findPageBySlug(request.params.slug);
      if (page === undefined) {
        await reply.status(404).send({ message: 'Page not found.' });
        return;
      }
      const response: ContentPageResponseBody = { page };
      await reply.send(response);
    },
  );
}
