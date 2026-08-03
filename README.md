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
| Shared contracts | `shared/` workspace with shared TypeScript types |
| Internationalization | i18next (`fr`, `en`, `nl`) |
| Tooling | npm workspaces, Makefile, Docker Compose |
| Tests | Vitest (frontend) + Jest (backend) |

## Project Description

This section will be completed by Martin.

## Installation

The full install and startup guide is in [README_install_and_start.md](README_install_and_start.md).

This section will be completed by Jerem.

## Team Presentation

| Role | Member | Login | Responsibilities |
|---|---|---|---|
| Product Owner + Gameplay Lead | Martin | malafont | Gameplay rules, Phaser scenes, map gameplay, tower and duel game flow |
| Project Manager + Backend Lead | Jerem | jdebrull | Express API, Prisma, PostgreSQL, auth, Docker, Socket.IO server |
| Technical Lead + Frontend Architecture | Jennifer | jpaulis | Frontend structure, hooks, shared types, API contracts, integration |
| UI Lead | Elise | evan-dro | UI components, layout, forms, Tailwind, i18n integration |

## Role Distribution

The team is split into four main areas:

- Martin leads gameplay and the game rules.
- Jerem leads backend, infrastructure, and project management.
- Jennifer leads frontend architecture and integration between all parts.
- Elise leads the UI system and the user-facing experience.

## Responsibilities of Each Role

### Martin - Gameplay

- Owns the Phaser game logic.
- Defines movement, collisions, win and loss conditions.
- Works on training mode, tower gameplay, and duel gameplay behavior.

### Jerem - Backend and infrastructure

- Owns the Express server and Prisma schema.
- Handles authentication, protected routes, and database relations.
- Maintains Docker setup and backend stability.

### Jennifer - Frontend architecture and integration

- Owns the React app structure and route organization.
- Maintains the API service, hooks, auth context, and shared types.
- Keeps frontend, backend, and Phaser integration coherent.

### Elise - UI and UX

- Owns reusable UI components and layouts.
- Handles forms, visual consistency, and responsive behavior.
- Works on notifications, profile UI, and language switching.

## Project Organization

This section will be completed by Jerem.

## Management Tools

This section will be completed by Jerem.

## Communication Methods

This section will be completed by Jerem and Elise.

## Technical Stack

| Area | What we use |
|---|---|
| Monorepo | npm workspaces with `frontend`, `backend`, and `shared` |
| Frontend app | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Game rendering | Phaser |
| Backend API | Node.js, Express, TypeScript |
| Realtime | Socket.IO |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT + bcrypt |
| Validation | Zod |
| Internationalization | i18next with French, English, and Dutch files |
| Tests | Vitest, Testing Library, Jest, Supertest |
| Local orchestration | Makefile and Docker Compose |

## Why We Chose This Stack

- React and Vite gave us a simple frontend setup that is fast to run locally.
- TypeScript helped us keep the API contracts and shared game data clearer.
- Express was a good fit for a 42 project because it stays simple and easy to debug.
- Prisma made the PostgreSQL schema and migrations easier to read as a team.
- Socket.IO was the easiest way for us to build the duel mode with live events.
- Phaser let us keep the game logic in the browser without building a game engine ourselves.
- Tailwind was practical for making reusable UI components quickly.

## Database Schema

This section will be completed by Jerem.

## Main Features

This section will be completed by Martin.

## Features By Member

| Member | Main features worked on |
|---|---|
| Martin | Gameplay core, tower, game scenes, multiplayer flow, editor core, avatar sprite work |
| Jerem | Backend API, auth, maps, users, friends, Docker, security, WAF and Vault |
| Jennifer | Frontend architecture, user management frontend, game customization flow, gamification, docs and integration |
| Elise | UI components, i18n, legal pages, profile UI, notifications, map panel and UI fixes |

## 42 Module Scope

These are the modules currently documented in this README from what is already implemented in the repository.

| Module | Level | Points | Current implementation in the project |
|---|---|---:|---|
| Use a framework as backend | Major | 2 | Express API with typed routes, middleware, auth, and Socket.IO server |
| Standard user management and authentication | Major | 2 | Register, login, JWT auth, `/me`, profile update, avatar upload |
| Implementing a remote player | Major | 2 | Duel mode with Socket.IO lobby and live multiplayer game state |
| Use a front-end framework or toolkit | Minor | 1 | React application with route-based pages and shared UI |
| Use a database for the backend | Minor | 1 | PostgreSQL with Prisma models, migrations, and seed data |
| Game customisation options | Minor | 1 | Map editor, difficulty selection, creator test before publication |
| Expanding browser compatibility | Minor | 1 | Browser-based client built with Vite and standard web stack |

## Module Points Calculation

Current total documented in this README: `10 points`

- Major modules: `3 x 2 = 6`
- Minor modules: `4 x 1 = 4`

Some other systems already exist in the repository, like i18n, gamification, notifications, and friends. We prefer to keep them out of the counted total here until the team validates what will really be claimed during evaluation.

## Why These Modules

This section will be completed by Martin.

## Module Implementation Notes

### Backend framework

The backend is an Express server with REST routes under `/api/v1`, middleware for auth and validation, and a Socket.IO server for realtime features.
Most backend ownership sits with Jerem. Jennifer only supports the integration side.

### Authentication

Users can register, log in, fetch their own profile, update profile data, and upload an avatar. Passwords are hashed and access is protected with JWT.
The backend auth flow is mainly Jerem. The frontend auth flow and validation are shared with Jennifer and Elise.

### Remote player

The duel mode uses Socket.IO for lobby registration, match start, and synchronized gameplay updates during the game.
Martin is the main owner here. Jerem supports the backend side and Jennifer supports the frontend integration.

### Frontend framework

The frontend is a React app with protected routes, reusable hooks, a shared API service, and integration with Phaser for the game views.
This is mainly Jennifer's area, with UI work and translations coming from Elise.

### Database

The project uses PostgreSQL with Prisma. The schema includes users, maps, scores, admin tower levels, achievements, XP events, and friendships.
The audit shows this is shared between Jerem, Jennifer, and Martin, not owned by one person only.

### Game customisation

Players can create maps, edit grids, choose a difficulty, test their own map, and publish it only after completing it.
The base gameplay comes from Martin, while Jennifer finalizes the customization flow and Elise helps with the UI around it.

### Browser client

The whole project runs in the browser with React and Phaser, which keeps the game accessible without a native client.
Jennifer owns the integration side of the browser client.

## Modules By Member

| Module | Main owner | Support |
|---|---|---|
| Backend framework | Jerem | Jennifer, Martin |
| Authentication | Jerem | Jennifer, Elise |
| Remote player | Martin | Jerem, Jennifer, Elise |
| Frontend framework | Jennifer | Elise, Martin |
| Database | Jerem, Jennifer, Martin | - |
| Game customisation | Martin, Jennifer | Elise, Jerem |
| Browser client | Jennifer | Martin, Elise |

## Resources Used

- [docs/ft_transcendence.subject.pdf](docs/ft_transcendence.subject.pdf) for the official project requirements.
- [docs/42 EvalHub.pdf](docs/42%20EvalHub.pdf) for evaluation references.
- The local architecture and setup docs in this repository.
- Official documentation for React, Vite, Express, Prisma, Socket.IO, Phaser, Tailwind CSS, and i18next.

## AI Usage

AI was used as a support tool, not as a replacement for understanding the project.

- We used AI help for debugging support, documentation cleanup, wording help, and technical summaries.
- The repository also contains AI support context files like `CLAUDE.md` and `CONTEXT.md` for project context during assisted work sessions.
- Final code choices, integration, and testing still had to be checked by the team.

## Detailed Individual Contributions

This section will be completed by the whole team.

## Difficulties We Met and How We Solved Them

- We had to keep the project coherent between React pages, Phaser scenes, backend routes, and shared types. The `shared/` workspace helped us avoid repeating game and API contracts in several places.
- The map publication flow was tricky. We now require the creator to finish their own map before publishing it, which made the editor flow more consistent.
- Multiplayer synchronization was another hard part. The duel mode now uses Socket.IO and shared game state so the live match does not depend only on local rendering.
- Startup and environment alignment also took time because the project mixes local development and Docker mode. The current setup separates those two modes more clearly.

## Known Limitations

- The current multiplayer work is focused on duel mode, not on a larger shared world.
- Tower mode is currently based on 8 admin levels.
- Language support exists for French, English, and Dutch only.
- The security layer is fine for a student project.
