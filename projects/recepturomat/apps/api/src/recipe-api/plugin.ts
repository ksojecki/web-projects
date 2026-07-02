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

        const createdRecipe = createRecipeWithStableSlug(
          fastify.recipeStore.listRecipes(),
          recipe,
        );

        await reply.status(201).send(fastify.recipeStore.upsert(createdRecipe));
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
): Omit<Recipe, 'recipeId'> | undefined;
function parseRecipePayload(
  payload: RecipePayload,
  routeRecipeId: string,
): Recipe | undefined;
function parseRecipePayload(
  payload: RecipePayload,
  routeRecipeId?: string,
): Recipe | Omit<Recipe, 'recipeId'> | undefined {
  if (typeof payload !== 'object' || payload === null) {
    return undefined;
  }

  const name = normalizeNonEmptyString(payload.name);
  const defaultWeight = normalizeNumber(payload.defaultWeight);
  const ingredients = parseIngredients(payload.ingredients);

  if (
    name === undefined ||
    defaultWeight === undefined ||
    ingredients === undefined
  ) {
    return undefined;
  }

  if (routeRecipeId !== undefined) {
    return {
      recipeId: routeRecipeId,
      name,
      defaultWeight,
      ingredients,
    };
  }

  return {
    name,
    defaultWeight,
    ingredients,
  };
}

function createRecipeWithStableSlug(
  existingRecipes: Recipe[],
  recipe: Omit<Recipe, 'recipeId'>,
): Recipe {
  const baseRecipeId = slugifyRecipeName(recipe.name);
  const existingRecipeIds = new Set(
    existingRecipes.map((candidate) => candidate.recipeId),
  );
  let recipeId = baseRecipeId;
  let suffix = 2;

  while (existingRecipeIds.has(recipeId)) {
    recipeId = `${baseRecipeId}-${suffix}`;
    suffix += 1;
  }

  return {
    ...recipe,
    recipeId,
  };
}

function slugifyRecipeName(name: string): string {
  const normalized = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

  return normalized.length > 0 ? normalized : 'recipe';
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

  if (!isRecipeIngredientPayload(payload)) {
    return undefined;
  }

  const ingredient = payload;
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
  if (typeof value !== 'string' || !isRecipeUnit(value)) {
    return undefined;
  }

  return value;
}

function isRecipeUnit(value: string): value is RecipeIngredient['unit'] {
  return value === 'g' || value === 'ml' || value === 'pcs';
}

function isRecipeIngredientPayload(
  value: unknown,
): value is RecipeIngredientPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('name' in value ||
      'amount' in value ||
      'unit' in value ||
      'recipeId' in value)
  );
}
