# Selected Modules

## Major modules (10 pts)

### Web — Use a framework for both the frontend and backend *(2 pts)*

Frontend built with **React**, backend built with **Express**.
The goal is to structure the project with a clear separation between interface, business logic, and API.

---

### Web — Implement real-time features using WebSockets or similar technology *(2 pts)*

Real-time communication will be used to:

* detect when another player is online,
* update worlds live,
* synchronize shared actions,
* send live notifications.

The system must also handle connection loss and reconnection correctly.

---

### User Management — Standard user management and authentication *(2 pts)*

Users must have:

* account creation and authentication,
* editable profile page,
* avatar upload,
* friends / favorites system,
* online status visibility.

This module must include all required profile and friendship features, not only login/signup.

---

### Gaming and user experience — Implement a complete web-based game where users can play against each other *(2 pts)*

The project must provide a complete playable game:

* clear rules,
* progression,
* success / failure conditions,
* persistent game state.

The labyrinth world and card system must result in a real playable experience, not only an editor.

---

### Gaming and user experience — Remote players *(2 pts)*

Two users on separate machines must be able to interact with the same game session.

This requires:

* synchronized actions,
* proper handling of latency,
* reconnection management if a player disconnects.

---

## Minor modules (6 pts)

### Web — Use an ORM for the database *(1 pt)*

Database access will be handled through **Prisma** in order to keep models clean, readable, and maintainable.

---

### Accessibility and Internationalization — Support for multiple languages *(1 pt)*

The interface will support at least **3 languages**:

* French
* English
* German

All visible text must be translatable.

---

### Gaming and user experience — A gamification system to reward users for their actions *(1 pt)*

Three persistent progression systems will be implemented:

* XP / levels
* badges
* rewards

Leaderboard or daily challenges may be added if time allows.

---

### Web — A complete notification system for all creation, update, and deletion actions *(1 pt)*

Notifications will inform users when:

* a world is visited,
* a reward is unlocked,
* a card is obtained,
* a friend request is accepted.

---

### Web — Custom-made design system with reusable components *(1 pt)*

The interface will rely on reusable UI components:
buttons, cards, modals, inputs, notifications, profile blocks, inventory elements, etc.

At least 10 reusable components must be created.

---

### Gaming and user experience — Game customization options *(1 pt)*

Players will be able to customize their world through:

* different labyrinth pieces,
* decorative elements,
* unlockable visual variations.

This strengthens both replayability and progression.

---

## Total: 16 pts
