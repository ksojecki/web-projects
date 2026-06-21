import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';
import type { UserRole } from '@sojecki/platform-shared';
import type Database from 'better-sqlite3';
import type {
  AuthStore,
  CountRow,
  OAuthProviderListRow,
  OAuthProviderRow,
  SessionRow,
  UserRow,
} from './types';
import { createSessionExpiration } from './types';

export type { AuthStore };

// Number of random bytes used for the password assigned to OAuth-only users.
// These users authenticate exclusively via OAuth and never use this password directly.
const OAUTH_USER_PASSWORD_BYTES = 32;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');

  return `${salt}:${derived}`;
}

export function verifyPassword(
  password: string,
  passwordHash: string,
): boolean {
  const [salt, expectedHex] = passwordHash.split(':') as [
    string | undefined,
    string | undefined,
  ];

  if (salt === undefined || expectedHex === undefined) {
    return false;
  }

  const expected = Buffer.from(expectedHex, 'hex');
  const actual = scryptSync(password, salt, expected.length);

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

export function getRoleForNewUser(db: Database.Database): UserRole {
  const userCount = db
    .prepare<[], CountRow>(`SELECT COUNT(*) AS count FROM users`)
    .get();

  return (userCount?.count ?? 0) === 0 ? 'admin' : 'user';
}

export function createStore(db: Database.Database): AuthStore {
  const findUserByIdStatement = db.prepare<[string], UserRow>(
    `SELECT id, email, first_name, last_name, display_name, role, password_hash FROM users WHERE id = ?`,
  );

  const findUserByEmailStatement = db.prepare<[string], UserRow>(
    `SELECT id, email, first_name, last_name, display_name, role, password_hash FROM users WHERE email = ?`,
  );

  const findUserByOAuthProviderStatement = db.prepare<
    [string, string],
    UserRow
  >(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.display_name, u.role, u.password_hash FROM users u
      JOIN oauth_providers o ON u.id = o.user_id
      WHERE o.provider = ? AND o.provider_user_id = ?`,
  );

  const createUserStatement = db.prepare(
    `INSERT INTO users (id, email, password_hash, first_name, last_name, display_name, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );

  const createOAuthProviderStatement = db.prepare(
    `INSERT INTO oauth_providers (id, user_id, provider, provider_user_id, access_token, refresh_token, access_token_expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );

  const getOAuthProviderStatement = db.prepare<
    [string, string],
    OAuthProviderRow
  >(
    `SELECT id, user_id, provider, provider_user_id, access_token, refresh_token, access_token_expires_at, created_at
      FROM oauth_providers
      WHERE user_id = ? AND provider = ?`,
  );

  const updateOAuthTokenStatement = db.prepare(
    `UPDATE oauth_providers SET access_token = ?, refresh_token = ?, access_token_expires_at = ?
      WHERE user_id = ? AND provider = ?`,
  );

  const updateLinkedOAuthProviderStatement = db.prepare(
    `UPDATE oauth_providers
      SET provider_user_id = ?, access_token = ?, refresh_token = ?, access_token_expires_at = ?
      WHERE user_id = ? AND provider = ?`,
  );

  const deleteOAuthProviderStatement = db.prepare(
    `DELETE FROM oauth_providers WHERE user_id = ? AND provider = ?`,
  );

  const listLinkedOAuthProvidersStatement = db.prepare<
    [string],
    OAuthProviderListRow
  >(
    `SELECT provider FROM oauth_providers WHERE user_id = ? ORDER BY provider ASC`,
  );

  const createSessionStatement = db.prepare(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`,
  );

  const findSessionStatement = db.prepare<[string], SessionRow>(
    `SELECT s.token, s.user_id, s.expires_at, u.email, u.first_name, u.last_name, u.display_name, u.role
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = ?`,
  );

  const deleteSessionStatement = db.prepare(
    `DELETE FROM sessions WHERE token = ?`,
  );

  const deleteExpiredSessionsStatement = db.prepare(
    `DELETE FROM sessions WHERE expires_at <= ?`,
  );

  return {
    findUserById(id) {
      const row = findUserByIdStatement.get(id);

      if (row === undefined) {
        return undefined;
      }

      return {
        id: row.id,
        email: row.email,
        name: row.first_name,
        surname: row.last_name,
        displayName: row.display_name,
        role: row.role,
        passwordHash: row.password_hash,
      };
    },
    findUserByEmail(email) {
      const row = findUserByEmailStatement.get(email);

      if (row === undefined) {
        return undefined;
      }

      return {
        id: row.id,
        email: row.email,
        name: row.first_name,
        surname: row.last_name,
        displayName: row.display_name,
        role: row.role,
        passwordHash: row.password_hash,
      };
    },
    findUserByOAuthProvider(provider, providerUserId) {
      const row = findUserByOAuthProviderStatement.get(
        provider,
        providerUserId,
      );

      if (row === undefined) {
        return undefined;
      }

      return {
        id: row.id,
        email: row.email,
        name: row.first_name,
        surname: row.last_name,
        displayName: row.display_name,
        role: row.role,
        passwordHash: row.password_hash,
      };
    },
    createUser(email, name, surname, password) {
      const existingUser = this.findUserByEmail(email);
      if (existingUser !== undefined) {
        throw new Error('A user with this email already exists.');
      }

      const userId = randomUUID();
      const role = getRoleForNewUser(db);
      const displayName = [name, surname].filter(Boolean).join(' ') || email;
      const passwordHash =
        password !== null && password.length > 0
          ? hashPassword(password)
          : hashPassword(
              randomBytes(OAUTH_USER_PASSWORD_BYTES).toString('hex'),
            );

      createUserStatement.run(
        userId,
        email,
        passwordHash,
        name,
        surname,
        displayName,
        role,
      );

      return {
        id: userId,
        email,
        name,
        surname,
        displayName,
        role,
        passwordHash,
      };
    },
    findOrCreateUserByOAuth(provider, providerUserId, email, name, surname) {
      // Check if OAuth provider is already linked
      const oauthUser = this.findUserByOAuthProvider(provider, providerUserId);
      if (oauthUser !== undefined) {
        return oauthUser;
      }

      // Check if user with this email exists
      const existingUser = this.findUserByEmail(email);
      const userId = existingUser?.id ?? randomUUID();
      const displayName = [name, surname].filter(Boolean).join(' ') || email;

      if (existingUser === undefined) {
        // Create new user with random password (OAuth user doesn't have password)
        const randomPassword = randomBytes(OAUTH_USER_PASSWORD_BYTES).toString(
          'hex',
        );
        const role = getRoleForNewUser(db);
        createUserStatement.run(
          userId,
          email,
          hashPassword(randomPassword),
          name,
          surname,
          displayName,
          role,
        );

        this.linkOAuthProvider(userId, provider, providerUserId, '', null, 0);

        return {
          id: userId,
          email,
          name,
          surname,
          displayName,
          role,
          passwordHash: '',
        };
      }

      // Link OAuth provider
      this.linkOAuthProvider(userId, provider, providerUserId, '', null, 0);

      return {
        id: userId,
        email,
        name: existingUser.name,
        surname: existingUser.surname,
        displayName: existingUser.displayName,
        role: existingUser.role,
        passwordHash: '',
      };
    },
    linkOAuthProvider(
      userId,
      provider,
      providerUserId,
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
    ) {
      const existingProvider = getOAuthProviderStatement.get(userId, provider);

      if (existingProvider !== undefined) {
        updateLinkedOAuthProviderStatement.run(
          providerUserId,
          accessToken,
          refreshToken,
          accessTokenExpiresAt,
          userId,
          provider,
        );
        return;
      }

      const id = randomUUID();
      createOAuthProviderStatement.run(
        id,
        userId,
        provider,
        providerUserId,
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
      );
    },
    unlinkOAuthProvider(userId, provider) {
      deleteOAuthProviderStatement.run(userId, provider);
    },
    getOAuthProvider(userId, provider) {
      const row = getOAuthProviderStatement.get(userId, provider);

      if (row === undefined) {
        return undefined;
      }

      return {
        id: row.id,
        userId: row.user_id,
        provider: row.provider,
        providerUserId: row.provider_user_id,
        accessToken: row.access_token,
        refreshToken: row.refresh_token,
        accessTokenExpiresAt: row.access_token_expires_at,
        createdAt: row.created_at,
      };
    },
    updateOAuthToken(
      userId,
      provider,
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
    ) {
      updateOAuthTokenStatement.run(
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
        userId,
        provider,
      );
    },
    listLinkedOAuthProviders(userId) {
      return listLinkedOAuthProvidersStatement
        .all(userId)
        .map((row) => row.provider);
    },
    verifyPassword,
    createSession(userId) {
      const token = createSessionToken();
      createSessionStatement.run(token, userId, createSessionExpiration());
      return token;
    },
    findSession(token) {
      const row = findSessionStatement.get(token);

      if (row === undefined) {
        return undefined;
      }

      return {
        token: row.token,
        userId: row.user_id,
        expiresAt: row.expires_at,
        userEmail: row.email,
        userName: row.first_name,
        userSurname: row.last_name,
        userDisplayName: row.display_name,
        userRole: row.role,
      };
    },
    deleteSession(token) {
      deleteSessionStatement.run(token);
    },
    deleteExpiredSessions(now) {
      deleteExpiredSessionsStatement.run(now);
    },
  };
}

/** Generates a cryptographically random session token combining a UUID and random hex bytes. */
function createSessionToken(): string {
  return `${randomUUID()}-${randomBytes(16).toString('hex')}`;
}
