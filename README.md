# ft_transcendence — Guilds of the Deep

*This project has been created as part of the 42 curriculum by malafont, jdebrull, jpaulis, evan-dro.*

## Description

The game targets players under 15 years old.

Core pillars:

- exploration
- labyrinth creation
- progression
- multiplayer races
- community-created maps

The player is an adventurer rescued by a resistance made of former miners and builders. They train the player inside labyrinths before attempting to climb the tower controlled by the witch Meduza.
Players join guilds, climb leaderboards, and compete in ranked matches — all playable in the browser with no installation required.

## Quick Start (Docker — recommandé)

```bash
# 1. Copier et remplir les variables d'environnement
cp .env.example .env

# 2. Lancer tous les services (PostgreSQL + backend + frontend)
make docker-up
```

Frontend → http://localhost:5173  
Backend  → http://localhost:3001/api/health

Le fichier `.env.example` à la racine est prévu pour Docker Compose. Il contient aussi les variables PostgreSQL utilisées par le service `postgres`.

### Mode local sans Docker (PostgreSQL requis)

```bash
npm install
cp backend/.env.example backend/.env
npm run build --workspace=shared
npm run db:migrate --workspace=backend
npm run dev
```

Le fichier `backend/.env.example` est prévu pour le backend lancé localement avec `make dev` ou `npm run dev --workspace=backend`; sa `DATABASE_URL` pointe vers `localhost`.

Avant `make dev`, arrêter les conteneurs Docker frontend/backend s'ils tournent déjà:

```bash
make docker-down
make dev
```

Sinon les ports `5173` et `3001` seront déjà occupés.

### Makefile shortcuts (from repo root)

```bash
make start         # install + build shared + dev (recommended entry point)
make dev           # backend + frontend in parallel
make test          # all tests (backend then frontend)
make db-migrate    # apply pending Prisma migrations
make db-seed       # insert test users + AdminMap
make db-studio     # open Prisma Studio in browser
make docker-up     # build + start all services via Docker (PostgreSQL mode)
make docker-down   # stop Docker containers before local dev
make help          # list all available commands
```

### Docker mode (PostgreSQL)

Create a `.env` at the **repo root** from `.env.example` (see `README_install_and_start.md` for details), then:

```bash
make docker-up
```

| Service    | URL              |
|------------|-----------------|
| Frontend   | http://localhost:5173 |
| Backend    | http://localhost:3001 |
| PostgreSQL | localhost:5432   |

> See [README_install_and_start.md](README_install_and_start.md) for the full reference (env vars, workspace commands, common issues).

## Team

| Role | Member | Login | Responsibilities |
|---|---|---|---|
| PO + Gameplay | Martin | malafont | Phaser game scenes, game logic, map editor |
| PM + Backend | Jerem | jdebrull | Express API, auth, Socket.IO, Prisma |
| Tech Lead + Frontend | Jennifer | jpaulis | Architecture, hooks, shared types, Vite |
| UI Lead | Élise | evan-dro | Components, Tailwind design system |

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite 8, Tailwind CSS |
| Game engine | Phaser 3.80 |
| Realtime | Socket.IO 4.7 |
| Backend | Node.js + Express 4 + TypeScript |
| Database | PostgreSQL 16 via Prisma 5 (Docker Compose) |
| Auth | JWT (ft_token in localStorage, Bearer header) |
| Tests | Vitest (frontend) + Jest 30 (backend) |

## Project Status

| Step | Feature | Status |
|------|---------|--------|
| 1–4 | Auth, user management, map editor, tower mode | Done |
| 5 | Socket.IO multiplayer race | To do |
| — | Admin editor + full tower mode | To do |

## Modules

- **Major** — Use a Framework as backend (Express + Node.js)
- **Major** — Standard user management, authentication, users across tournaments
- **Major** — Implementing a remote player (Socket.IO multiplayer)
- **Minor** — Use a front-end framework or toolkit (React)
- **Minor** — Use a database for the backend (PostgreSQL + Prisma)
- **Minor** — Game customisation options (maps, difficulty)
- **Minor** — Expanding Browser Compatibility (Vite build, modern ES target)
