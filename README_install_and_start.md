# Install and Start Guide - Guilds of the Deep

This project has two startup modes:

| Mode | Command | What runs |
|------|---------|-----------|
| Local development | `make dev` | PostgreSQL in Docker, backend locally, frontend locally |
| Docker demo/evaluation | `make docker-up` | PostgreSQL, backend, and frontend all in Docker |

Do not run both modes at the same time. They use the same ports.

For project overview and architecture:

| Document | Purpose |
|---|---|
| [README.md](README.md) | Project overview |
| [docs/architecture.md](docs/architecture.md) | Architecture reference |
| [docs/README.md](docs/README.md) | Documentation map |

---

## First Setup

From the project root:

```bash
cp .env.example .env
make install
```

`make install` installs all npm workspace dependencies.

> **Provisional note:** `.env.example` is a temporary placeholder committed only
> so a fresh clone can run `make install`/`make dev` without extra steps. On
> defense day, the real `.env` will already exist on the school computer with
> its own values — just edit it in place, do not overwrite it with `.env.example`.

For local backend development, `make dev` will also create `backend/.env` from `backend/.env.example` if it is missing. The backend env file points to PostgreSQL on `localhost`, because the backend runs locally in development mode.

---

## Local Development

Use this while coding:

```bash
make dev
```

This starts the full local development environment:

| Service | How it runs | URL |
|---------|-------------|-----|
| PostgreSQL | Docker | localhost:5432 |
| Backend | local reload | http://localhost:3001 |
| Frontend | local reload | http://localhost:5173 |

Before starting the servers, `make dev` also:

1. Checks that `.env` exists.
2. Creates `backend/.env` if missing.
3. Refuses to run if Docker backend/frontend are already running.
4. Refuses to run if ports `3001` or `5173` are already busy.
5. Starts PostgreSQL in Docker.
6. Waits until PostgreSQL is ready.
7. Builds the shared package.
8. Generates the Prisma client.

Stop local backend/frontend with `Ctrl-C`.

To stop PostgreSQL too:

```bash
make docker-down
```

---

## Docker Demo/Evaluation Mode

Use this for a demo or 42 evaluation:

```bash
make docker-up
```

This starts the complete stack in Docker:

| Service | How it runs | URL |
|---------|-------------|-----|
| PostgreSQL | Docker | localhost:5432 |
| Backend | Docker | http://localhost:3001 |
| Frontend | Docker | http://localhost:5173 |

Stop Docker mode:

```bash
make docker-down
```

Delete containers and Docker database data:

```bash
make docker-down-v
```

Use `make docker-down-v` only when you really want to reset the Docker database volume.

---

## Main Commands

Run:

```bash
make help
```

The daily commands are:

```bash
make install      # install all workspace dependencies
make dev          # local dev: Docker PostgreSQL + local backend/frontend
make docker-up    # demo/evaluation: complete stack in Docker
make docker-down  # stop Docker services
make start        # print startup guidance only
```

`make start` does not start anything. It exists only to point you to the explicit command:

```bash
make dev          # local development
make docker-up    # Docker demo/evaluation
```

---

## Useful Secondary Commands

```bash
make dev-backend       # backend only; PostgreSQL must already be running
make dev-frontend      # frontend only; backend must already be running for API calls
make build             # build shared, backend, frontend
make test              # run backend and frontend tests
make db-generate       # regenerate Prisma client
make db-migrate        # run Prisma migrations
make db-seed           # seed database
make db-studio         # open Prisma Studio
make docker-logs       # follow Docker logs
make docker-restart    # restart full Docker stack
make clean             # remove build artifacts
make fclean            # clean + remove node_modules
```

---

## Common Mistakes

### Running `make dev` and `make docker-up` together

Do not do this. Both modes use:

```text
backend  -> port 3001
frontend -> port 5173
postgres -> port 5432
```

Switch modes cleanly:

```bash
make docker-down
make dev
```

or:

```bash
make docker-down
make docker-up
```

### `EADDRINUSE :3001`

The backend port is already used. Another backend process or Docker backend is probably running.

Fix:

```bash
make docker-down
lsof -i :3001
```

Stop the process using the port, then rerun the command you wanted.

### `EADDRINUSE :5173`

The frontend port is already used. Another Vite/frontend process or Docker frontend is probably running.

Fix:

```bash
make docker-down
lsof -i :5173
```

Stop the process using the port, then rerun the command you wanted.

### `Can't reach database server at localhost:5432`

PostgreSQL is not running, or the backend is using the wrong database URL.

For normal local development, run:

```bash
make dev
```

Check that `backend/.env` uses `localhost`, not `postgres`:

```dotenv
DATABASE_URL=postgresql://ft_user:change_me_in_prod@localhost:5432/ft_transcendence
```

### `P1000: Authentication failed for the database server` (`ft_user`)

This means your local `postgres_data` Docker volume was created with a different
password than the one currently in your `.env` files. This volume is **local to
each collaborator** (per `CLAUDE.md`) — it never resets automatically when `.env`
changes.

Run these commands from the project root, in order:

**Step 1 — sync `backend/.env` with your root `.env` password:**

```bash
sed -i "s#^DATABASE_URL=.*#DATABASE_URL=postgresql://ft_user:$(grep '^POSTGRES_PASSWORD=' .env | cut -d= -f2)@localhost:5432/ft_transcendence#" backend/.env
make dev
```

This fixes it for most people — `ft_user` is literally the Postgres superuser
(`POSTGRES_USER=ft_user` in the root `.env`), so its real password is normally
whatever `POSTGRES_PASSWORD` in your root `.env` already is.

**Step 2 — if `make dev` still fails with `P1000`, and you have no local data to keep**
(fresh machine, or you never had `make dev`/`make docker-up` fully working before):

```bash
make docker-down-v
make dev
```

`docker-down-v` deletes containers **and** the local `postgres_data` volume, so
Postgres re-initializes cleanly with your current `.env`. This only destroys your
own local dev database — nothing shared, nothing another collaborator depends on.

**Step 3 — if `make dev` still fails with `P1000`, and you want to keep your local data**
(you have real accounts/maps saved locally you don't want to lose):

Your live Postgres password is neither the root `.env` value nor the `backend/.env`
value — you'll need to reconnect with whichever password last worked, then reset it
to match your current `.env`:

```bash
docker compose up -d postgres
docker exec -it ft_transcendence-postgres-1 psql -U ft_user -d ft_transcendence
```

`psql` will prompt for the password interactively — try the last password you
remember using. Once connected, run:

```sql
ALTER USER ft_user WITH PASSWORD 'paste_your_current_.env_POSTGRES_PASSWORD_here';
\q
```

Then rerun step 1's `sed` command and `make dev`.

If you don't remember any working password, fall back to Step 2 (you will lose
your local test data, but nothing outside your machine).

### Temporary `ECONNREFUSED 127.0.0.1:3001` from Vite

This can happen once if the frontend starts before the backend is ready.

Wait until the backend prints that it is listening on `http://localhost:3001`, then refresh the browser once.

### Docker says `.env not found`

Create the root env file:

```bash
cp .env.example .env
```

Then rerun:

```bash
make docker-up
```

---

## Quick Team Summary

```text
make install     first setup
make dev         local coding mode
make docker-up   Docker demo/evaluation mode
make docker-down stop Docker services
```
