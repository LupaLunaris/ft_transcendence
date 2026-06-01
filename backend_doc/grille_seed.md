# Grille de jeu — structure et seed initial

## Comment fonctionne la stack

La grille du jeu est représentée comme un **tableau 2D de nombres entiers**. C'est le format le plus universel pour une carte de labyrinthe : chaque case a une coordonnée `[row][col]` et une valeur numérique qui indique son type.

**Côté TypeScript (shared/src/types/tiles.types.ts) :**

```typescript
export const GRID_SIZE = 25;

// Valeurs possibles pour une case
export type TileValue = 0 | 1 | 2 | 3 | 4;
//                      │   │   │   │   └─ ENEMY
//                      │   │   │   └───── SPAWN
//                      │   │   └───────── EXIT
//                      │   └───────────── WALL
//                      └───────────────── EMPTY

export type Grid = TileValue[][];  // tableau 25×25
```

**Côté base de données :**  
PostgreSQL (ou SQLite en dev) ne peut pas stocker un tableau 2D natif de manière portable. On sérialise donc la grille en JSON avec `JSON.stringify()`, et on la stocke dans un champ `String` nommé `grid_json`. Pour la relire, on fait `JSON.parse()`.

```
Code TypeScript           Base de données
─────────────────         ───────────────────────────────────────
number[][]       ──────▶  "[[1,1,1,...],[1,3,0,...],...]"  (String)
                JSON.stringify()

String (grid_json) ─────▶  number[][]
                JSON.parse()
```

---

## Les enjeux pour le projet

La grille de 25×25 = 625 cases doit respecter des contraintes structurelles pour être jouable :

1. **Frontières WALL** : le joueur ne doit pas pouvoir sortir de la carte.
2. **Un seul SPAWN** : point de départ du joueur. Il ne peut pas en exister deux.
3. **Un seul EXIT** : condition de victoire. Une carte sans EXIT n'est pas finissable.
4. **Intérieur navigable** : le reste doit être EMPTY par défaut (les murs intérieurs sont ajoutés par l'éditeur de carte).

Ces règles sont la **convention minimale** que tout composant du projet (frontend, backend, moteur de jeu Phaser) tient pour acquise. Une grille qui ne les respecte pas produira un comportement indéfini dans le moteur de jeu.

Le modèle `AdminMap` dans le schéma Prisma stocke les cartes officielles (créées par l'équipe, pas par les joueurs) :

```prisma
model AdminMap {
  id          String   @id @default(uuid())
  order_index Int      @unique   // numéro de niveau
  name        String
  grid_json   String             // la grille sérialisée
  created_at  DateTime @default(now())
}
```

---

## L'exemple du projet : `buildStarterGrid()` dans seed.ts

La fonction de seed génère automatiquement la carte minimale valide :

```typescript
// backend/prisma/seed.ts
function buildStarterGrid(): number[][] {
  const WALL = 1, EMPTY = 0, EXIT = 2, SPAWN = 3;
  const SIZE = 25;

  return Array.from({ length: SIZE }, (_, row) =>
    Array.from({ length: SIZE }, (_, col) => {
      if (row === 0 || row === SIZE - 1 || col === 0 || col === SIZE - 1)
        return WALL;           // ← toute la bordure
      if (row === 1 && col === 1)
        return SPAWN;          // ← haut-gauche de l'intérieur
      if (row === 23 && col === 23)
        return EXIT;           // ← bas-droite de l'intérieur
      return EMPTY;
    }),
  );
}
```

**Visualisation de la grille générée (représentation compacte) :**

```
     col 0  1  2  ...  23  24
row  0 [ W  W  W  ...   W   W ]  ← frontière haute
     1 [ W  S  E  ...   E   W ]  ← SPAWN en [1][1]
     2 [ W  E  E  ...   E   W ]
     .   .                   .
    23 [ W  E  E  ...   X   W ]  ← EXIT en [23][23]
    24 [ W  W  W  ...   W   W ]  ← frontière basse

W = WALL(1)  S = SPAWN(3)  E = EMPTY(0)  X = EXIT(2)
```

La grille est ensuite insérée en base via `prisma.adminMap.upsert()` :

```typescript
await prisma.adminMap.upsert({
  where: { order_index: 1 },
  update: {},
  create: {
    order_index: 1,
    name: 'The Depths — Level 1',
    grid_json: JSON.stringify(buildStarterGrid()),  // ← sérialisation
  },
});
```

`upsert` : si la ligne existe déjà (relance du seed), on ne la modifie pas (`update: {}`). Sinon on la crée. C'est ce qui rend le seed **idempotent** — on peut le relancer sans risque de doublon.

**Quand Phaser lira cette carte**, il fera `JSON.parse(adminMap.grid_json)` pour récupérer le `number[][]` et dessinera chaque case selon sa valeur.
