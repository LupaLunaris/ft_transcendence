# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend
```bash
cd backend
node server.js          # start API on port 3000
```

### Frontend
```bash
cd frontend
npm run dev             # start Vite dev server (port 5173)
npm run build           # production build
npm run lint            # ESLint
```

## Architecture

Two completely separate apps — no monorepo tooling, no shared code.

### Backend (`backend/`)

Node.js + Express, CommonJS (`require`). No test suite yet.

- `server.js` — starts the HTTP server on port 3000
- `app.js` — wires Express middleware and mounts `/auth` + `/maps` routers
- `db.js` — opens `data.db` (SQLite via `better-sqlite3`), runs `CREATE TABLE IF NOT EXISTS`, and applies additive migrations via `ALTER TABLE` wrapped in `try/catch`
- `middleware/auth.js` — JWT verification; attaches `req.user = { id, username }` on success. Secret: `JWT_SECRET` env var, falls back to `"dev_secret_change_in_prod"`
- `models/` — thin wrappers over `db.prepare(...).run/get/all`. Grid is stored as a JSON string and must be `JSON.stringify`'d on write and `JSON.parse`'d on read
- `controllers/` — route handlers; ownership is always checked with `map.user_id !== req.user.id`
- `routes/` — `authRoutes.js` (public) and `mapRoutes.js` (mixed: some public, some `requireAuth`)

### Frontend (`frontend/`)

React 19 + Vite, ESM. All API calls go through `src/api.js`.

- `src/App.jsx` — auth gate: decodes JWT from `localStorage` on load (checks expiry); renders `AuthForm` or `MapEditor`
- `src/api.js` — all `fetch` calls centralised here; reads token from `localStorage` and injects `Authorization: Bearer` header automatically
- `src/components/AuthForm.jsx` — register/login toggle; calls `onLogin(user)` on success
- `src/components/MapEditor.jsx` — the entire game (editor + play + explore), single component

### Grid encoding

The grid is a 2D array of integers stored as JSON:

| Value | Constant | Meaning |
|-------|----------|---------|
| 0 | `EMPTY` | walkable floor |
| 1 | `WALL` | impassable |
| 2 | `EXIT` | goal (one per map) |
| 3 | `SPAWN` | player start (one per map) |
| 4 | `ENEMY_START` | horizontal enemy spawn |
| 5 | `ENEMY_V_START` | vertical enemy spawn |

`SIZE = 25` (25×25). Changing it requires updating `grid-auto-rows` and `gridTemplateColumns` inline style (both currently `24px` cells).

### MapEditor state model

Two grids coexist during play:
- `grid` — the editable source (contains SPAWN/ENEMY_START markers)
- `playGrid` — computed by `initPlay()`: SPAWN/ENEMY_START stripped out, enemies extracted into `enemies[]` state

**Critical pattern — stale closure avoidance:** `move` is a `useCallback` that only closes over `playGrid`. All other mutable state accessed inside it (`player`, `enemies`, `playingOwnMap`, `mapId`) is read through refs (`playerRef`, `enemiesRef`, `playingOwnMapRef`, `mapIdRef`) that are kept in sync via `useEffect`. Never add these to the `useCallback` dependency array.

**Publish gate:** `creator_completed` must be `1` in the DB before `POST /maps/:id/publish` succeeds. The flag is set by `POST /maps/:id/complete`, called automatically when the creator wins their own map in the Play tab.

### Auth flow

1. `POST /auth/register` → creates user (bcrypt, 10 rounds)
2. `POST /auth/login` → returns `{ token, user }` — token is JWT, 7-day expiry
3. Token stored in `localStorage`; session is restored on reload by decoding the JWT payload client-side (no `/me` endpoint)
