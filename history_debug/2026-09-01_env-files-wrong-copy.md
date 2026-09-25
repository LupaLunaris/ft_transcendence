# Debug history — 2026-09-01 : `.env` racine erroné + `backend/.env` manquant

## Contexte
`make docker-up` échouait (postgres unhealthy) et `make dev` crashait
(`JWT_SECRET is not set`). Cause unique : mauvais fichier d'exemple copié.

---

## Problème 1 — `make docker-up` : postgres unhealthy

### Symptôme
```
WARN The "POSTGRES_USER" variable is not set. Defaulting to a blank string.
WARN The "POSTGRES_PASSWORD" variable is not set...
WARN The "POSTGRES_DB" variable is not set...
WARN The "BACKEND_URL" variable is not set...
✘ Container guild_of_the_deep-postgres-1 Error dependency postgres failed to start
dependency failed to start: container guild_of_the_deep-postgres-1 is unhealthy
```

### Cause
Le `.env` racine était une copie **octet pour octet** de `backend/.env.example`
(`cp backend/.env.example .env` au lieu de `cp .env.example .env`).
Il lui manquait donc `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`,
`BACKEND_URL`, et son `DATABASE_URL` pointait sur `@localhost` au lieu de
`@postgres`. Avec `POSTGRES_PASSWORD` vide, l'image `postgres:16-alpine`
refuse de démarrer ("Database is uninitialized and superuser password is
not specified"), le healthcheck `pg_isready -U "" -d ""` échoue, backend et
frontend restent bloqués sur `depends_on: condition: service_healthy`.

### Fix
Réécrit `/.env` à partir de `/.env.example` (host `postgres`, + les 4
variables manquantes). Le volume `guild_of_the_deep_postgres_data` existait
déjà, initialisé avec `ft_user` / `change_me_in_prod` → compatible, pas de
reset nécessaire. Stack vérifiée : postgres healthy, migrations Prisma
appliquées, `/api/health` → 200, frontend → 200.

### Fichiers impliqués
- `.env` (non versionné)

---

## Problème 2 — `make dev` : `JWT_SECRET is not set`

### Symptôme
```
backend/src/routes/auth.routes.ts:26
  throw new Error('JWT_SECRET is not set');
```

### Cause
`backend/src/server.ts` fait `import 'dotenv/config'` → lit `backend/.env`
(cwd = `backend/` sous `npm run dev -w backend`). Ce fichier n'existait pas
(seul `backend/.env.example` était présent). `make dev` n'utilise **pas** le
`.env` racine.

### Fix
Créé `backend/.env` à partir de `backend/.env.example` (`DATABASE_URL` sur
`@localhost:5432` — `make dev` cible une instance Postgres locale, ou celle
publiée par Docker sur le port 5432).

### Fichiers impliqués
- `backend/.env` (non versionné)

---

## Problème 3 — `make dev` : `Can't reach database server at localhost:5432`

### Symptôme
`make dev` démarre bien (backend écoute sur 3001, front sur 5173) mais toute
requête touchant la DB renvoie :
```
PrismaClientInitializationError: Can't reach database server at `localhost:5432`
```
Aucun process sur le port 5432 côté hôte. `docker compose up -d postgres`
lançait un conteneur `healthy` mais toujours rien sur 5432.

### Cause
`docker-compose.override.yml` (gitignoré — `.gitignore:38` "Docker overrides",
créé le 2026-08-26, purement local à cette machine, aucune référence ailleurs
dans le repo, pas de CI). Il visait un "smoketest" (postgres sur
`127.0.0.1:5433` + volume jetable `postgres_data_smoketest`) mais utilisait une
syntaxe `!reset` invalide :
```yaml
services:
  postgres:
    ports: !reset          # <-- !reset DOIT être suivi de null / []
      - "127.0.0.1:5433:5432"
    volumes: !reset
      - postgres_data_smoketest:/var/lib/postgresql/data
```
Compose applique `!reset` (vide la clé) **et ignore la liste en dessous**.
Résultat du merge : postgres sans `ports` **et** sans `volumes`. Le conteneur
tourne, healthy via le réseau interne, mais :
- aucun port publié → `make dev` (hôte) ne peut pas s'y connecter ;
- aucun volume → stockage éphémère, les migrations du `make docker-up`
  précédent partaient à la poubelle à chaque `down`.

Vérifier le merge réel : `docker compose config | sed -n '/^  postgres:/,/^  backend:/p'`

### Fix
Déplacé `docker-compose.override.yml` hors du repo (backup dans le scratchpad
de session). `docker compose config` remontre alors `published: 5432` +
`volume: postgres_data`.
Le volume persistant `guild_of_the_deep_postgres_data` était resté figé à la
seule migration `20260527000000_init_postgres` (les 4 suivantes n'avaient
jamais été appliquées dessus — elles ne l'étaient que sur l'éphémère). Rattrapé
avec `cd backend && npx prisma migrate deploy` → 9 tables, `/api/v1/maps` répond.

### Fichiers impliqués
- `docker-compose.override.yml` (gitignoré, supprimé)
- volume Docker `guild_of_the_deep_postgres_data`

---

## Notes architecture
- Deux `.env` distincts, non interchangeables :
  - `/.env` → lu par `docker compose` (interpolation `${VAR}` dans
    `docker-compose.yml`). Host DB = `postgres`. Contient les `POSTGRES_*`
    et `BACKEND_URL` (absents du fichier backend).
  - `/backend/.env` → lu par `dotenv/config` quand le backend tourne hors
    Docker (`make dev`). Host DB = `localhost`. Pas de `POSTGRES_*`.
- `make docker-up` ne vérifie que l'**existence** de `/.env`, pas la présence
  des clés requises → un `.env` incomplet passe le garde-fou. Amélioration
  possible : vérifier `POSTGRES_PASSWORD` / `BACKEND_URL` non vides.
- `make dev` ne copie pas `backend/.env.example` automatiquement.
- `make dev` ne lance **pas** de Postgres ni de migrations. Il faut soit une
  instance Postgres locale native sur 5432, soit `docker compose up -d postgres`
  en parallèle, avec les migrations à jour (`npx prisma migrate deploy` depuis
  `backend/`).
- `docker-compose.override.yml` est auto-mergé par **toute** commande
  `docker compose`. Un override cassé casse donc silencieusement `make docker-up`
  ET `make dev`. Syntaxe correcte pour purger une clé : `ports: !reset []`.
  Pour un usage smoketest ponctuel, préférer un fichier explicite
  `docker-compose.smoketest.yml` appelé via `-f`.
