*This project was carried out as part of the 42 curriculum by malafont, jdebrull, jpaulis and evan-dro.*

# ft_transcendence — Guilds of the Deep

**Guilds of the Deep** is a browser-based multiplayer game built around maze exploration and creation.

Players can create their own maps, test them and then publish them, play maps created by other members of the community, progress through a Tower of predefined levels, and compete in real-time multiplayer duels.

## Documentation

| Document                                                               | Content                        |
| ----------------------------------------------------------------------- | ------------------------------ |
| [README_install_and_start.md](README_install_and_start.md)             | Installation and startup       |
| [docs/architecture.md](docs/architecture.md)                            | Project architecture           |
| [docs/README.md](docs/README.md)                                        | Documentation index            |
| [docs/ft_transcendence.subject.pdf](docs/ft_transcendence.subject.pdf)  | Official 42 subject            |

---

# Description

**Guilds of the Deep** is a maze game where each player can create and play different maps.

A player builds a maze using the built-in editor, tests it, and then publishes it once they have completed it themselves — this constraint guarantees that a published map is always playable from start to finish. Other players can then find and play maps published by the community.

The game also offers a **Tower** mode, with levels predefined by the team, and real-time multiplayer matches (**Duel** mode, 2 to 4 players) where several players compete on the same map.

Around the game itself, the project adds user profiles, a friends system, progression (XP, levels, diamonds), achievements, leaderboards, game customization, and several other features required by the selected 42 modules.

### Main features

* Sign up and login
* User profiles and avatars
* Friends and online status
* Map editor
* Map testing and publishing
* Community maps
* Tower mode
* Multiplayer matches
* Remote players
* XP and levels
* Achievements and rewards
* Leaderboards
* Game customization
* Notifications
* English, French and Dutch
* Responsive interface

---

# Instructions

## Prerequisites

* Node.js and npm (for `make install` / local development)
* Docker and Docker Compose
* GNU Make

## Quick start

Local development mode (PostgreSQL in Docker, backend and frontend running locally, with hot reload):

```bash
cp .env.example .env
make install
make dev
```

Or, for a single-command setup (demo / evaluation):

```bash
cp .env.example .env
make install
make docker-up    # PostgreSQL, backend and frontend, all in Docker
```

Both modes use the same ports (`3001` backend, `5173` frontend, `5432` PostgreSQL) — never run them at the same time.

The complete installation guide, with all secondary `make` commands and troubleshooting, is available in [README_install_and_start.md](README_install_and_start.md).

---

# Team

| Member              | Role                              | Main area                                  |
| -------------------- | --------------------------------- | ------------------------------------------ |
| Martin (malafont)    | Product Owner / Lead Gameplay     | Gameplay, Phaser and multiplayer           |
| Jerem (jdebrull)     | Project Manager / Lead Backend    | Backend, database and infrastructure       |
| Jennifer (jpaulis)   | Tech Lead                         | Frontend architecture and integration      |
| Elise (evan-dro)     | Lead UI / UX                      | UI, responsive, i18n and frontend UX       |

### Martin — Product Owner / Lead Gameplay

Martin worked mainly on the game and its gameplay: Phaser, player movement, collisions, enemies, game rules, Tower mode, multiplayer gameplay (2-to-4-player duel, server-authoritative enemies) and the core of the map editor.

He also collaborated with Jennifer on game customization and gamification, and with Jerem on multiplayer systems and real-time synchronization.

As Product Owner, he was also responsible for the project's overall gameplay direction.

### Jerem — Project Manager / Lead Backend

Jerem worked mainly on the project's backend, database and infrastructure.

His work covers the Express backend architecture, authentication (JWT + bcrypt), the database schema and its evolution with Prisma, seed scripts, the server side of maps, friends, avatars and online status, as well as the real-time infrastructure (Socket.IO server side) for Duel mode.

He also set up the infrastructure security layer: a WAF (Nginx + ModSecurity with the OWASP CRS ruleset) in front of the application, and HashiCorp Vault as an internal PKI for managing TLS certificates and secrets (instead of storing them in plaintext in `.env`), with AppRole authentication from the backend to Vault.

As Project Manager, he was responsible for the technical follow-up of the project, organizing the team's work, and the stability of the deployment (single-command `make docker-up` mode, including on a freshly cloned repository).

### Jennifer — Tech Lead

Jennifer worked mainly on the frontend architecture and the integration between the different parts of the project.

She worked on the React architecture, integration with the backend API, frontend-side user management, TypeScript types shared between frontend and backend, game customization, gamification (XP, levels, achievements, leaderboards) and project documentation.

She also reviewed and integrated changes from other team members (Pull Request reviews).

### Elise — Lead UI / UX

Elise worked mainly on the user interface, user experience and internationalization of the project.

Her work covers the reusable design system (`components/ui/`), the responsive interface, internationalization with i18next (English, French, Dutch), interface-side notifications (toasts), the frontend parts of authentication, profile, friends and avatars, as well as the application's legal pages.

---

# Project management

## Project organization

Work was divided by area of expertise (gameplay, backend/infrastructure, frontend architecture, UI/UX) rather than by isolated feature, which allowed each member to remain responsible for end-to-end technical consistency within their own scope. Cross-cutting features (authentication, profiles, friends, avatars) were co-developed in backend/frontend pairs.

## Management tools

Work tracking relies on per-feature Git branches (`feature/...`, `fix/...`) and Pull Requests reviewed before merging into `dev`. Evolving technical documentation (architecture decisions, resolved bugs, deviations noted from the subject) is kept in dedicated Markdown files (`CONTEXT.md`, `backend_doc/`, `frontend_doc/`, `history_debug/`) to keep track of the choices made during development.

## Communication

The team ran on regular sync points to share progress and unblock issues, complemented by code reviews on Pull Requests, which also served as a point of technical discussion.

---

# Tech stack

| Area              | Technology                                  |
| ------------------- | -------------------------------------------- |
| Frontend            | React + TypeScript + Vite                   |
| Game                | Phaser                                      |
| Styling             | Tailwind CSS                                |
| Backend             | Node.js + Express + TypeScript              |
| Real-time           | Socket.IO                                   |
| Database            | PostgreSQL                                  |
| ORM                 | Prisma                                      |
| Authentication      | JWT + bcrypt                                |
| Validation          | Zod                                         |
| Languages           | i18next                                     |
| Tests               | Vitest, Jest, Testing Library, Supertest    |
| Security            | Nginx + ModSecurity (WAF), HashiCorp Vault  |
| Infrastructure      | Docker Compose + Makefile                   |

## Why this stack

React was chosen for the frontend because it is well suited to building pages and reusable components for an application of this size.

Phaser handles the game itself: scenes, movement, sprites, collisions and enemy logic.

Express handles the API and the server-side business logic. PostgreSQL stores the project's data, and Prisma simplifies working with the database from TypeScript while keeping a single shared, typed schema.

Socket.IO is used for the parts of the project that require real-time communication, mainly the multiplayer Duel mode.

Nginx and ModSecurity form a WAF placed in front of the application, and HashiCorp Vault acts as an internal PKI for managing TLS certificates and secrets, in line with the requirements of the subject's cybersecurity module.

---

# Database schema

The schema is defined with Prisma (`backend/prisma/schema.prisma`) and deployed to PostgreSQL via migrations.

| Model                | Role                                                                   | Main relations                                                                       |
| -------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `User`                | Account, profile, progression (xp, diamonds, Tower progress)             | 1–N `Map`, `Score`, `UserAchievement`, `XpEvent`, `MapRankingPoints`, `Friendship`         |
| `Map`                 | A map (maze) created by a user (grid, publication status, difficulty)    | belongs to a `User` (creator); 1–N `Score`, `MapRankingPoints`                            |
| `AdminMap`            | Predefined Tower mode levels, ordered by `order_index`                    | standalone (no foreign key)                                                              |
| `Score`               | A player's personal best time on a map (one row per pair)                | belongs to `User` and `Map`; unique on `(user_id, map_id)`                                |
| `MapRankingPoints`    | Speed ranking points per map (recalculated on every new record)          | belongs to `User` and `Map`; unique on `(map_id, user_id)`                                |
| `UserAchievement`     | Unlocked achievements                                                    | belongs to `User`; unique on `(user_id, code)`                                            |
| `XpEvent`             | XP gain log, deduplicated by `(action, key)`                             | belongs to `User`                                                                         |
| `Friendship`          | Friendship relation between two users                                    | two named relations on `User` (requester / addressee), unique on `(requester_id, addressee_id)` |

All foreign keys cascade on delete (`onDelete: Cascade`), except `Score.user`: deleting a user or a map automatically cleans up dependent rows.

---

# Features and owners

| Feature                                          | Contributor(s)                     |
| ----------------------------------------------- | ---------------------------------- |
| Core gameplay                                    | Martin                             |
| Phaser scenes and logic                          | Martin                             |
| Tower mode                                       | Martin                             |
| Multiplayer gameplay                             | Martin                             |
| Remote players                                   | Martin                             |
| 3+ player multiplayer                            | Martin                             |
| Core of the map editor                           | Martin                             |
| Map customization workflow                       | Jennifer, Martin                   |
| Maps backend                                     | Jerem                              |
| Authentication backend                           | Jerem                              |
| Authentication frontend                          | Jennifer, Elise                    |
| User profiles                                    | Jennifer, Jerem, Elise             |
| Avatars backend                                  | Jerem                              |
| Avatars frontend                                 | Jennifer, Elise                    |
| Avatar sprites                                   | Martin                             |
| Friends backend                                  | Jerem                              |
| Friends frontend                                 | Jennifer, Elise                    |
| Online status                                    | Jerem, Jennifer                    |
| XP and levels                                    | Jennifer                           |
| Achievements and rewards                         | Jennifer                           |
| Leaderboards                                     | Martin                             |
| Notifications                                    | Elise                              |
| Internationalization                             | Elise                              |
| Design system / reusable components              | Elise                              |
| Responsive interface                             | Elise                              |
| Frontend architecture                            | Jennifer                           |
| API integration                                  | Jennifer, Jerem                    |
| Database / Prisma                                | Jerem                              |
| Docker / infrastructure                          | Jerem                              |
| WAF / Vault / infrastructure security            | Jerem                              |
| Legal pages                                      | Elise                              |
| Documentation                                    | Jennifer, Martin, Jerem, Elise     |
| Pull Request reviews and overall code review     | Jennifer                           |

---

# 42 Modules

## Major modules

| Module                                   | Points | Owner(s)          |
| ---------------------------------------- | -----: | ------------------ |
| Frontend and backend framework           |      2 | Jennifer, Jerem     |
| Real-time features                       |      2 | Martin, Jerem       |
| Standard user management                 |      2 | Jennifer, Jerem     |
| Complete web game                        |      2 | Martin              |
| Remote players                           |      2 | Martin              |
| Multiplayer game (3+ players)            |      2 | Martin              |
| WAF / ModSecurity + HashiCorp Vault      |      2 | Jerem               |

**Total major modules: 14 points**

## Minor modules

| Module                                 | Points | Owner(s)              |
| --------------------------------------- | -----: | --------------------- |
| ORM — Prisma                            |      1 | Jerem                 |
| Custom design system                    |      1 | Elise                 |
| Multiple languages                      |      1 | Elise                 |
| Game customization options              |      1 | Jennifer, Martin       |
| Gamification system                     |      1 | Jennifer, Martin       |
| Notification system                     |      1 | Elise                 |
| Additional browsers                     |      1 | Elise                 |

**Total minor modules: 7 points**

**Grand total: 21 points**

> Only fully functional and demonstrable modules will be claimed during the final evaluation.

---

# Module implementation

### Frontend + Backend Framework

The frontend uses React and the backend uses Express.

Jennifer worked on the frontend architecture and Jerem on the backend architecture.

**Owner(s):** Jennifer, Jerem.

### Real-time features

Socket.IO is used for real-time communication, mainly for the multiplayer gameplay of Duel mode.

Martin worked on the multiplayer game logic and Jerem on the Socket.IO backend infrastructure.

**Owner(s):** Martin, Jerem.

### Standard user management

Users can update their profile, use an avatar, manage their friends and see their online status.

Jennifer worked mainly on the frontend side and Jerem on the backend side.

**Owner(s):** Jennifer, Jerem.

### Complete web game

The game is built with Phaser and includes movement, collisions, enemies, maps and win/lose conditions.

**Owner:** Martin.

### Remote players

Players located on different computers can join and play the same match in real time.

**Owner:** Martin.

### 3+ player multiplayer

Duel mode supports more than two players simultaneously (up to 4).

**Owner:** Martin.

### Cybersecurity

A `waf` service (Nginx + ModSecurity, `nginx/modsec/`) is placed in front of the application and applies the OWASP Core Rule Set (`crs-setup.conf` and the CRS rule files) to incoming HTTP traffic before it reaches the backend.

A dedicated `vault` service (HashiCorp Vault, `vault/config/vault.hcl`) runs with a TLS listener and raft storage, and acts as an internal PKI: `vault/generate-certs.sh` and `vault/vault-init.sh` provision the certificates used by `nginx` (TLS termination for the whole stack) and by Vault itself, and expose secrets to the backend via `VAULT_ROLE_ID`/`VAULT_SECRET_ID` (AppRole authentication) instead of storing them directly in `.env`. Certificates and secrets are stored under `vault/certs/` and `vault/secrets/`, both excluded from Git.

HTTPS is enforced across the whole stack (automatic redirect from HTTP to HTTPS).

**Owner:** Jerem.

### ORM

Prisma is used between the Express backend and PostgreSQL.

**Owner:** Jerem.

### Design system

Generic, reusable UI components live in `frontend/src/components/ui/`: `Button`, `Input`, `Modal`, `Spinner`, `Toast` (+ `useToast`), `LanguageSelector`, `TouchPad` — 7 components in total, built on a shared Tailwind color palette and typography (the `fantasy` font is used for headings).

The rest of `frontend/src/components/` (`editor/`, `friends/`, `game/`, `layout/`, `leaderboard/`, `profile/`, `tower/`) contains feature-specific components (for example `Avatar`, `Leaderboard`, `GameOverModal`) that internally reuse the primitives from `ui/`.


**Owner:** Elise.

### Multiple languages

The application uses i18next and supports English, French and Dutch.

**Owner:** Elise.

### Game customization

Players can create and customize maps before testing and publishing them.

Martin worked on the core gameplay/editor and Jennifer on the customization and publishing workflow.

**Owner(s):** Martin, Jennifer.

### Gamification

The project includes XP, levels, achievements, rewards and leaderboards.

**Owner(s):** Jennifer, Martin.

### Notifications

User feedback is currently implemented as ephemeral client-side toasts (`components/ui/Toast.tsx` / `useToast.ts`), shown for events such as XP gains and achievement unlocks (see reward handling in `duel_game_page`).


**Owner:** Elise.

### Additional browsers

Chrome and Firefox

**Owner:** Elise.

---

# Why these modules

Most modules were chosen because they naturally fit into the game the team wanted to build.

The gameplay modules were the most important: the complete game, remote players, multiplayer and real-time features form a coherent whole.

Game customization was also a logical choice since the project already has a map editor.

Gamification allowed the addition of progression through XP, achievements and leaderboards.

The other modules — user management, Prisma, multiple languages, design system and security (WAF/Vault) — are used throughout the application and made the project more complete and more robust.

---

# Individual contributions

## Martin — malafont

Martin worked mainly on gameplay.

His work covers Phaser, movement, collisions, enemies, game rules, Tower mode, multiplayer gameplay and the core of the map/editor logic.

He also worked on remote players and multiplayer synchronization with Jerem and Jennifer, as well as on game customization and gamification with Jennifer.

As Product Owner, he was also responsible for the project's overall gameplay direction.

## Jerem — jdebrull

Jerem worked mainly on the backend and infrastructure.

His work covers the Express architecture, authentication, the database schema (Prisma/PostgreSQL) and its evolution throughout the project, the backend endpoints for maps, friends, avatars and online status, the server side of real-time features (Socket.IO, Duel mode), as well as securing the infrastructure (Nginx/ModSecurity WAF, HashiCorp Vault PKI, secrets management).

He also handled project follow-up as Project Manager, and the reliability of the single-command Docker deployment (`make docker-up`), including on a freshly cloned repository.

## Jennifer — jpaulis

Jennifer worked mainly on the frontend architecture and integration.

Her work covers the React architecture, frontend/backend communication, API integration, frontend-side user management, shared TypeScript types, game customization and gamification.

She also worked on integrating and reviewing the features developed by other team members, as well as on project documentation.

## Elise — evan-dro

Elise worked mainly on the interface, user experience and internationalization.

Her work covers the reusable design system, the responsive interface, internationalization (English, French, Dutch), interface-side notifications, as well as the frontend parts of authentication, profile, friends and avatars.

---

# Difficulties encountered and solutions

One early difficulty was connecting the map editor to the game itself: a map must not only be saved, it must also remain playable. A system was put in place where the creator must finish their own map before being able to publish it, guaranteeing that a published map is always completable.

Multiplayer mode was also one of the hardest parts, since game state has to stay synchronized across multiple players. Socket.IO is used to exchange the necessary information between clients and the backend, with server-authoritative enemy logic to prevent any divergence between clients.

Another difficulty was maintaining consistency between React, Phaser and the backend while several people were modifying different parts of the project in parallel. TypeScript types shared between frontend and backend, along with systematic Pull Request reviews, helped limit integration issues.

### Backend / infrastructure

Several incidents were encountered and fixed on the backend and infrastructure side over the course of the project, notably:

* a memory leak on abandoning a duel race via the app's internal navigation (not a tab close), fixed by adding a dedicated `leave_race` event and a factored grace delay, accounting for the constraints of React StrictMode's double-mount in development;
* a `make docker-up` failure during database seeding (`DATABASE_URL` not found), caused by a seed script that did not fetch secrets from Vault the way the main server does, fixed by aligning the seed script with the same bootstrap mechanism;
* a leak of "realistic-looking" secrets detected in a temporary `.env.example` file during a Pull Request review, resolved by replacing the values with neutral placeholders before merging into the main branch.

These incidents reinforced the team's attention to secrets management and to systematically validating the single-command deployment on a freshly cloned repository.

---

# Resources

Main resources used:

* [Official ft_transcendence subject](docs/ft_transcendence.subject.pdf)
* 42 evaluation documentation
* [React documentation](https://react.dev)
* [TypeScript documentation](https://www.typescriptlang.org)
* [Vite documentation](https://vite.dev)
* [Express documentation](https://expressjs.com)
* [Prisma documentation](https://www.prisma.io)
* [PostgreSQL documentation](https://www.postgresql.org)
* [Socket.IO documentation](https://socket.io)
* [Phaser documentation](https://phaser.io)
* [Tailwind CSS documentation](https://tailwindcss.com)
* [i18next documentation](https://www.i18next.com)
* [Zod documentation](https://zod.dev)
* [Docker documentation](https://www.docker.com)
* [HashiCorp Vault documentation](https://www.vaultproject.io)
* [OWASP ModSecurity Core Rule Set documentation](https://coreruleset.org)

---

# Use of AI

The team used AI throughout the project mainly to:

* understand errors and unfamiliar code;
* debug issues;
* review code and some Pull Requests;
* understand new technologies;
* clean up and organize documentation;
* prepare for the defense.

AI suggestions were reviewed and tested before being kept in the project. Each member remains responsible for understanding the parts of the code they developed.

---
