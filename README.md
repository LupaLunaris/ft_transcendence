# ft_transcendence — Guilds of the Deep

*This project has been created as part of the 42 curriculum by [martin_login], [jerem_login], [jennifer_login], [elise_login].*

## Description

A real-time multiplayer Pong game with a deep-sea fantasy theme, built for the 42 School ft_transcendence project.
Players join guilds, climb leaderboards, and compete in ranked matches — all playable in the browser with no installation required.

## Quick Start

```bash
# 1. Copy environment variables and fill in your values
cp .env.example .env

# 2. Build and start all services (postgres + backend + frontend)
docker-compose up --build

# Frontend → http://localhost:5173
# Backend  → http://localhost:3001
# API health →;ake
```

### Local development (without Docker)

```bash
# Install all workspace dependencies from the root
npm install

# Run backend + frontend in parallel
npm run dev
```

> The backend requires a running PostgreSQL instance. Set `DATABASE_URL` in your `.env` accordingly.

## Team

| Role | Member | Login | Responsibilities |
|---|---|---|---|
| PO + Gameplay | Martin | [martin_login] | Phaser game scenes, game logic |
| PM + Backend/Security | Jerem | [jerem_login] | Express API, auth, Socket.IO, Prisma |
| Tech Lead + Frontend | Jennifer | [jennifer_login] | Architecture, hooks, shared types, Vite |
| UI Lead | Élise | [elise_login] | Components, Tailwind design system |

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite 5, Tailwind CSS 3 |
| Game engine | Phaser 3 |
| Realtime | Socket.IO 4 |
| Backend | Node.js + Express 4 + TypeScript |
| Database | PostgreSQL 16 via Prisma 5 |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Infrastructure | Docker + docker-compose |

## Modules

- **Major** — Use a Framework as backend (Express + Node.js)
- **Major** — Standard user management, authentication, users across tournaments
- **Major** — Implementing a remote player (Socket.IO multiplayer)
- **Minor** — Use a front-end framework or toolkit (React)
- **Minor** — Use a database for the backend (PostgreSQL + Prisma)
- **Minor** — Game customisation options (power-ups, maps, difficulty)
- **Minor** — Expanding Browser Compatibility (Vite build, modern ES target)
