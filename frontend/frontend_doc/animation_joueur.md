# Animer le joueur selon sa direction de déplacement

Afficher un sprite différent (ou une frame d'animation) selon que le joueur va à gauche, droite, haut ou bas.  
**Impact backend : aucun** — le mouvement est calculé localement dans `GameScene.ts`.

---

## Principe général

Le joueur est actuellement un `Phaser.GameObjects.Rectangle` (carré orange fixe).  
Pour avoir des sprites directionnels, on le remplace par un `Phaser.GameObjects.Sprite`  
qui peut afficher des frames statiques ou jouer une animation.

Deux approches possibles :

| Approche | Quand l'utiliser |
|----------|-----------------|
| **Frames statiques** (4 PNG, pas d'animation) | Sprites simples, style pixel-art discret |
| **Spritesheet + animations** (strip d'images) | Personnage avec cycle de marche |

---

## Arborescence des fichiers concernés

```
frontend/
├── public/assets/player/
│   ├── idle.png              ← (optionnel) état neutre/idle
│   ├── walk_left.png         ← frame ou strip direction gauche
│   ├── walk_right.png        ← frame ou strip direction droite
│   ├── walk_up.png           ← frame ou strip direction haut
│   └── walk_down.png         ← frame ou strip direction bas
│   — OU —
│   └── player_sheet.png      ← spritesheet unique (toutes directions)
└── src/game/scenes/
    └── GameScene.ts          ← TOUS les changements se font ici
```

`BaseScene.ts`, `GameCanvas.tsx`, `EditorGrid.tsx`, `TileSelector.tsx` : **inchangés**.

---

## Approche A — Frames statiques (4 images séparées)

### A1. Préparer les assets

```
frontend/public/assets/player/
├── walk_left.png    # 24 × 24 px (= TILE_SIZE - 8, taille actuelle du joueur)
├── walk_right.png
├── walk_up.png
└── walk_down.png
```

### A2. Charger les textures dans `preload()`

**Fichier** : `frontend/src/game/scenes/GameScene.ts`, méthode `preload()` (ligne 42)

```typescript
// AVANT
preload(): void {
  // Placeholder — real assets loaded here in future sprints
}

// APRÈS
preload(): void {
  this.load.image('player_left',  'assets/player/walk_left.png');
  this.load.image('player_right', 'assets/player/walk_right.png');
  this.load.image('player_up',    'assets/player/walk_up.png');
  this.load.image('player_down',  'assets/player/walk_down.png');
}
```

### A3. Remplacer `Rectangle` par `Sprite`

**Fichier** : `frontend/src/game/scenes/GameScene.ts`

#### Champ de classe (ligne 26)

```typescript
// AVANT
private player!: Phaser.GameObjects.Rectangle;

// APRÈS
private player!: Phaser.GameObjects.Sprite;
```

#### Ajouter un champ pour suivre la direction courante

```typescript
// Ajouter après `private finished = false;` (ligne 36)
private facing: 'left' | 'right' | 'up' | 'down' = 'down';
```

#### `create()` — instanciation du joueur (lignes 64–70)

```typescript
// AVANT
this.player = this.add.rectangle(
  this.gridX * TILE_SIZE + TILE_SIZE / 2,
  this.gridY * TILE_SIZE + TILE_SIZE / 2,
  TILE_SIZE - 8,
  TILE_SIZE - 8,
  0xf4511e,
);

// APRÈS
this.player = this.add.sprite(
  this.gridX * TILE_SIZE + TILE_SIZE / 2,
  this.gridY * TILE_SIZE + TILE_SIZE / 2,
  'player_down', // texture initiale = face à l'écran
);
this.player.setDisplaySize(TILE_SIZE - 8, TILE_SIZE - 8);
```

- `this.add.sprite(x, y, key)` → `Phaser.GameObjects.Sprite`  
- `.setDisplaySize()` → force la taille à 24 × 24 px quel que soit le PNG source  
- La caméra (`startFollow`) prend n'importe quel `GameObject` — aucun changement ligne 74

#### `tryMove()` — changer la texture au déplacement (ligne 112)

```typescript
// AVANT
private tryMove(dx: number, dy: number): void {
  const nx = this.gridX + dx;
  const ny = this.gridY + dy;
  if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) return;
  if (this.grid[ny][nx] === TILE.WALL) return;

  this.gridX = nx;
  this.gridY = ny;
  this.player.setPosition(nx * TILE_SIZE + TILE_SIZE / 2, ny * TILE_SIZE + TILE_SIZE / 2);
  // ...
}

// APRÈS
private tryMove(dx: number, dy: number): void {
  const nx = this.gridX + dx;
  const ny = this.gridY + dy;
  if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) return;
  if (this.grid[ny][nx] === TILE.WALL) return;

  // Mettre à jour la direction et la texture
  if      (dx === -1) this.facing = 'left';
  else if (dx ===  1) this.facing = 'right';
  else if (dy === -1) this.facing = 'up';
  else if (dy ===  1) this.facing = 'down';
  this.player.setTexture(`player_${this.facing}`);

  this.gridX = nx;
  this.gridY = ny;
  this.player.setPosition(nx * TILE_SIZE + TILE_SIZE / 2, ny * TILE_SIZE + TILE_SIZE / 2);

  if (this.grid[ny][nx] === TILE.EXIT) {
    this.finished = true;
    const elapsed = Math.floor(this.time.now - this.startTime);
    this.game.events.emit('player_reached_exit', elapsed);
  }
}
```

- `setTexture(key)` → swape la texture du sprite sans recréer l'objet  
- `this.facing` = `'left' | 'right' | 'up' | 'down'` → dérivé de `dx`/`dy`  
- Les clés `player_left` etc. sont celles déclarées dans `preload()`

---

## Approche B — Spritesheet avec animation de marche

Plus immersif : le personnage a plusieurs frames par direction (cycle de marche).

### B1. Préparer le spritesheet

Un seul PNG organisé en rangées/colonnes :

```
player_sheet.png (128 × 128 px, 4 colonnes × 4 rangées, frames de 32 × 32)

Rangée 0 (dy =  1) : walk_down  frames 0–3
Rangée 1 (dy = -1) : walk_up    frames 4–7
Rangée 2 (dx = -1) : walk_left  frames 8–11
Rangée 3 (dx =  1) : walk_right frames 12–15
```

> Adapte les dimensions à ton asset. L'important est la cohérence entre `frameWidth`/`frameHeight` et la taille réelle des frames.

### B2. Charger le spritesheet dans `preload()`

```typescript
preload(): void {
  this.load.spritesheet('player', 'assets/player/player_sheet.png', {
    frameWidth:  32,
    frameHeight: 32,
  });
}
```

- `this.load.spritesheet()` découpe automatiquement l'image en frames numérotées (0, 1, 2, ...)
- `frameWidth` / `frameHeight` = taille d'une frame individuelle en px

### B3. Créer les animations dans `create()`

Juste après `this.buildTilemap(data.grid)` (ligne 51), ajouter :

```typescript
// Créer une animation par direction
this.anims.create({
  key: 'walk_down',
  frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
  frameRate: 8,
  repeat: -1, // boucle infinie
});
this.anims.create({
  key: 'walk_up',
  frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
  frameRate: 8,
  repeat: -1,
});
this.anims.create({
  key: 'walk_left',
  frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
  frameRate: 8,
  repeat: -1,
});
this.anims.create({
  key: 'walk_right',
  frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15 }),
  frameRate: 8,
  repeat: -1,
});
```

Remplacer `this.add.rectangle()` par un sprite (identique à l'approche A) :

```typescript
this.player = this.add.sprite(
  this.gridX * TILE_SIZE + TILE_SIZE / 2,
  this.gridY * TILE_SIZE + TILE_SIZE / 2,
  'player',
  0, // frame initiale
);
this.player.setDisplaySize(TILE_SIZE - 8, TILE_SIZE - 8);
this.player.play('walk_down'); // animation par défaut
```

### B4. Jouer l'animation dans `tryMove()`

```typescript
private tryMove(dx: number, dy: number): void {
  const nx = this.gridX + dx;
  const ny = this.gridY + dy;
  if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) return;
  if (this.grid[ny][nx] === TILE.WALL) return;

  // Jouer l'animation de la direction
  if      (dx === -1) this.player.play('walk_left',  true);
  else if (dx ===  1) this.player.play('walk_right', true);
  else if (dy === -1) this.player.play('walk_up',    true);
  else if (dy ===  1) this.player.play('walk_down',  true);

  this.gridX = nx;
  this.gridY = ny;
  this.player.setPosition(nx * TILE_SIZE + TILE_SIZE / 2, ny * TILE_SIZE + TILE_SIZE / 2);

  if (this.grid[ny][nx] === TILE.EXIT) {
    this.finished = true;
    const elapsed = Math.floor(this.time.now - this.startTime);
    this.game.events.emit('player_reached_exit', elapsed);
  }
}
```

- `.play('walk_left', true)` → `true` = ne pas redémarrer si l'animation est déjà active (évite le glitch de reset de frame)
- L'animation boucle tant que `repeat: -1`

### B5. (Optionnel) Stopper l'animation quand le joueur ne bouge plus

Dans `update()` (ligne 88), après `this.moved = false; return;` :

```typescript
if (!anyKey) {
  this.moved = false;
  // Figer sur la première frame de la direction courante
  this.player.anims.stop();
  this.player.setFrame(0); // ou la frame "idle" de ta direction
  return;
}
```

---

## Tableau récapitulatif des modifications

| Fichier | Symbole modifié | Ligne | Nature du changement |
|---------|----------------|-------|----------------------|
| `GameScene.ts` | `player` | 26 | `Rectangle` → `Sprite` |
| `GameScene.ts` | `facing` | ~37 | nouveau champ |
| `GameScene.ts` | `preload()` | 42 | ajout `this.load.image()` ou `this.load.spritesheet()` |
| `GameScene.ts` | `create()` | 64 | `add.rectangle()` → `add.sprite()` |
| `GameScene.ts` | `create()` | ~51 | (approche B) appels `this.anims.create()` |
| `GameScene.ts` | `tryMove()` | 112 | ajout `setTexture()` ou `play()` |
| `GameScene.ts` | `update()` | 88 | (optionnel) stop animation si idle |

---

## Dépendances entre symboles

```
shared/src/types/tiles.types.ts
  └─ TILE, GRID_SIZE → importés par GameScene.ts (inchangé)

frontend/public/assets/player/
  ├─ chargé par preload() via this.load.image() ou this.load.spritesheet()
  └─ référencé par key string dans setTexture() / play() / anims.create()

GameScene.ts
  ├─ extends BaseScene (héritage — buildTilemap() inchangé)
  ├─ private player: Phaser.GameObjects.Sprite   ← type change
  ├─ private facing: 'left'|'right'|'up'|'down'  ← nouveau
  ├─ preload() → charge les assets
  ├─ create() → instancie le sprite + crée les animations (approche B)
  └─ tryMove() → appelle setTexture() ou play() selon dx/dy

GameCanvas.tsx
  └─ aucun changement (game.events, startFollow — compatibles Sprite/Rectangle)
```

---

## Checklist d'implémentation

### Approche A (frames statiques)
- [ ] Créer 4 PNG dans `frontend/public/assets/player/`
- [ ] `preload()` : 4 appels `this.load.image('player_<dir>', ...)`
- [ ] Champ de classe : `player` → `Phaser.GameObjects.Sprite`, ajouter `facing`
- [ ] `create()` : `add.rectangle()` → `add.sprite()` + `.setDisplaySize()`
- [ ] `tryMove()` : déduire `facing` de `dx`/`dy`, appeler `setTexture()`

### Approche B (spritesheet animé)
- [ ] Créer `player_sheet.png` (rangées par direction, frames par rangée)
- [ ] `preload()` : `this.load.spritesheet('player', ..., { frameWidth, frameHeight })`
- [ ] Champ de classe : `player` → `Phaser.GameObjects.Sprite`
- [ ] `create()` : 4 appels `this.anims.create()` + `add.sprite()` + `.play('walk_down')`
- [ ] `tryMove()` : appeler `this.player.play('walk_<dir>', true)`
- [ ] (optionnel) `update()` : stopper l'animation si aucune touche pressée
