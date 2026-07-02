import type Database from 'better-sqlite3';
import type { Recipe, RecipeRow, RecipeStore } from './types';

function mapRecipeRow(row: RecipeRow): Recipe {
  const ingredients = JSON.parse(row.ingredients_json);

  if (!isRecipeIngredientArray(ingredients)) {
    throw new Error('Invalid recipe row.');
  }

  return {
    recipeId: row.recipe_id,
    name: row.name,
    defaultWeight: row.default_weight,
    ingredients,
  };
}

function serializeIngredients(recipe: Recipe): string {
  return JSON.stringify(recipe.ingredients);
}

function isRecipeIngredientArray(
  value: unknown,
): value is Recipe['ingredients'] {
  return (
    Array.isArray(value) &&
    value.every(
      (ingredient) =>
        isRecord(ingredient) &&
        typeof ingredient.name === 'string' &&
        typeof ingredient.amount === 'number' &&
        typeof ingredient.unit === 'string',
    )
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function createRecipeStore(db: Database.Database): RecipeStore {
  const listRecipesStatement = db.prepare<[], RecipeRow>(
    `SELECT recipe_id, name, default_weight, ingredients_json
      FROM recipes
      ORDER BY recipe_id ASC`,
  );

  const getRecipeStatement = db.prepare<[string], RecipeRow>(
    `SELECT recipe_id, name, default_weight, ingredients_json
      FROM recipes
      WHERE recipe_id = ?`,
  );

  const upsertRecipeStatement = db.prepare(
    `INSERT INTO recipes (recipe_id, name, default_weight, ingredients_json)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(recipe_id) DO UPDATE SET
        name = excluded.name,
        default_weight = excluded.default_weight,
        ingredients_json = excluded.ingredients_json,
        updated_at = unixepoch()`,
  );

  const deleteRecipeStatement = db.prepare(
    `DELETE FROM recipes WHERE recipe_id = ?`,
  );

  function getByRecipeId(recipeId: string): Recipe | undefined {
    const row = getRecipeStatement.get(recipeId);

    if (row === undefined) {
      return undefined;
    }

    return mapRecipeRow(row);
  }

  return {
    listRecipes(this: void) {
      return listRecipesStatement.all().map(mapRecipeRow);
    },
    getByRecipeId,
    upsert(this: void, recipe: Recipe) {
      upsertRecipeStatement.run(
        recipe.recipeId,
        recipe.name,
        recipe.defaultWeight,
        serializeIngredients(recipe),
      );

      const storedRecipe = getByRecipeId(recipe.recipeId);

      if (storedRecipe === undefined) {
        throw new Error('Recipe upsert failed.');
      }

      return storedRecipe;
    },
    delete(this: void, recipeId: string) {
      const result = deleteRecipeStatement.run(recipeId);
      return result.changes > 0;
    },
  };
}
