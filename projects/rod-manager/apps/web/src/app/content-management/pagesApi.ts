import type {
  ContentPageListResponseBody,
  ContentPageResponseBody,
} from '@ksojecki/rod-manager-pages-shared';
import { requestJson } from '@ksojecki/platform-web-platform';

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
