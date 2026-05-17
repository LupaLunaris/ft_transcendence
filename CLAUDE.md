# CLAUDE.md — ft_transcendence

## Équipe
| Membre   | Login      | Email 42                            | Rôle               |
|----------|------------|-------------------------------------|--------------------|
| Martin   | malafont   | malafont@student.42belgium.be       | PO + Gameplay      |
| Jerem    | jdebrull   | jdebrull@student.42belgium.be       | PM + Backend       |
| Jennifer | jpaulis    | jpaulis@student.42belgium.be        | Tech Lead + Front  |
| Élise    | evan-dro   | evan-dro@student.42belgium.be       | UI Lead            |

## Stack
- Frontend : React 18 + TypeScript + Vite 8 + Phaser 3.80 + Tailwind CSS
- Backend  : Node.js + Express 4 + TypeScript
- Auth     : JWT (localStorage clé ft_token, header Authorization: Bearer)
- ORM      : Prisma 5 + SQLite (DATABASE_URL="file:./data.db")
- Realtime : Socket.IO 4.7
- Tests    : Vitest (frontend) + Jest 30 (backend)
- Zod      : v4 — utiliser .issues[0].message (pas .errors)

## Structure monorepo
/frontend   → React + Phaser
/backend    → Express + Prisma
/shared     → Types TypeScript partagés (compiler avant tout : npm run build -w shared)

## Conventions non négociables
- Erreurs API : { error: string, code: number }
- Réponses succès : { data: T } ou { data: T[], total, page, limit }
- Socket events : snake_case
- Client→Server : player_input, join_lobby, leave_lobby
- Server→Client : game_state, race_finished, player_joined, player_left, error_event
- Grille : TileValue[][] 25x25 — EMPTY=0 WALL=1 EXIT=2 SPAWN=3 ENEMY=4
- Phaser→React : this.game.events.emit(eventName, payload) — pas d'EventBus séparé
- Composants : fonctionnels + hooks, TypeScript strict, jamais de any
- Jamais de logique Phaser dans les composants React

## Admins
Les emails suivants ont is_admin=true automatiquement à la création de compte :
- malafont@student.42belgium.be
- jdebrull@student.42belgium.be
- jpaulis@student.42belgium.be
- evan-dro@student.42belgium.be

## Responsabilité des fichiers (headers 42)
- /backend/**                    → jdebrull
- /frontend/src/game/**          → malafont
- /frontend/src/components/**    → evan-dro
- /frontend/src/hooks/**         → jpaulis
- /frontend/src/context/**       → jpaulis
- /frontend/src/services/**      → jpaulis
- /frontend/src/pages/auth/**    → evan-dro
- /frontend/src/pages/editor/**  → malafont
- /frontend/src/pages/game/**    → malafont
- /frontend/src/pages/home/**    → evan-dro
- /shared/**                     → jpaulis

## État du projet
- Étapes 1-4 complètes
- Étape 5 (Socket.IO race) : à faire
- Éditeur admin + mode tour complet : à faire


