# Budget

- App paths: `projects/budget/apps/api`, `projects/budget/apps/web`
- Package ids: `@ksojecki/budget-api`, `@ksojecki/budget-web`
- Dev command: `npm run dev:budget`
- Local URL: `https://localhost:3200/`
- Web port: `4400`
- Chrome debug port: `9444`
- Put budget feature code under `projects/budget/plugins/` and project app composition under `projects/budget/apps/`.
- Keep imported financial data local under `tmp/budget/`; never commit CSV exports or SQLite databases.
