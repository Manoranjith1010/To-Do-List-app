# Todo App — REST API + React Client

A production-ready Todo application:

- **`/` (root)** – REST API: Node.js, TypeScript, Express, PostgreSQL, Prisma, JWT auth, Argon2, Zod
- **`client/`** – React + TypeScript + Vite single-page frontend

---

## Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Backend](#backend)
  - [Environment](#backend-environment)
  - [Database setup](#database-setup)
  - [Run](#run-the-backend)
  - [Project structure](#backend-project-structure)
- [Frontend](#frontend)
- [API reference](#api-reference)
  - [Error response format](#error-response-format)
  - [Endpoints](#endpoints)
- [Security notes](#security-notes)
- [Common tasks](#common-tasks)
- [Deployment](#deployment)

---

## Architecture

```
Browser ──► React client (Vite dev server, :5173)
                 │  fetch + JWT bearer token
                 ▼
           Express REST API (:3000, /api/*)
                 │  Prisma Client
                 ▼
           PostgreSQL (:5432, Docker)
```

- The client stores the JWT and the user object in `localStorage`, attaches
  `Authorization: Bearer <token>` to every API call, and clears the token on `401`.
- The API is stateless; all todo queries are scoped to the authenticated user.
- Deleting a user cascades to delete their todos (`onDelete: Cascade`).

---

## Prerequisites

- Node.js 18+ (tested on 24)
- One of:
  - **Docker Desktop** (recommended – `docker-compose.yml` is included), or
  - a local PostgreSQL 13+ instance

---

## Quick start

```bash
# 1. Backend deps + Prisma client
npm install
npm run prisma:generate

# 2. Database (Docker)
docker compose up -d

# 3. Environment
copy .env.example .env          # macOS/Linux: cp .env.example .env
#   -> then set a real JWT_SECRET and, if needed, DATABASE_URL

# 4. Migrate
npm run prisma:migrate:deploy

# 5. Run the API (http://localhost:3000)
npm run dev

# 6. In a second terminal – the React client (http://localhost:5173)
cd client
npm install
copy .env.example .env
npm run dev
```

Open **http://localhost:5173**, register an account, and you are in.

> `http://localhost:3000/` intentionally returns `404` — the API only serves
> routes under `/api`. Use `http://localhost:3000/api/health` to check it is up.

---

## Backend

### Backend environment

`.env` (copied from `.env.example`):

| Variable         | Example                                                              | Notes                                   |
|------------------|---------------------------------------------------------------------|-----------------------------------------|
| `DATABASE_URL`   | `postgresql://postgres:postgres@localhost:5432/todo_api?schema=public` | `postgresql://USER:PASS@HOST:PORT/DB`  |
| `PORT`           | `3000`                                                              | API port                                |
| `NODE_ENV`       | `development`                                                       | `development` \| `test` \| `production` |
| `JWT_SECRET`     | *(long random string)*                                              | min 16 chars — required                  |
| `JWT_EXPIRES_IN` | `1h`                                                                | any [ms](https://github.com/vercel/ms) string |

Environment variables are validated on boot with Zod; the process exits with a
clear message if any are missing or invalid.

Generate a strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### Database setup

**With Docker (recommended):**

```bash
docker compose up -d            # starts postgres:16-alpine on :5432, volume todo_pgdata
npm run prisma:migrate:deploy   # applies prisma/migrations
```

**With a local PostgreSQL:**

```bash
createdb todo_api               # or: psql -U postgres -c "CREATE DATABASE todo_api;"
# edit DATABASE_URL in .env to match your credentials
npm run prisma:migrate:deploy
```

Useful Prisma scripts:

| Script                          | Purpose                                             |
|---------------------------------|-----------------------------------------------------|
| `npm run prisma:generate`       | (re)generate the typed Prisma Client                |
| `npm run prisma:migrate`        | create + apply a new migration in development       |
| `npm run prisma:migrate:deploy` | apply existing migrations (CI / production)         |
| `npm run prisma:studio`         | open Prisma Studio to browse data                   |

### Run the backend

| Script            | What it does                                  |
|-------------------|-----------------------------------------------|
| `npm run dev`     | watch mode with `ts-node-dev`                 |
| `npm run build`   | compile TypeScript to `dist/`                 |
| `npm start`       | run the compiled server from `dist/`          |

### Backend project structure

```
.
├── src/
│   ├── controllers/      # HTTP request/response glue (thin)
│   │   ├── auth.controller.ts
│   │   └── todo.controller.ts
│   ├── middleware/
│   │   ├── auth.ts             # Bearer JWT verification
│   │   ├── validate.ts         # Zod request validation
│   │   ├── error-handler.ts    # centralized errors + 404 handler
│   │   └── async-handler.ts    # forwards async errors to Express
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── todo.routes.ts
│   │   └── index.ts
│   ├── services/         # business logic + all DB access
│   │   ├── auth.service.ts
│   │   └── todo.service.ts
│   ├── validators/       # Zod schemas
│   │   ├── auth.validator.ts
│   │   └── todo.validator.ts
│   ├── lib/
│   │   ├── env.ts        # Zod-validated environment
│   │   ├── prisma.ts     # Prisma Client singleton
│   │   ├── jwt.ts        # sign / verify, expired-token handling
│   │   ├── password.ts   # Argon2id hash / verify
│   │   └── errors.ts     # typed AppError hierarchy
│   ├── app.ts            # express app factory (helmet, cors, json)
│   └── server.ts         # bootstrap + graceful shutdown
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       └── 20260101000000_init/migration.sql
├── docker-compose.yml
├── .env.example
├── package.json
├── tsconfig.json
└── client/               # React frontend (see client/README.md)
```

---

## Frontend

Located in [`client/`](client/). See [`client/README.md`](client/README.md) for details.

```bash
cd client
npm install
copy .env.example .env       # sets VITE_API_URL=http://localhost:3000/api
npm run dev                  # http://localhost:5173
npm run build                # production build to client/dist
```

Routes:

| Path        | Access        | Description                          |
|-------------|---------------|--------------------------------------|
| `/login`    | guests only   | email + password                     |
| `/register` | guests only   | name + email + password (auto-login) |
| `/`         | authenticated | todo list: add, toggle, delete       |

Key files:

- `src/api/client.ts` – `fetch` wrapper, JWT header, `{ data }` unwrap, typed `ApiError`
- `src/api/endpoints.ts` – one function per REST endpoint
- `src/auth/AuthContext.tsx` – `login` / `register` / `logout`, `localStorage` persistence
- `src/auth/ProtectedRoute.tsx` – redirect to `/login` when unauthenticated

---

## API reference

Base URL: `http://localhost:3000/api`

- All responses are JSON.
- Success responses are wrapped in `{ "data": ... }`.
- All `/todos` routes require an `Authorization: Bearer <token>` header.

### Error response format

Every error returns:

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "details": {
      "issues": [
        { "path": "body.email", "message": "A valid email is required" }
      ]
    }
  }
}
```

`details` is optional.

| HTTP | `code`                  | When                                          |
|------|-------------------------|-----------------------------------------------|
| 400  | `BAD_REQUEST`           | invalid/missing input, malformed JSON         |
| 401  | `UNAUTHORIZED`          | missing/invalid/expired token, bad login      |
| 403  | `FORBIDDEN`             | authenticated but not allowed                 |
| 404  | `NOT_FOUND`             | resource does not exist or is not yours       |
| 409  | `CONFLICT`              | duplicate email on registration               |
| 500  | `INTERNAL_SERVER_ERROR` | unexpected server error                       |

### Endpoints

| Method   | Path                        | Auth | Description                    |
|----------|-----------------------------|:----:|-------------------------------|
| `GET`    | `/api/health`               |  –   | liveness check                |
| `POST`   | `/api/auth/register`        |  –   | create an account             |
| `POST`   | `/api/auth/login`           |  –   | obtain a JWT                   |
| `POST`   | `/api/todos`                |  ✔   | create a todo                 |
| `GET`    | `/api/todos`                |  ✔   | list your todos (`?completed=true\|false`) |
| `GET`    | `/api/todos/:id`            |  ✔   | get one todo                  |
| `PUT`    | `/api/todos/:id`            |  ✔   | update a todo                 |
| `DELETE` | `/api/todos/:id`            |  ✔   | delete a todo                 |
| `PATCH`  | `/api/todos/:id/complete`   |  ✔   | toggle or set completion      |

---

#### `POST /api/auth/register`

Request:

```json
{ "name": "Ada Lovelace", "email": "ada@example.com", "password": "supersecret123" }
```

`201 Created`:

```json
{
  "data": {
    "id": "d87e9a71-ad79-439c-9cf9-2e5dd0089a69",
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "createdAt": "2026-08-27T14:20:29.103Z",
    "updatedAt": "2026-08-27T14:20:29.103Z"
  }
}
```

Errors: `400` invalid input · `409` email already registered.

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","password":"supersecret123"}'
```

---

#### `POST /api/auth/login`

Request:

```json
{ "email": "ada@example.com", "password": "supersecret123" }
```

`200 OK`:

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "d87e9a71-ad79-439c-9cf9-2e5dd0089a69",
      "name": "Ada Lovelace",
      "email": "ada@example.com",
      "createdAt": "2026-08-27T14:20:29.103Z",
      "updatedAt": "2026-08-27T14:20:29.103Z"
    }
  }
}
```

Errors: `400` invalid input · `401` invalid email or password.

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"supersecret123"}'

# capture the token for the calls below
TOKEN="paste-access-token-here"
```

---

#### `POST /api/todos`

Request:

```json
{ "title": "Write documentation", "description": "Cover every endpoint" }
```

`201 Created`:

```json
{
  "data": {
    "id": "f0b1d8a3-71b7-4ce5-8ea3-a4a78c985eeb",
    "userId": "d87e9a71-ad79-439c-9cf9-2e5dd0089a69",
    "title": "Write documentation",
    "description": "Cover every endpoint",
    "completed": false,
    "createdAt": "2026-08-27T14:20:29.903Z",
    "updatedAt": "2026-08-27T14:20:29.903Z"
  }
}
```

```bash
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Write documentation","description":"Cover every endpoint"}'
```

---

#### `GET /api/todos`

Optional query: `?completed=true` or `?completed=false`.

`200 OK`:

```json
{
  "data": [
    {
      "id": "f0b1d8a3-71b7-4ce5-8ea3-a4a78c985eeb",
      "userId": "d87e9a71-ad79-439c-9cf9-2e5dd0089a69",
      "title": "Write documentation",
      "description": "Cover every endpoint",
      "completed": false,
      "createdAt": "2026-08-27T14:20:29.903Z",
      "updatedAt": "2026-08-27T14:20:29.903Z"
    }
  ]
}
```

```bash
curl http://localhost:3000/api/todos -H "Authorization: Bearer $TOKEN"
```

---

#### `GET /api/todos/:id`

`200 OK` — same shape as a single todo above.
Errors: `400` invalid id · `404` not found or not owned by you.

```bash
curl http://localhost:3000/api/todos/f0b1d8a3-71b7-4ce5-8ea3-a4a78c985eeb \
  -H "Authorization: Bearer $TOKEN"
```

---

#### `PUT /api/todos/:id`

Request — any subset of fields, at least one required (`description` may be `null`):

```json
{ "title": "Write great documentation", "completed": true }
```

`200 OK`:

```json
{
  "data": {
    "id": "f0b1d8a3-71b7-4ce5-8ea3-a4a78c985eeb",
    "userId": "d87e9a71-ad79-439c-9cf9-2e5dd0089a69",
    "title": "Write great documentation",
    "description": "Cover every endpoint",
    "completed": true,
    "createdAt": "2026-08-27T14:20:29.903Z",
    "updatedAt": "2026-08-27T14:20:30.267Z"
  }
}
```

```bash
curl -X PUT http://localhost:3000/api/todos/f0b1d8a3-71b7-4ce5-8ea3-a4a78c985eeb \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Write great documentation","completed":true}'
```

---

#### `DELETE /api/todos/:id`

`204 No Content` (empty body).

```bash
curl -X DELETE http://localhost:3000/api/todos/f0b1d8a3-71b7-4ce5-8ea3-a4a78c985eeb \
  -H "Authorization: Bearer $TOKEN"
```

---

#### `PATCH /api/todos/:id/complete`

Body is optional:

- omit body → **toggles** `completed`
- `{ "completed": true }` → sets it explicitly

`200 OK`:

```json
{
  "data": {
    "id": "f0b1d8a3-71b7-4ce5-8ea3-a4a78c985eeb",
    "userId": "d87e9a71-ad79-439c-9cf9-2e5dd0089a69",
    "title": "Write documentation",
    "description": "Cover every endpoint",
    "completed": true,
    "createdAt": "2026-08-27T14:20:29.903Z",
    "updatedAt": "2026-08-27T14:20:30.422Z"
  }
}
```

```bash
curl -X PATCH http://localhost:3000/api/todos/f0b1d8a3-71b7-4ce5-8ea3-a4a78c985eeb/complete \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"completed":true}'
```

---

### Postman

1. Create an environment with `baseUrl = http://localhost:3000/api` and an empty `token`.
2. Call `POST {{baseUrl}}/auth/register`, then `POST {{baseUrl}}/auth/login`.
3. In the login request's **Tests** tab:
   ```js
   pm.environment.set("token", pm.response.json().data.accessToken);
   ```
4. For every `/todos` request, set Authorization → **Bearer Token** → `{{token}}`.

---

## Security notes

- Passwords are hashed with **Argon2id** and never returned by any endpoint.
- All `/api/todos/*` routes require a valid, unexpired JWT; expired and malformed
  tokens return `401 UNAUTHORIZED` with a clear message.
- Every todo lookup is filtered by the authenticated user's id, so one user can
  never read, update, or delete another user's todos (returns `404`).
- Requests are validated and sanitized with Zod (trim, lowercased email, length caps).
- `helmet` sets secure headers; JSON body size is capped at 100 kb.
- Deleting a user cascades to their todos at the database level.

---

## Common tasks

| Task                                   | Command                                             |
|----------------------------------------|-----------------------------------------------------|
| Start database                         | `docker compose up -d`                              |
| Stop database (keep data)              | `docker compose stop`                               |
| Destroy database + data                | `docker compose down -v`                            |
| Apply migrations                       | `npm run prisma:migrate:deploy`                     |
| Create a new migration                 | `npm run prisma:migrate -- --name <change>`         |
| Browse data                            | `npm run prisma:studio`                             |
| Reset schema (dev only, drops data)    | `npx prisma migrate reset`                          |
| API health check                       | `curl http://localhost:3000/api/health`            |
| Build everything                       | `npm run build && cd client && npm run build`       |

---

## Deployment

Production deployment with Docker Compose (API + nginx-served client + Postgres)
is documented in **[DEPLOYMENT.md](DEPLOYMENT.md)**.

```bash
cp .env.production.example .env.production   # fill in JWT_SECRET + POSTGRES_PASSWORD
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

- [`Dockerfile`](Dockerfile) — multi-stage API image; runs `prisma migrate deploy` on start
- [`client/Dockerfile`](client/Dockerfile) + [`client/nginx.conf`](client/nginx.conf) — builds the SPA, serves it, proxies `/api/*` to the API
- [`docker-compose.prod.yml`](docker-compose.prod.yml) — the three services; Postgres stays internal
- App is served on `http://<host>:8080` (put a TLS reverse proxy in front for production)
