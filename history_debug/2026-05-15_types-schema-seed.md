# 2026-05-15 — Types partagés, schéma Prisma & seed

## Contexte

Deuxième journée de développement. Mise en place des contrats TypeScript partagés et de la couche base de données.

## Fichiers créés

### shared/src/types/

| Fichier | Auteur | Contenu clé |
|---------|--------|-------------|
| `tiles.types.ts` | jpaulis | `TILE`, `TileValue`, `Grid`, `GRID_SIZE = 25` |
| `user.types.ts` | jpaulis | `UserPublic`, `UserProfile`, `UpdateProfileRequest` |
| `map.types.ts` | jpaulis | `MapData`, `MapSummary`, `Difficulty`, requêtes CRUD |
| `auth.types.ts` | jpaulis | `LoginRequest`, `RegisterRequest`, `AuthResponse` |
| `game.types.ts` | jpaulis | `Direction`, `Position`, `PlayerState`, `GameState`, `RaceResult` |
| `socket.types.ts` | jpaulis | `ClientToServerEvents`, `ServerToClientEvents` |
| `api.types.ts` | jpaulis | `ApiError`, `ApiResponse<T>`, `PaginatedResponse<T>` |
| `index.ts` | jpaulis | Barrel re-export de tous les types |

### backend/

| Fichier | Auteur | Contenu clé |
|---------|--------|-------------|
| `prisma/schema.prisma` | jdebrull | 4 modèles (User, Map, AdminMap, Score), enum Difficulty |
| `prisma/seed.ts` | jdebrull | 2 users bcrypt, 1 AdminMap grille 25×25 |
| `src/lib/prisma.ts` | jdebrull | Singleton PrismaClient, logs dev |

## Points d'attention / décisions techniques

- **Prisma** : générateur `prisma-client-js` (Prisma 5, standard). `@prisma/client` pour les imports.
- **Seed** : `ts-node --transpile-only prisma/seed.ts` pour éviter le conflit avec `rootDir: "src"` dans tsconfig.
- **Grille seed** : frontières WALL, intérieur EMPTY, SPAWN en [1][1], EXIT en [23][23].
- **Difficulty** : enum Prisma en MAJUSCULES (`EASY|MEDIUM|HARD`), type TypeScript en minuscules (`'easy'|'medium'|'hard'`). Mapping requis dans la couche API.
- **Header .prisma** : format `//` (Prisma ne supporte pas les commentaires `/* */`).

## Étapes bloquantes à prévoir

| Étape | Date estimée |
|-------|-------------|
| `prisma migrate dev` (DB Docker démarrée) | 2026/05/16 |
| `prisma db seed` (après migrate) | 2026/05/16 |
| Intégration `@ft/shared` dans le frontend | 2026/05/16 |

## Tests effectués

| Commande | Répertoire | Résultat |
|----------|-----------|---------|
| `tsc --noEmit` | `shared/` | ✅ 0 erreur |
| `prisma validate` | `backend/` | ✅ schéma valide |
| `prisma generate` | `backend/` | ✅ client généré (Prisma 5.22.0 → `node_modules/@prisma/client`) |
| `tsc --noEmit` | `backend/` | ✅ 0 erreur (inclut `src/lib/prisma.ts`) |

> Note : `prisma/seed.ts` n'est pas inclus dans le `tsconfig` backend (`include: ["src/**/*"]`).
> Il est exécuté via `ts-node --transpile-only` qui bypasse la vérification de types.
