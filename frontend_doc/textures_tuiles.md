# Textures et sprites — pipeline de chargement

Remplacement des carrés colorés (MVP) par des PNG dans les scènes de jeu.  
**Impact backend : aucun** — `grid` stocke des entiers `0–5`, les textures sont 100 % frontend.

---

## Invariant fondamental

> Les textures sont utilisées **uniquement** dans `GameScene` et `TowerGamePage`.  
> Jamais dans `EditorPage`, `EditorGrid`, ni `TileSelector`.

L'éditeur admin et l'éditeur joueur conservent leurs couleurs CSS (`backgroundColor`).

---

## État actuel (session 2026-05-21)

Implémenté :
- `assets.ts` — constantes `KEY_*` (clés Phaser) et `ASSET_*` (chemins `public/`)
- `BaseScene.ts` — `preloadTileAssets()` + `buildTilemap()` avec fallback
- `GameScene.ts` — `preload()`, joueur sprite/fallback, ennemis sprite/fallback
- `Enemy.ts` — `rect` accepte `Rectangle | Image` via `EnemyGameObject`

En attente :
- Fournir les PNG dans `public/assets/tiles/` et `public/assets/sprites/`

---

## Arborescence des fichiers

```
frontend/
├── public/
│   └── assets/
│       ├── tiles/               ← PNG 32×32 par type de tuile
│       │   ├── .gitkeep
│       │   ├── floor.png        (TILE.EMPTY = 0)
│       │   ├── wall.png         (TILE.WALL  = 1)
│       │   ├── exit.png         (TILE.EXIT  = 2)
│       │   └── spawn.png        (TILE.SPAWN = 3)
│       └── sprites/             ← PNG ou spritesheet pour entités animées
│           ├── .gitkeep
│           ├── player.png
│           ├── enemy_h.png      (TILE.ENEMY_H = 4)
│           └── enemy_v.png      (TILE.ENEMY_V = 5)
└── src/game/
    ├── assets.ts                ← clés Phaser + chemins public/
    ├── entities/
    │   └── Enemy.ts             ← EnemyGameObject = Rectangle | Image
    └── scenes/
        ├── BaseScene.ts         ← preloadTileAssets() + buildTilemap()
        └── GameScene.ts         ← preload() + sprites joueur/ennemis
```

---

## Pourquoi `public/` et non `src/assets/`

Phaser charge les assets via URL HTTP (`this.load.image(key, url)`) — il n'utilise
pas le module bundler. `public/` est servi par Vite à la racine sans transformation
ni hachage de nom, ce qui correspond exactement à `this.load.image('key', '/assets/tiles/floor.png')`.

`src/assets/` conviendrait aux imports ES (`import url from './img.png'`) — inutile ici.

---

## Fichier `assets.ts` — constantes

| Constante | Valeur | Rôle |
|-----------|--------|------|
| `KEY_TILE_FLOOR` | `'tile_floor'` | Clé interne Phaser — argument 1 de `load.image` |
| `KEY_TILE_WALL` | `'tile_wall'` | idem |
| `KEY_TILE_EXIT` | `'tile_exit'` | idem |
| `KEY_TILE_SPAWN` | `'tile_spawn'` | idem |
| `KEY_SPRITE_PLAYER` | `'sprite_player'` | idem |
| `KEY_SPRITE_ENEMY_H` | `'sprite_enemy_h'` | idem |
| `KEY_SPRITE_ENEMY_V` | `'sprite_enemy_v'` | idem |
| `ASSET_TILE_FLOOR` | `'/assets/tiles/floor.png'` | URL dans `public/` |
| `ASSET_TILE_WALL` | `'/assets/tiles/wall.png'` | idem |
| `ASSET_TILE_EXIT` | `'/assets/tiles/exit.png'` | idem |
| `ASSET_TILE_SPAWN` | `'/assets/tiles/spawn.png'` | idem |
| `ASSET_SPRITE_PLAYER` | `'/assets/sprites/player.png'` | idem |
| `ASSET_SPRITE_ENEMY_H` | `'/assets/sprites/enemy_h.png'` | idem |
| `ASSET_SPRITE_ENEMY_V` | `'/assets/sprites/enemy_v.png'` | idem |

---

## Cycle Phaser : preload → create → fallback

```
GameScene.preload()
  └─ this.preloadTileAssets()     [BaseScene]  ← load.image × 4 (sol/mur/sortie/spawn)
  └─ this.load.image(player...)                ← load.image × 1
  └─ this.load.image(enemy_h...)               ← load.image × 1
  └─ this.load.image(enemy_v...)               ← load.image × 1
        ↓ Phaser attend la fin du chargement HTTP
GameScene.create()
  └─ this.buildTilemap(grid)      [BaseScene]
        pour chaque tuile :
          if this.textures.exists(key) → this.add.image()    ← texture PNG
          else                         → graphics.fillRect() ← couleur fallback
  └─ makeGameObject(joueur)
        if textures.exists('sprite_player') → add.image()
        else                                → add.rectangle() (orange #f4511e)
  └─ this.spawnEnemies(grid)
        pour chaque ENEMY_H/ENEMY_V :
          makeGameObject() → add.image ou add.rectangle
```

**Règle clé** : `buildTilemap` dessine les cases `ENEMY_H`/`ENEMY_V` comme du sol
(même texture/couleur que `TILE.EMPTY`). `spawnEnemies` place le sprite ennemi
par-dessus — l'ordre d'ajout garantit que l'ennemi est devant le sol.

---

## Tableau de fallback

| Clé texture | Constante ASSET | Fichier attendu | Fallback couleur |
|-------------|-----------------|-----------------|------------------|
| `tile_floor` | `ASSET_TILE_FLOOR` | `public/assets/tiles/floor.png` | `#2a2a3e` |
| `tile_wall` | `ASSET_TILE_WALL` | `public/assets/tiles/wall.png` | `#5c3d8f` |
| `tile_exit` | `ASSET_TILE_EXIT` | `public/assets/tiles/exit.png` | `#00e5a0` |
| `tile_spawn` | `ASSET_TILE_SPAWN` | `public/assets/tiles/spawn.png` | `#2a2a3e` |
| `sprite_player` | `ASSET_SPRITE_PLAYER` | `public/assets/sprites/player.png` | `#f4511e` (Rectangle) |
| `sprite_enemy_h` | `ASSET_SPRITE_ENEMY_H` | `public/assets/sprites/enemy_h.png` | `#e53935` (Rectangle) |
| `sprite_enemy_v` | `ASSET_SPRITE_ENEMY_V` | `public/assets/sprites/enemy_v.png` | `#ff8c00` (Rectangle) |

Si un fichier PNG est absent, `this.textures.exists(key)` retourne `false` et le jeu
utilise le Rectangle coloré — **aucun crash, aucune erreur bloquante**.

---

## Détail `Enemy.ts` — type union

```typescript
// Avant : rect: Phaser.GameObjects.Rectangle
// Après :
export type EnemyGameObject = Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
```

`applyPosition()` appelle `this.rect.setPosition(x, y)` — les deux types implémentent
`Phaser.GameObjects.Components.Transform`, donc l'appel est valide sans casting.

---

## Checklist d'implémentation

- [x] Créer `frontend/public/assets/tiles/` + `sprites/` (`.gitkeep`)
- [x] Créer `frontend/src/game/assets.ts` — constantes `KEY_*` et `ASSET_*`
- [x] `Enemy.ts` — `EnemyGameObject = Rectangle | Image`
- [x] `BaseScene.ts` — `preloadTileAssets()` + `buildTilemap()` avec fallback
- [x] `GameScene.ts` — `preload()`, joueur et ennemis sprite/fallback
- [ ] Fournir les PNG : `floor`, `wall`, `exit`, `spawn` (32×32 px)
- [ ] Fournir les PNG/spritesheets : `player`, `enemy_h`, `enemy_v`
- [ ] Vérifier visuellement : mode entraînement + mode tour
