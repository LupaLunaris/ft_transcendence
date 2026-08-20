# Module: Standard User Management

For the Major Module: users can securely subscribe to the website, securely log in, update their information, upload an avatar, and have friends whose online status is visible. A user profile displays relevant stats, and every registered user has a match history.

**Points:** 2 · **Owners:** Jennifer (frontend), Jerem (backend)

## Overview

Every account is created through a password-based signup (`bcrypt` hashing, unique email/username), authenticated with a JWT sent in `Authorization: Bearer`, and can update its username, avatar, friend list, and view its own progression (XP, level, achievements, Tower progress) from `/profile`. Friends see each other's live presence — `online`, `in_game`, or `offline` — because the same Socket.IO connection that carries Duel gameplay ([Real-Time Features](../realtime-features/README.md)) also marks a user present the moment they connect and absent the moment they disconnect.

## Stack

| Concern | Technology |
|---|---|
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` password hashing, `backend/src/routes/auth.routes.ts` |
| Validation | [Zod](https://zod.dev) schemas (`backend/src/schemas/`) via `validate.middleware.ts` |
| Avatars | `multer`-based upload middleware (`upload.middleware.ts`), served statically from `/uploads` |
| Data | PostgreSQL via Prisma — `User`, `Friendship`, `Score`, `UserAchievement` models |
| Presence | In-memory map (`backend/src/state/online.state.ts`), fed by Socket.IO connect/disconnect |

## How it works

### Signup / login

`POST /api/v1/auth/register` rejects a duplicate email or username before hashing the password with `bcrypt.hash(password, 12)`, and `POST /api/v1/auth/login` accepts either identifier and returns a single generic "Invalid credentials" error on any mismatch — deliberately not distinguishing "unknown user" from "wrong password" to avoid account enumeration:

```ts
const user = await prisma.user.findFirst({ where: { OR: [{ email: identifier }, { username: identifier }] } });
if (!user || !(await bcrypt.compare(password, user.password_hash))) {
  sendError(res, 'Invalid credentials', 401);
  return;
}
```

Both routes return `{ user, token }`; the frontend stores the token under `ft_token` in `localStorage` and attaches it as `Authorization: Bearer <token>` on every subsequent request (`AuthProvider` / `context/auth.context.tsx`).

### Protected routes and admin accounts

`authMiddleware` (`backend/src/middleware/auth.middleware.ts`) verifies the JWT and attaches `req.user = { id, email, is_admin }` to the request; any route that needs a logged-in user simply adds it to its handler chain. `is_admin` is stamped once, at account creation, for a fixed list of team emails (`ADMIN_EMAILS` env var) — not toggleable after the fact through the API.

### Avatars

`POST /api/v1/users/avatar` runs the upload through `avatarUpload` (multer, size/type validated) then `validateAndSaveAvatar`, updates `User.avatar` to the new `/uploads/avatars/<file>` path, and — only after the DB write succeeds — deletes the previous avatar file from disk if it was a local upload:

```ts
if (previousUser?.avatar && previousUser.avatar !== avatarUrl && previousUser.avatar.startsWith('/uploads/avatars/')) {
  fs.unlink(oldFilePath, (err) => { if (err && err.code !== 'ENOENT') console.error(...); });
}
```

### Friends and presence

`Friendship` is a single row with `requester_id`/`addressee_id`, so `GET /api/v1/friends` has to resolve "the other user" from whichever side the caller is on:

```ts
const friends = friendships.map((f) => {
  const friend = f.requester_id === myId ? f.addressee : f.requester;
  return { id: friend.id, username: friend.username, avatar: friend.avatar, online_status: getStatus(friend.id), ... };
});
```

`getStatus()` reads `backend/src/state/online.state.ts`, a plain in-memory `Map<user_id, PresenceStatus>` updated exclusively from the Duel Socket.IO handlers:

```ts
export type PresenceStatus = 'online' | 'in_game';
export function setOnline(user_id: string): void  { onlineUsers.set(user_id, 'online'); }
export function setInGame(user_id: string): void  { onlineUsers.set(user_id, 'in_game'); }
export function setOffline(user_id: string): void { onlineUsers.delete(user_id); }
export function getStatus(user_id: string): 'online' | 'offline' | 'in_game' {
  return onlineUsers.get(user_id) ?? 'offline';
}
```

A user has no separate "presence heartbeat" mechanism to build or maintain: connecting to the app's socket *is* going online, joining a race *is* going in-game, and disconnecting *is* going offline — the state machine falls directly out of the Socket.IO connection lifecycle already required for [Real-Time Features](../realtime-features/README.md).

### Profile stats and match history

`GET /api/v1/users/:user_id` returns a `UserProfile`: XP, computed level, unlocked achievements, diamonds, Tower progress, number of maps created, friend count, and live `online_status`. Match history is the `Score` table — one row per `(user_id, map_id)` holding a personal best — surfaced on the profile and on each map's leaderboard (see `backend_doc/scoring-points-and-leaderboards.md`).

## Diagram

```text
                     connect (JWT)                 disconnect
                    ───────────────►               ───────────────►
        offline ─────────────────────► online ─────────────────────► offline
                                          │
                                          │ join_race (matched into a Duel)
                                          ▼
                                       in_game
                                          │
                                          │ race_finished → setOnline()
                                          ▼
                                        online
```

## Why this satisfies the module

- Registration and login are password-based with hashed storage (`bcrypt`, cost 12) and JWT session tokens — no plaintext password ever stored or logged.
- Users can update their username and avatar after signup (`PUT /auth/profile`, `POST /users/avatar`).
- Friends are a real relational feature (add/remove/list) with **live** online status, not a static flag — it is driven directly by the same socket connection used for gameplay.
- Every profile exposes stats (XP, level, achievements, diamonds, Tower progress) and a persistent match history (`Score` per map), not just account metadata.
