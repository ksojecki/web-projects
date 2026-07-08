import { randomUUID } from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { OAuthIntent, OAuthProviderType } from '@ksojecki/platform-shared';
import type { AuthStoreSession } from '../plugins/database';

export type OAuthProviderParams = {
  Params: {
    provider: string;
  };
};

interface OAuthStateData {
  codeVerifier: string;
  expiresAt: number;
  intent: OAuthIntent;
  provider: OAuthProviderType;
  redirectTo: string;
  userId?: string;
}

type OAuthStateInput = Omit<OAuthStateData, 'expiresAt'>;

type AuthenticatedOAuthProviderContext = {
  provider: OAuthProviderType;
  session: AuthStoreSession;
};

export interface CompletedOAuthFlow {
  intent: OAuthIntent;
  message?: string;
  redirectTo: string;
  sessionUserId?: string;
}

export const OAUTH_PROVIDERS: OAuthProviderType[] = ['google', 'apple', 'facebook'];

const OAUTH_STATE_TTL = 10 * 60 * 1000;
const oauthStates = new Map<string, OAuthStateData>();

function cleanupExpiredStates(): void {
  const now = Date.now();
  for (const [state, data] of oauthStates.entries()) {
    if (data.expiresAt < now) {
      oauthStates.delete(state);
    }
  }
}

export function isOAuthProviderType(provider: string): provider is OAuthProviderType {
  return OAUTH_PROVIDERS.some((candidate) => candidate === provider);
}

export async function validateOAuthProvider(
  provider: string,
  reply: Parameters<FastifyInstance['requireAuthenticatedSession']>[1],
): Promise<boolean> {
  if (isOAuthProviderType(provider)) {
    return true;
  }

  await reply.status(400).send({ message: 'Invalid OAuth provider.' });
  return false;
}

export function createAuthenticatedOAuthProviderPreHandler(fastify: FastifyInstance) {
  return async function authenticatedOAuthProviderPreHandler(
    request: FastifyRequest<OAuthProviderParams>,
    reply: Parameters<FastifyInstance['requireAuthenticatedSession']>[1],
  ): Promise<void> {
    const { provider } = request.params;

    if (!(await validateOAuthProvider(provider, reply))) {
      return;
    }

    await fastify.requireAuthenticatedSession(request, reply);
  };
}

export function getAuthenticatedOAuthProviderContext(
  request: FastifyRequest<OAuthProviderParams>,
): AuthenticatedOAuthProviderContext | undefined {
  const { provider } = request.params;

  if (!isOAuthProviderType(provider)) {
    return undefined;
  }

  const session = request.authenticatedSession;

  if (session === undefined) {
    return undefined;
  }

  return {
    provider,
    session,
  };
}

export function createRedirectUrl(pathname: string): string {
  const redirectUrl = new URL(process.env.OAUTH_REDIRECT_BASE_URL ?? 'http://localhost:3000');
  redirectUrl.pathname = pathname;
  redirectUrl.search = '';
  return redirectUrl.toString();
}

export function createOAuthState(input: OAuthStateInput): {
  state: string;
  stateData: OAuthStateData;
} {
  const state = randomUUID();
  const stateData: OAuthStateData = {
    ...input,
    expiresAt: Date.now() + OAUTH_STATE_TTL,
  };

  cleanupExpiredStates();
  oauthStates.set(state, stateData);

  return { state, stateData };
}

export function getOAuthErrorStatusCode(error: unknown): number {
  const message = error instanceof Error ? error.message : '';

  if (message === 'Invalid or expired OAuth state.') {
    return 401;
  }

  if (
    message === 'Missing authenticated user for OAuth linking.' ||
    message === 'OAuth link target user does not exist.'
  ) {
    return 401;
  }

  if (
    message === 'This OAuth account is already linked to another user.' ||
    message === 'A different OAuth account is already linked for this provider.'
  ) {
    return 409;
  }

  return 500;
}

export async function completeOAuthFlow(
  fastify: FastifyInstance,
  provider: OAuthProviderType,
  code: string,
  state: string,
): Promise<CompletedOAuthFlow> {
  cleanupExpiredStates();
  const oauthState = oauthStates.get(state);

  if (oauthState === undefined || oauthState.provider !== provider) {
    throw new Error('Invalid or expired OAuth state.');
  }

  oauthStates.delete(state);

  const { accessToken, refreshToken, expiresIn, idToken } =
    await fastify.oauth.exchangeCodeForToken(provider, code, oauthState.codeVerifier);

  const userInfo = await fastify.oauth.getUserInfo(provider, accessToken, idToken);
  const accessTokenExpiresAt = Date.now() + expiresIn * 1000;

  if (oauthState.intent === 'login') {
    const user = fastify.authStore.findOrCreateUserByOAuth(
      provider,
      userInfo.id,
      userInfo.email,
      userInfo.name,
      userInfo.surname,
    );

    fastify.authStore.linkOAuthProvider(
      user.id,
      provider,
      userInfo.id,
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
    );

    return {
      intent: 'login',
      redirectTo: oauthState.redirectTo,
      sessionUserId: user.id,
    };
  }

  if (oauthState.userId === undefined) {
    throw new Error('Missing authenticated user for OAuth linking.');
  }

  const existingUser = fastify.authStore.findUserById(oauthState.userId);

  if (existingUser === undefined) {
    throw new Error('OAuth link target user does not exist.');
  }

  const linkedUser = fastify.authStore.findUserByOAuthProvider(provider, userInfo.id);

  if (linkedUser !== undefined && linkedUser.id !== existingUser.id) {
    throw new Error('This OAuth account is already linked to another user.');
  }

  const existingProvider = fastify.authStore.getOAuthProvider(existingUser.id, provider);

  if (existingProvider !== undefined && existingProvider.providerUserId !== userInfo.id) {
    throw new Error('A different OAuth account is already linked for this provider.');
  }

  fastify.authStore.linkOAuthProvider(
    existingUser.id,
    provider,
    userInfo.id,
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
  );

  return {
    intent: 'link',
    redirectTo: oauthState.redirectTo,
    message: 'OAuth provider linked.',
  };
}
