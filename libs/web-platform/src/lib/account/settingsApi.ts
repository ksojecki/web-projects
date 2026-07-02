import type { ApiErrorResponse, UserLanguage } from '@ksojecki/platform-shared';

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
    const error = await response.json();

    if (hasErrorMessage(error)) {
      return error.message;
    }
  } catch {
    return 'Unexpected server error.';
  }

  return 'Unexpected server error.';
}

function hasErrorMessage(value: unknown): value is ApiErrorResponse {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.message === 'string' && value.message.length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
