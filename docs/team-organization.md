# Team Organization

---

## Overview

| Area | Owner |
| --- | --- |
| Product direction | Martin |
| Project coordination | Jerem |
| Technical architecture | Jennifer |
| Gameplay logic | Martin |
| Backend & API | Jerem |
| Real-time backend (WebSocket) | Jerem |
| Frontend logic & integration | Jennifer |
| UI & Components | Élise |

---

## Roles Distribution

| Member | Roles |
| --- | --- |
| Martin | Product Owner (PO), Developer |
| Jerem | Project Manager (PM), Backend Developer |
| Jennifer | Technical Lead, Frontend Developer |
| Élise | UI Lead & Integration Developer |

---

## Role Responsibilities

### Product Owner - Martin

- Defines game concept and rules
- Designs gameplay loop
- Prioritizes features
- Validates gameplay coherence

### Project Manager - Jerem

- Organizes workflow and meetings
- Tracks progress
- Manages tasks and merges
- Identifies blockers

### Technical Lead - Jennifer

- Defines architecture
- Ensures code quality
- Maintains consistency
- Reviews key implementations

### UI Lead - Élise

- Ensures UI consistency
- Builds reusable components
- Connects frontend to backend
- Improves usability

---

## Developer Responsibilities

All members must:

- Write code
- Review code
- Test features
- Document work
- Understand the full project

---

## Detailed Responsibilities

### Martin - Gameplay

**Focus**

- Game logic

**Tasks**

- Define game rules
- Implement labyrinth structure
- Handle player movement rules
- Detect win condition

**Constraint**

- No advanced systems (cards, progression)

---

### Jerem - Backend & Real-Time

**Focus**

- Backend + WebSocket

**Tasks**

- Express API
- Authentication (JWT)
- Database (Prisma)
- Input validation
- Security basics
- WebSocket server (Socket.IO)
- Game state synchronization

---

### Jennifer - Frontend Logic & Integration

**Focus**

- Frontend architecture

**Tasks**

- React app structure
- Game rendering (labyrinth grid)
- Handle player input
- Connect WebSocket
- Sync UI with backend
- Ensure UX coherence

---

### Élise - UI & Integration

**Focus**

- Interface & integration

**Tasks**

- Build pages:
  - Login
  - Register
  - Lobby
  - Profile
- Create reusable components
- Connect API (fetch/axios)
- Improve responsiveness
- Assist frontend integration

---

## Technical Direction

### Stack

| Layer | Choice |
| --- | --- |
| Frontend | React |
| Backend | Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Real-time | WebSocket (Socket.IO) |
| DevOps | Docker |

### Rendering

- 2D grid (DOM or Canvas)
- No 3D

### Avoid

- Microservices
- Over-engineering
- Complex infra

---

## Work Method

### Principles

- Clear responsibilities
- No blocking dependencies
- Frequent communication
- Simple first, improve later

### Current Focus

- MVP implementation
- Core architecture
- Basic gameplay

---

## Immediate Priorities

### Martin

- Define gameplay loop
- Implement basic labyrinth

### Jerem

- Setup backend
- Implement auth
- Setup WebSocket

### Jennifer

- Setup React app
- Create game view

### Élise

- Build UI pages
- Create components

---

## Internal Rule

Each member must be able to explain:

- Architecture
- Game flow
- WebSocket logic
- Their contributions

**Required for evaluation**

---

## Final Note

This organization ensures:

- Balanced workload
- Clear responsibilities
- Functional MVP
- Strong evaluation readiness
