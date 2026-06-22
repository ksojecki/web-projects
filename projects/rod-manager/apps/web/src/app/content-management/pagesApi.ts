import type {
  ContentPageListResponseBody,
  ContentPageResponseBody,
} from '@sojecki/rod-manager-pages-shared';
import type { ApiErrorResponse } from '@sojecki/platform-shared';

export async function loadPages(): Promise<ContentPageListResponseBody> {
  return requestJson<ContentPageListResponseBody>('/api/pages', {
    method: 'GET',
  });
}

export async function loadPageBySlug(
  slug: string,
): Promise<ContentPageResponseBody> {
  return requestJson<ContentPageResponseBody>(`/api/pages/${slug}`, {
    method: 'GET',
  });
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

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as T;
}
