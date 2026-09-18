# MAUSAM Backend — B/S7

Production-oriented Node.js + TypeScript API boundary for the MAUSAM Flutter application.

## Run

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

Default server:

`http://localhost:5000`

## Endpoints

- `GET /`
- `GET /health`
- `GET /api/v1/weather?latitude=22.5726&longitude=88.3639`
- `GET /api/v1/weather/providers`
- `GET /api/v1/profile`
- `PUT /api/v1/profile`
- `GET /api/v1/personalization`
- `PUT /api/v1/personalization`

## Architecture

Flutter → MAUSAM Backend → Weather Provider

Open-Meteo is the active provider. The IMD adapter is intentionally only an integration boundary until an authorized IMD feed/API and credentials are available.

## B/S8 note

Profile storage is currently an in-memory development boundary. PostgreSQL and real authentication/session management are intentionally added in B/S8.
