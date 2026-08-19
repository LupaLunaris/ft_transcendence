# Team Organization — ft_transcendence

*This project has been created as part of the 42 curriculum.*

---

## Table of Contents

1. [Project Objective](#1-project-objective)
2. [Global Team Summary](#2-global-team-summary)
3. [Team Overview](#3-team-overview)
4. [Global Workload Philosophy](#4-global-workload-philosophy)
5. [Role Distribution](#5-role-distribution)
6. [Product Owner — Martin](#6-product-owner--martin)
7. [Project Manager / Backend Lead — Jerem](#7-project-manager--backend-lead--jerem)
8. [Technical Lead / Frontend Architecture — Jennifer](#8-technical-lead--frontend-architecture--jennifer)
9. [UI Lead / Frontend Integration — Élise](#9-ui-lead--frontend-integration--élise)
10. [Shared Developer Responsibilities](#10-shared-developer-responsibilities)
11. [Detailed Technical Ownership](#11-detailed-technical-ownership)
12. [Estimated Workload Distribution](#12-estimated-workload-distribution)
13. [MVP Definition](#13-mvp-definition)
14. [Modules Ownership](#14-modules-ownership)
15. [Communication Rules](#15-communication-rules)
16. [Pull Requests and Code Reviews](#16-pull-requests-and-code-reviews)
17. [Evaluation Preparation](#17-evaluation-preparation)
18. [Risk Management](#18-risk-management)
19. [Final Team Rules](#19-final-team-rules)

---

# 1. Project Objective

The objective of this organization document is to:

* clearly define responsibilities,
* avoid role confusion,
* balance workload fairly,
* reduce technical chaos,
* keep the MVP realistic,
* improve collaboration,
* prepare the team for evaluation.

ft_transcendence is a long-term group project.

A clean organization is essential because poor coordination early in the project can create major delays later.

This document defines:

* who owns each area,
* what is expected from each member,
* what each member should avoid,
* how work is distributed,
* how the project will be coordinated.

---

# 2. Global Team Summary

## Martin — Product Owner & Gameplay Multiplayer Systems

Martin owns:

* gameplay vision,
* gameplay systems,
* realtime gameplay logic,
* game rooms lifecycle,
* enemy systems,
* game customization,
* gamification systems,
* multiplayer gameplay synchronization.

Expected result:

The game is playable, coherent, synchronized, scalable, and fun in multiplayer.

---

## Jerem — Project Manager & Backend Infrastructure

Jerem owns:

* project organization,
* backend infrastructure,
* API architecture,
* authentication,
* database architecture,
* WebSocket infrastructure,
* deployment coordination.

Expected result:

The backend infrastructure is stable, secure, synchronized, and maintainable.

---

## Jennifer — Technical Lead & Frontend Architecture

Jennifer owns:

* technical coherence,
* frontend architecture,
* frontend/backend integration,
* reviews,
* rendering architecture,
* realtime frontend integration,
* visual direction coordination.

Expected result:

The project remains technically coherent, maintainable, demonstrable, and stable.

---

## Élise — UI Lead & Frontend Systems Integration

Élise owns:

* UI systems,
* reusable components,
* responsive frontend,
* profile systems,
* notifications systems,
* frontend state integration,
* forms systems,
* i18n integration,
* frontend API integration.

Expected result:

The application is usable, responsive, visually coherent, and fully integrated with backend systems.

---

# 3. Team Overview

| Member   | Main Role                           | Main Technical Focus                |
| -------- | ----------------------------------- | ----------------------------------- |
| Martin   | Product Owner                       | Gameplay multiplayer systems        |
| Jerem    | Project Manager / Backend Lead      | Backend infrastructure & realtime   |
| Jennifer | Technical Lead / Frontend Architect | Frontend architecture & integration |
| Élise    | UI Lead / Frontend Systems          | UI systems & frontend integration   |

---

# 4. Global Workload Philosophy

The objective is not only to distribute titles.

The objective is to balance:

* coding workload,
* invisible coordination workload,
* integration workload,
* debugging workload,
* architecture workload,
* evaluation preparation.

Important:

* PO and Tech Lead include major invisible workloads.
* Therefore their feature quantity must remain realistic.
* Gameplay and UI responsibilities must include substantial technical implementation.
* Every member must contribute significantly to coding.
* Nobody should become overloaded.
* Nobody should become underloaded.

Target balance:

| Member   | Main Invisible Work     | Main Coding Work             |
| -------- | ----------------------- | ---------------------------- |
| Martin   | Product/game decisions  | Gameplay multiplayer systems |
| Jerem    | Planning & coordination | Backend infrastructure       |
| Jennifer | Architecture & reviews  | Frontend integration         |
| Élise    | UI consistency          | Frontend systems integration |

---

# 5. Role Distribution

| Role                              | Owner    |
| --------------------------------- | -------- |
| Product Owner                     | Martin   |
| Gameplay Multiplayer Systems Lead | Martin   |
| Gamification Lead                 | Martin   |
| Project Manager / Scrum Master    | Jerem    |
| Backend Infrastructure Lead       | Jerem    |
| Technical Lead / Architect        | Jennifer |
| Frontend Architecture Lead        | Jennifer |
| Rendering & Integration Lead      | Jennifer |
| UI Lead                           | Élise    |
| Frontend Systems Integration Lead | Élise    |
| Developers                        | Everyone |

---

# 6. Product Owner — Martin

## Purpose

The Product Owner is responsible for gameplay coherence and multiplayer game systems.

Martin ensures that the gameplay remains:

* coherent,
* understandable,
* synchronized,
* balanced,
* technically realistic.

---

## Main Responsibilities

Martin is responsible for:

* defining gameplay rules,
* defining the multiplayer game flow,
* defining victory/loss conditions,
* validating gameplay decisions,
* freezing gameplay MVP scope,
* documenting gameplay systems,
* defining gameplay priorities,
* validating gameplay coherence.

---

## Technical Responsibilities

Martin is also one of the largest gameplay developers of the project.

He is responsible for:

* movement engine,
* collisions systems,
* enemy movement systems,
* gameplay state machine,
* map parsing,
* map validation algorithms,
* multiplayer gameplay synchronization logic,
* game rooms lifecycle logic,
* lobby/game transitions,
* match lifecycle systems,
* game restart/rematch systems,
* game customization systems,
* gamification systems,
* achievements logic,
* progression systems,
* gameplay balancing,
* gameplay testing tools.

---

## Expected Deliverables

Martin must maintain:

* gameplay rules documentation,
* multiplayer gameplay flow,
* map rules,
* enemy behavior rules,
* customization rules,
* gamification rules,
* gameplay test maps,
* postponed gameplay features list.

---

## What Martin Must Avoid

Martin should not:

* continuously change gameplay scope,
* add unplanned systems during development,
* impose technical architecture decisions alone,
* create unnecessary gameplay complexity,
* bypass technical validation.

Technical architecture decisions must be validated with Jennifer and Jerem.

---

## Evaluation Expectations

Martin must be able to explain:

* gameplay systems,
* multiplayer gameplay logic,
* enemy systems,
* collisions,
* synchronization logic,
* room lifecycle,
* WebSocket client integration,
* customization systems,
* gamification systems,
* balancing decisions,
* what he personally implemented.

---

# 7. Project Manager / Backend Lead — Jerem

## Purpose

The Project Manager is responsible for organization, planning visibility, and backend infrastructure stability.

The PM ensures that:

* the team remains coordinated,
* meetings remain useful,
* blockers remain visible,
* responsibilities stay clear,
* the MVP stays controlled.

---

## Main PM Responsibilities

Jerem is responsible for:

* organizing meetings,
* preparing agendas,
* writing meeting summaries,
* maintaining task tracking,
* tracking blockers,
* assigning tasks clearly,
* tracking MVP progress,
* ensuring unfinished tasks are followed.

---

## Mandatory PM Deliverables

| Deliverable         | Frequency       |
| ------------------- | --------------- |
| Task board          | Continuous      |
| Meeting agenda      | Before meetings |
| Meeting summary     | After meetings  |
| MVP tracking        | Weekly          |
| Sprint planning     | Weekly          |
| Blockers list       | Continuous      |
| Task ownership list | Continuous      |

---

## Backend Infrastructure Responsibilities

Jerem is responsible for:

* Express backend setup,
* API architecture,
* PostgreSQL integration,
* Prisma setup,
* authentication backend,
* JWT/session logic,
* password hashing,
* backend validation,
* backend security basics,
* WebSocket infrastructure,
* connection/disconnection handling,
* rooms infrastructure,
* realtime backend synchronization,
* Docker backend setup,
* backend deployment preparation.

---

## Important Workload Note

The PM role includes heavy invisible workload:

* planning,
* organization,
* communication,
* coordination,
* blocker management.

Therefore:

* backend architecture must remain simple,
* unnecessary complexity must be avoided,
* gameplay logic must be delegated to Martin,
* frontend integration must be delegated to Élise and Jennifer.

---

## What Jerem Must Avoid

Jerem should not:

* disappear from PM responsibilities,
* leave meetings undocumented,
* silently change APIs,
* overload backend complexity,
* centralize every technical responsibility,
* become the only person understanding backend systems.

---

## Evaluation Expectations

Jerem must be able to explain:

* project organization,
* planning structure,
* backend architecture,
* authentication,
* frontend/backend communication,
* database structure,
* WebSocket infrastructure,
* synchronization infrastructure,
* deployment logic,
* WebSocket client integration,
* what he personally implemented.

---

# 8. Technical Lead / Frontend Architecture — Jennifer

## Purpose

The Technical Lead is responsible for technical coherence and integration quality.

Jennifer ensures that:

* architecture stays maintainable,
* frontend/backend integration stays stable,
* technical choices stay realistic,
* rendering stays coherent,
* the project remains demonstrable.

---

## Main Responsibilities

Jennifer is responsible for:

* frontend architecture,
* technical conventions,
* folder structures,
* frontend/backend consistency,
* reviews of critical PRs,
* architecture validation,
* risky technical decisions validation,
* API contracts coordination,
* maintaining GitHub Issues / project board,
* maintaining roadmap visibility,
* integration strategy,
* tracking blockers,
* assigning tasks clearly,
* tracking MVP progress,
* ensuring unfinished tasks are followed,
* technical documentation.

---

## Frontend Architecture Responsibilities

Jennifer is responsible for:

* React structure,
* routing architecture,
* frontend organization,
* shared frontend types,
* WebSocket client integration,
* realtime frontend synchronization,
* game rendering architecture,
* map rendering integration,
* frontend/backend synchronization,
* rendering consistency,
* global frontend error handling.

---

## Visual Direction Coordination

Jennifer coordinates:

* gameplay visual consistency,
* rendering consistency,
* gameplay UI coherence,
* frontend visual integration,
* visual identity validation.

This does not mean producing all visual assets alone.

---

## Important Workload Note

The Technical Lead role already includes:

* reviews,
* debugging,
* architecture decisions,
* integration support,
* technical coordination.

Therefore Jennifer should NOT:

* own too many isolated pages,
* own large CRUD systems,
* become support for every issue,
* centralize all frontend coding.

---

## What Jennifer Must Avoid

Jennifer should not:

* write everyone’s code,
* fix every issue alone,
* absorb PM responsibilities,
* become the only person understanding architecture,
* over-engineer frontend systems.

---

## Evaluation Expectations

Jennifer must be able to explain:

* frontend architecture,
* integration strategy,
* rendering architecture,
* frontend/backend communication,
* technical conventions,
* review strategy,
* technical consistency decisions,
* what she personally implemented.

---

# 9. UI Lead / Frontend Integration — Élise

## Purpose

The UI Lead is responsible for frontend systems integration, responsive systems, reusable components, and user-facing frontend logic.

This role is highly technical and includes:

* frontend integration,
* state synchronization,
* forms systems,
* notifications systems,
* profile systems,
* API integration.

---

## Main Responsibilities

Élise is responsible for:

* reusable UI systems,
* responsive frontend layouts,
* frontend forms systems,
* frontend validation systems,
* notifications systems,
* profile systems,
* auth frontend flows,
* accessibility basics,
* i18n systems,
* frontend state synchronization,
* frontend API integration,
* user-facing polish.

---

## Technical Responsibilities

Élise is a major frontend systems developer.

She is responsible for:

* login/register systems,
* profile systems,
* settings systems,
* notifications integration,
* auth frontend flow,
* session restoration,
* avatar systems,
* frontend forms validation,
* API hooks integration,
* frontend data synchronization,
* frontend loading/error states,
* language switching systems,
* i18n integration,
* responsive systems,
* reusable UI components,
* frontend state handling.

---

## Design System Responsibilities

Élise maintains reusable components such as:

* Button,
* Input,
* Card,
* Modal,
* Navbar,
* Avatar,
* Badge,
* Toast,
* FormError,
* Layout,
* Tabs,
* LoadingState.

This supports the custom-made design system module.

---

## Important Workload Note

Élise owns substantial frontend implementation workload.

This role is not only visual work.

It includes:

* frontend logic,
* frontend integration,
* frontend synchronization,
* frontend systems architecture support.

---

## What Élise Must Avoid

Élise should not:

* work only on visuals,
* create isolated UI pages,
* bypass architecture conventions,
* modify backend contracts alone.

Architecture decisions must remain aligned with Jennifer and Jerem.

---

## Evaluation Expectations

Élise must be able to explain:

* frontend systems integration,
* reusable components,
* notifications systems,
* forms systems,
* frontend synchronization,
* API integration,
* i18n systems,
* responsive systems,
* what she personally implemented.

---

# 10. Shared Developer Responsibilities

Every member is also a developer.

Each member must:

* write code,
* test their code,
* document their work,
* use feature branches,
* create understandable commits,
* participate in reviews,
* understand the global project,
* explain their own contributions.

Nobody should only:

* manage,
* organize,
* design,
* decide.

Everyone must contribute technically.

---

# 11. Detailed Technical Ownership

| Area                               | Main Owner | Support  |
| ---------------------------------- | ---------- | -------- |
| Gameplay systems                   | Martin     | Jennifer |
| Multiplayer gameplay logic         | Martin     | Jerem    |
| Enemy systems                      | Martin     | Jerem    |
| Gamification systems               | Martin     | Élise    |
| Game customization                 | Martin     | Jennifer |
| Frontend architecture              | Jennifer   | Élise    |
| Backend infrastructure             | Jerem      | Jennifer |
| WebSocket infrastructure           | Jerem      | Jennifer |
| WebSocket gameplay synchronization | Martin     | Jerem    |
| WebSocket client                   | Jennifer   | Jerem    |
| UI systems                         | Élise      | Jennifer |
| Notifications systems              | Élise      | Jerem    |
| Authentication frontend            | Élise      | Jerem    |
| Authentication backend             | Jerem      | Élise    |
| Responsive systems                 | Élise      | Jennifer |
| Rendering integration              | Jennifer   | Martin   |
| Frontend state systems             | Élise      | Jennifer |
| API integration                    | Élise      | Jerem    |
| Database schema                    | Jerem      | Jennifer |
| Docker setup                       | Jerem      | Jennifer |
| README coordination                | Jennifer   | Everyone |

---

# 12. Estimated Workload Distribution

| Member   | Main Technical Load                 | Invisible Load         | Estimated Balance |
| -------- | ----------------------------------- | ---------------------- | ----------------- |
| Martin   | Gameplay + multiplayer systems      | Product decisions      | Heavy             |
| Jerem    | Backend + realtime infrastructure   | PM coordination        | Heavy             |
| Jennifer | Frontend architecture + integration | Reviews & architecture | Heavy             |
| Élise    | Frontend systems + UI integration   | UI consistency         | Heavy             |

The objective is balanced workload through different types of responsibilities, not identical task types.

---

# 13. MVP Definition

## MVP Includes

* user registration,
* user login,
* map creation,
* map editing,
* map validation,
* multiplayer labyrinth gameplay,
* realtime player synchronization,
* game rooms,
* lobby system,
* map publication,
* public maps exploration,
* profile system,
* notifications,
* responsive frontend,
* Docker setup,
* PostgreSQL,
* Prisma ORM,
* README documentation.

---

## MVP Does NOT Include

* economy systems,
* persistent open world,
* advanced progression,
* blockchain,
* microservices,
* AI opponent,
* advanced matchmaking,
* large social systems,
* advanced analytics,
* 3D rendering.

These can only be considered later if the MVP is stable.

---

# 14. Modules Ownership

## Major Modules

| Module                     | Main Owner       | Support           |
| -------------------------- | ---------------- | ----------------- |
| Framework frontend/backend | Jennifer / Jerem | Everyone          |
| Realtime features          | Jerem            | Martin / Jennifer |
| Standard user management   | Élise / Jerem    | Jennifer          |
| Complete web-based game    | Martin           | Jennifer          |
| Remote players             | Martin / Jerem   | Jennifer          |

---

## Minor Modules

| Module                     | Main Owner | Support  |
| -------------------------- | ---------- | -------- |
| ORM                        | Jerem      | Jennifer |
| Multiple languages         | Élise      | Jennifer |
| Gamification system        | Martin     | Élise    |
| Notification system        | Élise      | Jerem    |
| Custom-made design system  | Élise      | Jennifer |
| Game customization options | Martin     | Jennifer |

---

# 15. Communication Rules

## Meetings

The team should have:

* one weekly planning meeting,
* short progress updates during the week,
* additional meetings only when needed.

---

## Meeting Structure

Each meeting should answer:

1. What was completed?
2. What is blocked?
3. What needs review?
4. Did the MVP change?
5. What is the next task for each member?

---

## Decision Rules

| Decision Type       | Main Lead |
| ------------------- | --------- |
| Product decisions   | Martin    |
| Technical decisions | Jennifer  |
| Planning decisions  | Jerem     |
| UI decisions        | Élise     |

Important decisions must always be documented.

---

# 16. Pull Requests and Code Reviews

## Branching Strategy

Recommended branches:

* `main` → stable only,
* `dev` → integration branch,
* `feature/name` → features,
* `fix/name` → bug fixes,
* `docs/name` → documentation.

No direct push to `main`.

---

## Pull Requests

Each PR should include:

* summary of changes,
* testing information,
* screenshots if UI changed,
* known limitations,
* reviewer.

---

## Review Rules

| Type             | Preferred Reviewer |
| ---------------- | ------------------ |
| Architecture PRs | Jennifer           |
| Backend PRs      | Jerem              |
| Gameplay PRs     | Martin + Jennifer  |
| UI PRs           | Élise + Jennifer   |

---

# 17. Evaluation Preparation

Each member must understand:

* the project goal,
* the MVP,
* selected modules,
* frontend/backend communication,
* WebSocket synchronization,
* authentication,
* database structure,
* architecture,
* their own contributions.

Nobody should only understand their isolated part.

---

# 18. Risk Management

| Risk                        | Prevention                              |
| --------------------------- | --------------------------------------- |
| MVP becomes too large       | Freeze MVP early                        |
| Scope constantly changes    | Maintain written backlog                |
| Jennifer becomes bottleneck | Limit feature overload                  |
| Jerem overloaded            | Keep backend infrastructure simple      |
| Élise underloaded           | Give systems integration ownership      |
| Martin undercodes           | Give multiplayer/game systems ownership |
| Integration problems        | Define API contracts early              |
| WebSocket complexity        | Keep first version minimal              |
| Evaluation failure          | Document everything clearly             |

---

# 19. Final Team Rules

The objective is not to build the biggest possible project.

The objective is to build:

* a stable project,
* a demonstrable project,
* a maintainable project,
* a coherent project,
* a project the entire team understands.

Every member must:

* contribute,
* communicate,
* review,
* test,
* document,
* understand the project globally.
