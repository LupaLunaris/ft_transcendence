# ft_transcendence

## Description

This project is a web application developed as part of the 42 curriculum.

The goal is to build a collaborative online game designed around exploration, progression, and world creation. Users will be able to unlock map elements, build their own labyrinth-like environments, complete challenges, and interact with worlds created by other players.

The application combines gameplay, progression systems, and controlled social interaction in a secure web environment.

---

## Core Game Principle

Each player progressively unlocks map elements by completing actions such as:

* solving questions or challenges,
* exploring existing worlds,
* testing other players' creations,
* completing objectives.

Unlocked elements can then be used to build a personal world made of modular map pieces.

Players can:

* create their own labyrinth,
* test their own world,
* explore worlds created by others,
* receive rewards through progression,
* use virtual currency to unlock decorative or gameplay elements.

User interaction will remain controlled through predefined communication systems to avoid unsafe free messaging.

---

## Project Structure

### frontend/

Contains the client-side application.

This part will handle:

* user interface,
* game rendering,
* navigation,
* interaction with backend APIs,
* responsive design.

Planned technologies: frontend framework, reusable components, game UI logic.

---

### backend/

Contains the server-side application.

This part will handle:

* authentication,
* API routes,
* business logic,
* game rules,
* rewards system,
* interaction with database.

Planned technologies: backend framework, secure REST API, websocket features.

---

### database/

Contains database-related resources.

This part will include:

* schema design,
* migrations,
* relations between users, worlds, tiles, rewards and interactions.

Main entities expected:

* users
* worlds
* tiles
* inventory
* rewards
* interactions

---

### docker/

Contains containerization and environment setup.

This part will define:

* service containers,
* development environment,
* database service,
* backend service,
* frontend service.

Goal: full project startup with one command.

---

### docs/

Contains technical and project documentation.

This part may include:

* architecture diagrams,
* module planning,
* task organization,
* database diagrams,
* technical decisions.

---

## Initial Technical Goal

The first objective is to establish a clean working base:

* repository structure,
* protected branches,
* frontend and backend startup,
* database connection,
* Docker orchestration.

---

## Development Approach

The project will first focus on a minimal playable version:

* user login,
* basic world grid,
* tile placement,
* simple progression loop.

Additional systems will be added progressively afterward.
