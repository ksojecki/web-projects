# MVP Architecture Plan (React + Fastify + SQLite)

## Product goal

Build a community app with:

- a public announcements board,
- a discussion board available to authenticated users.

## Target monorepo layout (Nx)

- `projects/rod-manager/apps/web` - React frontend (Vite), routing, and views.
- `projects/rod-manager/apps/api` - Fastify backend (REST API, auth, validation).
- `libs/shared` - shared DTO types and helpers.
- `libs/ui` - shared React UI components reused across applications.

## Frontend (React)

- React + React Router + TanStack Query.
- Modules: `auth`, `announcements`, `discussion`.
- Communication only through backend API endpoints.

## Backend (Fastify)

- Fastify with domain-based plugins (`/auth`, `/announcements`, `/discussion`).
- Input validation via schemas and mapping to DTOs.
- Cookie sessions (`httpOnly`) for authenticated users.

## Data (SQLite)

Minimum tables:

- `users` (email, password_hash, role)
- `sessions` (user_id, expires_at)
- `announcements` (title, content, author_id, published_at)
- `discussion_threads` (title, author_id)
- `discussion_posts` (thread_id, author_id, content)

## Data flow

1. Frontend fetches public announcements without authentication.
2. Login creates a session and cookie.
3. After authentication, the user can create threads and posts.
4. API returns stable DTOs from `libs/shared`.

## Non-functional MVP requirements

- Simple authentication, no SSO.
- Protection for discussion endpoints and write operations.
- Backend error logging and basic auth rate limiting.
