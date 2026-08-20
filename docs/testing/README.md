# Testing

## Overview

The project runs two separate, framework-appropriate test stacks — [Jest](https://jestjs.io) for the backend, [Vitest](https://vitest.dev) for the frontend — rather than forcing one runner across both workspaces. Both suites are fast (backend: 74 tests in ~2.5s; frontend: 59 tests in ~14s, `--runInBand`/jsdom overhead included) and run fully offline: no real database, no real network call, no real Socket.IO connection. That's a deliberate choice — these are unit and integration tests of *this codebase's* logic, not of Postgres, Express, or React themselves.

Coverage focuses on the areas where a regression is expensive to discover late: authentication and authorization, the map lifecycle's invariants (a published map must be completable and immutable), gamification anti-cheat guards (forged scores, replayed tokens), and the UI components/hooks/pages that carry real conditional logic (not pure presentation).

## Stack

| | Backend | Frontend |
|---|---|---|
| Runner | [Jest 30](https://jestjs.io) + `ts-jest` | [Vitest 4](https://vitest.dev) |
| HTTP testing | [Supertest](https://github.com/ladjs/supertest) against an in-memory `express()` app | — |
| Component testing | — | [React Testing Library](https://testing-library.com/react) + `@testing-library/user-event` |
| DOM environment | `node` (no DOM needed) | `jsdom` |
| Location | `backend/src/__tests__/*.test.ts` | `frontend/src/__tests__/*.test.tsx` |
| Run | `npm test -w backend` (`jest --runInBand`) | `npm test -w frontend` (`vitest run`) |

## Backend: route- and middleware-level integration tests

Each test file mounts only the router under test on a bare `express()` instance — not the real `server.ts` — so a test failure points at one router, not at global middleware or Socket.IO wiring:

```ts
const app = express();
app.use(express.json());
app.use('/api/v1/admin', adminRouter);
```

### Prisma is mocked at the module boundary, not the network boundary

`jest.mock('../lib/prisma', () => ({ __esModule: true, default: mockPrisma }))` runs before the router is imported, so every `prisma.xxx.yyy()` call the route code makes resolves to a `jest.fn()` the test controls directly — no test database, no migrations to run, no cross-test state to reset beyond `jest.clearAllMocks()`:

```ts
const mockPrisma = { adminMap: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), create: jest.fn() } };
jest.mock('../lib/prisma', () => ({ __esModule: true, default: mockPrisma }));
import adminRouter from '../routes/admin.routes'; // imported AFTER the mock is registered
```

This keeps each test's intent explicit: `mockPrisma.adminMap.findUnique.mockResolvedValue(null)` *is* the test's "given" clause — there's no hidden fixture database state to go looking for.

### Auth is exercised with real JWTs, not stubbed middleware

Tests sign real tokens with `jsonwebtoken` against a fixed test secret (`process.env.JWT_SECRET = 'test_secret'` in `beforeAll`) and send them through `Authorization: Bearer`, so `authMiddleware`/`adminMiddleware` run for real on every request — a broken guard shows up as a failing test, not as a false-positive from a bypassed mock:

```ts
function adminToken(): string { return jwt.sign({ id: 'u1', email: 'admin@example.com', is_admin: true }, SECRET); }
function userToken():  string { return jwt.sign({ id: 'u2', email: 'user@example.com', is_admin: false }, SECRET); }
```

### What's covered

| Area | File | Notable cases |
|---|---|---|
| Auth | `auth.routes.test.ts` | register/login happy paths, duplicate email → 409, password/email/username validation, wrong password / unknown user → generic 401 |
| Auth middleware | `auth.middleware.test.ts` | missing header, missing `Bearer` prefix, wrong secret, **expired token** (`expiresIn: -1`) |
| Admin middleware | `admin.middleware.test.ts` | non-admin → 403, missing `req.user` → 403 |
| Admin tower editor | `admin.routes.test.ts` | admin-only access, create-vs-update by `order_index`, grid size/shape validation |
| Map lifecycle | `maps.routes.test.ts` | pagination, ownership (`/my` requires auth), grid validation (size + **BFS path existence**, see below), **editing resets `creator_completed`**, **editing a published map is rejected (400)**, publish requires `creator_completed`, publish requires ownership |
| Tower progression | `tower.complete.test.ts` | sequential unlocking, **skip-ahead rejected (403)**, replaying a completed level doesn't re-award progress/diamonds, **`run_token` signed with a stale JWT secret still verifies correctly** (import-time vs. test-time secret capture) |
| Grid validation | `grid.utils.test.ts` | structural validation (`validateGrid`) and BFS reachability (`hasPath`) as pure-function unit tests, independent of any route |

The map-lifecycle and tower tests specifically pin down invariants that are easy to silently break during a refactor — a published map becoming editable, or a level becoming skippable — which is exactly the kind of regression a manual smoke test tends to miss.

### Anti-cheat logic gets its own explicit tests

Because run timing and scoring double as leaderboard integrity (see `history_debug/2026-08-14_faille-scores-forgeable.md`), the tests don't just check the happy path — they assert the *rejection* paths that make forging a score or skipping a Tower level actually fail: a `run_token` with a backdated `started_at` still has to clear `MIN_TOWER_RUN_TIME_MS`/`MIN_SCORE_RUN_TIME_MS`, and jumping straight to `order_index: 5` from `tower_progress: 0` returns 403 even with a well-formed token.

## Frontend: component, hook, and page tests

### `vi.hoisted` — surviving Vitest's mock hoisting

Vitest hoists `vi.mock(...)` calls to the top of the file at transform time, which means a mock factory can't close over a `const` declared below it in source order. Every page-level test therefore declares its mock functions through `vi.hoisted()` first, so they exist before any `vi.mock` factory runs:

```ts
const mockNavigate = vi.hoisted(() => vi.fn());
const mapRef = vi.hoisted(() => ({ current: null as MapData | null }));

vi.mock('react-router-dom', async (importActual) => {
  const actual = await importActual<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock('@/hooks/useMap', () => ({ useMap: () => ({ map: mapRef.current, loading: false, error: null }) }));
```

Page tests mock exactly the seams a page actually depends on (router, auth context, the API service, data-fetching hooks, and — for game pages — `GameCanvas` itself, stubbed to a button that fires the real `onExit(ms)` callback) so the test exercises the page's own branching logic (e.g. "does the map creator get redirected to the editor, or a regular player to `/train`?") without dragging in Phaser, real HTTP, or real routing.

### Global test environment (`frontend/src/__tests__/setup.ts`)

```ts
vi.stubGlobal('ResizeObserver', ResizeObserverMock); // jsdom has no ResizeObserver
vi.mock('@/game/scenes/BaseScene', () => ({ TILE_SIZE: 32 })); // avoid pulling in Phaser for non-game tests
beforeAll(async () => { await i18n.changeLanguage('fr'); }); // deterministic locale for every test run
```

### What's covered

| Layer | File(s) | Notable cases |
|---|---|---|
| UI primitives | `Button.test.tsx`, `Input.test.tsx`, `Modal.test.tsx` | variants, disabled/loading states, accessible roles |
| Editor grid | `EditorGrid.test.tsx` | renders exactly `GRID_SIZE × GRID_SIZE` cells, click-to-paint, **drag-paint via `mouseenter` only when a mouse button is actually held** (`buttons: 1` vs `buttons: 0`), correct `(col, row)` reported from a flat DOM index |
| Auth pages | `LoginPage.test.tsx`, `LoginPage.toast.test.tsx` | loading vs. form vs. already-authenticated redirect, calls `login()` with form values, **toast is asserted against the real `<ToastProvider>`/`<ToastContainer>`, not a mocked `useToast`** — this specifically guards against the toast being mounted in the wrong place in the component tree (a real regression, see the file's own header comment) |
| Editor page | `EditorPage.test.tsx` | publish button enabled only once `creator_completed`, save disabled once published, **admin mode**: auto-activated for admin users, loads/saves Tower levels by `order_index`, falls back to a translated "Level N" label for levels not yet seeded |
| Game page | `GamePage.test.tsx` | score is always submitted on exit; **only the map's creator** triggers `markComplete` + redirect to the editor; a non-creator goes to `/train`; a failing `markComplete` (already completed) still redirects instead of blocking the player |
| Hooks | `useApi.test.tsx`, `useToast.test.tsx` | loading → data → error transitions, `refetch`, provider-boundary enforcement (`useToast` throws outside `<ToastProvider>`) |
| API client | `api.service.test.ts` | request unwrapping (`{ data }` → `T`), `Authorization` header attached from `localStorage`, 4xx → thrown `ApiError`, 204 No Content handled without throwing |

## Diagram — one backend test end to end

```text
it('returns 400 when creator has not completed the map', async () => {
   │
   ├─ mockPrisma.map.findUnique.mockResolvedValue({ creator_completed: false, ... })
   │      (the "given": the test controls Prisma's answer directly, no DB involved)
   │
   ├─ await request(app)                              ◄── Supertest drives a real
   │      .post('/api/v1/maps/map-1/publish')              HTTP request into the
   │      .set('Authorization', `Bearer ${token()}`)       in-memory Express app
   │
   │      Express app
   │        └─ authMiddleware   (real: verifies the real signed JWT)
   │             └─ maps.routes publish handler   (real route logic)
   │                  └─ prisma.map.findUnique(...)   (mocked: returns the given fixture)
   │                  └─ creator_completed === false → sendError(res, ..., 400)
   │
   └─ expect(res.status).toBe(400)                    ◄── only the route's own branching
                                                             logic is actually under test
```

## Running the suites

```bash
npm test -w backend            # jest --runInBand — all 7 suites, ~2.5s
npm test -w backend -- --watch # jest --watch, for TDD loops

npm test -w frontend           # vitest run — all 11 files, ~14s
npm run test -w frontend       # vitest in watch mode (default vitest behavior without `run`)
```

Both commands assume `@ft/shared` has already been built (`npm run build -w shared`) — the same prerequisite as `make dev`/`make docker-up`.

## Conventions

- One `describe()` block per route/endpoint or component, one `it()` per behavior — test names read as a spec of the behavior, not as "test 1", "test 2".
- Prisma/API/router mocks live at the top of the file, clearly separated under a `// ─── Mocks ───` (or `// ── vi.hoisted ──`) header, so the "given" state for every test is easy to find.
- Tests assert the *rejection* path, not just the happy path, for anything that's a security or fairness invariant (ownership checks, publish preconditions, run-token timing) — a passing suite is meant to be evidence the guard actually works, not just that the endpoint returns *something*.
- No test reaches a real database, a real filesystem, or a real network socket — external effects (Prisma, `fetch`, Socket.IO, Phaser) are mocked at the narrowest boundary that keeps the code under test genuinely exercised.
