import Database from 'better-sqlite3';
import Fastify from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import {
  pagesSchemaMigration,
  pagesValidationRulesMigration,
} from './migrations';
import type { ServerPlatformPluginContext } from '@ksojecki/platform-server-platform';

const databases: Database.Database[] = [];
const fastifyInstances: Array<ReturnType<typeof Fastify>> = [];

function createTestContext(): {
  db: Database.Database;
  ctx: ServerPlatformPluginContext;
} {
  const db = new Database(':memory:');
  databases.push(db);
  const fastify = Fastify();
  fastifyInstances.push(fastify);
  const ctx: ServerPlatformPluginContext = {
    fastify,
    services: {
      authStore: {
        findUserById: () => undefined,
      },
      db: createDbClient(db),
      logger: fastify.log,
    },
  };
  void pagesSchemaMigration.up(ctx);
  void pagesValidationRulesMigration.up(ctx);
  return { db, ctx };
}

afterEach(() => {
  for (const db of databases.splice(0)) {
    db.close();
  }

  for (const fastify of fastifyInstances.splice(0)) {
    void fastify.close();
  }
});

describe('pages migrations', () => {
  it('rejects slug collision with reserved routes', () => {
    const { db } = createTestContext();

    expect(() => {
      db.prepare(`INSERT INTO pages (slug, content_md) VALUES (?, ?)`).run(
        'account',
        '# Reserved route',
      );
    }).toThrow('Page slug collides with a reserved application route.');
  });

  it('rejects empty slug values', () => {
    const { db } = createTestContext();

    expect(() => {
      db.prepare(`INSERT INTO pages (slug, content_md) VALUES (?, ?)`).run(
        '   ',
        '# Empty slug',
      );
    }).toThrow('Page slug cannot be empty.');
  });

  it('accepts non-reserved slugs', () => {
    const { db } = createTestContext();

    db.prepare(`INSERT INTO pages (slug, content_md) VALUES (?, ?)`).run(
      'community-news',
      '# Community News',
    );

    const row = db
      .prepare<
        [string],
        { slug: string; content_md: string }
      >(`SELECT slug, content_md FROM pages WHERE slug = ?`)
      .get('community-news');

    expect(row).toEqual({
      slug: 'community-news',
      content_md: '# Community News',
    });
  });
});

function createDbClient(
  db: Database.Database,
): ServerPlatformPluginContext['services']['db'] {
  return {
    prepare(sql) {
      return db.prepare(sql);
    },
    exec(sql) {
      db.exec(sql);
    },
  };
}
