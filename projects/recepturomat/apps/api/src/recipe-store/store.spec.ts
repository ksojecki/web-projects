import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import { bootstrapRecipeDatabase } from './database';
import { createRecipeStore } from './store';
import type { Recipe } from './types';

const databases: Database.Database[] = [];

function createTestDatabase(): Database.Database {
  const db = new Database(':memory:');
  databases.push(db);
  return db;
}

afterEach(() => {
  for (const db of databases.splice(0)) {
    db.close();
  }
});

describe('recipe store', () => {
  it('supports list, getByRecipeId, upsert, and delete', () => {
    const db = createTestDatabase();
    bootstrapRecipeDatabase(db, { seedLegacyRecipes: false });
    const recipeStore = createRecipeStore(db);

    const recipe: Recipe = {
      recipeId: 'testcake',
      name: 'Test Cake',
      defaultWeight: 250,
      ingredients: [
        { name: 'Flour', amount: 100, unit: 'g' },
        { name: 'Milk', amount: 150, unit: 'ml', recipeId: 'basecreamvanilla' },
      ],
    };

    expect(recipeStore.listRecipes()).toEqual([]);

    const createdRecipe = recipeStore.upsert(recipe);
    expect(createdRecipe).toEqual(recipe);
    expect(recipeStore.getByRecipeId('testcake')).toEqual(recipe);
    expect(recipeStore.listRecipes()).toEqual([recipe]);

    const updatedRecipe = recipeStore.upsert({
      ...recipe,
      name: 'Updated Test Cake',
      defaultWeight: 300,
      ingredients: [
        { name: 'Flour', amount: 120, unit: 'g' },
        { name: 'Milk', amount: 180, unit: 'ml' },
      ],
    });

    expect(updatedRecipe).toEqual({
      ...recipe,
      name: 'Updated Test Cake',
      defaultWeight: 300,
      ingredients: [
        { name: 'Flour', amount: 120, unit: 'g' },
        { name: 'Milk', amount: 180, unit: 'ml' },
      ],
    });

    expect(recipeStore.getByRecipeId('testcake')).toEqual(updatedRecipe);
    expect(recipeStore.delete('testcake')).toBe(true);
    expect(recipeStore.getByRecipeId('testcake')).toBeUndefined();
    expect(recipeStore.delete('testcake')).toBe(false);
  });

  it('keeps upsert usable after method destructuring', () => {
    const db = createTestDatabase();
    bootstrapRecipeDatabase(db, { seedLegacyRecipes: false });
    const { upsert, getByRecipeId } = createRecipeStore(db);

    upsert({
      recipeId: 'standalone',
      name: 'Standalone',
      defaultWeight: 100,
      ingredients: [{ name: 'Sugar', amount: 100, unit: 'g' }],
    });

    expect(getByRecipeId('standalone')).toEqual({
      recipeId: 'standalone',
      name: 'Standalone',
      defaultWeight: 100,
      ingredients: [{ name: 'Sugar', amount: 100, unit: 'g' }],
    });
  });
});
