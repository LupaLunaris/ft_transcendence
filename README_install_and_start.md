# Installation & démarrage — Guilds of the Deep

## Prérequis

### Outils nécessaires

| Outil | Version minimale | Vérification |
|-------|-----------------|--------------|
| Git | toute version récente | `git --version` |
| Docker Desktop (inclut Compose) | 24+ | `docker --version` |
| Node.js | 20+ (testé v24) | `node --version` |
| npm | 10+ (testé v11) | `npm --version` |

> **Node.js et npm sont uniquement nécessaires pour le mode développement local (sans Docker).**
> Pour simplement lancer le projet, seuls Git et Docker suffisent.

---
**macOS :**
```bash
# Avec Homebrew (https://brew.sh)
brew install git
# Ou directement depuis Xcode Command Line Tools
xcode-select --install
```

**Windows :** Télécharger et installer depuis [git-scm.com](https://git-scm.com/download/win).

---

### Installer Docker Desktop

Docker Desktop inclut Docker Engine **et** Docker Compose — un seul installeur suffit.

**Linux (Ubuntu/Debian) :**
```bash
# Désinstaller d'éventuelles anciennes versions
sudo apt remove docker docker-engine docker.io containerd runc

# Installer via le script officiel
curl -fsSL https://get.docker.com | sh

# Ajouter votre utilisateur au groupe docker (évite sudo à chaque commande)
sudo usermod -aG docker $USER
newgrp docker

# Vérifier
docker --version
docker compose version
```

**macOS :** Télécharger Docker Desktop depuis [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) et lancer l'installeur `.dmg`.

**Windows :** Télécharger Docker Desktop depuis [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) et lancer l'installeur `.exe`.
> Sur Windows, Docker Desktop nécessite WSL 2 (activé automatiquement par l'installeur).

Après installation, ouvrir Docker Desktop et attendre que le moteur démarre (icône baleine dans la barre des tâches = vert).

---

### Installer Node.js et npm (mode développement local uniquement)

**Linux / macOS — via nvm (recommandé) :**
```bash
# Installer nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# Recharger le terminal
source ~/.bashrc   # ou ~/.zshrc

# Installer Node.js 20 LTS
nvm install 20
nvm use 20

# Vérifier
node --version
npm --version
```

**Ou via le site officiel :** Télécharger l'installeur LTS depuis [nodejs.org](https://nodejs.org).

---

## Cloner le projet

```bash
git clone <url-du-repo>
cd ft_transcendence
```

---

## Démarrage rapide (mode Docker — recommandé)

C'est la méthode la plus simple : Docker gère PostgreSQL, le backend et le frontend automatiquement.

```bash
# 1. Créer le fichier de variables d'environnement
cp ".env .example" .env

# 2. (Optionnel) Éditer .env pour personnaliser les mots de passe
#    Les valeurs par défaut fonctionnent directement pour un usage local
nano .env   # ou code .env, vim .env, etc.

# 3. Lancer tous les services
make docker-up
```

Attendre environ 30 secondes le temps que les conteneurs démarrent, puis ouvrir :

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend (API) | http://localhost:3001 |

Le backend applique automatiquement les migrations Prisma au démarrage — aucune action manuelle sur la base de données n'est nécessaire.

---

## Variables d'environnement (`.env` à la racine)

Le fichier `.env .example` contient des valeurs prêtes à l'emploi pour un usage local :

```dotenv
# ─── PostgreSQL ───────────────────────────────────────────────────────────────
POSTGRES_USER=ft_user
POSTGRES_PASSWORD=change_me_in_prod
POSTGRES_DB=ft_transcendence

# ─── Backend ──────────────────────────────────────────────────────────────────
# "@postgres" = nom du service Docker ; remplacer par "@localhost" pour un postgres local
DATABASE_URL=postgresql://ft_user:change_me_in_prod@postgres:5432/ft_transcendence

# ─── Auth ─────────────────────────────────────────────────────────────────────
JWT_SECRET=change_me_in_prod_use_at_least_64_random_chars
JWT_EXPIRES_IN=7d

# ─── URLs ─────────────────────────────────────────────────────────────────────
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001
NODE_ENV=development
```

> En production, remplacer toutes les valeurs `change_me_in_prod` par des secrets forts.

---

## Makefile — référence complète

Toutes les commandes s'exécutent depuis la **racine** du repo (`ft_transcendence/`).

```bash
make help          # Affiche la liste des commandes disponibles
```

### Docker (mode principal)

```bash
make docker-up        # Build + démarre tous les services en arrière-plan
make docker-down      # Arrête et supprime les conteneurs (conserve les volumes)
make docker-down-v    # Arrête + supprime conteneurs ET volumes (efface la DB)
make docker-logs      # Suit les logs de tous les services
make docker-logs-backend  # Suit uniquement les logs backend
make docker-restart   # Arrête, rebuild et redémarre tout
```

Services exposés :

| Service | URL / hôte |
|---------|------------|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3001 |
| PostgreSQL | localhost:5432 |

### Développement local (sans Docker)

Nécessite un PostgreSQL installé et démarré localement. Adapter `DATABASE_URL` dans `backend/.env` (utiliser `@localhost` à la place de `@postgres`).

```bash
make install       # npm install (toutes les workspaces)
make build         # Build shared → backend → frontend
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

### Base de données (Prisma)

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
make re            # Reconstruction complète : fclean → install → build
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

## Ordre de build obligatoire

Le workspace `shared` exporte les types TypeScript partagés. Il doit toujours être compilé **avant** backend et frontend, sinon les imports `@ft/shared` échouent.

```
shared (build) → backend (dev/build) + frontend (dev/build)
```

Le script `npm run dev` à la racine s'en charge automatiquement.

---

## Workflow collaboratif (après un `git pull`)

```bash
# Avec Docker — rebuild + migrate deploy automatique au démarrage
make docker-restart

# En mode local
npm run db:migrate --workspace=backend
```

Les migrations Prisma sont incrémentales et idempotentes — relancer `migrate deploy` après un pull est toujours sans risque.

---

## Mode Duel (multijoueur temps réel)

Le mode Duel utilise **Socket.IO** pour synchroniser deux joueurs en temps réel.

### Prérequis

- Deux comptes joueurs distincts (créés via `/register`)
- Backend démarré

### Tester en local avec deux fenêtres

```
Fenêtre A : Chrome          →  http://localhost:5173  (compte joueur 1)
Fenêtre B : Chrome privé    →  http://localhost:5173  (compte joueur 2)
           ou Firefox
```

1. Se connecter sur chaque fenêtre avec un compte différent
2. Naviguer vers **Duel** (bouton sur la page d'accueil ou `/duel`)
3. Sur la **fenêtre A** — cliquer **S'inscrire** sur une map (le bouton passe à **Inscrit**)
4. Sur la **fenêtre B** — cliquer **Défier** sur la même map
5. Les deux fenêtres basculent automatiquement vers la scène de combat
6. Le premier à atteindre la sortie remporte le duel

### Comportements attendus

| Action | Résultat |
|--------|----------|
| S'inscrire sur une map | Bouton → **Inscrit** + pseudo visible par tous |
| Défier un joueur inscrit | Course démarre immédiatement pour les deux |
| Inscription sur 3 maps | Bannière d'avertissement, bouton S'inscrire désactivé |
| Fermer l'onglet pendant une course | L'adversaire reçoit automatiquement la victoire |
| Atteindre la sortie | Overlay **Victoire / Défaite** avec le temps |

### Architecture socket (résumé)

```
DuelPage     ──join_lobby──►  Serveur
                              └─ match trouvé → duel_start ──► 2 joueurs
DuelGamePage ──join_race──►  Serveur (room race:<id>)
                              └─ 2 joueurs présents → game_state(started=true)
Phaser       ──player_input──► Serveur (valide + met à jour position)
                              └─ game_state ──► 2 joueurs (fantôme bouge)
Joueur atteint EXIT ──►       race_finished ──► 2 joueurs
```

---

## Problèmes courants

| Symptôme | Cause probable | Solution |
|----------|----------------|----------|
| `Cannot find module '@ft/shared'` | shared non compilé | `npm run build --workspace=shared` |
| `PrismaClientInitializationError` | DB non démarrée ou non migrée | `make docker-up` ou `make db-migrate` |
| Port 3001 ou 5173 déjà utilisé | processus en arrière-plan | `lsof -i :3001` puis `kill <PID>` |
| `.env not found` | fichier .env absent à la racine | `cp ".env .example" .env` |
| `prisma generate` échoue | node_modules absent | `make install` |
| Postgres ne démarre pas | port 5432 déjà utilisé | `lsof -i :5432` puis `kill <PID>` |
| Données perdues après `docker compose down -v` | volumes supprimés explicitement | utiliser `make docker-down` (sans `-v`) |
| Docker : permission denied sur le socket | utilisateur non dans le groupe docker | `sudo usermod -aG docker $USER` puis se reconnecter |
| Duel : "En attente" qui ne disparaît jamais | backend pas redémarré après changements socket | `make docker-restart` |
| Duel : connexion socket refusée (`Authentication required`) | token JWT absent ou expiré | se reconnecter via `/login` |
| Duel : bouton S'inscrire désactivé | déjà inscrit sur 3 maps | se retirer d'une map ou recharger la page |
