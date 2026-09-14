# Budget

Budget is a private personal-budget workspace. It will import a local CSV export of the historical `Ledger bankowy` sheet and provide focused transaction and reporting views.

## Project structure

- API: [`apps/api`](./apps/api)
- Web: [`apps/web`](./apps/web)
- Project feature code: [`plugins`](./plugins)
- Migration and parity notes: [`docs`](./docs)
- Agent instructions: [`AGENTS.md`](./AGENTS.md)

## Local development

```sh
npm run dev:budget
```

The app uses `https://localhost:3200/` for the API and SSR entry point, with the Vite web server on port `4400`. Authentication uses `tmp/budget/auth.sqlite`; the budget store will use `tmp/budget/budget.sqlite`.

Public registration is disabled. Set `AUTH_SEED_INITIAL_USER=true` in a local project environment when creating the private seeded account. Keep the account credentials in an ignored `.env.local` file.

Do not commit financial exports, SQLite databases, or other unsanitized personal data.
