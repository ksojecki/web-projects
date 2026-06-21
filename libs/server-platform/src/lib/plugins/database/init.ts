import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { UserRole } from '@sojecki/platform-shared';
import type Database from 'better-sqlite3';
import type { CountRow } from './types';
import { hashPassword } from './store';

export function getDatabasePath(): string {
  const configuredPath = process.env.AUTH_DB_PATH ?? 'tmp/auth.sqlite';

  if (configuredPath === ':memory:') {
    return configuredPath;
  }

  const resolvedPath = resolve(process.cwd(), configuredPath);
  mkdirSync(dirname(resolvedPath), { recursive: true });

  return resolvedPath;
}

export function initializeSchema(db: Database.Database): void {
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL DEFAULT '',
      last_name TEXT NOT NULL DEFAULT '',
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS oauth_providers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_user_id TEXT NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      access_token_expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(provider, provider_user_id)
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'pl')),
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_oauth_providers_user_id ON oauth_providers(user_id);
  `);
}

export function ensureUserSettingsModel(db: Database.Database): void {
  const userColumns = db
    .prepare<[], { name: string }>(`PRAGMA table_info('users')`)
    .all();

  const hasPreferredLanguageColumnInUsers = userColumns.some(
    (column) => column.name === 'preferred_language',
  );

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'pl')),
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TRIGGER IF NOT EXISTS trg_user_settings_on_user_insert
    AFTER INSERT ON users
    BEGIN
      INSERT INTO user_settings (user_id, preferred_language, created_at, updated_at)
      VALUES (
        NEW.id,
        'en',
        unixepoch(),
        unixepoch()
      )
      ON CONFLICT(user_id) DO NOTHING;
    END;
  `);

  if (hasPreferredLanguageColumnInUsers) {
    db.exec(`
      INSERT OR IGNORE INTO user_settings (user_id, preferred_language, created_at, updated_at)
      SELECT
        u.id,
        CASE
          WHEN u.preferred_language IN ('en', 'pl') THEN u.preferred_language
          ELSE 'en'
        END,
        unixepoch(),
        unixepoch()
      FROM users u
    `);
    return;
  }

  db.exec(`
    INSERT OR IGNORE INTO user_settings (user_id, preferred_language, created_at, updated_at)
    SELECT u.id, 'en', unixepoch(), unixepoch()
    FROM users u
  `);
}

export function ensureUserRoleColumn(db: Database.Database): void {
  const userColumns = db
    .prepare<[], { name: string }>(`PRAGMA table_info('users')`)
    .all();

  const hasRoleColumn = userColumns.some((column) => column.name === 'role');

  if (!hasRoleColumn) {
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`);
  }

  db.prepare(
    `UPDATE users SET role = 'user' WHERE role NOT IN ('admin', 'user')`,
  ).run();
}

export function ensureNameColumns(db: Database.Database): void {
  const userColumns = db
    .prepare<[], { name: string }>(`PRAGMA table_info('users')`)
    .all();

  const hasFirstName = userColumns.some(
    (column) => column.name === 'first_name',
  );
  const hasLastName = userColumns.some((column) => column.name === 'last_name');

  if (!hasFirstName) {
    db.exec(`ALTER TABLE users ADD COLUMN first_name TEXT NOT NULL DEFAULT ''`);
  }

  if (!hasLastName) {
    db.exec(`ALTER TABLE users ADD COLUMN last_name TEXT NOT NULL DEFAULT ''`);
  }
}

export function seedInitialUser(db: Database.Database): void {
  const initialUserEmail =
    process.env.AUTH_INITIAL_USER_EMAIL ?? 'admin@rod-manager.local';
  const initialUserPassword =
    process.env.AUTH_INITIAL_USER_PASSWORD ?? 'admin1234';

  db.prepare(
    `INSERT INTO users (id, email, password_hash, first_name, last_name, display_name, role)
      VALUES (@id, @email, @password_hash, @first_name, @last_name, @display_name, @role)
      ON CONFLICT(email) DO UPDATE SET
        password_hash = excluded.password_hash,
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        display_name = excluded.display_name,
        role = excluded.role`,
  ).run({
    id: 'initial-admin-user',
    email: initialUserEmail,
    password_hash: hashPassword(initialUserPassword),
    first_name: 'Administrator',
    last_name: '',
    display_name: 'Administrator',
    role: 'admin' satisfies UserRole,
  });
}

export function shouldSeedInitialUser(): boolean {
  return process.env.AUTH_SEED_INITIAL_USER === 'true';
}

export function ensureAdministratorExists(db: Database.Database): void {
  const adminCount = db
    .prepare<
      [],
      CountRow
    >(`SELECT COUNT(*) AS count FROM users WHERE role = 'admin'`)
    .get();

  if ((adminCount?.count ?? 0) > 0) {
    return;
  }

  db.prepare(
    `UPDATE users
      SET role = 'admin'
      WHERE id = (
        SELECT id
        FROM users
        ORDER BY created_at ASC, rowid ASC
        LIMIT 1
      )`,
  ).run();
}
