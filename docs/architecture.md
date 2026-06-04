# Architecture Reference

This document is the canonical architecture reference for the repository. It describes the current project layout and runtime boundaries without replacing the startup guide.

For installation and launch commands, use [../README_install_and_start.md](../README_install_and_start.md).

## Runtime Overview

```text
Browser
  -> Frontend: React + Vite + Phaser
  -> Backend API: Express + Socket.IO
  -> Database: PostgreSQL through Prisma
```

Local development and Docker evaluation use the same application architecture:

| Mode | Frontend | Backend | PostgreSQL |
|---|---|---|---|
| Local development | local Vite dev server | local Node/nodemon server | Docker Compose service |
| Docker demo/evaluation | Docker Compose service | Docker Compose service | Docker Compose service |

## Root Layout

```text
.
├── backend/                    Express API, Socket.IO, Prisma
├── frontend/                   React, Vite, Phaser game client
├── shared/                     Shared TypeScript types/contracts
├── docs/                       Canonical docs, team docs, subject PDFs
├── backend_doc/                Backend implementation notes
├── frontend_doc/               Frontend implementation notes
├── background_doc/             Background technical notes
├── history_debug/              Historical debugging notes
├── PedagoGamePlay/             Pedagogical gameplay notes
├── probleme_rencontre/         Historical problem/correction notes
├── docker-compose.yml          Local Docker stack
├── Makefile                    Developer command entry point
├── README.md                   Project overview
└── README_install_and_start.md Startup and troubleshooting guide
```

## Backend

```text
backend/
├── src/
│   ├── __tests__/              Backend tests
│   ├── controllers/            Reserved for request handlers
│   ├── lib/                    Backend helpers, including Prisma client setup
│   ├── middleware/             Active Express middleware
│   ├── middlewares/            Empty legacy placeholder folder
│   ├── prisma/                 Prisma client integration
│   ├── routes/                 API route definitions
│   ├── schemas/                Request validation schemas
│   ├── services/               Empty service placeholder folder
│   ├── socket/                 Active Socket.IO handlers
│   ├── sockets/                Empty legacy placeholder folder
│   ├── utils/                  Backend utility functions
│   └── server.ts               Express and Socket.IO entry point
├── prisma/
│   ├── migrations/             PostgreSQL migrations
│   ├── schema.prisma           Prisma schema
│   └── seed.ts                 Database seed
├── Dockerfile
├── package.json
└── tsconfig.json
```

Responsibilities:

- expose REST API routes under `/api/v1`
- expose backend health at `/api/health`
- handle authentication and protected resources
- run Socket.IO multiplayer events
- read/write PostgreSQL through Prisma

## Frontend

```text
frontend/
├── public/assets/              Runtime game assets served by Vite
├── src/
│   ├── __tests__/              Frontend tests
│   ├── components/             UI, layout, editor, game components
│   ├── context/                React contexts
│   ├── game/                   Phaser scenes, entities, asset constants
│   ├── hooks/                  Frontend hooks
│   ├── pages/                  Route-level pages
│   ├── services/               API client
│   ├── types/                  Frontend-local types
│   ├── App.tsx                 Route configuration
│   └── main.tsx                React entry point
├── Dockerfile
├── package.json
├── tailwind.config.ts
└── vite.config.ts
```

Responsibilities:

- render the browser application
- proxy API and Socket.IO traffic to the backend in development
- run Phaser game scenes
- call the backend through the frontend API service

## Shared Package

```text
shared/
├── src/index.ts                Shared TypeScript contracts
├── package.json
└── tsconfig.json
```

The shared package is built before backend/frontend commands because both workspaces depend on `@ft/shared`.

## Docker Boundary

Docker Compose defines three services:

| Service | Purpose | Port |
|---|---|---|
| `postgres` | PostgreSQL database | `5432` |
| `backend` | Express + Socket.IO backend | `3001` |
| `frontend` | Vite frontend server | `5173` |

Docker mode is intended for demo/evaluation. Local development uses Docker only for PostgreSQL, while backend and frontend run locally with reload.

## Documentation Boundary

Canonical docs:

- [../README.md](../README.md) - project overview
- [../README_install_and_start.md](../README_install_and_start.md) - install/start/troubleshooting
- [architecture.md](architecture.md) - architecture reference
- [README.md](README.md) - documentation map

Historical notes and implementation journals are kept for team context, but they are not startup or architecture sources of truth.
