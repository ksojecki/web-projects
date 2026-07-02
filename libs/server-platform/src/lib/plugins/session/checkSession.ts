import type { FastifyRequest } from 'fastify';
import type { AuthStore, AuthStoreSession } from '../database';
import { SESSION_COOKIE_NAME } from './types';

/**
 * Reads the session token from request cookies.
 */
function readSessionToken(this: FastifyRequest): string | undefined {
  return this.cookies[SESSION_COOKIE_NAME];
}

export const getSessionToken = readSessionToken;

/**
 * Creates a request-bound function that resolves and caches the current session.
 */
export function createGetSessionDecorator(getAuthStore: () => AuthStore) {
  return function getSession(
    this: FastifyRequest,
  ): AuthStoreSession | undefined {
    return resolveSessionFromRequest(getAuthStore(), this);
  };
}

/**
 * Checks whether an authenticated session exists for the current request.
 */
function checkSession(this: FastifyRequest): boolean {
  return this.getSession() !== undefined;
}

export const hasSession = checkSession;

export function resolveSessionFromRequest(
  authStore: AuthStore,
  request: FastifyRequest,
): AuthStoreSession | undefined {
  if (request.authenticatedSession !== undefined) {
    return request.authenticatedSession;
  }

  const now = Date.now();

  authStore.deleteExpiredSessions(now);

  const token = request.getSessionToken();

  if (token === undefined) {
    return undefined;
  }

  const session = authStore.findSession(token);

  if (session === undefined || now > session.expiresAt) {
    authStore.deleteSession(token);
    return undefined;
  }

  request.authenticatedSession = session;
  return session;
}
