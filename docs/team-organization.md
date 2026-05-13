# Team Organization — ft_transcendence

*This project has been created as part of the 42 curriculum.*

---

# Table of Contents

1. Project Objective
2. Global Team Summary
3. Team Overview
4. Global Workload Philosophy
5. Role Distribution
6. Product Owner — Martin
7. Project Manager / Backend Lead — Jerem
8. Technical Lead / Frontend Architecture — Jennifer
9. UI Lead / Frontend Integration — Élise
10. Shared Developer Responsibilities
11. Detailed Technical Ownership
12. MVP Definition
13. Modules Ownership
14. Communication Rules
15. Pull Requests and Code Reviews
16. Evaluation Preparation
17. Risk Management
18. Final Team Rules

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

## Martin — Product Owner & Gameplay Systems

Martin owns:

* gameplay vision,
* gameplay rules,
* labyrinth systems,
* enemy systems,
* movement logic,
* map validation,
* game balance.

Expected result:

The game is coherent, playable, understandable, and fun.

---

## Jerem — Project Manager & Backend Lead

Jerem owns:

* project organization,
* meetings,
* planning,
* backend architecture,
* API,
* authentication,
* database,
* WebSocket server.

Expected result:

The backend is stable, organized, synchronized, and the team always knows the project status.

---

## Jennifer — Technical Lead & Frontend Architecture

Jennifer owns:

* technical coherence,
* frontend architecture,
* integration quality,
* reviews,
* frontend/game integration,
* game rendering architecture,
* visual direction coordination.

Expected result:

The project remains maintainable, coherent, demonstrable, and technically clean.

---

## Élise — UI Lead & Frontend Integration

Élise owns:

* UI system,
* reusable components,
* responsive pages,
* frontend integration,
* user-facing polish,
* accessibility basics,
* i18n integration,
* frontend API integration.

Expected result:

The application is clean, usable, responsive, understandable, and visually coherent.

---

# 3. Team Overview

| Member   | Main Role                           | Main Technical Focus                        |
| -------- | ----------------------------------- | ------------------------------------------- |
| Martin   | Product Owner                       | Gameplay systems                            |
| Jerem    | Project Manager / Backend Lead      | Backend, API, WebSocket                     |
| Jennifer | Technical Lead / Frontend Architect | Frontend architecture, integration, reviews |
| Élise    | UI Lead / Frontend Integration      | UI systems, pages, frontend integration     |

---

# 4. Global Workload Philosophy

The goal is not only to distribute titles.

The goal is to balance:

* coding workload,
* invisible coordination workload,
* integration workload,
* technical complexity,
* evaluation preparation.

Important:

* Technical Lead and PM roles include large invisible workloads.
* Therefore, their pure feature implementation workload must remain realistic.
* Every member must contribute technically.
* Nobody should become overloaded.
* Nobody should become underloaded.

Target balance:

| Member   | Main Invisible Work          | Main Coding Work            |
| -------- | ---------------------------- | --------------------------- |
| Martin   | Product decisions            | Gameplay systems            |
| Jerem    | Planning & coordination      | Backend & realtime          |
| Jennifer | Architecture & reviews       | Frontend/game integration   |
| Élise    | UI consistency & integration | UI systems & frontend logic |

---

# 5. Role Distribution

| Role                           | Owner    |
| ------------------------------ | -------- |
| Product Owner                  | Martin   |
| Gameplay Systems Lead          | Martin   |
| Project Manager / Scrum Master | Jerem    |
| Backend Lead                   | Jerem    |
| Technical Lead / Architect     | Jennifer |
| Frontend Architecture Lead     | Jennifer |
| Visual Direction Coordinator   | Jennifer |
| UI Lead                        | Élise    |
| Frontend Integration Developer | Élise    |
| Developers                     | Everyone |

---

# 6. Product Owner — Martin

## Purpose

The Product Owner is responsible for the product vision and gameplay coherence.

The PO defines:

* what the game should be,
* what belongs in the MVP,
* what features are important,
* what should be postponed.

The PO protects the gameplay identity of the project.

---

## Main Responsibilities

Martin is responsible for:

* defining the gameplay loop,
* defining game objectives,
* defining win/loss conditions,
* deciding MVP gameplay priorities,
* documenting gameplay rules,
* keeping gameplay coherent,
* preventing gameplay scope explosion,
* validating gameplay-related features.

---

## Technical Responsibilities

Martin is also a major gameplay developer.

He is responsible for:

* movement systems,
* collision systems,
* enemy systems,
* map validation,
* map parsing,
* gameplay state logic,
* game balancing,
* gameplay testing,
* labyrinth logic,
* game rule implementation.

---

## Expected Deliverables

Martin must maintain:

* gameplay rules document,
* MVP gameplay scope,
* gameplay diagrams if needed,
* map rules,
* enemy behavior definitions,
* postponed features list.

---

## What Martin Must Avoid

Martin should not:

* continuously change the MVP,
* add unplanned features during implementation,
* impose technical architecture alone,
* overload the game with future ideas,
* bypass technical validation.

Technical decisions must be validated with Jennifer.

---

## Evaluation Expectations

Martin must be able to explain:

* the gameplay loop,
* the MVP choices,
* how gameplay systems work,
* how the labyrinth system works,
* enemy logic,
* game balancing decisions,
* what he personally implemented.

---

# 7. Project Manager / Backend Lead — Jerem

## Purpose

The Project Manager is responsible for project coordination, organization, planning visibility, and execution tracking.

The PM ensures that:

* the team stays organized,
* tasks remain visible,
* blockers are identified early,
* meetings are useful,
* decisions are documented.

---

## Main PM Responsibilities

Jerem is responsible for:

* organizing meetings,
* preparing meeting agendas,
* keeping meetings focused,
* writing meeting summaries,
* maintaining GitHub Issues / task board,
* tracking project progress,
* assigning tasks clearly,
* identifying blockers,
* following unfinished tasks,
* helping freeze the MVP,
* maintaining roadmap visibility,
* making sure responsibilities are clear.

---

## Mandatory PM Deliverables

Jerem must maintain:

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

## Backend Responsibilities

Jerem is also Backend Lead.

He is responsible for:

* Express backend setup,
* API architecture,
* Prisma setup,
* PostgreSQL integration,
* authentication,
* JWT/session logic,
* password hashing,
* backend validation,
* user routes,
* game routes,
* WebSocket server,
* rooms management,
* realtime synchronization,
* disconnect handling,
* reconnection basics.

---

## Important Workload Note

The PM role includes a large invisible workload:

* planning,
* coordination,
* follow-up,
* organization,
* communication.

Therefore:

* backend scope must remain realistic,
* backend complexity must stay controlled,
* responsibilities must be delegated when needed.

---

## What Jerem Must Avoid

Jerem should not:

* disappear from PM responsibilities,
* improvise planning constantly,
* leave meetings undocumented,
* silently change backend contracts,
* overload himself with unnecessary backend complexity,
* merge large changes without review.

---

## Evaluation Expectations

Jerem must be able to explain:

* how the team organized work,
* how meetings were managed,
* how tasks were tracked,
* how the backend works,
* how authentication works,
* how WebSocket synchronization works,
* what he personally implemented.

---

# 8. Technical Lead / Frontend Architecture — Jennifer

## Purpose

The Technical Lead is responsible for technical coherence and maintainability.

Jennifer ensures that:

* the architecture remains clean,
* integration remains stable,
* technical decisions stay realistic,
* the project remains demonstrable.

This role is transversal and includes:

* reviews,
* debugging support,
* integration guidance,
* architectural consistency.

---

## Main Responsibilities

Jennifer is responsible for:

* defining frontend architecture,
* validating the technical stack,
* defining folder structures,
* defining coding conventions,
* reviewing important pull requests,
* ensuring frontend/backend consistency,
* validating risky technical choices,
* preventing over-engineering,
* helping define API contracts,
* integration strategy,
* technical documentation.

---

## Frontend Architecture Responsibilities

Jennifer is responsible for:

* React structure,
* routing architecture,
* frontend organization,
* WebSocket client integration,
* game rendering architecture,
* frontend/backend synchronization,
* shared frontend types,
* global error handling,
* gameplay rendering consistency,
* visual direction coordination.

---

## Visual Direction Responsibilities

Jennifer also coordinates:

* gameplay visual coherence,
* visual identity consistency,
* map rendering integration,
* gameplay UI consistency,
* art direction validation.

This does not mean producing all graphical assets alone.

---

## Important Workload Note

The Technical Lead role includes heavy invisible workload:

* reviews,
* architecture decisions,
* debugging,
* integration support,
* consistency validation,
* technical coordination.

Therefore:

* Jennifer should not own too many isolated feature pages,
* Jennifer should not become the main support for every issue,
* Jennifer should not absorb other members' responsibilities.

---

## What Jennifer Must Avoid

Jennifer should not:

* write everyone’s code,
* fix every problem alone,
* take over the whole frontend,
* become the only person understanding the architecture,
* block progress through perfectionism.

---

## Evaluation Expectations

Jennifer must be able to explain:

* the full architecture,
* why the stack was chosen,
* frontend/backend communication,
* WebSocket integration,
* frontend organization,
* rendering logic,
* review process,
* technical consistency decisions,
* what she personally implemented.

---

# 9. UI Lead / Frontend Integration — Élise

## Purpose

The UI Lead is responsible for usability, responsive integration, reusable components, and user-facing consistency.

This role is not only visual.

It includes:

* frontend integration,
* state handling,
* API integration,
* usability,
* accessibility basics.

---

## Main Responsibilities

Élise is responsible for:

* reusable components,
* responsive layouts,
* forms,
* frontend pages,
* notifications UI,
* loading states,
* accessibility basics,
* i18n integration,
* user-facing polish,
* frontend API integration,
* frontend validation integration.

---

## Technical Responsibilities

Élise contributes heavily to frontend implementation.

She is responsible for:

* login page,
* register page,
* lobby page,
* profile page,
* settings page,
* notifications integration,
* avatar integration,
* frontend forms,
* API calls integration,
* UI-side state synchronization,
* responsive fixes,
* frontend data synchronization.

---

## Design System Responsibilities

Élise should maintain reusable components such as:

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

## What Élise Must Avoid

Élise should not:

* only work on decorative visuals,
* create isolated pages without integration,
* bypass frontend architecture conventions,
* modify API contracts alone.

Frontend architecture decisions must remain aligned with Jennifer.

---

## Evaluation Expectations

Élise must be able to explain:

* how the UI is structured,
* how reusable components work,
* how frontend integration works,
* how forms connect to backend APIs,
* how responsiveness was handled,
* how i18n works if implemented,
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
* understand the full project,
* be able to explain their work during evaluation.

Nobody should only:

* manage,
* design,
* organize,
* decide.

Everyone must contribute technically.

---

# 11. Detailed Technical Ownership

| Area                  | Main Owner | Support  |
| --------------------- | ---------- | -------- |
| Gameplay systems      | Martin     | Jennifer |
| Enemy systems         | Martin     | Jerem    |
| Frontend architecture | Jennifer   | Élise    |
| Backend architecture  | Jerem      | Jennifer |
| WebSocket server      | Jerem      | Jennifer |
| WebSocket client      | Jennifer   | Jerem    |
| UI components         | Élise      | Jennifer |
| Visual direction      | Jennifer   | Élise    |
| Authentication        | Jerem      | Élise    |
| Notifications         | Élise      | Jerem    |
| Map rendering         | Jennifer   | Martin   |
| Responsive UI         | Élise      | Jennifer |
| Game integration      | Jennifer   | Jerem    |
| Database schema       | Jerem      | Jennifer |
| Docker setup          | Jerem      | Jennifer |
| README coordination   | Jennifer   | Everyone |

---

# 12. MVP Definition

## MVP Includes

* user registration,
* user login,
* map creation,
* map editing,
* map validation,
* one playable labyrinth mode,
* remote realtime gameplay,
* basic profile,
* map publication,
* public map exploration,
* responsive frontend,
* Docker setup,
* PostgreSQL,
* Prisma ORM,
* README documentation.

---

## MVP Does NOT Include

* economy systems,
* large persistent world,
* advanced progression,
* marketplace systems,
* AI opponent,
* 3D rendering,
* blockchain,
* microservices,
* advanced matchmaking,
* heavy analytics,
* complex social systems.

These can only be considered later if the MVP is stable.

---

# 13. Modules Ownership

## Major Modules

| Module                     | Main Owner       | Support           |
| -------------------------- | ---------------- | ----------------- |
| Framework frontend/backend | Jennifer / Jerem | Everyone          |
| Realtime features          | Jerem            | Jennifer          |
| Standard user management   | Jerem            | Élise             |
| Complete web-based game    | Martin           | Jennifer / Jerem  |
| Remote players             | Jerem            | Jennifer / Martin |

---

## Minor Modules

| Module                     | Main Owner | Support       |
| -------------------------- | ---------- | ------------- |
| ORM                        | Jerem      | Jennifer      |
| Multiple languages         | Élise      | Jennifer      |
| Gamification system        | Martin     | Jerem / Élise |
| Notification system        | Élise      | Jerem         |
| Custom-made design system  | Élise      | Jennifer      |
| Game customization options | Martin     | Jennifer      |

---

# 14. Communication Rules

## Meetings

The team should have:

* one weekly planning meeting,
* short progress updates during the week,
* additional meetings only when necessary.

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

Important decisions should always be documented.

---

# 15. Pull Requests and Code Reviews

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
* screenshots if UI changed,
* testing information,
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

# 16. Evaluation Preparation

Each member must understand:

* the project goal,
* the MVP,
* selected modules,
* frontend/backend communication,
* authentication,
* WebSocket synchronization,
* database structure,
* their own contributions,
* the overall architecture.

Nobody should only understand their isolated part.

---

# 17. Risk Management

| Risk                        | Prevention                        |
| --------------------------- | --------------------------------- |
| MVP becomes too large       | Freeze MVP early                  |
| Scope constantly changes    | Maintain written backlog          |
| Jennifer becomes bottleneck | Limit feature overload            |
| Jerem overloaded            | Keep backend simple               |
| Élise underloaded           | Give integration responsibilities |
| Martin undercodes           | Give gameplay systems ownership   |
| Integration problems        | Define API contracts early        |
| WebSocket complexity        | Keep first version minimal        |
| Evaluation failure          | Document everything clearly       |

---

# 18. Final Team Rules

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

