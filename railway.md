# Railway Deployment Guide (SERP)

This project can be deployed in Railway as three services:

1. `serp-db` (PostgreSQL managed by Railway)
2. `serp-backend` (Docker service from `backend/`)
3. `serp-frontend` (Docker service from `frontend/`)

## 1) Backend service

- Root directory: `backend`
- Builder: `Dockerfile`
- Start command: from Dockerfile (`bun src/index.ts`)

### Backend environment variables

- `PORT=3000`
- `DATABASE_URL=${{Postgres.DATABASE_URL}}` (reference Railway Postgres variable)
- `JWT_SECRET=<strong-random-secret>`
- `JWT_EXPIRES_IN_HOURS=8`
- `CORS_ORIGIN=<frontend-public-url>`

Example:

- `CORS_ORIGIN=https://serp-frontend-production.up.railway.app`

## 2) Frontend service

- Root directory: `frontend`
- Builder: `Dockerfile`
- Start command: from Dockerfile (`bun run dev`)

### Frontend environment variables

- `PORT=5173`
- `VITE_API_URL=<backend-public-url>`

Example:

- `VITE_API_URL=https://serp-backend-production.up.railway.app`

## 3) Database service

Use Railway PostgreSQL plugin.

### DB environment variables

Railway provides these automatically (do not hardcode):

- `PGHOST`
- `PGPORT`
- `PGUSER`
- `PGPASSWORD`
- `PGDATABASE`
- `DATABASE_URL`

The backend only needs `DATABASE_URL`.

## Important notes

- Backend runs migrations automatically on startup from `backend/src/db/schema.sql`.
- Frontend submits the full form directly to backend endpoint: `POST /api/public/formulario`.
- Ensure both backend and frontend services expose their ports in Railway networking.
- After first deploy, verify:
  - `GET /health` in backend returns `{ "status": "ok" }`
  - Frontend loads and form submission returns success.
