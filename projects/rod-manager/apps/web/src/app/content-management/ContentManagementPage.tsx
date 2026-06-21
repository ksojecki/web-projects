import { Page } from '@sojecki/platform-ui';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { ContentPageSummary } from '@sojecki/platform-shared';
import { loadPages } from './pagesApi';

export const ContentManagementPage = () => {
  const { t } = useTranslation('content');
  const [pages, setPages] = useState<ContentPageSummary[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await loadPages();
        setPages(response.pages);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : t('loadErrorDefault'),
        );
      }
    })();
  }, [t]);

  return (
    <Page>
      <Page.Title>{t('managementTitle')}</Page.Title>
      <Page.Content>
        <div className="space-y-4">
          <p>{t('managementDescription')}</p>
          {errorMessage !== null ? (
            <p className="text-error">{errorMessage}</p>
          ) : (
            <ul className="menu rounded-box bg-base-200">
              {pages.map((page) => (
                <li key={page.slug}>
                  <Link to={page.slug === 'home' ? '/' : `/${page.slug}`}>
                    {page.slug}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Page.Content>
    </Page>
  );
};
