import type { FastifyInstance, FastifyRequest } from 'fastify';

interface UpdateUserLanguageRequestBody {
  language: 'en' | 'pl';
}

export default function userSettingsRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: UpdateUserLanguageRequestBody }>(
    '/api/user-settings/language',
    {
      preHandler: fastify.requireAuthenticatedSession,
    },
    async (request: FastifyRequest<{ Body: UpdateUserLanguageRequestBody }>, reply) => {
      const session = request.authenticatedSession;

      if (session === undefined) {
        return;
      }

      const { language } = request.body;

      fastify.userSettingsStore.updateUserPreferredLanguage(session.userId, language);

      await reply.status(204).send();
    },
  );
}
