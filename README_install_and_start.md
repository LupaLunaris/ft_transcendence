# Installation & démarrage — Guilds of the Deep

## Prérequis

| Outil | Version minimale | Vérification |
|-------|-----------------|--------------|
| Node.js | 20+ (testé v24) | `node --version` |
| npm | 10+ (testé v11) | `npm --version` |
| Git | toute version récente | `git --version` |
| Docker + Compose | optionnel (mode Docker) | `docker --version` |

---

## Démarrage rapide (mode local — SQLite)

```bash
git clone <url-du-repo>
cd transcandence

# 1. Installer toutes les dépendances (monorepo npm workspaces)
npm install

# 2. Configurer les variables d'environnement du backend
cp backend/.env.example backend/.env
# Editer backend/.env si besoin (JWT_SECRET, etc.)

# 3. Générer le client Prisma + créer/migrer la base SQLite
npm run db:generate --workspace=backend
npm run db:migrate --workspace=backend

# 4. (optionnel) Peupler la DB avec des utilisateurs de test
npm run db:seed --workspace=backend

# 5. Lancer backend + frontend en parallèle
npm run dev
```

Frontend : http://localhost:5173  
Backend  : http://localhost:3001

---

## Variables d'environnement (`backend/.env`)

```dotenv
DATABASE_URL="file:./dev.db"

# Auth
JWT_SECRET=change_me_in_production
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

> En mode Docker, `DATABASE_URL` pointe vers PostgreSQL — voir section Docker.

---

## Makefile — référence complète

Toutes les commandes sont lancées depuis la **racine** du repo.

```bash
make help          # Affiche la liste des commandes disponibles
```

### Développement local

```bash
make install       # npm install (toutes les workspaces)
make build         # Build shared → backend → frontend
make start         # install + build shared + dev (point d'entrée rapide)
make dev           # Lance backend + frontend en parallèle (Ctrl-C pour arrêter)
make dev-backend   # Lance uniquement le serveur backend (port 3001)
make dev-frontend  # Lance uniquement le serveur frontend (port 5173)
```

### Tests

```bash
make test          # Lance tous les tests (backend puis frontend)
make test-backend  # Tests backend — Jest + supertest
make test-frontend # Tests frontend — Vitest + Testing Library
```

### Base de données (Prisma, mode local)

```bash
make db-generate   # Régénère le client Prisma après un changement de schema.prisma
make db-migrate    # Applique les migrations en attente (crée la DB si absente)
make db-seed       # Insère des utilisateurs de test + AdminMap (order 1)
make db-studio     # Ouvre Prisma Studio dans le navigateur
```

### Nettoyage

```bash
make clean         # Supprime les dossiers dist/ et le cache Vite
make fclean        # clean + supprime tous les node_modules
make re            # Reconstrution complète : fclean → install → build
```

---

## Commandes npm par workspace

Si tu préfères ne pas utiliser le Makefile :

```bash
# Shared (compiler en premier — backend et frontend en dépendent)
npm run build --workspace=shared

# Backend
npm run dev --workspace=backend       # Serveur de développement (nodemon)
npm run build --workspace=backend     # Compilation TypeScript
npm run start --workspace=backend     # Serveur de production (dist/)
npm test --workspace=backend          # Tests Jest
npm run db:generate --workspace=backend
npm run db:migrate --workspace=backend
npm run db:seed --workspace=backend
npm run db:studio --workspace=backend

# Frontend
npm run dev --workspace=frontend      # Serveur Vite (HMR)
npm run build --workspace=frontend    # Build de production
npm run preview --workspace=frontend  # Prévisualise le build de prod
npm test --workspace=frontend         # Tests Vitest
```

---

## Mode Docker (PostgreSQL)

### Prérequis

Créer un `.env` à la **racine** du repo (pas dans `/backend`) :

```dotenv
# PostgreSQL
POSTGRES_USER=transcendence
POSTGRES_PASSWORD=changeme
POSTGRES_DB=transcendence

# Backend
DATABASE_URL=postgresql://transcendence:changeme@postgres:5432/transcendence
JWT_SECRET=change_me_in_production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001
NODE_ENV=production
```

### Commandes Docker

```bash
make docker-up        # Build + démarre tous les services en arrière-plan
make docker-down      # Arrête et supprime les conteneurs (conserve les volumes)
make docker-down-v    # Arrête + supprime conteneurs ET volumes (efface la DB)
make docker-logs      # Suit les logs de tous les services
make docker-logs-backend  # Suit uniquement les logs backend
make docker-restart   # Arrête, rebuild et redémarre tout
```

Services exposés :

| Service  | URL / hôte |
|----------|-----------|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:3001 |
| PostgreSQL | localhost:5432 |

---

## Ordre de build obligatoire

Le workspace `shared` exporte les types TypeScript partagés. Il doit toujours être compilé **avant** backend et frontend, sinon les imports `@ft/shared` échouent.

```
shared (build) → backend (dev/build) + frontend (dev/build)
```

Le script `npm run dev` à la racine s'en charge automatiquement.

---

## Problèmes courants

| Symptôme | Cause probable | Solution |
|----------|----------------|----------|
| `Cannot find module '@ft/shared'` | shared non compilé | `npm run build --workspace=shared` |
| `PrismaClientInitializationError` | DB non migrée | `make db-migrate` |
| Port 3001 ou 5173 déjà utilisé | processus en arrière-plan | `lsof -i :3001` puis `kill <PID>` |
| `.env not found` (Docker) | fichier .env absent à la racine | Créer `.env` à la racine du repo |
| `prisma generate` échoue | node_modules absent | `npm install` |
