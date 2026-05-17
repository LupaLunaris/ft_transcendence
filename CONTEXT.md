# CONTEXT.md — Résumé rapide pour Claude

Stack : React 18 / Phaser 3.80 / Express 4 / Prisma 5 / SQLite / Socket.IO 4.7
Zod v4 : .issues[0].message (pas .errors)
Auth : JWT dans localStorage (ft_token), Bearer header
Phaser→React : this.game.events.emit() — pas d'EventBus
Shared : compiler avec npm run build -w shared avant tout démarrage

Admins : malafont, jdebrull, jpaulis, evan-dro (@student.42belgium.be)

Schéma Prisma actuel :
- User (id uuid, email, username, password_hash, avatar?, diamonds, tower_progress 0-8, created_maps_count, is_admin, created_at, updated_at)
- Map (id uuid, name, grid_json String, published, creator_completed, difficulty String, play_count, creator_id FK, created_at, updated_at)
- AdminMap (id uuid, order_index unique 1-8, name, grid_json String, created_at)
- Score (id uuid, completion_time_ms, user_id FK, map_id FK, created_at)

Types partagés (shared/src/types/) :
tiles, user, map, auth, game (Direction/Position/PlayerState/GameState/RaceResult), socket, api

Routes API actives (/api/v1/) :
auth: register, login, me, profile
maps: CRUD + complete + publish + my
tower: list + level/:order_index
scores: submit + leaderboard/:map_id

Socket.IO : io.on('connection') présent mais vide — auth JWT absente

Sprint actuel :
1. Corrections pré-étape-5 (double type, shared build, Zod, Socket auth)
2. Éditeur admin + mode tour complet
3. Étape 5 Socket.IO race

Génère les deux fichiers avec ce contenu exact.
Pas de header 42 sur ces fichiers (ce sont des fichiers de config, pas des fichiers source).

Correction 2 — Double définition + shared build automatique + Zod
Nouvelle conversation VS Code, ouvrir ces fichiers avant de coller :
frontend/src/services/api.service.ts + backend/src/middleware/validate.middleware.ts + package.json racine
[CONTEXTE — lire CONTEXT.md à la racine]

Trois corrections indépendantes à appliquer.

━━ CORRECTION 1 — Double définition de UpdateProfileRequest ━━

Dans frontend/src/services/api.service.ts :
Trouve la ligne qui redéfinit UpdateProfileRequest localement (vers ligne 32).
Supprime cette redéfinition locale.
Ajoute l'import manquant en tête du fichier :
import type { UpdateProfileRequest } from '@ft/shared'
Vérifie qu'aucun autre type de shared/ n'est redéfini localement dans ce fichier.

━━ CORRECTION 2 — Build automatique de shared/ ━━

Dans package.json à la racine, trouve le script "dev".
Remplace-le par :
"dev": "npm run build -w shared && concurrently \"npm run dev -w backend\" \"npm run dev -w frontend\""

Ajoute concurrently aux devDependencies racine si absent :
"concurrently": "^8.2.0"

Ajoute aussi ce script à la racine :
"prebuild": "npm run build -w shared"

━━ CORRECTION 3 — Zod v4 dans le middleware de validation ━━

Dans backend/src/middleware/validate.middleware.ts :
Trouve toute utilisation de error.errors ou result.error.errors
Remplace par error.issues ou result.error.issues
La ligne de message d'erreur doit être :
const message = result.error.issues[0]?.message ?? 'Validation error'

Génère uniquement les fichiers modifiés, avec leur chemin complet.
Montre uniquement les lignes changées avec contexte (5 lignes avant/après).

Correction 3 — Auth JWT dans la handshake Socket.IO
Nouvelle conversation VS Code, ouvrir backend/src/server.ts
[CONTEXTE — lire CONTEXT.md à la racine]

Modifie backend/src/server.ts pour ajouter l'authentification JWT
dans la handshake Socket.IO.

ÉTAT ACTUEL :
io.on('connection', (socket) => {
  console.log('connected:', socket.id)
  socket.on('disconnect', () => console.log('disconnected:', socket.id))
})

COMPORTEMENT ATTENDU :
Avant d'accepter toute connexion Socket.IO, vérifier le JWT.
Le token est envoyé par le client dans socket.handshake.auth.token
Si token absent ou invalide : émettre une erreur et déconnecter.
Si token valide : attacher socket.data.user = { id, email, is_admin }
pour que les handlers suivants y aient accès sans re-vérifier.

IMPLÉMENTATION :
1. Ajoute un middleware Socket.IO (io.use()) AVANT io.on('connection')
   qui vérifie jwt.verify(token, process.env.JWT_SECRET)
   En cas d'erreur : next(new Error('Unauthorized'))
   En cas de succès : socket.data.user = payload, next()

2. Dans io.on('connection'), remplace les logs par :
   const user = socket.data.user
   console.log(`Socket connected: ${socket.id} — user: ${user.email}`)
   // TODO étape 5 : registerRaceHandlers(io, socket, user)
   socket.on('disconnect', () => {
     console.log(`Socket disconnected: ${socket.id}`)
   })

3. Garde le header 42 existant (jdebrull), mets à jour la date Updated.

Génère le fichier server.ts complet.

Bloc 3 — Migration Prisma + logique diamant
Nouvelle conversation VS Code, ouvrir backend/prisma/schema.prisma
[CONTEXTE — lire CONTEXT.md à la racine]

Deux modifications du schéma Prisma à appliquer ensemble
pour pouvoir persister les résultats de course et les diamants.

━━ MODIFICATION 1 — Diamants gagnés en course ━━

Le modèle Score existe déjà.
Ajoute un champ booléen sur User :
Pas de nouveau modèle Race nécessaire.
Quand un joueur gagne une course, on incrémente User.diamonds de 1.
C'est géré côté backend à la fin de la race — pas besoin de le stocker séparément.
→ Aucun changement de schéma nécessaire pour les diamants.

━━ MODIFICATION 2 — AdminMap doit stocker grid_json comme Text ━━

Vérifie que grid_json dans AdminMap et Map est bien de type String (SQLite).
Si c'est Json, change en String — SQLite ne supporte pas le type Json natif de Prisma.
(Prisma le sérialise en TEXT de toute façon, mais le typage explicite évite les bugs)

━━ MODIFICATION 3 — Index de performance ━━

Vérifie que l'index suivant existe sur Score :
@@index([map_id, completion_time_ms])
S'il est absent, ajoute-le.

Après avoir modifié le schema.prisma, génère aussi la commande
de migration à exécuter :
npx prisma migrate dev --name [nom_descriptif]

Génère le schema.prisma complet mis à jour.
Header 42 (jdebrull) avec date Updated mise à jour.