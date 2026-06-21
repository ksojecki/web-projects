import type { ApiErrorResponse, UserLanguage } from '@sojecki/platform-shared';

export async function updateLanguagePreference(
  language: UserLanguage,
): Promise<void> {
  const response = await fetch('/api/user-settings/language', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ language }),
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(await parseErrorMessage(response));
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const error = (await response.json()) as ApiErrorResponse;

    if (error.message.length > 0) {
      return error.message;
    }
  } catch {
    return 'Unexpected server error.';
  }

  return 'Unexpected server error.';
}
