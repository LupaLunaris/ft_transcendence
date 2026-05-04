# Team Organization

> Initial team structure for **ft_transcendence**.  
> This organization ensures a balanced workload, clear responsibilities, and
> full alignment with evaluation requirements.

---

## Overview

| Area | Owner | Status |
| --- | --- | --- |
| Product direction | Martin | Active |
| Project coordination | Jerem | Active |
| Technical architecture | Jennifer | Active |
| Gameplay logic | Martin | Active |
| Frontend & UX | Jennifer | Active |
| Backend core | Jerem | Active |
| Security (integrated) | Jerem | Active |
| UI system & features | Élise | Active |

---

## Roles Distribution

| Member | Roles |
| --- | --- |
| Martin | Product Owner (PO), Developer |
| Jerem | Project Manager (PM / Scrum Master), Developer |
| Jennifer | Technical Lead / Architect, Developer |
| Élise | UI Lead & Integration Developer |

---

## Role Responsibilities

### Product Owner (Martin)

- Defines the overall game vision
- Designs gameplay mechanics and experience
- Prioritizes features
- Validates gameplay and user experience
- Ensures the project meets its objectives

### Project Manager (Jerem)

- Organizes team meetings and planning sessions
- Tracks progress and deadlines
- Manages tasks (GitHub, etc.)
- Identifies and resolves blockers
- Ensures clear communication within the team

### Technical Lead (Jennifer)

- Defines technical architecture
- Makes technology decisions
- Ensures code quality and consistency
- Reviews critical implementations
- Maintains technical coherence across the project

### UI Lead & Integration (Élise)

- Ensures UI consistency and usability
- Oversees frontend integration
- Coordinates UI components and pages
- Ensures proper connection between frontend and backend
- Contributes to user experience improvements

### Developers (All Members)

All team members are developers and must:

- Implement features
- Participate in code reviews
- Test their work
- Document their contributions
- Understand the overall project

---

## Team Members

### Martin

**Roles**

- Product Owner
- Developer (Gameplay)

**Main focus**

- Gameplay design
- Game mechanics

**Responsibilities**

- Define gameplay loop
- Implement labyrinth logic
- Implement card system
- Define game rules and progression
- Ensure gameplay coherence

**Constraints**

- No advanced 3D
- Focus on logic, not UI

**Linked modules**

| Module | Contribution |
| --- | --- |
| Gaming | Core game |
| Gaming | Game customization |

---

### Jerem

**Roles**

- Project Manager
- Developer (Backend & Security)

**Main focus**

- Backend development
- Project organization

**Responsibilities**

- Develop backend (Express)
- Implement API endpoints
- Handle authentication (JWT)
- Manage database (Prisma/PostgreSQL)
- Ensure backend validation
- Apply security best practices:
  - password hashing
  - input validation
  - rate limiting
- Support real-time backend

**Secondary responsibilities**

- Organize team workflow
- Track tasks and progress
- Manage blockers

**Linked modules**

| Module | Contribution |
| --- | --- |
| Web | Backend |
| User Management | Auth system |
| Web | API |
| Security | Backend protections |

---

### Jennifer

**Roles**

- Technical Lead
- Developer (Frontend & Integration)

**Main focus**

- Frontend architecture
- User experience
- Integration

**Responsibilities**

- Build frontend with React
- Implement UI and game interface
- Handle game rendering (2D labyrinth)
- Integrate WebSocket on frontend
- Ensure UX quality
- Maintain consistency between systems

**Secondary responsibilities**

- Support architecture decisions
- Help team on technical issues

**Linked modules**

| Module | Contribution |
| --- | --- |
| Web | Frontend |
| Gaming | Game interface |
| Web | Real-time frontend |

---

### Élise

**Roles**

- UI Lead & Integration Developer

**Main focus**

- Interface development
- UI consistency
- Frontend integration

**Responsibilities**

- Develop main UI pages:
  - login / register
  - profile
- Build reusable components
- Connect frontend to backend
- Improve UI responsiveness
- Assist integration of features
- Ensure consistency in design

**Secondary responsibilities**

- Participate in testing
- Support frontend improvements
- Contribute to UX adjustments

**Linked modules**

| Module | Contribution |
| --- | --- |
| Web | UI components |
| Accessibility | UI structure |
| Web | Notification UI |

---

## Technical Direction

### Chosen approach

- 2D rendering (Canvas / DOM)
- React frontend
- Express backend
- Prisma + PostgreSQL
- WebSocket for real-time

### Avoid

- Advanced 3D (too complex)
- Over-engineered security
- Microservices
- Complex infrastructure

---

## Work Method

### Principles

- Balanced workload
- No isolated roles
- Continuous communication
- Shared understanding

### Current Phase

**Focus on**

- MVP definition
- Architecture
- Task distribution

**Avoid**

- Over-complex solutions
- Blocking dependencies
- Premature decisions

---

## Immediate Priorities

### Martin

- Define gameplay loop
- Document game rules

### Jerem

- Set up backend
- Implement authentication

### Jennifer

- Set up frontend
- Define UI structure

### Élise

- Build basic pages (login/register)
- Start component system

---

## Internal Rule

Each member must be able to explain:

- Architecture
- Their work
- Technical choices
- Work distribution

---

## Final Note

This organization ensures:

- Balanced team structure
- Clear responsibilities
- Real contribution from each member
- A project that is coherent, feasible, and evaluable
