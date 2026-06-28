# Recepturomat Source Inventory

## Scope

This document records the legacy Recepturomat application shape from
`/Users/kamilsojecki/Projekty/recepturomat` so the migration issues can reuse
one concrete reference instead of re-discovering the source app piecemeal.

It is intentionally descriptive, not prescriptive. Use
[`recepturomat-migration.md`](./recepturomat-migration.md) for the target
architecture decision and issue breakdown.

## Source Workspace Snapshot

- Nx 22 workspace with four visible areas: `apps/ui`, `apps/backend`,
  `libs/data-model`, and `libs/app-toolkit`.
- Root `package.json` in the sampled source repo had no `scripts` block; the
  practical command surface was Nx-target driven.
- App manifests exposed these targets:
  - `apps/ui`: `build`, `serve`, `preview`, `test`, `typecheck`.
  - `apps/backend`: `serve`, `test`.
- Workspace plugins in `nx.json` also infer common `build`, `lint`, and
  `typecheck` targets where the project configuration supports them.
- Source dependencies show the application stack was Express + React Router +
  React Query + MongoDB + JWT + Zod.

## Source Command Surface

The sampled repo exposed and documented these commands:

- `npx nx serve backend` starts the Express API.
- `npx nx serve ui` starts the React Router frontend.
- `./serve.sh` runs `nx run-many -t serve,dev -p ui backend`.
- `npx nx run-many --target=test --all` runs the available tests.
- `npx nx test ui` and `npx nx test backend` run per-app test targets.
- `npx nx run-many --target=lint --all` and `npx nx lint ui` cover linting.
- `npx nx build recepturomat-ui` builds the frontend bundle.
- `npx nx show project recepturomat-ui` was the documented project inspection
  path.

Observed test coverage in the sampled repo was narrow:

- `apps/ui/app/api/query.test.ts`
- `libs/data-model/src/index.test.ts`
- No backend route tests were present in the inspected source tree.

## Frontend Routes And Behavior

Legacy frontend routes live in `apps/ui/app/routes.tsx`:

- `/` -> `RecipesListPage`
- `/recipe/:recipeId` -> `RecipePage`
- `/recipe/:recipeId/edit` -> `EditRecipePage`
- `/recipe/new` -> `NewRecipePage`
- `/login` -> `LoginPage`

Major UI behavior:

- `AppLayout.tsx` wraps the app in `I18nProvider`, `QueryClientProvider`, and
  `AuthenticationProvider`, then renders the dashboard layout.
- Locale state is client-side and persisted in localStorage under
  `recepturomat-locale`; the UI supports `en` and `pl`.
- Authentication state is also client-side and persisted in localStorage under
  `authInfo`.
- `RecipesListPage.tsx` loads recipes, sorts them by name, and filters by a
  client-side substring search.
- `RecipePage.tsx` recalculates ingredient quantities from a user-entered
  weight, supports `g` and `pcs`, and exposes edit/delete actions.
- `EditRecipePage.tsx` and `NewRecipePage.tsx` both reuse the same recipe form.
- `NewRecipePage.tsx` starts from an empty recipe object with
  `defaultWeight: 1000` and `recipeId: 'new'`.
- The recipe form and nested ingredient components in `apps/ui/app/recipes/*`
  support recipe-to-recipe ingredient references.
- The form submit path currently only logs the recipe payload in
  `useRecipeForm.ts`; no sampled create or update API call existed yet.

## Backend Endpoints And Auth Flow

Legacy backend composition lives in `apps/backend/src/main.ts` and
`apps/backend/src/api/authentication.ts`.

Endpoints exposed by the sampled backend:

- `POST /api/authentication/get-token`
  - Validates username/password against MongoDB users.
  - Returns a signed JWT on success.
- `GET /api/authentication/change-password`
  - Present as a placeholder response.
- `GET /api/recipe/list`
  - Requires bearer authentication.
  - Returns recipe list entries with `name` and `recipeId`.
- `GET /api/recipe/:id`
  - Requires bearer authentication.
  - Returns a full recipe document.
- `DELETE /api/recipe/:id`
  - Requires bearer authentication.
  - Deletes the recipe and returns success.

Auth flow details:

- The backend reads the bearer token from the `Authorization` header.
- Tokens are signed with `AUTHENTICATION_SECRET`.
- Token lifetime is `1h`.
- The JWT audience is `change-password` when `forceChangePassword` is true, and
  `recepturomat-ui` otherwise.
- The frontend query helper sends requests to
  `https://localhost:3333/api` and adds the bearer token when present.

## Env Vars And Runtime Assumptions

The backend settings layer reads these environment variables from
`apps/backend/src/settings.ts`:

- `MONGO_URL`
- `MONGO_USER`
- `MONGO_PASSWORD`
- `MONGO_DATABASE`
- `AUTHENTICATION_SECRET`
- `HTTPS_CERT`
- `HTTPS_KEY`

Runtime assumptions in the source app:

- The API runs as an HTTPS server.
- The server listens on `PORT` when set, otherwise `3333`.
- CORS is enabled globally.
- MongoDB is the primary runtime data store.
- The database connection uses authenticated Mongo credentials and a single
  database name from the environment.
- The frontend assumes the API is reachable at
  `https://localhost:3333/api`; there is no separate runtime base-URL
  configuration in the sampled UI code.

## Mongo Collections, Bootstrap, And Recipe Shape

Bootstrap behavior lives in `apps/backend/src/dataModel/dataModel.ts` and
`apps/backend/src/mock.ts`.

Collections in the legacy data model:

- `users`
- `settings`
- `recipes`

Schema bootstrap behavior:

- `CLEAN_SCHEMA` is `0`; `SUPPORTED_SCHEMA` is `1`.
- If the stored schema version is greater than `1`, startup fails fast.
- On a clean database, the backend:
  - Creates `users` with a unique text index on `username`.
  - Inserts a default `admin` user with password `password`.
  - Marks that user `forceChangePassword: true`.
  - Creates `settings` with a unique text index on `id`.
  - Stores `schemaVersion: 1` under the `schema` record.
  - Creates `recipes` with a unique text index on `recipeId`.
  - Seeds recipes from `MockOfRecipes`.

Legacy recipe document shape:

- `recipeId`: stable string identifier.
- `name`: recipe display name.
- `defaultWeight`: number.
- `ingredients`: array of ingredient documents.

Legacy ingredient shape:

- `name`: ingredient label.
- `amount`: number.
- `unit`: one of `g`, `ml`, or `pcs`.
- `recipeId`: optional reference to another recipe.

The current seed data includes nested recipe references, so the source app treats
recipes as a graph rather than a flat list.

## Legacy To Target Mapping

Use this mapping to split the migration work between product-local code and
shared platform reuse candidates.

| Legacy source area                                                               | Target in this repo                                                                                          | Migration note                                                                                                                |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `apps/ui` routes, pages, forms, hooks, and i18n                                  | `projects/recepturomat/apps/web`                                                                             | Product-local frontend composition. Keep route layout, recipe pages, and localization behavior here first.                    |
| `apps/backend` Express API, auth route, recipe routes, bootstrap, and seed logic | `projects/recepturomat/apps/api`                                                                             | Product-local backend composition. Port the behavior into the generated Fastify app shape.                                    |
| `libs/data-model` recipe/auth/response types                                     | Product-local contracts under `projects/recepturomat/` first; reuse only if a repo-wide shape already exists | Do not force a shared library before the product shape is stable.                                                             |
| `libs/app-toolkit` env extraction and Express middleware helpers                 | Replace with existing workspace platform/config utilities unless a product-local helper is still needed      | Treat this as migration glue, not as a new shared target by default.                                                          |
| Auth context, query helper, and app shell wrappers                               | Shared platform usage where it already matches the workspace pattern                                         | Reuse `libs/web-platform` and `libs/server-platform` only for generic auth/session/shell primitives, not for recipe behavior. |
| Mongo bootstrap and recipe seed data                                             | Product-local initialization and import path                                                                 | The first wave should own this inside the product API.                                                                        |

## First-Wave Postponed Or Unsupported Items

These items are not part of the first migration wave:

- MongoDB stays a legacy source, not the runtime database for the migrated app.
- There is no generic storage abstraction yet.
- The backend `change-password` endpoint remains a placeholder unless a later
  ticket gives it real behavior.
- Create and update recipe persistence are not present as shipped backend
  endpoints in the sampled source files, even though the UI includes form
  screens.
- Printing is not supported as a verified backend feature in the sampled source
  files; the UI button exists, but the migration should not treat it as shipped
  functionality.
- No cross-product sharing of recipe UI, recipe types, or recipe stores.
- No attempt to normalize nested ingredient references into a separate model on
  day one.
- No new locale expansion beyond the observed `en` and `pl` behavior.

## Concrete Legacy Source Files

The inventory above was based on these files in the legacy repository:

- `apps/backend/src/main.ts`
- `apps/backend/src/api/authentication.ts`
- `apps/backend/src/api/recipe.ts`
- `apps/backend/src/api/recipeList.ts`
- `apps/backend/src/dataModel/dataModel.ts`
- `apps/backend/src/dataModel/mongoConnection.ts`
- `apps/backend/src/mock.ts`
- `apps/backend/src/settings.ts`
- `docker-compose.yaml`
- `serve.sh`
- `mongo-init.js`
- `apps/ui/app/routes.tsx`
- `apps/ui/app/AppLayout.tsx`
- `apps/ui/app/api/authentication/AuthenticationProvider.tsx`
- `apps/ui/app/api/query.ts`
- `apps/ui/app/api/useApiCall.ts`
- `apps/ui/app/api/useRecipe.ts`
- `apps/ui/app/api/useRecipesList.ts`
- `apps/ui/app/recipes/hooks/useRecipeForm.ts`
- `apps/ui/app/i18n/index.tsx`
- `apps/ui/app/recipes/RecipesListPage.tsx`
- `apps/ui/app/recipes/RecipePage.tsx`
- `apps/ui/app/recipes/EditRecipePage.tsx`
- `apps/ui/app/recipes/NewRecipePage.tsx`
- `libs/app-toolkit/src/lib/appSettingsFromEnv.ts`
- `libs/data-model/src/lib/types/recipe.ts`
- `libs/data-model/src/lib/types/ingredient.ts`
- `libs/data-model/src/lib/types/users.ts`
- `libs/data-model/src/lib/types/response.ts`
