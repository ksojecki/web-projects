import { tmpdir } from 'node:os';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import Fastify from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import databasePlugin from './index';

describe('database plugin', () => {
  afterEach(async () => {
    delete process.env.AUTH_INITIAL_USER_EMAIL;
    delete process.env.AUTH_INITIAL_USER_PASSWORD;
  });

  it('throws an actionable error when project config is missing', async () => {
    const fastify = Fastify();

    // @ts-expect-error This test intentionally verifies the plugin's missing-options runtime guard.
    await expect(fastify.register(databasePlugin, {})).rejects.toThrowError(
      'databasePlugin requires opts.project with database.path and database.seedInitialUser.',
    );

    await fastify.close();
  });

  it('throws the same actionable error when options are undefined', async () => {
    const fastify = Fastify();

    await expect(
      // @ts-expect-error This test intentionally verifies the plugin's missing-options runtime guard.
      fastify.register(databasePlugin, undefined),
    ).rejects.toThrowError(
      'databasePlugin requires opts.project with database.path and database.seedInitialUser.',
    );

    await fastify.close();
  });

  it('keeps seeded and created users isolated across sqlite files', async () => {
    process.env.AUTH_INITIAL_USER_EMAIL = 'admin@rod-manager.local';
    process.env.AUTH_INITIAL_USER_PASSWORD = 'admin1234';

    const tempDir = mkdtempSync(join(tmpdir(), 'rod-manager-db-'));
    const databasePathA = join(tempDir, 'project-a', 'auth.sqlite');
    const databasePathB = join(tempDir, 'project-b', 'auth.sqlite');

    const serverA = Fastify();
    const serverB = Fastify();

    try {
      await serverA.register(databasePlugin, {
        project: {
          projectId: 'project-a',
          database: {
            path: databasePathA,
            seedInitialUser: true,
          },
        },
      });

      await serverB.register(databasePlugin, {
        project: {
          projectId: 'project-b',
          database: {
            path: databasePathB,
            seedInitialUser: true,
          },
        },
      });

      expect(existsSync(databasePathA)).toBe(true);
      expect(existsSync(databasePathB)).toBe(true);

      expect(
        serverA.authStore.findUserByEmail('admin@rod-manager.local'),
      ).toBeDefined();
      expect(
        serverB.authStore.findUserByEmail('admin@rod-manager.local'),
      ).toBeDefined();

      serverA.authStore.createUser(
        'alice@example.com',
        'Alice',
        'Example',
        'secret123',
      );

      expect(
        serverA.authStore.findUserByEmail('alice@example.com'),
      ).toBeDefined();
      expect(
        serverB.authStore.findUserByEmail('alice@example.com'),
      ).toBeUndefined();
    } finally {
      await serverA.close();
      await serverB.close();
      rmSync(tempDir, { recursive: true, force: true });
      delete process.env.AUTH_INITIAL_USER_EMAIL;
      delete process.env.AUTH_INITIAL_USER_PASSWORD;
    }
  });
});
