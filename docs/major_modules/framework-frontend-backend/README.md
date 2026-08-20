# Module: Frontend and Backend Framework

For the Major Module: use a framework to build the backend, and a framework or toolkit to build the frontend.

**Points:** 2 · **Owners:** Jennifer (frontend architecture), Jerem (backend architecture)

## Overview

Guilds of the Deep is a monorepo split into three independent TypeScript packages — `frontend`, `backend`, `shared` — built on React for the client and Express for the server, connected through a REST API plus a Socket.IO channel for real-time gameplay. `shared` is compiled first so both sides consume the exact same request/response and event types, which removes an entire category of integration bugs (a field renamed on one side breaking silently on the other).

The goal of this module was not just "pick a framework" but to get a framework pairing that could support everything the rest of the subject needs on top of it: typed contracts end to end, protected routes, file uploads, rate limiting, and a Socket.IO server sharing the same HTTP server as the API.

## Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org) + [Vite](https://vite.dev) | Component model fits a multi-page app (auth, editor, tower, duel, profile); Vite gives fast HMR in dev and a small production build |
| Frontend routing | `react-router-dom` | Client-side routing with a `ProtectedRoute` wrapper for authenticated pages |
| Backend | [Node.js](https://nodejs.org) + [Express 4](https://expressjs.com) + TypeScript | Minimal, well-understood routing/middleware model; easy to layer `helmet`, `cors`, rate limiting on top |
| Realtime | [Socket.IO 4.7](https://socket.io) | Runs on the same `http.Server` as Express — one process, one port, shared JWT auth logic |
| Shared contracts | `@ft/shared` (internal package) | Single source of truth for API and Socket.IO payload types, `Grid`/`Direction`/tile enums, and the enemy-movement algorithm |
| ORM / DB | [Prisma](https://www.prisma.io) + [PostgreSQL](https://www.postgresql.org) | Typed queries, migrations checked into the repo |

## How it works

### Backend entry point

`backend/src/server.ts` wires everything into one process: Express app, one `http.Server`, and a Socket.IO server attached to that same server.

```ts
const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'], credentials: true },
});

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

app.get('/api/health', ...);
app.use('/api/v1', apiRouter);
registerDuelHandlers(io);

httpServer.listen(PORT, ...);
```

`backend/src/bootstrap.ts` runs *before* `server.ts` is even imported: it resolves `DATABASE_URL` and `JWT_SECRET` (from HashiCorp Vault in Docker, from `backend/.env` in local dev — see the [WAF / Vault module](../waf-vault-security/README.md)), so Prisma and JWT signing never see an undefined secret.

Routes are organized by domain under `backend/src/routes/` (`auth`, `users`, `friends`, `maps`, `scores`, `tower`, `admin`), each a self-contained `Router()` mounted in `routes/index.ts` under `/api/v1`. Cross-cutting concerns are middleware, not per-route code: `auth.middleware.ts` (JWT verification), `admin.middleware.ts`, `validate.middleware.ts` (Zod schema validation), `upload.middleware.ts` (avatar uploads).

### Frontend entry point

`frontend/src/App.tsx` composes the app from providers down to routes:

```tsx
<ToastProvider>
  <AuthProvider>
    <SocketProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </SocketProvider>
  </AuthProvider>
  <ToastContainer />
</ToastProvider>
```

`AppRoutes` declares every page (`/`, `/login`, `/register`, `/profile`, `/editor`, `/tower`, `/play/:map_id`, `/duel`, legal pages, …) and wraps every authenticated one in `ProtectedRoute`, which reads `useAuth()` and redirects to `/login` when there is no user — one guard, reused everywhere instead of duplicated per-page checks.

### Shared contracts

```ts
// shared/src/index.ts
export * from './types/tiles.types';
export * from './types/user.types';
export * from './types/gamification.types';
export * from './types/leaderboard.types';
export * from './types/map.types';
export * from './types/auth.types';
export * from './types/game.types';
export * from './types/socket.types';
export * from './types/api.types';
export * from './game/enemyLogic';
```

Both `backend` and `frontend` depend on `@ft/shared` (built via `npm run build -w shared` before either workspace starts). This is what lets the Socket.IO server be typed as `Server<ClientToServerEvents, ServerToClientEvents>` and the client hooks consume the exact same event names and payload shapes — a typo in an event name is a compile error, not a runtime silent failure.

## Diagram

```text
Browser
  │
  ├── HTTP  ──►  React (Vite) ──► fetch('/api/v1/...') ──►┐
  │                                                        │
  └── WS    ──►  Socket.IO client ──────────────────────►  │
                                                             ▼
                                              Express app + Socket.IO server
                                              (same http.Server, backend/src/server.ts)
                                                             │
                                    ┌────────────────────────┴───────────────────────┐
                                    │                                                 │
                            REST routers (/api/v1/*)                     registerDuelHandlers(io)
                            auth · users · friends ·                     lobby / race / game_state
                            maps · scores · tower · admin                          │
                                    │                                              │
                                    └───────────────────┬──────────────────────────┘
                                                         ▼
                                              Prisma Client → PostgreSQL
```

## Why this satisfies the module

- Backend built on a real framework (Express) with layered middleware (`helmet`, `cors`, rate limiting, JSON body parsing, static file serving), not a raw `http` server.
- Frontend built on a real framework/toolkit (React + Vite), not server-rendered templates — fully client-side routed SPA.
- The two are not just co-located but genuinely integrated: one shared TypeScript package (`@ft/shared`) is the single source of truth for every API and Socket.IO contract between them.
- The same framework choice supports the rest of the subject's modules without a second server or a second app: Socket.IO for [real-time features](../realtime-features/README.md), Prisma/PostgreSQL for [standard user management](../standard-user-management/README.md), and the same Express app sits behind the [WAF/Vault](../waf-vault-security/README.md) stack in Docker.
