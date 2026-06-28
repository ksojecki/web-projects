import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type Database from 'better-sqlite3';
import { legacyRecipeSeedData } from './seedData';
import { createRecipeStore } from './store';
import type { RecipeDatabaseBootstrapOptions, RecipeStore } from './types';

export function resolveRecipeDatabasePath(path: string): string {
  if (path === ':memory:') {
    return path;
  }

  const resolvedPath = resolve(process.cwd(), path);
  mkdirSync(dirname(resolvedPath), { recursive: true });

  return resolvedPath;
}

export function initializeRecipeSchema(db: Database.Database): void {
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      recipe_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      default_weight INTEGER NOT NULL,
      ingredients_json TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name);
  `);
}

export function bootstrapRecipeDatabase(
  db: Database.Database,
  options: RecipeDatabaseBootstrapOptions,
): void {
  initializeRecipeSchema(db);

  if (!options.seedLegacyRecipes) {
    return;
  }

  seedLegacyRecipes(db);
}

export function seedLegacyRecipes(db: Database.Database): void {
  const recipeStore = createRecipeStore(db);

  for (const recipe of legacyRecipeSeedData) {
    recipeStore.upsert(recipe);
  }
}

export function createRecipeDatabaseStore(db: Database.Database): RecipeStore {
  return createRecipeStore(db);
}
