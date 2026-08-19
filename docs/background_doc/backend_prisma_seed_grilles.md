# Prisma ORM, seeds et grilles 25×25

## Comment fonctionne Prisma avec SQLite

Prisma est un ORM TypeScript qui génère un client typé à partir du schéma
`schema.prisma`. Son pipeline est :

```
schema.prisma
    │
    ▼ (npx prisma migrate dev)
Migration SQL → appliquée à data.db (SQLite)
    │
    ▼ (npx prisma generate)
@prisma/client → types TypeScript auto-générés
    │
    ▼ (import dans le code)
prisma.adminMap.upsert() → SQL généré + exécuté
```

**Pourquoi SQLite ici :** légèreté en dev (un seul fichier `data.db`), pas de
serveur DB à lancer. Contrainte : SQLite ne supporte pas le type `Json` natif de
Prisma → `grid_json` est stocké comme `String` (TEXT sous le capot) et
sérialisé/désérialisé manuellement avec `JSON.stringify` / `JSON.parse`.

---

## Les enjeux pour ce projet

### 1. Upsert plutôt que create

Le seed peut être relancé plusieurs fois (en dev, pour réinitialiser les données).
`prisma.adminMap.upsert()` garantit **idempotence** : si la ligne existe, elle est
mise à jour ; sinon, elle est créée. Sans upsert, un `create` échouerait avec une
contrainte d'unicité sur `order_index` au deuxième lancement.

```ts
await prisma.adminMap.upsert({
  where: { order_index: level.order_index },  // clé unique
  update: { name: level.name, grid_json: ... },
  create: { order_index: ..., name: ..., grid_json: ... },
});
```

### 2. Contraintes de la grille 25×25

La fonction `validateGrid()` dans `grid.utils.ts` vérifie :
- `grid.length === 25` et chaque ligne a longueur 25
- Toutes les cellules ont une valeur dans `{0, 1, 2, 3, 4}`
- Toutes les cellules bordures (`row=0`, `row=24`, `col=0`, `col=24`) sont `WALL (1)`
- Exactement 1 `SPAWN (3)` et 1 `EXIT (2)`

La fonction `hasPath()` fait un BFS de SPAWN vers EXIT pour vérifier qu'il
existe au moins un chemin jouable. Les maps admin utilisées en seed doivent
satisfaire toutes ces contraintes.

### 3. Stockage JSON en SQLite : double sérialisation

```ts
// Stockage → JSON.stringify(grid2DArray) → string en DB
grid_json: JSON.stringify(level.grid)

// Lecture → JSON.parse(level.grid_json) → number[][] en mémoire
sendSuccess(res, { ...level, grid_json: JSON.parse(level.grid_json) });
```

Si `JSON.parse` est oublié à la lecture, le frontend reçoit une **string** au lieu
d'un tableau, et `buildTilemap()` dans Phaser échoue silencieusement (le jeu
affiche une grille vide).

### 4. Opération atomique `increment` sur les diamants

```ts
// POST /tower/:order_index/complete
await prisma.user.update({
  data: { diamonds: { increment: 1 } }
});
```

`{ increment: 1 }` se traduit en SQL : `UPDATE users SET diamonds = diamonds + 1`.
C'est une opération **atomique** : même si deux requêtes arrivent simultanément,
chaque +1 est garanti. Sans cela, deux lectures concurrentes du même `diamonds = 5`
donneraient deux `UPDATE SET diamonds = 6`, perdant un diamant.

---

## Debug comme exemple pratique

### Fichiers impliqués

| Fichier | Rôle |
|---------|------|
| [backend/prisma/schema.prisma](../backend/prisma/schema.prisma) | Définit `AdminMap` avec `grid_json String` et `User` avec `diamonds Int @default(0)` |
| [backend/prisma/seed-tower.ts](../backend/prisma/seed-tower.ts) | Génère 8 grilles 25×25 et les insère via upsert |
| [backend/src/utils/grid.utils.ts](../backend/src/utils/grid.utils.ts) | `validateGrid()` + `hasPath()` (BFS) |
| [backend/src/routes/admin.routes.ts](../backend/src/routes/admin.routes.ts) | `PUT /admin/tower/:idx` — valide la grille avant upsert |
| [backend/src/routes/tower.routes.ts](../backend/src/routes/tower.routes.ts) | `POST /tower/:idx/complete` — increment atomique |
| [backend/src/__tests__/tower.complete.test.ts](../backend/src/__tests__/tower.complete.test.ts) | Tests de la route complete (séquence, limite 8, diamants) |

### Bug : `JSON.parse` manquant à la lecture

Dans `tower.routes.ts GET /:order_index`, le handler retourne :

```ts
sendSuccess(res, { ...level, grid_json: JSON.parse(level.grid_json) });
```

Si cette ligne était :

```ts
sendSuccess(res, level);  // ❌ grid_json est une string brute
```

Le frontend (`GamePage.tsx`) reçoit une string et appelle `buildTilemap(string)`.
La scène Phaser ne plante pas (les boucles sur une string itèrent sur les
caractères), elle génère juste une grille vide. Bug silencieux, difficile à
diagnostiquer sans regarder la réponse réseau.

### Bug : grille seed invalide (SPAWN écrasé)

Dans `seed-tower.ts`, les fonctions de génération de grille remplissent
d'abord l'intérieur de murs, creusent des couloirs, **puis** posent SPAWN et EXIT.

Si l'ordre était inversé (poser SPAWN avant de creuser), le creusage
remplacerait la case `[1][1]` avec `EMPTY (0)`, et `validateGrid()` échouerait
avec `spawnCount === 0`. Le seed s'arrêterait sans message d'erreur clair car
Prisma n'a pas de hook de validation de schéma applicatif.

La solution : toujours placer SPAWN et EXIT **en dernier**, après toute
construction de la grille :

```ts
function level1(): number[][] {
  const g = emptyGrid();
  // ... creusage des couloirs ...
  g[1][1] = S;           // ← en dernier
  g[SIZE - 2][SIZE - 2] = X;  // ← en dernier
  return border(g);
}
```

### Commandes utiles

```bash
# Lancer le seed complet (utilisateurs de test + AdminMaps)
cd backend
npx prisma db seed

# Lancer uniquement le seed tour
npx ts-node --project tsconfig.json prisma/seed-tower.ts

# Vérifier la DB directement
npx prisma studio
```
