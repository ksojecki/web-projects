import type { FastifyInstance } from 'fastify';
import type {
  OAuthCallbackRequestBody,
  OAuthCallbackResponseBody,
  OAuthProvidersResponseBody,
} from '@ksojecki/platform-shared';
import { generatePKCE } from '../plugins/oauth';
import {
  completeOAuthFlow,
  createAuthenticatedOAuthProviderPreHandler,
  createOAuthState,
  createRedirectUrl,
  getAuthenticatedOAuthProviderContext,
  getOAuthErrorStatusCode,
  isOAuthProviderType,
  OAUTH_PROVIDERS,
  type OAuthProviderParams,
} from './oauth-flow';

function oauthRoutes(fastify: FastifyInstance) {
  const authenticatedOAuthProviderPreHandler = createAuthenticatedOAuthProviderPreHandler(fastify);

  fastify.post<{ Params: { provider: string } }>(
    '/api/auth/oauth/authorize/:provider',
    async (request, reply) => {
      const { provider } = request.params;

      if (!isOAuthProviderType(provider)) {
        await reply.status(400).send({ message: 'Invalid OAuth provider.' });
        return;
      }

      try {
        const { codeVerifier, codeChallenge } = generatePKCE();
        const { state } = createOAuthState({
          provider,
          codeVerifier,
          intent: 'login',
          redirectTo: '/account',
        });
        const authUrl = fastify.oauth.generateAuthorizationUrl(provider, state, codeChallenge);

        await reply.send({
          authorizationUrl: authUrl,
          state,
          codeVerifier,
        });
      } catch (error) {
        fastify.log.error(error);
        await reply.status(500).send({
          message: `Failed to initiate OAuth authorization: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    },
  );

  fastify.get<{
    Params: { provider: string };
    Querystring: { code: string; state: string; error?: string };
  }>('/api/auth/oauth/callback/:provider', async (request, reply) => {
    const { provider } = request.params;
    const { code, state, error: oauthError } = request.query;

    if (!isOAuthProviderType(provider)) {
      await reply.status(400).send({ message: 'Invalid OAuth provider.' });
      return;
    }

    if (oauthError) {
      await reply.status(400).send({
        message: `OAuth authorization denied: ${oauthError}`,
      });
      return;
    }

    if (!state || !code) {
      await reply.status(400).send({ message: 'Missing state or code parameter.' });
      return;
    }

    try {
      const result = await completeOAuthFlow(fastify, provider, code, state);

      if (result.sessionUserId !== undefined) {
        reply.startSession(result.sessionUserId);
      }

      await reply.redirect(createRedirectUrl(result.redirectTo));
    } catch (error) {
      fastify.log.error(error);
      await reply.status(getOAuthErrorStatusCode(error)).send({
        message: `OAuth callback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  });

  fastify.post<{
    Params: { provider: string };
    Body: OAuthCallbackRequestBody;
  }>('/api/auth/oauth/callback/:provider', async (request, reply) => {
    const { provider } = request.params;
    const { code, state } = request.body;

    if (!isOAuthProviderType(provider)) {
      await reply.status(400).send({ message: 'Invalid OAuth provider.' });
      return;
    }

    if (!code || !state) {
      await reply.status(400).send({ message: 'Missing state or code parameter.' });
      return;
    }

    try {
      const result = await completeOAuthFlow(fastify, provider, code, state);

      if (result.sessionUserId !== undefined) {
        reply.startSession(result.sessionUserId);
      }

      const response: OAuthCallbackResponseBody = {
        intent: result.intent,
        redirectTo: result.redirectTo,
        message: result.message,
      };

      await reply.send(response);
    } catch (error) {
      fastify.log.error(error);
      await reply.status(getOAuthErrorStatusCode(error)).send({
        message: `OAuth callback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  });

  fastify.get(
    '/api/auth/oauth/providers',
    {
      preHandler: fastify.requireAuthenticatedSession,
    },
    async (request, reply) => {
      const session = request.authenticatedSession;

      if (session === undefined) {
        return;
      }

      const linkedProviders = new Set(fastify.authStore.listLinkedOAuthProviders(session.userId));
      const response: OAuthProvidersResponseBody = {
        providers: OAUTH_PROVIDERS.map((provider) => ({
          provider,
          linked: linkedProviders.has(provider),
        })),
      };

      await reply.send(response);
    },
  );

  fastify.post<OAuthProviderParams>(
    '/api/auth/oauth/link/:provider',
    {
      preHandler: authenticatedOAuthProviderPreHandler,
    },
    async (request, reply) => {
      const context = getAuthenticatedOAuthProviderContext(request);

      if (context === undefined) {
        return;
      }

      const { provider, session } = context;

      try {
        const { codeVerifier, codeChallenge } = generatePKCE();
        const { state } = createOAuthState({
          provider,
          codeVerifier,
          intent: 'link',
          redirectTo: '/account',
          userId: session.userId,
        });
        const authUrl = fastify.oauth.generateAuthorizationUrl(provider, state, codeChallenge);

        await reply.send({
          authorizationUrl: authUrl,
          state,
          codeVerifier,
        });
      } catch (error) {
        fastify.log.error(error);
        await reply.status(500).send({
          message: `Failed to initiate OAuth linking: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    },
  );

  fastify.delete<OAuthProviderParams>(
    '/api/auth/oauth/link/:provider',
    {
      preHandler: authenticatedOAuthProviderPreHandler,
    },
    async (request, reply) => {
      const context = getAuthenticatedOAuthProviderContext(request);

      if (context === undefined) {
        return;
      }

      const { provider, session } = context;

      try {
        fastify.authStore.unlinkOAuthProvider(session.userId, provider);
        await reply.send({ message: 'OAuth provider unlinked.' });
      } catch (error) {
        fastify.log.error(error);
        await reply.status(500).send({
          message: `Failed to unlink OAuth provider: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    },
  );
}

export default oauthRoutes;
