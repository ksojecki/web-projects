import { Page } from '@sojecki/platform-ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import type { ContentPage as ContentPageModel } from '@sojecki/platform-shared';
import { loadPageBySlug } from './pagesApi';
import { renderMarkdown } from './Markdown';

interface ContentPageProps {
  forcedSlug?: string;
}

export const ContentPage = ({ forcedSlug }: ContentPageProps) => {
  const { t } = useTranslation('content');
  const { slug: routeSlug } = useParams();
  const slug = forcedSlug ?? routeSlug ?? '';
  const [page, setPage] = useState<ContentPageModel | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await loadPageBySlug(slug);

        setPage(response.page);
        setErrorMessage(null);
      } catch (error) {
        setPage(null);
        setErrorMessage(
          error instanceof Error ? error.message : t('loadErrorDefault'),
        );
      }
    })();
  }, [slug, t]);

  return (
    <Page>
      <Page.Title>{page?.slug ?? t('pageTitleFallback')}</Page.Title>
      <Page.Content>
        <div className="space-y-4">
          {errorMessage !== null ? (
            <p className="text-error">{errorMessage}</p>
          ) : (
            renderMarkdown(page?.contentMd ?? '')
          )}
        </div>
      </Page.Content>
    </Page>
  );
};
