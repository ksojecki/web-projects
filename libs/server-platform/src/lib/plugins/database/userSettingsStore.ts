import type { UserLanguage } from '@sojecki/platform-shared';
import type Database from 'better-sqlite3';
import type { UserSettingsStore } from './types';

export function createUserSettingsStore(
  db: Database.Database,
): UserSettingsStore {
  const getUserPreferredLanguageStatement = db.prepare<
    [string],
    { preferred_language: UserLanguage }
  >(`SELECT preferred_language FROM user_settings WHERE user_id = ?`);

  const updateUserPreferredLanguageStatement = db.prepare(
    `INSERT INTO user_settings (user_id, preferred_language)
      VALUES (?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        preferred_language = excluded.preferred_language,
        updated_at = unixepoch()`,
  );

  return {
    getUserPreferredLanguage(userId: string) {
      const row = getUserPreferredLanguageStatement.get(userId);

      return row?.preferred_language;
    },
    updateUserPreferredLanguage(userId: string, language: UserLanguage) {
      updateUserPreferredLanguageStatement.run(userId, language);
    },
  };
}
