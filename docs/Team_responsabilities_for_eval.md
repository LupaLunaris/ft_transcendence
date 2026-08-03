# Team Responsibilities for the 42 Evaluation

This document defines the technical responsibilities of each team member based on the **actual work visible in the Git history, merged Pull Requests and repository analysis**.

The goal is not to prevent anyone from working on another part of the project, but to clearly define **who is expected to know, explain and defend each subsystem during the evaluation.**

Every member should understand the overall architecture of the project, but each person is responsible for mastering the areas below.

---

# Jennifer Paulis
## Technical Lead — Frontend Architecture & Integration

### Main responsibility

Jennifer is responsible for the overall frontend architecture and for integrating the different parts of the project into a single coherent application.

### Must fully understand

### Frontend Architecture

- React application structure
- Routing
- Hooks
- AuthContext
- API layer
- Shared TypeScript types
- Communication between frontend and backend
- Frontend project organization

### Frontend User Management

- Login / Register frontend flow
- Profile page
- Profile editing
- Avatar management
- Friends interface
- Friend search
- Online status integration
- Frontend validation
- Error handling

### Frontend Integration

- React ↔ Express communication
- React ↔ Phaser integration
- Shared package
- API contracts
- State synchronization

### Game Customization

- Map editor improvements
- Default map behaviour
- Publication workflow
- Test before publish
- Navigation between editor and gameplay
- UX improvements around map creation

### Gamification

- XP system
- Levels
- Achievements
- Rewards
- Progression display
- XP notifications

### Stabilization

- Integration of features coming from the other team members
- Frontend bug fixing
- Documentation
- Final polishing

Jennifer should be able to explain how every frontend subsystem communicates together and why the frontend architecture was designed this way.

---

# Martin Malafont
## Gameplay Lead

### Main responsibility

Martin is responsible for the game itself and the gameplay systems.

### Must fully understand

### Gameplay

- Core gameplay rules
- Player movement
- Collision system
- Victory / defeat conditions
- Spawn logic
- Exit logic

### Phaser

- Phaser architecture
- Scenes
- Rendering
- Game loop
- Sprites
- Animations

### Tower

- Tower gameplay
- Enemy behaviour
- Progression
- Internal gameplay logic

### Multiplayer

- Duel gameplay
- Remote players
- Ghost system
- Synchronization
- Reconnection
- Fair-play logic
- Multiplayer game state

### Editor Core

- Internal map representation
- Gameplay/editor interaction
- Grid behaviour
- Core gameplay mechanics

Martin should be able to explain how the game works internally from Phaser to multiplayer gameplay.

---

# Jérémie Debrull
## Backend & Infrastructure Lead

### Main responsibility

Jérémie is responsible for the backend architecture and infrastructure.

### Must fully understand

### Backend

- Express architecture
- REST API
- Middleware
- Routes
- Validation
- Controllers

### Database

- Prisma
- PostgreSQL
- Relations
- Migrations
- ORM design

### Authentication

- JWT
- Password hashing
- Protected routes
- Authorization
- User permissions

### Backend Features

- Users
- Friends
- Maps
- Scores
- Backend avatar upload
- Online status backend

### Infrastructure

- Docker
- Docker Compose
- Reverse Proxy
- Environment configuration

### Security

- Vault
- WAF
- ModSecurity
- Secret management

Jérémie should be able to explain the backend architecture from the database up to the API.

---

# Elise Van Droogenbroeck
## UI / UX & Frontend Lead

### Main responsibility

Elise is responsible for the user interface, user experience and several frontend features.

### Must fully understand

### User Interface

- Reusable UI components
- Tailwind CSS
- Forms
- Layouts
- Navigation
- Responsive interface
- Visual consistency

### Frontend Features

- Profile interface improvements
- Profile editor
- Navbar
- User interface around maps
- Map panel
- Map deletion interface
- Login/Register frontend flow improvements

### Internationalization

- i18next
- Translation system
- French / English / Dutch
- Translation organization
- Language switching

### Notifications

- Toast notification system
- Unsaved map notifications
- User feedback messages
- Frontend notification architecture

### Legal Pages

- Privacy Policy
- Terms of Service
- Footer
- Legal routing

### UX Improvements

- Accessibility improvements
- Profile fixes
- Navbar fixes
- Frontend quality improvements

Elise should be able to explain how the user interface is built, translated and maintained across the whole project.

---

# Shared Responsibilities

Some parts were clearly collaborative and everyone involved should understand them.

## User Management

Primary owners:

- Jennifer (Frontend)
- Jérémie (Backend)

Support:

- Elise (UI, translations, profile improvements)
- Martin (avatar sprite integration)

---

## Authentication

Primary owner:

- Jérémie

Support:

- Jennifer (frontend validation)
- Elise (login/register frontend flow)

---

## Database / Prisma

- Jérémie

Everyone involved should understand the database schema and the purpose of the main tables.

---

## Game Customization

Primary owners:

- Martin (gameplay/editor core)
- Jennifer (customization workflow)

Support:

- Elise (UI)
- Jérémie (backend routes)

---

## Project Knowledge (Everyone)

Every member should be able to explain:

- Project concept
- Overall architecture
- Folder structure
- React
- Express
- Prisma
- PostgreSQL
- Socket.IO
- Phaser
- Docker
- Chosen 42 modules
- Why these modules were selected
- How each claimed module is demonstrated during the evaluation

---

# Evaluation Rule

During the defense:

- The main owner of a subsystem should be able to answer technical questions without assistance and be able to modify or extend the related code during the evaluation if requested.
- Other team members should understand the subsystem well enough to explain its purpose and how it interacts with the rest of the project.
- Collaborative features should be understood by every contributor involved.

This document reflects the **actual implementation history observed in the Git repository** rather than the initial project planning.