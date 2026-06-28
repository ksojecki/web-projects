import type { FastifyPluginAsync } from 'fastify';
import type { Recipe, RecipeIngredient } from '../recipe-store';

interface RecipeParams {
  recipeId: string;
}

interface RecipeIngredientPayload {
  name?: unknown;
  amount?: unknown;
  unit?: unknown;
  recipeId?: unknown;
}

interface RecipePayload {
  recipeId?: unknown;
  name?: unknown;
  defaultWeight?: unknown;
  ingredients?: unknown;
}

const RECIPE_UNITS = new Set<RecipeIngredient['unit']>(['g', 'ml', 'pcs']);

export const recepturomatRecipeApiPlugin: FastifyPluginAsync =
  async function recepturomatRecipeApiPlugin(fastify) {
    fastify.get(
      '/api/recipes',
      {
        preHandler: fastify.requireAuthenticatedSession,
      },
      async () => fastify.recipeStore.listRecipes(),
    );

    fastify.get<{ Params: RecipeParams }>(
      '/api/recipes/:recipeId',
      {
        preHandler: fastify.requireAuthenticatedSession,
      },
      async (request, reply) => {
        const recipe = fastify.recipeStore.getByRecipeId(
          request.params.recipeId,
        );

        if (recipe === undefined) {
          await reply.status(404).send({ message: 'Recipe not found.' });
          return;
        }

        await reply.send(recipe);
      },
    );

    fastify.post<{ Body: RecipePayload }>(
      '/api/recipes',
      {
        preHandler: fastify.requireAuthenticatedSession,
      },
      async (request, reply) => {
        const recipe = parseRecipePayload(request.body);

        if (recipe === undefined) {
          await reply.status(400).send({ message: 'Invalid recipe payload.' });
          return;
        }

        const existingRecipe = fastify.recipeStore.getByRecipeId(
          recipe.recipeId,
        );

        if (existingRecipe !== undefined) {
          await reply
            .status(409)
            .send({ message: 'Recipe with this identifier already exists.' });
          return;
        }

        await reply.status(201).send(fastify.recipeStore.upsert(recipe));
      },
    );

    fastify.put<{ Params: RecipeParams; Body: RecipePayload }>(
      '/api/recipes/:recipeId',
      {
        preHandler: fastify.requireAuthenticatedSession,
      },
      async (request, reply) => {
        const recipe = parseRecipePayload(
          request.body,
          request.params.recipeId,
        );

        if (recipe === undefined) {
          await reply.status(400).send({ message: 'Invalid recipe payload.' });
          return;
        }

        const existingRecipe = fastify.recipeStore.getByRecipeId(
          recipe.recipeId,
        );

        if (existingRecipe === undefined) {
          await reply.status(404).send({ message: 'Recipe not found.' });
          return;
        }

        await reply.send(fastify.recipeStore.upsert(recipe));
      },
    );

    fastify.delete<{ Params: RecipeParams }>(
      '/api/recipes/:recipeId',
      {
        preHandler: fastify.requireAuthenticatedSession,
      },
      async (request, reply) => {
        const deleted = fastify.recipeStore.delete(request.params.recipeId);

        if (!deleted) {
          await reply.status(404).send({ message: 'Recipe not found.' });
          return;
        }

        await reply.status(204).send();
      },
    );
  };

function parseRecipePayload(
  payload: RecipePayload,
  routeRecipeId?: string,
): Recipe | undefined {
  if (typeof payload !== 'object' || payload === null) {
    return undefined;
  }

  const recipeId =
    routeRecipeId !== undefined
      ? routeRecipeId
      : normalizeNonEmptyString(payload.recipeId);
  const bodyRecipeId = normalizeOptionalNonEmptyString(payload.recipeId);
  const name = normalizeNonEmptyString(payload.name);
  const defaultWeight = normalizeNumber(payload.defaultWeight);
  const ingredients = parseIngredients(payload.ingredients);

  if (
    recipeId === undefined ||
    name === undefined ||
    defaultWeight === undefined ||
    ingredients === undefined
  ) {
    return undefined;
  }

  if (bodyRecipeId !== undefined && bodyRecipeId !== recipeId) {
    return undefined;
  }

  return {
    recipeId,
    name,
    defaultWeight,
    ingredients,
  };
}

function parseIngredients(payload: unknown): RecipeIngredient[] | undefined {
  if (!Array.isArray(payload)) {
    return undefined;
  }

  const ingredients: RecipeIngredient[] = [];

  for (const item of payload) {
    const ingredient = parseIngredient(item);

    if (ingredient === undefined) {
      return undefined;
    }

    ingredients.push(ingredient);
  }

  return ingredients;
}

function parseIngredient(payload: unknown): RecipeIngredient | undefined {
  if (typeof payload !== 'object' || payload === null) {
    return undefined;
  }

  const ingredient = payload as RecipeIngredientPayload;
  const name = normalizeNonEmptyString(ingredient.name);
  const amount = normalizeNumber(ingredient.amount);
  const unit = normalizeUnit(ingredient.unit);
  const recipeId = normalizeOptionalNonEmptyString(ingredient.recipeId);

  if (name === undefined || amount === undefined || unit === undefined) {
    return undefined;
  }

  return recipeId === undefined
    ? { name, amount, unit }
    : { name, amount, unit, recipeId };
}

function normalizeNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeOptionalNonEmptyString(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return normalizeNonEmptyString(value);
}

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return value;
}

function normalizeUnit(value: unknown): RecipeIngredient['unit'] | undefined {
  if (
    typeof value !== 'string' ||
    !RECIPE_UNITS.has(value as RecipeIngredient['unit'])
  ) {
    return undefined;
  }

  return value as RecipeIngredient['unit'];
}
