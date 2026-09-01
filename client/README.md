# Todo Web Client

React + TypeScript + Vite frontend for the Todo REST API.

## Stack

- React 19 + Vite
- React Router 7 (`/login`, `/register`, `/` protected todo list)
- Typed `fetch` API client with JWT bearer auth
- Auth state in React context; token + user persisted to `localStorage`

## Setup

```bash
cd client
npm install
cp .env.example .env    # Windows: copy .env.example .env
```

`.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

## Run

Start the backend first (from the project root): `npm run dev` (API on :3000).

Then, in `client/`:

```bash
npm run dev       # http://localhost:5173
```

Production build:

```bash
npm run build
npm run preview
```

## How it connects

- `src/api/client.ts` — base `fetch` wrapper: attaches `Authorization: Bearer <token>`,
  unwraps `{ data }`, throws a typed `ApiError` from the API's `{ error: { code, message } }`
  shape, and clears the token on a `401`.
- `src/api/endpoints.ts` — one function per REST endpoint.
- `src/auth/AuthContext.tsx` — `login` / `register` (register auto-logs-in) / `logout`.
- `src/auth/ProtectedRoute.tsx` — redirects to `/login` when unauthenticated.

The backend enables permissive CORS (`app.use(cors())`), so the dev server on
`:5173` can call the API on `:3000` directly.
