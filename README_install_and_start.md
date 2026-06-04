# Install and Start Guide - Guilds of the Deep

This project has two startup modes:

| Mode | Command | What runs |
|------|---------|-----------|
| Local development | `make dev` | PostgreSQL in Docker, backend locally, frontend locally |
| Docker demo/evaluation | `make docker-up` | PostgreSQL, backend, and frontend all in Docker |

Do not run both modes at the same time. They use the same ports.

---

## First Setup

From the project root:

```bash
cp .env.example .env
make install
```

`make install` installs all npm workspace dependencies.

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
