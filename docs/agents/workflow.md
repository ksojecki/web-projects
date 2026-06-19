# Agent Workflow

## 1) Discovery

- Check `README.md`, `AGENTS.md`, and `docs/README.md`.
- Confirm the current Nx workspace state (`nx.json`, `package.json`).
- For new features, identify MVP scope vs non-goals.

## 2) Plan

- Define implementation steps and validation points.
- If a durable architecture decision is made, create or update an ADR.
- Follow root-level defaults (TS, Oxlint, Prettier).

## 3) Implementation

- Make small changes, ideally one goal per change.
- Do not override local package conventions unless necessary.
- For API changes, keep alignment with `docs/architecture/`.
- Keep generated code and comments in English.
- For new plugins, use a folder-based structure with `index.ts` as a thin entrypoint and focused modules (types + implementation files), matching the `database` plugin style.
- For larger modules in general, split by responsibility once complexity grows (avoid monolithic files).

## 4) Validation

- Run lint/format and a quick smoke-check after major changes.
- Before a PR, verify whether documentation updates are required.

## 5) Handover

- In the change description, include what changed, where, why, and how to verify.
- Add links to updated docs and ADRs when relevant.
