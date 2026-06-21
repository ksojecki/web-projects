import type {
  OAuthProviderType,
  UserLanguage,
  UserRole,
} from '@sojecki/platform-shared';
import type { ServerPlatformDbClient } from '../../contracts/plugin.contract';

export type { OAuthProviderType };

export interface AuthStoreUser {
  id: string;
  email: string;
  name: string;
  surname: string;
  displayName: string;
  role: UserRole;
  passwordHash: string;
}

export interface OAuthProviderData {
  id: string;
  userId: string;
  provider: OAuthProviderType;
  providerUserId: string;
  accessToken: string;
  refreshToken: string | null;
  accessTokenExpiresAt: number;
  createdAt: number;
}

export interface AuthStoreSession {
  token: string;
  userId: string;
  expiresAt: number;
  userEmail: string;
  userName: string;
  userSurname: string;
  userDisplayName: string;
  userRole: UserRole;
}

export interface AuthStore {
  findUserById(id: string): AuthStoreUser | undefined;
  findUserByEmail(email: string): AuthStoreUser | undefined;
  findUserByOAuthProvider(
    provider: OAuthProviderType,
    providerUserId: string,
  ): AuthStoreUser | undefined;
  createUser(
    email: string,
    name: string,
    surname: string,
    password: string | null,
  ): AuthStoreUser;
  findOrCreateUserByOAuth(
    provider: OAuthProviderType,
    providerUserId: string,
    email: string,
    name: string,
    surname: string,
  ): AuthStoreUser;
  linkOAuthProvider(
    userId: string,
    provider: OAuthProviderType,
    providerUserId: string,
    accessToken: string,
    refreshToken: string | null,
    accessTokenExpiresAt: number,
  ): void;
  unlinkOAuthProvider(userId: string, provider: OAuthProviderType): void;
  getOAuthProvider(
    userId: string,
    provider: OAuthProviderType,
  ): OAuthProviderData | undefined;
  updateOAuthToken(
    userId: string,
    provider: OAuthProviderType,
    accessToken: string,
    refreshToken: string | null,
    accessTokenExpiresAt: number,
  ): void;
  listLinkedOAuthProviders(userId: string): OAuthProviderType[];
  verifyPassword(password: string, passwordHash: string): boolean;
  createSession(userId: string): string;
  findSession(token: string): AuthStoreSession | undefined;
  deleteSession(token: string): void;
  deleteExpiredSessions(now: number): void;
}

export interface UserSettingsStore {
  getUserPreferredLanguage(userId: string): UserLanguage | undefined;
  updateUserPreferredLanguage(userId: string, language: UserLanguage): void;
}

export interface UserRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  role: UserRole;
  password_hash: string;
}

export interface SessionRow {
  token: string;
  user_id: string;
  expires_at: number;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  role: UserRole;
}

export interface CountRow {
  count: number;
}

export interface OAuthProviderListRow {
  provider: OAuthProviderType;
}

export interface OAuthProviderRow {
  id: string;
  user_id: string;
  provider: OAuthProviderType;
  provider_user_id: string;
  access_token: string;
  refresh_token: string | null;
  access_token_expires_at: number;
  created_at: number;
}

declare module 'fastify' {
  interface FastifyInstance {
    authStore: AuthStore;
    userSettingsStore: UserSettingsStore;
    db: ServerPlatformDbClient;
  }
}

export const SESSION_TTL_SECONDS = 60 * 60 * 8;

export function createSessionExpiration(now = Date.now()): number {
  return now + SESSION_TTL_SECONDS * 1000;
}
