# Ajouter des textures aux tuiles

Remplacement des carrés colorés (MVP) par des sprites PNG.  
**Impact backend : aucun** — le grid stocke des entiers `0–4`, les textures sont 100 % frontend.

---

## Arborescence des fichiers concernés

```
shared/src/types/tiles.types.ts       ← définit TILE et Grid (lecture seule)
frontend/
├── public/assets/tiles/              ← à créer : sprites PNG (servis statiquement)
└── src/
    ├── game/
    │   ├── GameCanvas.tsx            ← monte le jeu Phaser (aucun changement)
    │   └── scenes/
    │       ├── BaseScene.ts          ← drawMap : TILE_COLORS + graphics → sprites
    │       └── GameScene.ts          ← preload() : charger les textures
    └── components/editor/
        ├── EditorGrid.tsx            ← tileColor() : backgroundColor → backgroundImage
        └── TileSelector.tsx          ← TILE_OPTIONS[].color → image
```

---

## Étape 0 — Préparer les assets

Crée `frontend/public/assets/tiles/` avec un PNG 32 × 32 par type de tuile.  
Phaser charge les assets via URL relative depuis `/public/`, Vite les sert sans import JS.

```
frontend/public/assets/tiles/
├── floor.png   # TILE.EMPTY = 0
├── wall.png    # TILE.WALL  = 1
├── exit.png    # TILE.EXIT  = 2
├── spawn.png   # TILE.SPAWN = 3
└── enemy.png   # TILE.ENEMY = 4
```

> **Taille** : 32 × 32 px (= `TILE_SIZE` défini dans `BaseScene.ts:16`).  
> **Format** : PNG avec transparence si nécessaire.

---

## Étape 1 — `GameScene.ts` : charger les textures dans `preload()`

**Fichier** : `frontend/src/game/scenes/GameScene.ts`

La méthode `preload()` (ligne 42) est le hook Phaser exécuté **avant** `create()`.  
Elle est actuellement vide — c'est là qu'on ajoute `this.load.image()`.

```typescript
// AVANT (ligne 42-44)
preload(): void {
  // Placeholder — real assets loaded here in future sprints
}

// APRÈS
preload(): void {
  this.load.image('tile_floor', 'assets/tiles/floor.png');
  this.load.image('tile_wall',  'assets/tiles/wall.png');
  this.load.image('tile_exit',  'assets/tiles/exit.png');
  this.load.image('tile_spawn', 'assets/tiles/spawn.png');
  this.load.image('tile_enemy', 'assets/tiles/enemy.png');
}
```

- `this.load` → `Phaser.Loader.LoaderPlugin` (disponible dans toute `Phaser.Scene`)
- Premier argument : **clé interne** utilisée par `this.add.image('tile_wall', ...)`
- Second argument : chemin relatif depuis `public/` (Vite sert `public/` à la racine)

---

## Étape 2 — `BaseScene.ts` : remplacer `graphics` par des sprites

**Fichier** : `frontend/src/game/scenes/BaseScene.ts`

### Variables et fonctions à modifier

| Symbole | Ligne | Rôle actuel | Action |
|---------|-------|-------------|--------|
| `TILE_COLORS` | 19–25 | mapping `TileValue → couleur hex` | Remplacer par `TILE_TEXTURE_KEYS` |
| `buildTilemap()` | 28 | boucle sur `grid`, appelle `graphics.fillRect()` | Remplacer `fillRect` par `this.add.image()` |
| `graphics` | 29 | objet Phaser Graphics (couleurs) | Supprimer (ou garder uniquement pour les lignes de grille) |

### Modification complète

```typescript
// AVANT (lignes 19-51)
const TILE_COLORS: Record<number, number> = {
  [TILE.EMPTY]: 0x2a2a3e,
  [TILE.WALL]:  0x5c3d8f,
  [TILE.EXIT]:  0x00e5a0,
  [TILE.SPAWN]: 0x2a2a3e,
  [TILE.ENEMY]: 0xe53935,
};

export abstract class BaseScene extends Phaser.Scene {
  protected buildTilemap(grid: Grid): void {
    const graphics = this.add.graphics();
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const tile = grid[row][col];
        const color = TILE_COLORS[tile] ?? TILE_COLORS[TILE.EMPTY];
        graphics.fillStyle(color, 1);
        graphics.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
    // lignes de grille...
  }
}

// APRÈS
const TILE_TEXTURE_KEYS: Record<number, string> = {
  [TILE.EMPTY]: 'tile_floor',
  [TILE.WALL]:  'tile_wall',
  [TILE.EXIT]:  'tile_exit',
  [TILE.SPAWN]: 'tile_spawn',
  [TILE.ENEMY]: 'tile_enemy',
};

export abstract class BaseScene extends Phaser.Scene {
  protected buildTilemap(grid: Grid): void {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const tile  = grid[row][col];
        const key   = TILE_TEXTURE_KEYS[tile] ?? TILE_TEXTURE_KEYS[TILE.EMPTY];
        const px    = col * TILE_SIZE;
        const py    = row * TILE_SIZE;
        this.add.image(px, py, key).setOrigin(0).setDisplaySize(TILE_SIZE, TILE_SIZE);
      }
    }

    // Lignes de grille (optionnel — supprimer si le sprite intègre ses propres bordures)
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x000000, 0.15);
    for (let i = 0; i <= GRID_SIZE; i++) {
      graphics.strokeLineShape(
        new Phaser.Geom.Line(i * TILE_SIZE, 0, i * TILE_SIZE, GRID_SIZE * TILE_SIZE),
      );
      graphics.strokeLineShape(
        new Phaser.Geom.Line(0, i * TILE_SIZE, GRID_SIZE * TILE_SIZE, i * TILE_SIZE),
      );
    }
  }
}
```

**Points clés :**
- `this.add.image(px, py, key)` → crée un `Phaser.GameObjects.Image` à la position pixel
- `.setOrigin(0)` → ancre en haut-gauche (comportement identique à `fillRect`)
- `.setDisplaySize(TILE_SIZE, TILE_SIZE)` → force 32 × 32 quel que soit le PNG source
- `px = col * TILE_SIZE`, `py = row * TILE_SIZE` → même calcul qu'avant (inchangé)

> **Note** : `this.add.image()` utilise les textures chargées dans `preload()` de `GameScene.ts`.  
> `BaseScene` est `abstract` — elle n'a pas de `preload()` propre, elle hérite du cycle Phaser via `GameScene`.

---

## Étape 3 — `EditorGrid.tsx` : aperçu dans la grille éditeur

**Fichier** : `frontend/src/components/editor/EditorGrid.tsx`

### Fonction à modifier : `tileColor()` (ligne 21)

```typescript
// AVANT
function tileColor(tile: TileValue): string {
  switch (tile) {
    case TILE.WALL:  return '#5c3d8f';
    case TILE.EXIT:  return '#00e5a0';
    case TILE.SPAWN: return '#f4511e';
    case TILE.ENEMY: return '#e53935';
    default:         return '#2a2a3e';
  }
}
```

```typescript
// APRÈS — remplace la fonction et le style dans le JSX

const TILE_TEXTURE_URL: Record<number, string> = {
  [TILE.EMPTY]: '/assets/tiles/floor.png',
  [TILE.WALL]:  '/assets/tiles/wall.png',
  [TILE.EXIT]:  '/assets/tiles/exit.png',
  [TILE.SPAWN]: '/assets/tiles/spawn.png',
  [TILE.ENEMY]: '/assets/tiles/enemy.png',
};
```

Et dans le JSX (ligne 52–58), remplacer `backgroundColor` :

```tsx
// AVANT
style={{
  width: 22,
  height: 22,
  backgroundColor: tileColor(tile),
  border: tileBorder(tile),
  transition: 'opacity 0.05s',
}}

// APRÈS
style={{
  width: 22,
  height: 22,
  backgroundImage: `url('${TILE_TEXTURE_URL[tile] ?? TILE_TEXTURE_URL[TILE.EMPTY]}')`,
  backgroundSize: 'cover',
  border: tileBorder(tile),
  transition: 'opacity 0.05s',
}}
```

> Tu peux aussi garder un `backgroundColor` de fallback (couleur de la version MVP) en cas d'image non chargée.

---

## Étape 4 — `TileSelector.tsx` : pastille de prévisualisation

**Fichier** : `frontend/src/components/editor/TileSelector.tsx`

### Constante à modifier : `TILE_OPTIONS` (ligne 20)

```typescript
// AVANT
const TILE_OPTIONS = [
  { value: TILE.EMPTY, label: 'Sol',    color: '#2a2a3e', description: 'Case vide' },
  { value: TILE.WALL,  label: 'Mur',    color: '#5c3d8f', description: 'Obstacle' },
  // ...
];
```

```typescript
// APRÈS — ajouter un champ `texture`
const TILE_OPTIONS = [
  { value: TILE.EMPTY, label: 'Sol',    color: '#2a2a3e', texture: '/assets/tiles/floor.png', description: 'Case vide' },
  { value: TILE.WALL,  label: 'Mur',    color: '#5c3d8f', texture: '/assets/tiles/wall.png',  description: 'Obstacle' },
  { value: TILE.EXIT,  label: 'Sortie', color: '#00e5a0', texture: '/assets/tiles/exit.png',  description: 'Fin du niveau' },
  { value: TILE.SPAWN, label: 'Spawn',  color: '#f4511e', texture: '/assets/tiles/spawn.png', description: 'Départ du joueur' },
  { value: TILE.ENEMY, label: 'Ennemi', color: '#e53935', texture: '/assets/tiles/enemy.png', description: 'Case ennemie' },
];
```

Et dans le JSX (ligne 47–49), remplacer le `<span>` coloré :

```tsx
// AVANT
<span
  className="w-5 h-5 rounded shrink-0 border border-black/20"
  style={{ backgroundColor: color }}
/>

// APRÈS
<span
  className="w-5 h-5 rounded shrink-0 border border-black/20"
  style={{
    backgroundImage: `url('${texture}')`,
    backgroundSize: 'cover',
    backgroundColor: color, // fallback si image non chargée
  }}
/>
```

---

## Récapitulatif des dépendances entre fichiers

```
shared/src/types/tiles.types.ts
  └─ exporte TILE, TileValue, Grid, GRID_SIZE
        ├─ importé par BaseScene.ts      (TILE, GRID_SIZE, Grid)
        ├─ importé par GameScene.ts      (TILE, GRID_SIZE, Grid)
        ├─ importé par EditorGrid.tsx    (TILE, GRID_SIZE, Grid, TileValue)
        └─ importé par TileSelector.tsx  (TILE, TileValue)

frontend/public/assets/tiles/*.png
  ├─ chargé par GameScene.ts via this.load.image() (Phaser loader, URL)
  ├─ référencé par EditorGrid.tsx via CSS backgroundImage (URL)
  └─ référencé par TileSelector.tsx via CSS backgroundImage (URL)

BaseScene.ts
  └─ importé par GameScene.ts (héritage — GameScene extends BaseScene)
       └─ importé par GameCanvas.tsx (instanciation Phaser)
```

---

## Checklist d'implémentation

- [ ] Créer `frontend/public/assets/tiles/` avec 5 PNG (32 × 32 px)
- [ ] `GameScene.ts` — remplir `preload()` avec 5 appels `this.load.image()`
- [ ] `BaseScene.ts` — remplacer `TILE_COLORS` + `graphics.fillRect()` par `TILE_TEXTURE_KEYS` + `this.add.image()`
- [ ] `EditorGrid.tsx` — remplacer `tileColor()` et `backgroundColor` par `backgroundImage`
- [ ] `TileSelector.tsx` — ajouter `texture` dans `TILE_OPTIONS` et mettre à jour le `<span>`
- [ ] Vérifier visuellement : éditeur, jeu, sélecteur de tuile
