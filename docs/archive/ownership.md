# ft_transcendence — Ownership & Push Plan

**Project:** Guilds of the Deep  
**Context:** ft_transcendence — 42 School  
**Purpose:** define clear ownership after adopting Martin’s repository as the technical base.

---

## 0. Why this document exists

The project currently has a strong technical base, but a large part of the implementation was produced before the full team could clearly own their areas.

This document exists to avoid:

- one person owning the whole project,
- unclear responsibilities,
- fake or cosmetic contributions,
- duplicated work,
- chaotic pushes,
- evaluation issues because only one person understands the code.

The goal is not to blame anyone.

The goal is to transform the current repository into a real team project where:

- each member has a clear technical area,
- each member pushes meaningful work,
- each member can explain their contribution,
- each member participates in reviews,
- the project remains coherent and demonstrable.

---

## 1. Core principle

Ownership means:

- the person is responsible for understanding the area deeply,
- the person is the main maintainer of that area,
- the person reviews important changes touching that area,
- the person prepares explanations for evaluation.

Ownership does **not** mean:

- nobody else can touch the files,
- the owner works alone,
- the owner decides everything without review,
- the owner can bypass team conventions.

Every member remains a developer.

---

## 2. Official ownership overview

| Member | Main role | Main ownership |
|---|---|---|
| Martin | Product Owner / Gameplay Lead | Gameplay systems, Phaser game logic, multiplayer gameplay, map validation, customization, gamification |
| Jerem | Project Manager / Backend Lead | Express backend, Prisma/PostgreSQL, authentication, WebSocket server infrastructure, Docker, HTTPS |
| Jennifer | Technical Lead / Frontend Architecture | React architecture, frontend/backend integration, API contracts, shared types, WebSocket client, rendering integration, visual direction |
| Élise | UI Lead / Frontend Systems | UI components, responsive layouts, forms, auth/profile UI, notifications UI, i18n, user flow fluidity |

---

## 3. Visual responsibilities

The visual split must be clear.

### Jennifer owns rendering

Jennifer is responsible for:

- global visual direction,
- gameplay visual consistency,
- rendering consistency,
- visual identity validation,
- frontend visual integration,
- React/Phaser visual integration.

This includes the artistic coherence of the game.

### Élise owns UI implementation and user flow

Élise is responsible for:

- UI components,
- Tailwind implementation,
- forms,
- game UI coherence,
- responsive behavior,
- navigation clarity,
- notifications UI,
- loading/error states,
- user flow fluidity.

### Practical difference

| Area | Owner |
|---|---|
| Global artistic direction | Jennifer |
| Visual identity of the game | Jennifer |
| Gameplay rendering coherence | Jennifer |
| Phaser/React visual integration | Jennifer |
| CSS/Tailwind implementation | Élise |
| Reusable UI components | Élise |
| Responsive UI behavior | Élise |
| Forms and user-facing flows | Élise |

---

# 4. Martin — Gameplay Owner

## 4.1 Role

Martin is the Product Owner and Gameplay Lead.

He owns the game logic and must ensure that the gameplay is:

- coherent,
- playable,
- balanced,
- understandable,
- synchronized,
- realistic for the MVP.

He must not be reduced to “Phaser scenes”, but he also must not own the whole project.

---

## 4.2 Main responsibilities

Martin owns:

- gameplay rules,
- victory/loss conditions,
- player movement,
- collision system,
- enemy movement,
- map gameplay rules,
- map validation from a gameplay perspective,
- Phaser scenes,
- game loop,
- match lifecycle,
- race flow,
- multiplayer gameplay logic,
- gameplay synchronization rules,
- game customization,
- gamification rules,
- balancing,
- gameplay test maps.

---

## 4.3 Main folders and files

Martin is the main owner of:

```txt
frontend/src/game/**
frontend/src/game/scenes/**
frontend/src/game/GameCanvas.tsx
frontend/src/game/RaceCanvas.tsx              # when created
frontend/src/game/EventBus.ts                 # when created
frontend/src/pages/game/GamePage.tsx
frontend/src/pages/game/TowerGamePage.tsx
frontend/src/pages/game/RacePage.tsx
frontend/src/pages/editor/EditorPage.tsx      # gameplay/editor behavior parts
```

Martin supports, but does not fully own:

```txt
shared/src/types/game.types.ts
shared/src/types/tiles.types.ts
shared/src/types/socket.types.ts
backend/src/services/race.service.ts
backend/src/services/lobby.service.ts
backend/src/sockets/race.handlers.ts
```

---

## 4.4 What Martin must understand

Martin must be able to explain:

- how a map is loaded,
- how a map is validated,
- how the grid works,
- how the player moves,
- how walls/collisions work,
- how the exit is detected,
- how a score is submitted,
- how tower levels work,
- how multiplayer race logic works,
- how the game state is synchronized,
- how disconnection/reconnection is handled in the gameplay flow,
- how customization affects the game,
- how gamification rewards are triggered.

---

## 4.5 What Martin should push

Suggested branches:

```txt
feature/game-loop-cleanup
feature/map-validation-gameplay
feature/gameplay-rules-doc
feature/remote-race-mvp
feature/game-customization
feature/gamification-rules
feature/race-scene
```

Suggested commits:

```txt
feat(game): clarify gameplay state machine
feat(game): add race scene with server state interpolation
feat(game): document map rules and win conditions
feat(game): add multiplayer gameplay flow
feat(game): add customization rules
feat(game): add basic gamification triggers
```

---

## 4.6 What Martin must not do alone

Martin should not:

- decide technical architecture alone,
- rewrite frontend architecture alone,
- rewrite backend architecture alone,
- decide API contracts alone,
- assign everyone’s work alone,
- keep gameplay logic undocumented,
- change MVP scope without team validation,
- claim modules that are not demonstrable.

Any change touching architecture must be reviewed with Jennifer and Jerem.

---

## 4.7 Evaluation proof

Martin should prepare to demonstrate:

- a local game run,
- a published map,
- a tower level,
- a multiplayer race slice,
- map validation,
- gameplay rules,
- win/loss flow,
- what he personally implemented or refactored.

---

# 5. Jerem — Backend / Infrastructure Owner

## 5.1 Role

Jerem is Project Manager and Backend Lead.

He owns backend stability, API reliability, infrastructure, and project coordination.

His role is heavy because it includes both:

- visible backend work,
- invisible planning and coordination work.

Therefore the backend must stay simple and maintainable.

---

## 5.2 Main responsibilities

Jerem owns:

- meeting preparation,
- meeting summaries,
- GitHub Issues / project board,
- sprint tracking,
- blocker tracking,
- Express backend,
- REST API architecture,
- Prisma schema,
- PostgreSQL migration,
- database relations,
- authentication backend,
- JWT logic,
- password hashing,
- backend validation,
- backend security basics,
- Socket.IO backend infrastructure,
- connection/disconnection handling,
- Docker setup,
- HTTPS setup,
- environment configuration,
- backend tests.

---

## 5.3 Main folders and files

Jerem is the main owner of:

```txt
backend/**
backend/src/server.ts
backend/src/routes/**
backend/src/middleware/**
backend/src/schemas/**
backend/src/utils/**
backend/src/lib/prisma.ts
backend/prisma/**
backend/Dockerfile
docker-compose.yml
.env.example
Makefile
```

Jerem also owns future backend multiplayer infrastructure:

```txt
backend/src/services/race.service.ts
backend/src/services/lobby.service.ts
backend/src/sockets/race.handlers.ts
backend/src/middleware/socket.auth.middleware.ts
```

---

## 5.4 What Jerem must understand

Jerem must be able to explain:

- Express server setup,
- API route structure,
- auth register/login/me/profile flow,
- JWT verification,
- bcrypt password hashing,
- Zod validation,
- Prisma models,
- PostgreSQL setup,
- database migrations,
- Docker startup flow,
- backend health check,
- Socket.IO server setup,
- room/lobby server infrastructure,
- security limitations and future hardening,
- why HTTPS is required and how it is handled.

---

## 5.5 What Jerem should push

Priority branches:

```txt
fix/postgres-prisma-docker
feature/backend-env-cleanup
feature/auth-hardening
feature/backend-validation
feature/https-backend
feature/socket-server
feature/race-service
docs/project-management
```

Suggested commits:

```txt
fix(prisma): migrate schema from sqlite to postgresql
fix(docker): align compose database with Prisma provider
chore(env): remove committed secrets and update env example
feat(backend): add HTTPS configuration for evaluation
feat(socket): add Socket.IO race handlers
feat(socket): add LobbyService with matchmaking queue
docs(pm): add meeting agenda and sprint tracking template
```

---

## 5.6 What Jerem must not do alone

Jerem should not:

- absorb gameplay logic,
- own all realtime gameplay decisions,
- change frontend contracts without Jennifer,
- change UI behavior without Élise,
- silently modify API response shapes,
- become the only person who understands backend,
- skip PM documentation.

Gameplay synchronization rules must be shared with Martin.
Frontend contracts must be validated with Jennifer.

---

## 5.7 Evaluation proof

Jerem should prepare to demonstrate:

- backend start,
- database connection,
- Prisma schema,
- auth flow,
- route examples,
- Docker launch,
- API validation,
- Socket.IO server connection,
- project organization method,
- task board / sprint plan,
- what he personally implemented or refactored.

---

# 6. Jennifer — Technical Lead / Frontend Architecture / Integration Owner

## 6.1 Role

Jennifer is Technical Lead and Frontend Architecture Owner.

She owns technical coherence and the bridge between frontend and backend.

She must ensure that the project remains:

- maintainable,
- readable,
- integrated,
- demonstrable,
- visually coherent,
- not over-engineered.

---

## 6.2 Main responsibilities

Jennifer owns:

- frontend architecture,
- React structure,
- routing strategy,
- protected routes,
- provider structure,
- frontend/backend integration,
- API contracts,
- typed API service,
- shared types,
- WebSocket client architecture,
- realtime frontend synchronization,
- rendering architecture,
- React/Phaser integration,
- frontend error handling,
- technical conventions,
- critical PR reviews,
- technical documentation,
- README coordination,
- visual direction coordination,
- gameplay visual consistency,
- rendering consistency.

---

## 6.3 Main folders and files

Jennifer is the main owner of:

```txt
frontend/src/App.tsx
frontend/src/main.tsx
frontend/src/services/**
frontend/src/hooks/**
frontend/src/context/**
shared/src/**
frontend/src/game/GameCanvas.tsx              # integration part
frontend/src/game/RaceCanvas.tsx              # integration part, when created
frontend/src/game/EventBus.ts                 # bridge part, when created
frontend/src/pages/game/**                    # integration/review support
frontend/vite.config.ts
frontend/tsconfig.json
README.md
docs/architecture.md
docs/api-conventions.md
docs/evaluation-readme.md
```

Jennifer supports:

```txt
frontend/src/components/**
frontend/src/pages/**
backend/src/routes/**
backend/src/sockets/**
```

Support means she reviews contracts and integration, not that she owns all implementation.

---

## 6.4 What Jennifer must understand

Jennifer must be able to explain:

- global frontend architecture,
- routing and protected routes,
- auth context,
- API service,
- typed frontend/backend contracts,
- shared type boundaries,
- how frontend calls backend,
- how errors/loading states are handled,
- how WebSocket client connects to backend,
- how React and Phaser communicate,
- how rendering integration is organized,
- why certain frontend conventions exist,
- how the visual direction stays coherent,
- which modules are really demonstrable,
- how the project avoids over-engineering.

---

## 6.5 What Jennifer should push

Priority branches:

```txt
feature/frontend-architecture-cleanup
feature/api-contracts
feature/protected-routing
feature/websocket-client
feature/react-phaser-bridge
feature/rendering-integration
docs/evaluation-readme
docs/ownership
```

Suggested commits:

```txt
feat(frontend): stabilize protected routing and providers
feat(frontend): clarify typed API service contracts
feat(shared): align shared types with backend responses
feat(frontend): add SocketService singleton
feat(frontend): add useRace hook bridging socket and UI state
feat(game): add EventBus bridge between React and Phaser
docs(root): add ownership and evaluation contribution plan
docs(readme): align README with real MVP and modules
```

---

## 6.6 What Jennifer must not do alone

Jennifer should not:

- fix all bugs alone,
- absorb PM responsibilities,
- become the support for every small issue,
- take ownership of every page,
- over-engineer abstractions,
- decide gameplay alone,
- decide backend data structure alone.

Backend decisions require Jerem.
Gameplay decisions require Martin.
UI system decisions require Élise.

---

## 6.7 Evaluation proof

Jennifer should prepare to demonstrate:

- routing architecture,
- protected route flow,
- API service,
- shared types,
- frontend/backend data flow,
- WebSocket client flow,
- React/Phaser integration,
- rendering strategy,
- visual coherence choices,
- README/module documentation,
- what she personally implemented or refactored.

---

# 7. Élise — UI Systems / UX Fluidity Owner

## 7.1 Role

Élise is UI Lead and Frontend Systems Integration Owner.

Her role is not “just design” and not “global graphics”.

Her role is to make the application usable, clean, consistent, responsive, and understandable for users.

She owns the practical user experience and frontend UI systems.

---

## 7.2 Main responsibilities

Élise owns:

- reusable UI components,
- Tailwind implementation,
- component variants,
- responsive layout,
- navbar/layout behavior,
- forms,
- frontend validation display,
- auth UI,
- profile UI,
- notifications/toasts,
- loading states,
- error states,
- empty states,
- modal behavior,
- i18n integration,
- language switcher,
- accessibility basics,
- frontend UX fluidity.

---

## 7.3 Main folders and files

Élise is the main owner of:

```txt
frontend/src/components/ui/**
frontend/src/components/layout/**
frontend/src/components/tower/**
frontend/src/components/editor/EditorGrid.tsx
frontend/src/components/editor/TileSelector.tsx
frontend/src/pages/auth/**
frontend/src/pages/ProfilePage.tsx
frontend/src/pages/HomePage.tsx
frontend/src/pages/NotFoundPage.tsx
frontend/src/pages/TrainingPage.tsx
frontend/src/i18n/**                         # when created
frontend/tailwind.config.ts
frontend/src/index.css
```

Élise supports:

```txt
frontend/src/pages/editor/EditorPage.tsx
frontend/src/pages/TowerPage.tsx
frontend/src/pages/game/RacePage.tsx
frontend/src/hooks/**
frontend/src/services/**
```

Support means UI integration and UX states, not API architecture ownership.

---

## 7.4 What Élise must understand

Élise must be able to explain:

- design system components,
- component variants,
- Tailwind structure,
- responsive layout strategy,
- login/register UI,
- profile UI,
- form validation display,
- notifications/toasts,
- loading/error states,
- i18n setup,
- how API states are shown in the interface,
- how the user moves through the app,
- how the app remains usable across screens.

---

## 7.5 What Élise should push

Priority branches:

```txt
feature/ui-system-cleanup
feature/forms-validation-ui
feature/auth-profile-ui
feature/notifications-ui
feature/responsive-layout
feature/i18n-foundation
feature/loading-error-states
```

Suggested commits:

```txt
feat(ui): clean reusable Button Input Modal Toast components
feat(ui): add consistent loading and error states
feat(frontend): improve auth and profile forms
feat(frontend): add responsive layout refinements
feat(frontend): add i18n foundation and language switcher
feat(ui): improve notification UX
```

---

## 7.6 What Élise must not do alone

Élise should not:

- decide global artistic direction alone,
- change API contracts alone,
- modify backend response expectations alone,
- rewrite frontend architecture alone,
- work only on colors or cosmetic CSS,
- create isolated pages outside conventions,
- bypass shared UI conventions.

Visual direction should be coordinated with Jennifer.
API behavior should be coordinated with Jennifer and Jerem.

---

## 7.7 Evaluation proof

Élise should prepare to demonstrate:

- reusable components,
- design system usage,
- responsive layouts,
- auth/profile UI,
- notification system UI,
- i18n switcher,
- loading/error states,
- forms behavior,
- what she personally implemented or refactored.

---

# 8. Cross-functional areas

Some parts cannot belong to only one person.

## 8.1 Multiplayer

| Area | Main owner | Support |
|---|---|---|
| WebSocket backend setup | Jerem | Jennifer |
| Room/lobby server infrastructure | Jerem | Martin |
| Gameplay synchronization rules | Martin | Jerem |
| WebSocket client | Jennifer | Jerem |
| Race UI states | Élise | Jennifer / Martin |
| Race scene rendering | Martin | Jennifer |

## 8.2 Map editor

| Area | Main owner | Support |
|---|---|---|
| Editor gameplay rules | Martin | Jennifer |
| Editor API calls | Jennifer | Jerem |
| Editor grid component | Élise | Jennifer |
| Backend map validation | Jerem | Martin |
| Visual clarity of editor | Élise | Jennifer |
| Map publication flow | Martin / Jennifer | Jerem |

## 8.3 Authentication

| Area | Main owner | Support |
|---|---|---|
| Backend auth routes | Jerem | Élise |
| JWT middleware | Jerem | Jennifer |
| Auth context | Jennifer | Élise |
| Login/register UI | Élise | Martin |
| Profile frontend | Élise | Jennifer |
| Shared auth types | Jennifer | Jerem |

## 8.4 Documentation

| Document | Main owner | Support |
|---|---|---|
| README.md | Everyone | Everyone |
| Setup / Docker docs | Jerem | Jennifer |
| Gameplay rules | Martin | Jennifer |
| API conventions | Jennifer / Jerem | Everyone |
| UI/component docs | Élise | Martin |
| Project management notes | Jerem | Everyone |
| Ownership document | Martin | Jennifer |

---

# 9. Immediate project risks

The current repo must not be treated as finished.

Known risks:

- repository history may not prove balanced team contribution yet,
- some files were attributed to members after the fact,
- Docker/PostgreSQL may not align with current Prisma setup,
- `.env` or local artifacts must not stay committed,
- Socket.IO exists but multiplayer gameplay may not be demonstrable yet,
- README may claim features that are not real yet,
- legal pages are missing,
- HTTPS backend is missing,
- modules must be reduced to what can actually be shown,
- each member must understand their area, not just push code.

---

# 10. Immediate priority order

## Priority 1 — Make repo safe and honest

Owner: Martin + Jennifer

Tasks:

- remove committed secrets,
- remove local artifacts,
- fix `.gitignore`,
- verify `.env.example`,
- rewrite README so it matches the real project,
- move useful docs into `/docs`,
- remove unrelated files from evaluation repo.

Suggested branches:

```txt
chore/repo-cleanup
docs/evaluation-readme
```

---

## Priority 2 — Fix database and Docker alignment

Owner: Jerem

Tasks:

- decide final database provider,
- migrate Prisma to PostgreSQL if Docker uses PostgreSQL,
- regenerate migrations cleanly,
- test `docker compose up --build`,
- document startup steps.

Suggested branch:

```txt
fix/postgres-prisma-docker
```

---

## Priority 3 — Freeze real MVP

Owner: Martin + Everyone

Tasks:

- define exact MVP,
- remove non-demonstrable claims,
- decide which modules are really claimed,
- define what must be shown during evaluation.

Suggested branch:

```txt
docs/final-mvp-modules
```

---

## Priority 4 — Make multiplayer demonstrable

Owner: Martin + Jerem

Tasks:

- minimal lobby,
- two remote players,
- synchronized race state,
- movement broadcast,
- win condition,
- disconnection handling,
- simple UI state.

Suggested branches:

```txt
feature/socket-server
feature/websocket-client
feature/remote-race-mvp
feature/race-ui
```

---

## Priority 5 — Complete user-facing requirements

Owner: Élise + Jennifer
Tasks:

- Privacy Policy page,
- Terms of Service page,
- accessible links in layout/footer,
- responsive pass,
- basic i18n foundation,
- notification UI cleanup.

Suggested branches:

```txt
feature/legal-pages
feature/responsive-layout
feature/i18n-foundation
feature/notifications-ui
```

---

# 11. Git rules

## 11.1 Main branches

| Branch | Purpose | Rule |
|---|---|---|
| `main` | Stable demo version | No direct push |
| `dev` | Integration branch | PR only |
| `feature/*` | New feature | Push by owner |
| `fix/*` | Bug fix | Push by owner |
| `docs/*` | Documentation | Push by owner |
| `chore/*` | Cleanup/config | Push by owner |

---

## 11.2 Pull request rules

Every PR must include:

- what changed,
- why it changed,
- how it was tested,
- screenshots if UI changed,
- known limitations,
- reviewer requested.

---

## 11.3 Reviewer rules

| PR touches | Reviewer |
|---|---|
| Backend/API | Jerem + Jennifer |
| Prisma/database | Jerem |
| Frontend architecture | Jennifer |
| Shared types | Jennifer + impacted owner |
| Gameplay | Martin |
| UI/components | Élise + Martin |
| Docker/env | Jerem + Jennifer |
| README/modules | Everyone |
| Multiplayer | Martin + Jerem |
| i18n | Élise + Jennifer |

---

# 12. What each person should push first

## Martin — first useful push

```txt
branch: feature/gameplay-rules-doc
```

Content:

- document current gameplay rules,
- document map rules,
- document win/loss conditions,
- identify what is missing for remote race,
- clean gameplay code only if needed.

Then:

```txt
branch: feature/remote-race-mvp
```

Content:

- minimal race flow,
- RaceScene,
- EventBus,
- game state interpolation,
- win condition.

---

## Jerem — first useful push

```txt
branch: fix/postgres-prisma-docker
```

Content:

- align Prisma provider with Docker database,
- remove SQLite dev artifacts,
- clean migrations,
- verify docker startup.

Then:

```txt
branch: feature/socket-server
```

Content:

- Socket.IO auth middleware,
- lobby service,
- race service,
- handlers,
- tests.

---

## Jennifer — first useful push

```txt
branch: docs/ownership
```

Content:

- add this ownership document,
- align README team section with official ownership,
- clarify what each person owns.

Then:

```txt
branch: feature/api-contracts
```

Content:

- review `shared/src/types`,
- align API service with backend responses,
- document frontend/backend contracts.

Then:

```txt
branch: feature/websocket-client
```

Content:

- SocketService,
- useRace hook,
- React/socket bridge.

---

## Élise — first useful push

```txt
branch: feature/ui-system-cleanup
```

Content:

- review Button/Input/Modal/Toast,
- make UI states consistent,
- ensure components are reusable.

Then:

```txt
branch: feature/i18n-foundation
```

Content:

- add i18n setup,
- language switcher,
- translate visible UI core texts.

Then:

```txt
branch: feature/responsive-layout
```

Content:

- responsive pass on auth/home/profile/tower/editor pages.

---

# 13. Evaluation responsibility by member

## Martin must defend

- gameplay,
- Phaser,
- map validation from gameplay side,
- game loop,
- race gameplay,
- customization,
- gamification.

## Jerem must defend

- backend,
- API,
- auth,
- Prisma/PostgreSQL,
- Docker,
- HTTPS,
- Socket.IO backend,
- PM process.

## Jennifer must defend

- frontend architecture,
- API contracts,
- shared types,
- routing,
- protected routes,
- frontend/backend integration,
- WebSocket client,
- rendering integration,
- visual coherence,
- README/modules accuracy.

## Élise must defend

- UI system,
- reusable components,
- responsive layout,
- user flow,
- forms,
- notifications UI,
- i18n,
- loading/error states.

---

# 14. What must be avoided

## Avoid this

```txt
Someone decides what everyone pushes.
```

## Replace with this

```txt
The team validates ownership.
Each owner creates branches and PRs for their area.
Each PR is reviewed by the relevant owner.
```

---

## Avoid this

```txt
People only push small cosmetic changes to make the history look balanced.
```

## Replace with this

```txt
Each member takes real responsibility for a maintainable area and can explain it.
```

---

## Avoid this

```txt
The README claims modules that are not demonstrable.
```

## Replace with this

```txt
The README only claims modules that can be shown live during evaluation.
```

---

## Avoid this

```txt
The current repo is considered finished.
```

## Replace with this

```txt
The current repo is a strong base that must be cleaned, documented, split, and completed by the team.
```

---

# 15. Final agreement to validate in meeting

The team should explicitly validate:

- We use `Guilds-of-the-Deep` as the technical base.
- We do not treat it as finished.
- We import useful organization/docs from the previous repo.
- We split ownership into 4 real areas.
- We use PRs into `dev`.
- No direct push to `main`.
- Each member owns and understands their zone.
- Modules are only claimed if demonstrable.
- The next sprint focuses on cleanup, Docker/PostgreSQL, README, legal pages, and remote multiplayer MVP.

---

# 16. Short version for Discord

```txt
Proposal for tonight:

We can use Guilds-of-the-Deep as the technical base because it is the most advanced repo.

But we should not treat it as finished or as one person’s project.

We need to split it into clear ownership zones:

Martin → gameplay, Phaser, map rules, multiplayer gameplay, customization/gamification.
Jerem → backend, Prisma/PostgreSQL, auth, Docker, HTTPS, Socket.IO server, PM tracking.
Jennifer → frontend architecture, API contracts, shared types, routing, WebSocket client, rendering/visual direction.
Élise → UI components, forms, responsive, auth/profile UI, notifications UI, i18n, user flow fluidity.

Each person should push real work on their area through feature branches and PRs to dev.
No direct push to main.
Each person must be able to explain their part during evaluation.

Goal: keep Martin’s existing work, but transform it into a real team project.
```

---

