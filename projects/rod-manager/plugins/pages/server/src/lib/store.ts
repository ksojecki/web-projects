import type {
  ContentPage,
  ContentPageSummary,
} from '@sojecki/rod-manager-pages-shared';
import type { ServerPlatformDbClient } from '@sojecki/platform-server-platform';

export interface PageStore {
  listPages(): ContentPageSummary[];
  findPageBySlug(slug: string): ContentPage | undefined;
}

interface ContentPageSummaryRow {
  slug: string;
}

interface ContentPageRow {
  slug: string;
  content_md: string;
}

/** Creates a page store backed by the given database client. */
export function createPageStore(db: ServerPlatformDbClient): PageStore {
  const listPagesStatement = db.prepare<[], ContentPageSummaryRow>(
    `SELECT slug FROM pages ORDER BY slug ASC`,
  );

  const findPageBySlugStatement = db.prepare<[string], ContentPageRow>(
    `SELECT slug, content_md FROM pages WHERE slug = ?`,
  );

  return {
    listPages(): ContentPageSummary[] {
      return listPagesStatement.all().map((row) => ({
        slug: row.slug,
      }));
    },
    findPageBySlug(slug: string): ContentPage | undefined {
      const row = findPageBySlugStatement.get(slug);
      if (row === undefined) {
        return undefined;
      }
      return {
        slug: row.slug,
        contentMd: row.content_md,
      };
    },
  };
}
