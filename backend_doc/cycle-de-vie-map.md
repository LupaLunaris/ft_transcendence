# Cycle de vie d'une map — Backend

## Comment fonctionne la stack

Le backend est un serveur **Express + TypeScript** qui expose une API REST.
La persistance est assurée par **Prisma ORM** avec une base **SQLite** (`prisma/schema.prisma`).
Chaque route est protégée optionnellement par un middleware JWT (`auth.middleware.ts`).
La validation des corps de requête utilise **Zod** (`schemas/map.schemas.ts`).

Les types partagés entre frontend et backend vivent dans le package `shared/` (`shared/src/types/map.types.ts`), compilé et consommé par les deux côtés via l'alias `@ft/shared`.

---

## Le modèle `Map` en base de données

```prisma
// backend/prisma/schema.prisma
model Map {
  id                String   @id @default(uuid())
  name              String
  grid_json         String   // grille 25×25 sérialisée en JSON
  creator_id        String
  creator_completed Boolean  @default(false)
  published         Boolean  @default(false)
  difficulty        String   @default("MEDIUM")
  play_count        Int      @default(0)
  created_at        DateTime @default(now())
  creator           User     @relation(fields: [creator_id], references: [id])
  scores            Score[]
}
```

Deux flags booléens pilotent le cycle de vie :
| Flag | Signification |
|---|---|
| `creator_completed` | Le créateur a terminé sa propre map au moins une fois |
| `published` | La map est visible publiquement dans "S'entraîner" |

---

## Les routes et leurs règles métier

Toutes les routes sont dans `backend/src/routes/maps.routes.ts`.

### Création — `POST /api/v1/maps`

- Requiert un JWT valide (authMiddleware)
- Valide la grille via Zod + BFS (`grid.utils.ts`) : la grille doit être 25×25, entourée de WALL, contenir exactement 1 SPAWN et 1 EXIT, et un chemin doit exister entre les deux
- Crée la map avec `creator_completed: false`, `published: false`
- Incrémente le compteur `created_maps_count` de l'utilisateur

### Mise à jour — `PUT /api/v1/maps/:id`

- Requiert d'être le créateur
- **Refusée si `published: true`** → une map publiée est immuable

### Marquer complétée — `POST /api/v1/maps/:id/complete`

- Requiert d'être le créateur
- Passe `creator_completed` à `true`
- **Précondition obligatoire pour la publication**

### Publication — `POST /api/v1/maps/:id/publish`

- Requiert d'être le créateur
- **Vérifie que `creator_completed === true`** → sinon HTTP 400
- Passe `published` à `true`

### Lecture publique — `GET /api/v1/maps`

- **Filtre `published: true`**
- Supporte pagination et filtre par difficulté

---

## Les transitions d'état — machine à états

```
          POST /maps
INEXISTANT ──────────→ BROUILLON
                       (creator_completed=false, published=false)
                             │
                             │ PUT /maps/:id (modification)
                             │ GET /maps/:id (test par le créateur)
                             │
                             ▼
                       [créateur joue et termine]
                             │
                             │ POST /maps/:id/complete
                             ▼
                       COMPLETÉE
                       (creator_completed=true, published=false)
                             │
                             │ POST /maps/:id/publish
                             ▼
                       PUBLIÉE
                       (creator_completed=true, published=true)
                       [immuable, visible dans GET /maps]
```

---

## Enjeux pour le projet

### Pourquoi imposer `creator_completed` avant la publication ?

La règle garantit qu'une map est jouable avant d'être exposée aux autres joueurs.
Un créateur qui n'a pas réussi sa propre map pourrait en publier une non-franchissable
(sans chemin entre SPAWN et EXIT), même si la validation Zod + BFS vérifie l'existence
d'un chemin au moment de la sauvegarde.

### Pourquoi rendre les maps publiées immuables ?

- Les scores (`Score`) sont liés à une map précise. Modifier la grille après publication
  invaliderait les scores existants.
- La confiance des joueurs : ce qu'ils jouent aujourd'hui est identique à ce que les
  autres ont joué.

### Risque si ce cycle n'est pas respecté côté frontend

Si le frontend n'appelle jamais `POST /maps/:id/complete`, le flag `creator_completed`
reste `false` indéfiniment. Le créateur ne peut alors jamais publier sa map, peu importe
le nombre de fois où il la teste. C'est exactement le bug décrit dans
`history_debug/2026-05-16_carte-perdue-et-non-publiable.md`.

---

## Exemple pratique — le bug du 2026-05-16

### Ce qui se passait

Dans `frontend/src/pages/game/GamePage.tsx`, `handleExit` soumettait
le score puis naviguait directement vers `/train` :

```ts
// ❌ Avant — markComplete jamais appelé
await api.scores.submit(map_id, time_ms);
navigate('/train');
```

L'appel à `POST /maps/{id}/complete` n'existait pas. Le backend,
lui, refusait toute tentative de publication avec :

```json
{ "error": "You must complete your own map before publishing it" }
```

### Ce qui a été corrigé

```ts
// ✅ Après
if (map && user && map.creator_id === user.id) {
  await api.maps.markComplete(map_id);   // POST /maps/:id/complete
  navigate(`/editor/${map_id}`);         // retour éditeur pour publier
} else {
  navigate('/train');
}
```

**Fichiers impliqués dans le cycle complet :**

| Fichier | Rôle |
|---|---|
| `backend/prisma/schema.prisma` | Modèle `Map` avec les flags |
| `backend/src/routes/maps.routes.ts` | Routes `/complete` et `/publish` avec leurs gardes |
| `backend/src/schemas/map.schemas.ts` | Validation Zod de la grille à la création |
| `backend/src/utils/grid.utils.ts` | BFS de validation du chemin SPAWN→EXIT |
| `shared/src/types/map.types.ts` | Type `MapData` partagé (champs `creator_completed`, `published`) |
| `frontend/src/services/api.service.ts` | Méthodes `api.maps.markComplete()` et `api.maps.publish()` |
| `frontend/src/pages/game/GamePage.tsx` | Appel de `markComplete` après victoire du créateur |
| `frontend/src/pages/editor/EditorPage.tsx` | State `creatorCompleted`/`isPublished` qui conditionne le bouton |
