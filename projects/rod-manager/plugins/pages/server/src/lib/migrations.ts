import type { ServerPlatformMigration } from '@sojecki/platform-server-platform';

const RESERVED_PAGE_SLUGS = ['account', 'register', 'pages', 'auth', 'api'];
const RESERVED_PAGE_SLUGS_SQL = RESERVED_PAGE_SLUGS.map(
  (slug) => `'${slug}'`,
).join(', ');
const RESERVED_PAGE_SLUG_ERROR_MESSAGE =
  'Page slug collides with a reserved application route.';
const EMPTY_PAGE_SLUG_ERROR_MESSAGE = 'Page slug cannot be empty.';

export const pagesSchemaMigration: ServerPlatformMigration = {
  id: 'pages-schema-v1',
  up(ctx) {
    ctx.services.db.exec(`
      CREATE TABLE IF NOT EXISTS pages (
        slug TEXT PRIMARY KEY CHECK (
          trim(slug) <> '' AND
          lower(slug) NOT IN (${RESERVED_PAGE_SLUGS_SQL})
        ),
        content_md TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      );

      CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
    `);
  },
};

export const pagesValidationRulesMigration: ServerPlatformMigration = {
  id: 'pages-validation-rules-v1',
  up(ctx) {
    ctx.services.db.exec(`
      CREATE TRIGGER IF NOT EXISTS trg_pages_validate_empty_slug_on_insert
      BEFORE INSERT ON pages
      FOR EACH ROW
      WHEN trim(NEW.slug) = ''
      BEGIN
        SELECT RAISE(ABORT, '${EMPTY_PAGE_SLUG_ERROR_MESSAGE}');
      END;

      CREATE TRIGGER IF NOT EXISTS trg_pages_validate_reserved_slug_on_insert
      BEFORE INSERT ON pages
      FOR EACH ROW
      WHEN lower(NEW.slug) IN (${RESERVED_PAGE_SLUGS_SQL})
      BEGIN
        SELECT RAISE(ABORT, '${RESERVED_PAGE_SLUG_ERROR_MESSAGE}');
      END;

      CREATE TRIGGER IF NOT EXISTS trg_pages_validate_empty_slug_on_update
      BEFORE UPDATE OF slug ON pages
      FOR EACH ROW
      WHEN trim(NEW.slug) = ''
      BEGIN
        SELECT RAISE(ABORT, '${EMPTY_PAGE_SLUG_ERROR_MESSAGE}');
      END;

      CREATE TRIGGER IF NOT EXISTS trg_pages_validate_reserved_slug_on_update
      BEFORE UPDATE OF slug ON pages
      FOR EACH ROW
      WHEN lower(NEW.slug) IN (${RESERVED_PAGE_SLUGS_SQL})
      BEGIN
        SELECT RAISE(ABORT, '${RESERVED_PAGE_SLUG_ERROR_MESSAGE}');
      END;
    `);
  },
};

export const pagesSeedMigration: ServerPlatformMigration = {
  id: 'pages-seed-v1',
  up(ctx) {
    ctx.services.db.exec(`
      INSERT OR IGNORE INTO pages (slug, content_md)
      VALUES
        ('home', '# Home\n\nWelcome to Rod Manager. This home page is stored in the database.'),
        ('about', '# About\n\nThis page is stored in the database as Markdown content.'),
        ('rules', '# Community Rules\n\n1. Be respectful.\n2. Keep discussions constructive.\n3. Follow project guidelines.');
    `);
  },
};
