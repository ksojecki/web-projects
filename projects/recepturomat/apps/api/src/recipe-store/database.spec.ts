import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { bootstrapRecipeDatabase, resolveRecipeDatabasePath } from './database';
import { legacyRecipeSeedData } from './seedData';

const databases: Database.Database[] = [];
const tempDirectories: string[] = [];

function createTestDatabase(path = ':memory:'): Database.Database {
  const db = new Database(path);
  databases.push(db);
  return db;
}

afterEach(() => {
  for (const db of databases.splice(0)) {
    db.close();
  }

  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('recipe database bootstrap', () => {
  it('creates the recipe schema and seeds legacy recipes when enabled', () => {
    const tempDirectory = mkdtempSync(join(tmpdir(), 'recepturomat-recipes-'));
    tempDirectories.push(tempDirectory);
    const databasePath = resolveRecipeDatabasePath(
      join(tempDirectory, 'recipes.sqlite'),
    );
    const db = createTestDatabase(databasePath);

    bootstrapRecipeDatabase(db, { seedLegacyRecipes: true });

    const countRow = db
      .prepare<[], { count: number }>(`SELECT COUNT(*) AS count FROM recipes`)
      .get();
    expect(countRow?.count).toBe(legacyRecipeSeedData.length);

    const seededRecipe = db
      .prepare<
        [string],
        {
          recipe_id: string;
          name: string;
          default_weight: number;
          ingredients_json: string;
        }
      >(
        `SELECT recipe_id, name, default_weight, ingredients_json FROM recipes WHERE recipe_id = ?`,
      )
      .get('dessertlemontart');

    expect(seededRecipe).toEqual({
      recipe_id: 'dessertlemontart',
      name: 'Tarta cytrynowa',
      default_weight: 900,
      ingredients_json: JSON.stringify([
        {
          name: 'Kruche ciasto (bazowe)',
          amount: 400,
          unit: 'g',
          recipeId: 'baseshortcrust',
        },
        { name: 'Masło', amount: 120, unit: 'g' },
        { name: 'Cukier', amount: 150, unit: 'g' },
        { name: 'Sok z cytryn', amount: 150, unit: 'ml' },
        { name: 'Jajka', amount: 120, unit: 'g' },
      ]),
    });
  });

  it('resolves relative sqlite paths under the workspace root', () => {
    const resolved = resolveRecipeDatabasePath(
      'tmp/recepturomat/recipes.sqlite',
    );

    expect(resolved).toContain('/Users/kamilsojecki/Projekty/rod-manager/');
    expect(resolved).toContain('tmp/recepturomat/recipes.sqlite');
  });
});
