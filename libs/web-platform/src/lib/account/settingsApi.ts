import type { UserLanguage } from '@ksojecki/platform-shared';
import { JSON_HEADERS, requestNoContent } from '../http';

export async function updateLanguagePreference(language: UserLanguage): Promise<void> {
  await requestNoContent('/api/user-settings/language', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ language }),
  });
}
