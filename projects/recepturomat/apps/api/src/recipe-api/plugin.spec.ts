import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createServerPlatform } from '../../../../../../libs/server-platform/src';
import type { ServerPlatformProjectConfig } from '../../../../../../libs/server-platform/src/lib/contracts/bootstrap.contract';
import { recipeStorePlugin } from '../recipe-store';
import { recepturomatRecipeApiPlugin } from './plugin';

const sessionCookieName = 'rod_manager_session';
const testProjectId = 'recepturomat-test';

describe('recepturomat recipe api plugin', () => {
  beforeEach(() => {
    process.env.AUTH_INITIAL_USER_EMAIL = 'admin@rod-manager.local';
    process.env.AUTH_INITIAL_USER_PASSWORD = 'admin1234';
  });

  afterEach(() => {
    delete process.env.AUTH_INITIAL_USER_EMAIL;
    delete process.env.AUTH_INITIAL_USER_PASSWORD;
  });

  it('requires an authenticated session for recipe routes', async () => {
    const serverHarness = await createRecipeApiTestServer();

    try {
      const response = await serverHarness.server.inject({
        method: 'GET',
        url: '/api/recipes',
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({ message: 'Not authenticated.' });
    } finally {
      await disposeRecipeApiTestServer(serverHarness);
    }
  });

  it('lists, reads, creates, updates, and deletes recipes through the platform runtime', async () => {
    const serverHarness = await createRecipeApiTestServer();

    try {
      const authCookie = await login(serverHarness.server);

      const listResponse = await serverHarness.server.inject({
        method: 'GET',
        url: '/api/recipes',
        cookies: authCookie,
      });

      expect(listResponse.statusCode).toBe(200);
      expect(listResponse.json()).toEqual([]);

      const createPayload = {
        name: 'Test Tart',
        defaultWeight: 1200,
        ingredients: [
          { name: 'Cream', amount: 400, unit: 'ml' },
          { name: 'Shell', amount: 1, unit: 'pcs', recipeId: 'baseshortcrust' },
        ],
      };

      const createResponse = await serverHarness.server.inject({
        method: 'POST',
        url: '/api/recipes',
        cookies: authCookie,
        payload: createPayload,
      });

      expect(createResponse.statusCode).toBe(201);
      const createdRecipe = createResponse.json();

      expect(createdRecipe).toEqual({
        ...createPayload,
        recipeId: 'test-tart',
      });

      const createConflictResponse = await serverHarness.server.inject({
        method: 'POST',
        url: '/api/recipes',
        cookies: authCookie,
        payload: {
          ...createPayload,
          name: 'Test Tart',
        },
      });

      expect(createConflictResponse.statusCode).toBe(201);
      expect(createConflictResponse.json()).toEqual({
        ...createPayload,
        recipeId: 'test-tart-2',
      });

      const getResponse = await serverHarness.server.inject({
        method: 'GET',
        url: '/api/recipes/test-tart',
        cookies: authCookie,
      });

      expect(getResponse.statusCode).toBe(200);
      expect(getResponse.json()).toEqual(createdRecipe);

      const updatePayload = {
        recipeId: 'ignored-update-id',
        name: 'Updated Tart',
        defaultWeight: 1250,
        ingredients: [{ name: 'Cream', amount: 450, unit: 'ml' }],
      };

      const updateResponse = await serverHarness.server.inject({
        method: 'PUT',
        url: '/api/recipes/test-tart',
        cookies: authCookie,
        payload: updatePayload,
      });

      expect(updateResponse.statusCode).toBe(200);
      expect(updateResponse.json()).toEqual({
        ...updatePayload,
        recipeId: 'test-tart',
      });

      const deleteResponse = await serverHarness.server.inject({
        method: 'DELETE',
        url: '/api/recipes/test-tart',
        cookies: authCookie,
      });

      expect(deleteResponse.statusCode).toBe(204);
      expect(deleteResponse.body).toBe('');

      const missingResponse = await serverHarness.server.inject({
        method: 'GET',
        url: '/api/recipes/test-tart',
        cookies: authCookie,
      });

      expect(missingResponse.statusCode).toBe(404);
      expect(missingResponse.json()).toEqual({ message: 'Recipe not found.' });
    } finally {
      await disposeRecipeApiTestServer(serverHarness);
    }
  });
});

interface RecipeApiTestServer {
  server: RecipeApiServer;
  tempDirectory: string;
}

interface RecipeApiServerBuildResult {
  server: RecipeApiServer;
  tempDirectory: string;
}

type RecipeApiServer = FastifyInstance;

async function buildRecipeApiTestServer(): Promise<RecipeApiServerBuildResult> {
  const tempDirectory = mkdtempSync(join(tmpdir(), 'recepturomat-api-routes-'));
  const server = Fastify();
  const projectConfig: ServerPlatformProjectConfig = {
    projectId: testProjectId,
    database: {
      path: join(tempDirectory, 'auth.sqlite'),
      seedInitialUser: true,
    },
  };

  await server.register(recipeStorePlugin, {
    path: join(tempDirectory, 'recipes.sqlite'),
    seedLegacyRecipes: false,
  });
  await createServerPlatform(server, {
    project: projectConfig,
    plugins: [],
  });
  await server.register(recepturomatRecipeApiPlugin);

  return { server, tempDirectory };
}

async function createRecipeApiTestServer(): Promise<RecipeApiTestServer> {
  const { server, tempDirectory } = await buildRecipeApiTestServer();

  return {
    server,
    tempDirectory,
  };
}

async function disposeRecipeApiTestServer(
  serverHarness: RecipeApiTestServer,
): Promise<void> {
  await serverHarness.server.close();
  rmSync(serverHarness.tempDirectory, { recursive: true, force: true });
}

async function login(server: RecipeApiServer) {
  const loginResponse = await server.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      email: 'admin@rod-manager.local',
      password: 'admin1234',
    },
  });

  expect(loginResponse.statusCode).toBe(200);

  const sessionCookie = loginResponse.cookies.find(
    (cookie: { name: string; value: string }) =>
      cookie.name === sessionCookieName,
  );

  expect(sessionCookie).toBeDefined();

  return {
    [sessionCookieName]: sessionCookie?.value ?? '',
  };
}
