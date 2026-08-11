*This project has been created as part of the 42 curriculum by malafont, jdebrull, jpaulis, and evan-dro.*

# ft_transcendence - Guilds of the Deep

Guilds of the Deep is a multiplayer browser game based on labyrinth exploration and creation.

Players can create their own maps, test and publish them, play maps created by other users, progress through the Tower and play against other players in real time.

## Documentation

| Document                                                               | Purpose                  |
| ---------------------------------------------------------------------- | ------------------------ |
| [README_install_and_start.md](README_install_and_start.md)             | Installation and startup |
| [docs/architecture.md](docs/architecture.md)                           | Project architecture     |
| [docs/README.md](docs/README.md)                                       | Documentation overview   |
| [docs/ft_transcendence.subject.pdf](docs/ft_transcendence.subject.pdf) | Official subject         |

---

# Description

**Guilds of the Deep** is a labyrinth game where players can create and play different maps.

A player can create a labyrinth with the editor, test it and publish it after completing it. Other players can then find and play the published map.

The game also has a Tower mode with predefined levels and multiplayer games where players can play together in real time.

Around the game, we added user profiles, friends, progression, achievements, leaderboards, customization and several other features required by the modules we selected.

### Main features

* Register and login
* User profiles and avatars
* Friends and online status
* Map editor
* Map testing and publication
* Community maps
* Tower mode
* Multiplayer games
* Remote players
* XP and levels
* Achievements and rewards
* Leaderboards
* Game customization
* Notifications
* English, French and Dutch languages
* Responsive interface

---

# Instructions

🔴 **JEREM - TO COMPLETE**

The complete installation guide is also available in [README_install_and_start.md](README_install_and_start.md).

---

# Team

| Member             | Role                           | Main area                             |
| ------------------ | ------------------------------ | ------------------------------------- |
| Martin (malafont)  | Product Owner / Gameplay Lead  | Gameplay, Phaser and multiplayer      |
| Jerem (jdebrull)   | Project Manager / Backend Lead | Backend, database and infrastructure  |
| Jennifer (jpaulis) | Technical Lead                 | Frontend architecture and integration |
| Elise (evan-dro)   | UI / UX Lead                   | UI, responsive, i18n and frontend UX  |

### Martin - Product Owner / Gameplay Lead

Martin worked mainly on the game and its gameplay.

He worked on Phaser, player movement, collisions, enemies, game rules, Tower mode, multiplayer gameplay and the core of the map editor.

He also worked with Jennifer on game customization and with Jerem on the multiplayer systems.

As Product Owner, he was also responsible for the general game concept and gameplay decisions.

### Jerem - Project Manager / Backend Lead

🔴 **JEREM - TO COMPLETE**

### Jennifer - Technical Lead

Jennifer worked mainly on the frontend architecture and the integration between the different parts of the project.

She worked on the React structure, API integration, frontend user management, shared types, game customization, gamification and project documentation.

She also reviewed and integrated changes from the different parts of the project.

### Elise - UI / UX Lead

🔴 **ELISE - TO COMPLETE**

---

# Project Management

## Project Organization

🔴 **JEREM - TO COMPLETE**

## Management Tools

🔴 **JEREM - TO COMPLETE**

## Communication

🔴 **JEREM - TO COMPLETE**

---

# Technical Stack

| Area           | Technology                               |
| -------------- | ---------------------------------------- |
| Frontend       | React + TypeScript + Vite                |
| Game           | Phaser                                   |
| Styling        | Tailwind CSS                             |
| Backend        | Node.js + Express + TypeScript           |
| Realtime       | Socket.IO                                |
| Database       | PostgreSQL                               |
| ORM            | Prisma                                   |
| Authentication | JWT + bcrypt                             |
| Validation     | Zod                                      |
| Languages      | i18next                                  |
| Tests          | Vitest, Jest, Testing Library, Supertest |
| Infrastructure | Docker Compose + Makefile                |

## Why we chose this stack

We chose React for the frontend because it works well for building the different pages and reusable components of the application.

Phaser handles the game itself, including scenes, movement, sprites and collisions.

Express is used for the API and backend logic. PostgreSQL stores the project data and Prisma makes it easier to work with the database from TypeScript.

Socket.IO is used for the parts of the project that need real-time communication, mainly multiplayer.

---

# Database Schema

🔴 **JEREM - TO COMPLETE**

---
# Features

| Feature                                     | Contributors                   |
| ------------------------------------------- | ------------------------------ |
| Core gameplay                               | Martin                         |
| Phaser scenes and game logic                | Martin                         |
| Tower mode                                  | Martin                         |
| Multiplayer gameplay                        | Martin                         |
| Remote players                              | Martin                         |
| Multiplayer 3+ players                      | Martin                         |
| Map editor core                             | Martin                         |
| Map customization workflow                  | Jennifer, Martin               |
| Map backend                                 | Jerem                          |
| Authentication backend                      | Jerem                          |
| Authentication frontend                     | Jennifer, Elise                |
| User profiles                               | Jennifer, Jerem, Elise         |
| Avatar backend                              | Jerem                          |
| Avatar frontend                             | Jennifer, Elise                |
| Avatar sprites                              | Martin                         |
| Friends backend                             | Jerem                          |
| Friends frontend                            | Jennifer, Elise                |
| Online status                               | Jerem, Jennifer                |
| XP and levels                               | Jennifer                       |
| Achievements and rewards                    | Jennifer                       |
| Leaderboards                                | Martin                         |
| Notifications                               | Elise                          |
| Internationalization                        | Elise                          |
| Design system / reusable UI                 | Elise                          |
| Responsive interface                        | Elise                          |
| Frontend architecture                       | Jennifer                       |
| API integration                             | Jennifer, Jerem                |
| Database / Prisma                           | Jerem                          |
| Docker / infrastructure                     | Jerem                          |
| WAF / Vault / security infrastructure       | Jerem                          |
| Legal pages                                 | Elise                          |
| Documentation                               | Jennifer, Martin, Jerem, Elise |
| Pull Request reviews and global code review | Jennifer                       |

---

# 42 Modules

## Major modules

| Module                              | Points | Responsible member(s) |
| ----------------------------------- | -----: | --------------------- |
| Framework for frontend and backend  |      2 | Jennifer, Jerem       |
| Real-time features                  |      2 | Martin, Jerem         |
| Standard user management            |      2 | Jennifer, Jerem       |
| Complete web-based game             |      2 | Martin                |
| Remote players                      |      2 | Martin                |
| Multiplayer game (3+ players)       |      2 | Martin                |
| WAF / ModSecurity + HashiCorp Vault |      2 | Jerem                 |

**Major: 14 points**

## Minor modules

| Module                     | Points | Responsible member(s) |
| -------------------------- | -----: | --------------------- |
| ORM - Prisma               |      1 | Jerem                 |
| Custom-made Design System  |      1 | Elise                 |
| Multiple Languages         |      1 | Elise                 |
| Game Customization Options |      1 | Jennifer, Martin      |
| Gamification System        |      1 | Jennifer, Martin      |
| Notification System        |      1 | Elise                 |
| Additional Browsers        |      1 | Elise                 |

**Minor: 7 points**

**Total: 21 points**

> Only modules that are fully working and demonstrable will be claimed during the final evaluation.

---

# Module Implementation

### Framework Frontend + Backend

The frontend uses React and the backend uses Express.

Jennifer worked on the frontend architecture and Jerem on the backend architecture.

**Responsible:** Jennifer, Jerem.

### Real-time Features

Socket.IO is used for real-time communication, mainly for multiplayer gameplay.

Martin worked on the multiplayer game logic and Jerem on the Socket.IO backend infrastructure.

**Responsible:** Martin, Jerem.

### Standard User Management

Users can update their profile, use an avatar, manage friends and see their online status.

Jennifer worked mainly on the frontend side and Jerem on the backend side.

**Responsible:** Jennifer, Jerem.

### Complete Web-based Game

The game is made with Phaser and includes movement, collisions, enemies, maps and win/loss conditions.

**Responsible:** Martin.

### Remote Players

Players on different computers can join and play the same game in real time.

**Responsible:** Martin.

### Multiplayer 3+

The multiplayer game supports more than two players at the same time.

**Responsible:** Martin.

### Cybersecurity

🔴 **JEREM - TO COMPLETE**

**Responsible:** Jerem.

### ORM

Prisma is used between the Express backend and PostgreSQL.

**Responsible:** Jerem.

### Design System

🔴 **ELISE - TO COMPLETE**

**Responsible:** Elise.

### Multiple Languages

The application uses i18next and supports English, French and Dutch.

**Responsible:** Elise.

### Game Customization

Players can create and customize maps before testing and publishing them.

Martin worked on the gameplay/editor core and Jennifer worked on the customization and publication workflow.

**Responsible:** Martin, Jennifer.

### Gamification

The project includes XP, levels, achievements, rewards and leaderboards.

**Responsible:** Jennifer, Martin.

### Notifications

🔴 **ELISE - TO COMPLETE**

**Responsible:** Elise.

### Additional Browsers

🔴 **ELISE - TO COMPLETE**

**Responsible:** Elise.


---

# Why We Chose These Modules

Most of the modules were chosen because they fit naturally with the game we wanted to make.

The gameplay modules were the most important ones for us: the complete game, remote players, multiplayer and real-time features all work together.

Game customization was also a logical choice because the project already has a map editor.

Gamification allowed us to add progression with XP, achievements and leaderboards.

The other modules such as user management, Prisma, multiple languages and the design system are used throughout the application and helped us make the project more complete.

---

# Individual Contributions

## Martin - malafont

Martin worked mainly on gameplay.

His work includes Phaser, movement, collisions, enemies, game rules, Tower mode, multiplayer gameplay and the core map/editor logic.

He also worked on remote players and multiplayer synchronization with Jerem and Jennifer, and on game customization and gamification with Jennifer.

As Product Owner, he was also responsible for the general gameplay direction of the project.

## Jerem - jdebrull

🔴 **JEREM - TO COMPLETE**

## Jennifer - jpaulis

Jennifer worked mainly on frontend architecture and integration.

Her work includes the React architecture, frontend/backend communication, API integration, frontend user management, shared TypeScript types, game customization and gamification.

She also worked on integrating and reviewing features made by the other members and on the project documentation.

## Elise - evan-dro

🔴 **ELISE - TO COMPLETE**

---

# Difficulties and Solutions

One difficulty was connecting the map editor with the game. A map should not just be saved: it also has to be playable. We added a system where the creator has to complete the map before it can be published.

Multiplayer was also one of the more difficult parts because the game state has to stay synchronized between several players. Socket.IO is used to exchange the necessary information between the clients and the backend.

Another difficulty was keeping React, Phaser and the backend working together while several people were modifying different parts of the project. Shared TypeScript types and Pull Request reviews helped us avoid some integration problems.

### Backend / infrastructure

🔴 **JEREM - TO COMPLETE**

### UI / responsive

🔴 **ELISE - TO COMPLETE**

---

# Resources

We mainly used:

* The official ft_transcendence subject
* 42 evaluation documentation
* React documentation
* TypeScript documentation
* Express documentation
* Prisma documentation
* PostgreSQL documentation
* Socket.IO documentation
* Phaser documentation
* Tailwind CSS documentation
* i18next documentation
* Docker documentation

---

# AI Usage

We used AI during the project mainly to help us:

* understand errors and unfamiliar code;
* debug problems;
* review some code and some Pull Requests;
* understand new technologies;
* clean and organize documentation;
* prepare for the evaluation.

AI suggestions were reviewed and tested before being kept in the project. Each member is still responsible for understanding the parts they worked on.
