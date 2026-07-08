import type { ApiErrorResponse } from '@ksojecki/platform-shared';

export const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

export async function requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await request(url, init);
  return await response.json();
}

export async function requestNoContent(url: string, init: RequestInit = {}): Promise<void> {
  await request(url, init);
}

async function request(url: string, init: RequestInit): Promise<Response> {
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response;
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
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string' &&
    value.message.length > 0
  );
}
