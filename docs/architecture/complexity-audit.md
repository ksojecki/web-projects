# Complexity Reduction Audit

GitHub issue: [#98](https://github.com/ksojecki/web-projects/issues/98)

This audit ranks code and architecture cuts that reduce duplicate code, file
surface, dependency weight, and token usage. It covers complexity only.
Correctness, security, and performance need separate reviews.

## Ranked Backlog

| Rank | Tag       | Urgency | Size | Cut                                                                                                                                  | Replacement                                                                                           | Evidence                                                                                                                           | Validation                                                                                |
| ---- | --------- | ------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1    | `delete:` | High    | M    | Unused root dependencies: `@fastify/autoload`, `@vitest/ui`, `ajv`, `autoprefixer`, `jiti`, `isbot`, and likely direct SWC packages. | Remove from `package.json` and lockfile after dependency validation.                                  | Source search found no repo references outside manifests, lockfile, and Nx cache data.                                             | `npm install`, then `npx nx run-many -t lint test build typecheck --no-tui`.              |
| 2    | `shrink:` | High    | M    | Product API startup copies TLS loading, Fastify setup, env loading, port selection, and listen handling.                             | Add one shared server starter that accepts product id, project config, and product plugins.           | `projects/rod-manager/apps/api/src/main.ts` and `projects/recepturomat/apps/api/src/main.ts` differ mainly in plugin registration. | API tests plus both API builds.                                                           |
| 3    | `shrink:` | High    | M    | Browser API clients repeat `requestJson`, `parseErrorMessage`, `hasMessage`, and `isRecord`.                                         | Export one `requestJson` helper from `libs/web-platform`.                                             | Auth, account settings, Rod Manager pages, and Recepturomat recipes each define a variant.                                         | Affected web tests and typecheck.                                                         |
| 4    | `delete:` | Medium  | S    | Empty product account extension layers.                                                                                              | Call `useDefaultAccountSections()` directly until a product adds real extra sections.                 | Both products define a config object and hook that only returns `[]`.                                                              | Account page tests for both products.                                                     |
| 5    | `delete:` | Medium  | S    | Rod Manager password form and schema re-export files.                                                                                | Import `PasswordMethodForm` and `passwordSchema` from `@ksojecki/platform-web-platform` where needed. | Product-local files only re-export shared symbols.                                                                                 | Rod Manager web typecheck.                                                                |
| 6    | `delete:` | Medium  | S    | Placeholder `shared()` function and spec.                                                                                            | Nothing. Keep only real DTO and workspace config exports in `libs/shared`.                            | No source imports `shared()` outside its own generated spec.                                                                       | `npx nx run @ksojecki/platform-shared:test --no-tui`.                                     |
| 7    | `shrink:` | Medium  | M    | Project generator emits stale bootstrap, account extension, and config boilerplate.                                                  | Generate thin product deltas that call shared helpers.                                                | Generated templates still include old `dotenv/config` style and duplicate startup code.                                            | Generator spec plus `npm run generate:project -- <tmp-name>` in a scratch path if needed. |
| 8    | `yagni:`  | Medium  | M    | `projects/rod-manager/plugins/pages/ui` package.                                                                                     | Delete until real WebPlatform UI plugin integration exists.                                           | Package exports only a placeholder `pagesUiPlugin()` with no callers.                                                              | `npx nx sync:check --no-tui` and Rod Manager web typecheck.                               |
| 9    | `shrink:` | Low     | M    | Product route shells repeat register, OAuth callback, auth provider, and account route wiring.                                       | Add a shared route-shell helper that accepts product route elements and redirects.                    | Both products define the same auth/register/OAuth/account route pattern.                                                           | Product web route tests.                                                                  |
| 10   | `shrink:` | Low     | S    | Repo search commands can include package-local `node_modules` and Nx cache files.                                                    | Document `rg --glob '!**/node_modules/**'` and avoid `.nx/workspace-data` unless cache state matters. | Initial audit searches returned package-local dependencies before pruning ignored paths.                                           | No code validation needed.                                                                |

## First PR

Start with the low-risk deletes:

- Remove empty product account config and extra-section files.
- Remove Rod Manager password re-export files if no imports need them.
- Remove `shared()` and its placeholder spec.
- Remove unused root dependencies only after `npm install` updates the lockfile cleanly.

This batch should cut about 80 to 180 source lines and several dependency
entries, with low behavior risk.

## Bigger PRs

- Add a shared product API starter, then shrink both product `main.ts` files and
  the project generator output.
- Add one web request helper, then migrate auth, account settings, pages, and
  recipes clients.
- Delete the placeholder pages UI package or replace it with real UI plugin
  behavior in the same PR.
- Consider a shared route shell only after the API starter and request helper
  cuts land. The current duplication costs tokens, but the abstraction should
  stay small.

## Net

Possible result: `-700` to `-1,400` lines, `-6` to `-9` direct dependency
entries, and fewer repeated files in future agent context.
