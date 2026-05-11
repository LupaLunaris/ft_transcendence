# Team Organization

ft_transcendence team organization document.

This document defines the team roles, responsibilities, work distribution, technical ownership, and collaboration rules for the project.

---

## 1. Objective

The goal of this organization is to ensure:

- clear responsibilities,
- balanced workload,
- no unclear ownership,
- efficient teamwork,
- clean technical decisions,
- a realistic MVP,
- strong evaluation readiness.

ft_transcendence is a group project. Every member must actively contribute to the mandatory part, modules, code, documentation, testing, and understanding of the whole project.

---

## 2. Team Overview

| Member | Main Role | Developer Focus |
| --- | --- | --- |
| Martin | Product Owner | Gameplay logic |
| Jerem | Project Manager / Backend Lead | Backend, API, WebSocket |
| Jennifer | Technical Lead / Architect | Frontend architecture, integration, reviews |
| Élise | UI Lead / Frontend Integration Developer | UI system, pages, i18n, usability |

---

## 3. Role Distribution

| Role | Owner |
| --- | --- |
| Product Owner | Martin |
| Project Manager / Scrum Master | Jerem |
| Technical Lead / Architect | Jennifer |
| Backend Lead | Jerem |
| Gameplay Developer | Martin |
| Frontend Architecture Lead | Jennifer |
| UI Lead | Élise |
| Integration Developer | Élise |
| Developers | Everyone |

---

# 4. Role Definitions

---

## 4.1 Product Owner — Martin

### Purpose

The Product Owner is responsible for the product vision.

He decides what the game should be, what features are important, and what must be included in the MVP.

The Product Owner focuses on the user experience, gameplay coherence, and feature priorities.

### Main Responsibilities

Martin is responsible for:

- defining the game concept,
- defining the gameplay loop,
- deciding what belongs in the MVP,
- prioritizing features,
- validating if a feature makes sense for the game,
- keeping the project coherent,
- avoiding unnecessary scope changes,
- documenting the gameplay rules.

### Expected Deliverables

Martin must produce and maintain:

- clear gameplay rules,
- MVP feature list,
- game loop description,
- win/loss conditions,
- map/labyrinth rules,
- player progression rules if included,
- list of postponed features.

### Developer Responsibilities

Martin also contributes as a developer.

His technical focus is:

- labyrinth logic,
- map structure,
- player movement rules,
- collision rules,
- win condition,
- game state rules,
- basic gameplay testing.

### What Martin Does Not Decide Alone

Martin does not decide alone:

- technical architecture,
- database structure,
- WebSocket architecture,
- folder structure,
- coding conventions,
- final technical implementation choices.

These decisions must be validated with the Technical Lead.

### Evaluation Expectations

Martin must be able to explain:

- what the game is,
- why the MVP was chosen,
- how the gameplay works,
- what was postponed and why,
- what he personally implemented.

---

## 4.2 Project Manager / Scrum Master — Jerem

### Purpose

The Project Manager is responsible for organization, planning, communication, and blockers.

He makes sure the team works in a coordinated way and that everyone knows what to do.

### Main Responsibilities

Jerem is responsible for:

- organizing meetings,
- preparing meeting agendas,
- writing meeting summaries,
- tracking progress,
- checking blockers,
- maintaining GitHub Issues or task board,
- making sure tasks are assigned,
- making sure deadlines are realistic,
- helping the team stay focused on the MVP.

### Expected Deliverables

Jerem must maintain:

- task board,
- meeting notes,
- sprint planning,
- list of blockers,
- task ownership,
- project timeline,
- progress tracking.

### Developer Responsibilities

Jerem also contributes as Backend Lead.

His technical focus is:

- Express backend,
- API routes,
- authentication,
- Prisma setup,
- PostgreSQL schema implementation,
- backend validation,
- backend security basics,
- WebSocket server,
- game rooms,
- real-time synchronization.

### What Jerem Does Not Do Alone

Jerem does not merge large changes without review.

He does not change core architecture without discussing with Jennifer.

He does not silently change backend contracts without informing frontend developers.

### Evaluation Expectations

Jerem must be able to explain:

- how the team organized the work,
- how tasks were tracked,
- how backend routes work,
- how authentication works,
- how WebSocket communication works,
- what he personally implemented.

---

## 4.3 Technical Lead / Architect — Jennifer

### Purpose

The Technical Lead is responsible for technical coherence.

Jennifer ensures that the project has a clean architecture, consistent code, good technical decisions, and maintainable implementation.

This role is transversal and requires reviewing, guiding, and integrating the work of others.

### Main Responsibilities

Jennifer is responsible for:

- defining the technical architecture,
- validating the stack,
- defining folder structure,
- defining coding conventions,
- reviewing important pull requests,
- ensuring frontend/backend consistency,
- helping define API contracts,
- preventing over-engineering,
- identifying risky technical choices,
- ensuring the project remains demonstrable.

### Expected Deliverables

Jennifer must maintain:

- architecture documentation,
- frontend structure,
- technical conventions,
- API contract documentation with Jerem,
- review checklist,
- integration strategy,
- technical risks list,
- README technical sections.

### Developer Responsibilities

Jennifer also contributes as Frontend Architecture Lead.

Her technical focus is:

- React app structure,
- routing,
- frontend state management,
- WebSocket client integration,
- game view architecture,
- frontend/backend integration,
- global error handling,
- technical consistency.

### Important Workload Note

Jennifer should not be assigned too many isolated feature pages.

Her Tech Lead role already includes:

- code reviews,
- architecture decisions,
- debugging support,
- integration help,
- checking consistency,
- helping other members.

Therefore, her developer workload must be slightly smaller than a pure developer workload.

### What Jennifer Does Not Do

Jennifer should not:

- write everyone’s code,
- fix every problem alone,
- replace other members’ responsibilities,
- take over the whole frontend,
- become the only person who understands the project.

Each member remains responsible for their own code.

### Evaluation Expectations

Jennifer must be able to explain:

- the full architecture,
- why the stack was chosen,
- how frontend and backend communicate,
- how WebSocket is integrated,
- how code quality was maintained,
- what she personally implemented and reviewed.

---

## 4.4 UI Lead / Frontend Integration Developer — Élise

### Purpose

The UI Lead is responsible for the visual consistency, usability, accessibility basics, reusable components, and user-facing pages.

This is not only “making things pretty”.  
This role is essential for making the application usable, clean, responsive, and coherent.

### Main Responsibilities

Élise is responsible for:

- UI consistency,
- design system,
- reusable components,
- responsive layouts,
- frontend pages,
- form interfaces,
- usability improvements,
- language switcher and translations if i18n is included,
- user-facing polish.

### Expected Deliverables

Élise must produce:

- reusable UI components,
- design system documentation,
- page layouts,
- responsive UI,
- consistent buttons, forms, cards, modals,
- translated UI texts if i18n is implemented,
- UI testing checklist.

### Developer Responsibilities

Élise contributes as a frontend developer.

Her technical focus is:

- login page,
- register page,
- lobby page,
- profile page,
- settings page,
- UI components,
- forms,
- API integration for user-facing pages,
- notifications display,
- accessibility basics,
- responsiveness.

### Suggested Components

Élise should build and maintain at least:

- Button,
- Input,
- Card,
- Modal,
- Navbar,
- Avatar,
- Badge,
- Toast,
- FormError,
- Layout,
- Tabs,
- LoadingState.

This supports the custom-made design system module.

### What Élise Does Not Do Alone

Élise does not decide gameplay rules.

Élise does not change API contracts alone.

Élise does not own the full frontend architecture.

She works with Jennifer for architecture and with Jerem for API integration.

### Evaluation Expectations

Élise must be able to explain:

- how the UI is structured,
- how reusable components work,
- how pages connect to the backend,
- how responsiveness was handled,
- how i18n works if implemented,
- what she personally implemented.

---

# 5. Developer Responsibilities — Everyone

Every team member is also a developer.

Each member must:

- write code,
- test their code,
- review code when asked,
- document their work,
- use clear commit messages,
- work on feature branches,
- understand the full project,
- be able to explain their own contributions.

No member should only manage, design, or decide.

Everyone must contribute technically.

---

# 6. Detailed Work Distribution

---

## 6.1 Martin — Gameplay

### Main Focus

Gameplay logic and game coherence.

### Tasks

Martin is responsible for:

- defining game rules,
- implementing labyrinth structure,
- implementing map logic,
- handling player movement rules,
- handling collisions,
- defining win/loss conditions,
- creating simple test maps,
- documenting gameplay decisions.

### MVP Tasks

For MVP, Martin must deliver:

- one playable labyrinth mode,
- clear movement rules,
- clear objective,
- clear victory condition,
- basic game rules documented.

### Optional Later

Can be added later:

- advanced cards,
- economy,
- unlockable decorations,
- advanced progression,
- multiple map types,
- complex balancing.

---

## 6.2 Jerem — Backend and Real-Time

### Main Focus

Backend, database, authentication, and real-time server.

### Tasks

Jerem is responsible for:

- Express project setup,
- API structure,
- Prisma setup,
- PostgreSQL connection,
- database schema,
- authentication,
- password hashing,
- JWT/session logic,
- backend validation,
- user routes,
- profile routes,
- friends routes if included,
- WebSocket server,
- game rooms,
- broadcasting game state,
- handling disconnects,
- reconnection basics.

### MVP Tasks

For MVP, Jerem must deliver:

- working backend,
- working database,
- login/register backend,
- basic authenticated routes,
- WebSocket room system,
- real-time game sync.

### Optional Later

Can be added later:

- advanced notifications,
- advanced stats,
- admin tools,
- complex matchmaking,
- advanced security modules.

---

## 6.3 Jennifer — Technical Lead and Frontend Architecture

### Main Focus

Architecture, frontend structure, real-time integration, and code quality.

### Tasks

Jennifer is responsible for:

- defining frontend architecture,
- setting up React structure,
- defining route structure,
- defining shared types if used,
- creating frontend conventions,
- integrating WebSocket client,
- creating game view structure,
- syncing UI with backend state,
- reviewing critical PRs,
- helping debug cross-feature issues,
- ensuring consistency between modules.

### MVP Tasks

For MVP, Jennifer must deliver:

- clean frontend architecture,
- working game screen,
- WebSocket client connection,
- player input handling,
- live game state display,
- integration with backend game state,
- review process.

### Optional Later

Can be added later:

- advanced animations,
- advanced frontend state patterns,
- performance optimization,
- advanced game rendering,
- richer UX polish.

---

## 6.4 Élise — UI System and Frontend Integration

### Main Focus

User interface, reusable components, pages, responsiveness, and integration.

### Tasks

Élise is responsible for:

- design system,
- reusable components,
- login page,
- register page,
- lobby page,
- profile page,
- settings page,
- notifications UI,
- forms,
- error messages,
- loading states,
- responsive layouts,
- accessibility basics,
- i18n UI integration if included.

### MVP Tasks

For MVP, Élise must deliver:

- clean login/register UI,
- lobby UI,
- profile UI,
- reusable components,
- responsive layout,
- basic design system,
- basic frontend API calls.

### Optional Later

Can be added later:

- advanced animations,
- decorative assets,
- theme customization,
- richer profile UI,
- visual polish.

---

# 7. Module Ownership

## Major Modules

| Module | Main Owner | Support |
| --- | --- | --- |
| Web framework frontend/backend | Jennifer / Jerem | Everyone |
| Real-time features | Jerem | Jennifer |
| Standard user management | Jerem | Élise |
| Complete web-based game | Martin | Jennifer / Jerem |
| Remote players | Jerem | Jennifer / Martin |

## Minor Modules

| Module | Main Owner | Support |
| --- | --- | --- |
| ORM | Jerem | Jennifer |
| Multiple languages | Élise | Jennifer |
| Gamification system | Martin | Jerem / Élise |
| Notification system | Jerem | Élise |
| Custom-made design system | Élise | Jennifer |
| Game customization options | Martin | Jennifer |

---

# 8. MVP Definition

The MVP must be simple, functional, and demonstrable.

## MVP Includes

- user registration,
- user login,
- basic profile,
- lobby,
- create/join game,
- one playable labyrinth game mode,
- real-time remote player movement,
- win/loss condition,
- basic notifications,
- basic responsive UI,
- Docker setup,
- PostgreSQL database,
- Prisma ORM,
- README documentation.

## MVP Does Not Include

- complex economy,
- large persistent world,
- advanced card system,
- advanced decorations,
- complex matchmaking,
- advanced chat,
- 3D rendering,
- AI opponent,
- microservices,
- blockchain,
- heavy analytics.

These can be considered later only if the MVP is stable.

---

# 9. Work Method

## Branching

Recommended branches:

- `main`: stable version only,
- `dev`: integration branch,
- `feature/name`: individual features,
- `fix/name`: bug fixes,
- `docs/name`: documentation changes.

No direct push to `main`.

Large changes must go through pull requests.

## Pull Requests

Each PR should include:

- what was changed,
- how it was tested,
- screenshots if UI changed,
- known limitations,
- reviewer name.

## Code Review

Important PRs must be reviewed by at least one other member.

Critical architecture or backend/frontend integration PRs should be reviewed by Jennifer.

Backend PRs should preferably be reviewed by Jerem.

UI PRs should preferably be reviewed by Élise or Jennifer.

Gameplay PRs should preferably be reviewed by Martin and Jennifer.

---

# 10. Communication Rules

## Meetings

The team should have:

- one weekly planning meeting,
- short progress updates during the week,
- extra meetings only when needed.

## Meeting Structure

Each meeting should cover:

1. What was done?
2. What is blocked?
3. What needs review?
4. What changed in the MVP?
5. What is the next task for each person?

## Decision Rules

Product decisions:

- led by Martin,
- discussed with the team.

Technical decisions:

- led by Jennifer,
- discussed with relevant developers.

Planning decisions:

- led by Jerem,
- validated with the team.

UI decisions:

- led by Élise,
- validated with Jennifer for consistency.

---

# 11. Evaluation Preparation

Each member must be able to explain:

- the project goal,
- the MVP,
- chosen modules,
- their own role,
- their own code,
- how frontend and backend communicate,
- how WebSocket works,
- how authentication works,
- how the database is structured,
- how the team worked together.

No member should only understand their isolated part.

---

# 12. Risk Management

## Main Risks

| Risk | Prevention |
| --- | --- |
| MVP too large | Freeze MVP early |
| Martin changes scope too often | Use written backlog |
| Jennifer becomes bottleneck | Limit her feature workload |
| Jerem overloaded with backend + PM | Keep backend scope simple |
| Élise underloaded | Give her UI system + pages + i18n |
| Integration problems | Define API contracts early |
| WebSocket complexity | Keep first version simple |
| Evaluation failure | Document modules clearly |

---

# 13. Final Responsibility Summary

## Martin

Owns:

- product vision,
- gameplay rules,
- labyrinth logic,
- game coherence.

Expected result:

- the game makes sense and is playable.

## Jerem

Owns:

- project tracking,
- backend,
- database,
- authentication,
- WebSocket server.

Expected result:

- the backend is stable and real-time works.

## Jennifer

Owns:

- technical architecture,
- frontend architecture,
- integration quality,
- code consistency,
- reviews.

Expected result:

- the project is clean, coherent, and maintainable.

## Élise

Owns:

- UI system,
- reusable components,
- user-facing pages,
- responsiveness,
- usability,
- i18n if included.

Expected result:

- the application is usable, clean, coherent, and presentable.

---

# 14. Final Rule

Each member owns a clear area, but the project belongs to the whole team.

Everyone must:

- contribute,
- communicate,
- test,
- document,
- understand,
- be ready to explain the project during evaluation.

The objective is not to build the biggest possible project.

The objective is to build a clean, functional, demonstrable, and well-organized ft_transcendence project.