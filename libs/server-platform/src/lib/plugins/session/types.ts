import type { preHandlerAsyncHookHandler } from 'fastify';
import type { AuthStoreSession } from '../database';

export type RequireAuthenticatedSessionHook = preHandlerAsyncHookHandler;

export const SESSION_COOKIE_NAME = 'rod_manager_session';

declare module 'fastify' {
  interface FastifyInstance {
    requireAuthenticatedSession: RequireAuthenticatedSessionHook;
    authPolicy: {
      allowRegistration: boolean;
      allowOAuthAutoProvisioning: boolean;
    };
  }

  interface FastifyReply {
    startSession: (userId: string) => void;
    removeSession: () => void;
  }

  interface FastifyRequest {
    authenticatedSession: AuthStoreSession | undefined;
    getSessionToken: () => string | undefined;
    getSession: () => AuthStoreSession | undefined;
    hasSession: () => boolean;
  }
}
