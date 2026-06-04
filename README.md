# ft_transcendence - Guilds of the Deep

This project was created as part of the 42 curriculum by malafont, jdebrull, jpaulis, and evan-dro.

Guilds of the Deep is a browser game for young players, built around exploration, labyrinth creation, progression, multiplayer races, and community-created maps.

## Canonical Documentation

Use these documents as the source of truth:

| Document | Purpose |
|---|---|
| [README.md](README.md) | Project overview, stack, team, module scope |
| [README_install_and_start.md](README_install_and_start.md) | Installation, local development, Docker demo/evaluation, troubleshooting |
| [docs/architecture.md](docs/architecture.md) | Architecture reference and folder overview |
| [docs/README.md](docs/README.md) | Documentation map, including historical/team notes |

Older notes still exist in the repository for team memory, but they should not override the canonical documents above.

## Quick Start

For the complete install/start procedure, use [README_install_and_start.md](README_install_and_start.md).

```bash
cp .env.example .env
make install
make dev
```

For Docker demo/evaluation mode:

```bash
make docker-up
```

Main URLs:

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend health | http://localhost:3001/api/health |

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS |
| Game engine | Phaser |
| Realtime | Socket.IO |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL via Prisma |
| Auth | JWT |
| Tests | Vitest (frontend) + Jest (backend) |

## Team

| Role | Member | Login | Responsibilities |
|---|---|---|---|
| PO + Gameplay | Martin | malafont | Phaser game scenes, game logic, map editor |
| PM + Backend | Jerem | jdebrull | Express API, auth, Socket.IO, Prisma |
| Tech Lead + Frontend | Jennifer | jpaulis | Architecture, hooks, shared types, Vite |
| UI Lead | Elise | evan-dro | Components, Tailwind design system |

## 42 Module Scope

- Major - Use a framework as backend: Express + Node.js
- Major - Standard user management, authentication, users across tournaments
- Major - Implementing a remote player: Socket.IO multiplayer
- Minor - Use a front-end framework or toolkit: React
- Minor - Use a database for the backend: PostgreSQL + Prisma
- Minor - Game customisation options: maps and difficulty
- Minor - Expanding browser compatibility: Vite build, modern browser target
