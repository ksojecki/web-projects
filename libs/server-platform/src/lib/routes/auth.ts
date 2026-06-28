import type { FastifyInstance } from 'fastify';
import type {
  AuthenticationMethodsResponseBody,
  AuthUser,
  LoginRequestBody,
  OAuthProviderType,
  RegisterRequestBody,
  SessionResponse,
} from '@ksojecki/platform-shared';

const OAUTH_PROVIDERS: OAuthProviderType[] = ['google', 'apple', 'facebook'];

export default function authRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: LoginRequestBody }>(
    '/api/auth/login',
    async (request, reply) => {
      const { email, password } = request.body;
      const user = fastify.authStore.findUserByEmail(email);

      if (
        user === undefined ||
        !fastify.authStore.verifyPassword(password, user.passwordHash)
      ) {
        await reply.status(401).send({ message: 'Invalid email or password.' });
        return;
      }

      reply.startSession(user.id);
      const sessionResponse: SessionResponse = {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          surname: user.surname,
          displayName: user.displayName,
          role: user.role,
        },
      };

      await reply.send(sessionResponse);
    },
  );

  fastify.post<{ Body: RegisterRequestBody }>(
    '/api/auth/register',
    async (request, reply) => {
      const { email, name, surname, password } = request.body;

      if (!email || !name || !surname || !password) {
        await reply.status(400).send({
          message: 'Email, name, surname, and password are required.',
        });
        return;
      }

      try {
        const user = fastify.authStore.createUser(
          email,
          name,
          surname,
          password,
        );

        reply.startSession(user.id);

        const sessionResponse: SessionResponse = {
          authenticated: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            surname: user.surname,
            displayName: user.displayName,
            role: user.role,
          },
        };

        await reply.status(201).send(sessionResponse);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === 'A user with this email already exists.'
        ) {
          await reply.status(409).send({ message: error.message });
          return;
        }

        fastify.log.error(error);
        await reply.status(500).send({ message: 'Registration failed.' });
      }
    },
  );

  fastify.get(
    '/api/auth/session',
    {
      preHandler: fastify.requireAuthenticatedSession,
    },
    async (request, reply) => {
      const session = request.authenticatedSession;

      if (session === undefined) {
        return;
      }

      const user: AuthUser = {
        id: session.userId,
        email: session.userEmail,
        name: session.userName,
        surname: session.userSurname,
        displayName: session.userDisplayName,
        role: session.userRole,
      };

      const sessionResponse: SessionResponse = {
        authenticated: true,
        user,
      };

      await reply.send(sessionResponse);
    },
  );

  fastify.get(
    '/api/auth/methods',
    {
      preHandler: fastify.requireAuthenticatedSession,
    },
    async (request, reply) => {
      const session = request.authenticatedSession;

      if (session === undefined) {
        return;
      }

      const linkedProviders = new Set(
        fastify.authStore.listLinkedOAuthProviders(session.userId),
      );

      const response: AuthenticationMethodsResponseBody = {
        methods: [
          {
            type: 'password',
            connected: true,
            canDisconnect: false,
          },
          ...OAUTH_PROVIDERS.map((provider) => {
            const connected = linkedProviders.has(provider);

            return {
              type: 'oauth' as const,
              provider,
              connected,
              canDisconnect: connected,
            };
          }),
        ],
      };

      await reply.send(response);
    },
  );

  fastify.post('/api/auth/logout', async (request, reply) => {
    reply.removeSession();
    await reply.status(204).send();
  });
}
