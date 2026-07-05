# Recepturomat

Recepturomat is a recipe and calculation app for small bakeries, restaurants, and food enthusiasts who need to store recipes and recalculate batches.

## Features

- Recipe list with search by name
- Recipe creation and editing
- Ingredient lists with units
- Linked recipe references for sub-recipes
- Yield scaling for grams and pieces
- Account-based access to the recipe workspace

## Project Structure

- API: [`apps/api`](./apps/api)
- Web: [`apps/web`](./apps/web)
- Project-specific code: [`apps/api/src`](./apps/api/src) and [`apps/web/src/app`](./apps/web/src/app)
- Agent instructions: [`AGENTS.md`](./AGENTS.md)
- Migration plan: [`docs/recepturomat-migration.md`](./docs/recepturomat-migration.md)
- Legacy source inventory: [`docs/recepturomat-source-inventory.md`](./docs/recepturomat-source-inventory.md)

Use the root [`README.md`](../../README.md), [`AGENTS.md`](../../AGENTS.md), and [`docs/agents/workflow.md`](../../docs/agents/workflow.md) for shared workspace rules.

## Commands

```sh
npm run dev:recepturomat
npm run lint
npm run typecheck
```
