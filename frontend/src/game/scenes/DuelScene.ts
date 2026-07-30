
import Phaser from 'phaser';
import {
  TILE, GRID_SIZE, extractEnemiesFromGrid,
  type Grid, type Direction, type PlayerState, type EnemyState,
} from '@ft/shared';
import { BaseScene, TILE_SIZE } from './BaseScene';
import {
  KEY_SPRITE_PLAYER,
  KEY_SPRITE_ENEMY_H, ASSET_SPRITE_ENEMY_H,
  KEY_SPRITE_ENEMY_V, ASSET_SPRITE_ENEMY_V,
  DEFAULT_PLAYER_SPRITE,
} from '../assets';
import { type EnemyGameObject } from '../entities/Enemy';

// ─── Constantes ───────────────────────────────────────────────────────────────

const FRAME_RATE = 8;
const FRAME_W    = 200;
const FRAME_H    = 320;

const ANIM_FRAMES: Record<Direction, { walk: number[]; idle: number }> = {
  down:  { walk: [0, 2],    idle: 1  },
  left:  { walk: [6, 7, 8], idle: 7  },
  right: { walk: [3, 5],    idle: 4  },
  up:    { walk: [9, 10],   idle: 10 },
};

const ENEMY_FRAME_W = 240;
const ENEMY_FRAME_H = 343;

const ENEMY_ANIM_FRAMES: Record<Direction, number[]> = {
  down:  [1, 3, 2, 1, 3],
  left:  [4, 6, 5, 4, 6],
  right: [1, 3, 2, 1, 3],
  up:    [12, 13, 14, 15],
};

// ─── Data passée à la scène ───────────────────────────────────────────────────

export interface DuelSceneData {
  grid:             Grid;
  my_id:            string;
  my_username:      string;
  my_sprite?:       string;
  // 1 à 3 adversaires (course de 2 à 4 joueurs) + URL de sprite par id.
  opponents:        { id: string; username: string; avatar: string | null }[];
  opponent_sprites: Record<string, string>;
}

// ─── Fantôme adverse ──────────────────────────────────────────────────────────
// Un adversaire = une texture dédiée + un jeu d'anims dédié (cf.
// frontend_doc/duel-remote-ghost-sprite-identity.md) : une anim Phaser garde
// sa texture d'origine même jouée sur un sprite différent, donc pas moyen de
// partager un seul jeu d'anims entre plusieurs adversaires aux skins distincts.

interface RemoteGhost {
  sprite:  Phaser.GameObjects.Sprite;
  label:   Phaser.GameObjects.Text;
  gridX:   number;
  gridY:   number;
  moving:  boolean;
  lastDir: Direction;
}

function opponentTextureKey(id: string): string {
  return `sprite_opponent_${id}`;
}

// ─── DuelScene ────────────────────────────────────────────────────────────────

export class DuelScene extends BaseScene {

  // ── Sprite URL résolue depuis l'avatar du joueur local ────────────────────
  private playerSpriteUrl = DEFAULT_PLAYER_SPRITE;
  private opponents: DuelSceneData['opponents'] = [];
  private opponentSpriteUrls: Record<string, string> = {};

  // ── Joueur local ──────────────────────────────────────────────────────────
  private grid:          Grid     = [];
  private gridX         = 0;
  private gridY         = 0;
  private localPlayer!: Phaser.GameObjects.Sprite;
  private cursors!:     Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up:    Phaser.Input.Keyboard.Key;
    down:  Phaser.Input.Keyboard.Key;
    left:  Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private isMoving      = false;
  private finished      = false;
  private lastDirection: Direction = 'down';
  private moveDuration  = 150;

  // ── Adversaires distants (1 à 3) ──────────────────────────────────────────
  private remotes = new Map<string, RemoteGhost>(); // clé = user_id adversaire

  // ── Ennemis (positions pilotées par le serveur, cf. duelHandler.ts) ───────
  private enemySprites = new Map<string, EnemyGameObject>();

  constructor() {
    super({ key: 'DuelScene' });
  }

  // ── init ──────────────────────────────────────────────────────────────────

  init(data: DuelSceneData): void {
    if (data.my_sprite) this.playerSpriteUrl = data.my_sprite;
    this.opponents = data.opponents;
    this.opponentSpriteUrls = data.opponent_sprites;
  }

  // ── preload ───────────────────────────────────────────────────────────────

  preload(): void {
    this.preloadTileAssets();
    this.load.spritesheet(KEY_SPRITE_ENEMY_H, ASSET_SPRITE_ENEMY_H, {
      frameWidth:  ENEMY_FRAME_W,
      frameHeight: ENEMY_FRAME_H,
    });
    this.load.spritesheet(KEY_SPRITE_ENEMY_V, ASSET_SPRITE_ENEMY_V, {
      frameWidth:  ENEMY_FRAME_W,
      frameHeight: ENEMY_FRAME_H,
    });
    if (!this.textures.exists(KEY_SPRITE_PLAYER)) {
      this.load.spritesheet(KEY_SPRITE_PLAYER, this.playerSpriteUrl, {
        frameWidth:  FRAME_W,
        frameHeight: FRAME_H,
      });
    }
    for (const opponent of this.opponents) {
      const key = opponentTextureKey(opponent.id);
      if (!this.textures.exists(key)) {
        this.load.spritesheet(key, this.opponentSpriteUrls[opponent.id] ?? DEFAULT_PLAYER_SPRITE, {
          frameWidth:  FRAME_W,
          frameHeight: FRAME_H,
        });
      }
    }
  }

  // ── create ────────────────────────────────────────────────────────────────

  create(data: DuelSceneData): void {
    this.grid     = data.grid;
    this.finished = false;
    this.isMoving = false;
    this.lastDirection = 'down';

    this.buildTilemap(data.grid);

    // Cherche le SPAWN
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (data.grid[row][col] === TILE.SPAWN) {
          this.gridX = col;
          this.gridY = row;
        }
      }
    }

    const spawnPx = this.gridX * TILE_SIZE + TILE_SIZE / 2;
    const spawnPy = this.gridY * TILE_SIZE + TILE_SIZE / 2;

    // ── Animations du joueur local (walk + idle × 4 directions) ──────────────
    (Object.entries(ANIM_FRAMES) as [Direction, { walk: number[]; idle: number }][])
      .forEach(([dir, { walk, idle }]) => {
        if (!this.anims.exists(`walk_${dir}`)) {
          this.anims.create({
            key:       `walk_${dir}`,
            frames:    this.anims.generateFrameNumbers(KEY_SPRITE_PLAYER, { frames: walk }),
            frameRate: FRAME_RATE,
            repeat:    -1,
          });
        }
        if (!this.anims.exists(`idle_${dir}`)) {
          this.anims.create({
            key:       `idle_${dir}`,
            frames:    this.anims.generateFrameNumbers(KEY_SPRITE_PLAYER, { frames: [idle] }),
            frameRate: 1,
            repeat:    0,
          });
        }
      });

    // ── Sprite joueur local ──────────────────────────────────────────────────
    this.localPlayer = this.add.sprite(spawnPx, spawnPy, KEY_SPRITE_PLAYER);
    this.localPlayer.setScale(0.20);
    this.localPlayer.setOrigin(0.5, 0.75);
    this.localPlayer.setDepth(2);
    this.localPlayer.anims.play('idle_down');

    // ── Fantômes adverses (1 à 3), chacun avec sa propre texture + anims ────
    for (const opponent of data.opponents) {
      const key = opponentTextureKey(opponent.id);

      const sprite = this.add.sprite(spawnPx, spawnPy, key);
      sprite.setScale(0.20);
      sprite.setOrigin(0.5, 0.75);
      sprite.setDepth(1);
      sprite.setAlpha(0.55);
      sprite.setTint(0x66aaff);

      const label = this.add.text(spawnPx, spawnPy - TILE_SIZE, opponent.username, {
        fontSize:   '10px',
        color:      '#99ccff',
        fontFamily: 'monospace',
      }).setOrigin(0.5, 1).setDepth(3).setAlpha(0.85);

      (Object.entries(ANIM_FRAMES) as [Direction, { walk: number[]; idle: number }][])
        .forEach(([dir, { walk, idle }]) => {
          const walkKey = `remote_walk_${opponent.id}_${dir}`;
          const idleKey = `remote_idle_${opponent.id}_${dir}`;
          if (!this.anims.exists(walkKey)) {
            this.anims.create({
              key:       walkKey,
              frames:    this.anims.generateFrameNumbers(key, { frames: walk }),
              frameRate: FRAME_RATE,
              repeat:    -1,
            });
          }
          if (!this.anims.exists(idleKey)) {
            this.anims.create({
              key:       idleKey,
              frames:    this.anims.generateFrameNumbers(key, { frames: [idle] }),
              frameRate: 1,
              repeat:    0,
            });
          }
        });

      sprite.anims.play(`remote_idle_${opponent.id}_down`);
      this.remotes.set(opponent.id, {
        sprite, label,
        gridX: this.gridX, gridY: this.gridY,
        moving: false, lastDir: 'down',
      });
    }

    this.spawnEnemies(data.grid);

    // Caméra suit le joueur local
    this.cameras.main.setBounds(0, 0, GRID_SIZE * TILE_SIZE, GRID_SIZE * TILE_SIZE);
    this.cameras.main.startFollow(this.localPlayer, true);

    // Clavier
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Écoute les mises à jour serveur (depuis React via game.events) :
    // positions des adversaires et des ennemis, toutes deux pilotées par le
    // tick autoritaire du serveur (cf. backend_doc/duel-server-authoritative-enemies.md).
    this.game.events.on('remote_states',  this.handleRemoteStates,  this);
    this.game.events.on('remote_enemies', this.handleRemoteEnemies, this);
    // Le mouvement local est prédictif (tween immédiat, sans attendre le
    // serveur) : sans ce signal explicite, le joueur continue de se déplacer
    // visuellement après sa mort côté serveur alors que ses inputs sont déjà
    // ignorés — cf. DuelGamePage.tsx `me.alive === false`.
    this.game.events.on('i_died', this.handleIDied, this);

    this.registerTouchInput();
    // Signale à React que les listeners ci-dessus sont prêts : tout
    // game_state émis PENDANT le chargement des assets (preload) était
    // silencieusement perdu (aucun listener encore inscrit) — React rejoue
    // alors son dernier état connu pour rattraper l'écart. Sans ça, un
    // adversaire qui termine très vite pendant que cette scène charge encore
    // reste figé au spawn pour toujours sur cet écran.
    this.game.events.emit('scene_ready');
  }

  // ── update ────────────────────────────────────────────────────────────────

  update(): void {
    if (this.finished || this.isMoving) return;

    const left  = this.cursors.left.isDown  || this.wasd.left.isDown || this.touchState.left;
    const right = this.cursors.right.isDown || this.wasd.right.isDown || this.touchState.right;
    const up    = this.cursors.up.isDown    || this.wasd.up.isDown || this.touchState.up;
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown || this.touchState.down;

    if      (left)  this.tryMove(-1,  0, 'left');
    else if (right) this.tryMove( 1,  0, 'right');
    else if (up)    this.tryMove( 0, -1, 'up');
    else if (down)  this.tryMove( 0,  1, 'down');
    else {
      this.moveDuration = 150;
      const idleKey = `idle_${this.lastDirection}`;
      if (this.localPlayer.anims.currentAnim?.key !== idleKey) {
        this.localPlayer.anims.play(idleKey);
      }
    }
  }

  // ── tryMove ───────────────────────────────────────────────────────────────
  // Mouvement prédictif côté client (feedback immédiat) ; le serveur reste
  // seul autoritaire sur la collision ennemie et l'arrivée réelle en EXIT
  // (cf. duelHandler.ts `player_input`) — le client ne fait ici que geler
  // son propre input une fois la case EXIT visuellement atteinte.

  private tryMove(dx: number, dy: number, dir: Direction): void {
    const nx = this.gridX + dx;
    const ny = this.gridY + dy;

    this.lastDirection = dir;
    if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) return;
    if (this.grid[ny][nx] === TILE.WALL) return;

    this.isMoving = true;
    this.gridX    = nx;
    this.gridY    = ny;

    this.localPlayer.anims.play(`walk_${dir}`, true);

    // Notifie React pour l'envoi socket
    this.game.events.emit('emit_player_input', { direction: dir });

    this.tweens.add({
      targets:  this.localPlayer,
      x:        nx * TILE_SIZE + TILE_SIZE / 2,
      y:        ny * TILE_SIZE + TILE_SIZE / 2,
      duration: this.moveDuration,
      ease:     'Linear',
      onComplete: () => {
        this.isMoving = false;

        const stillPressed =
          (dir === 'left'  && (this.cursors.left.isDown  || this.wasd.left.isDown))  ||
          (dir === 'right' && (this.cursors.right.isDown || this.wasd.right.isDown)) ||
          (dir === 'up'    && (this.cursors.up.isDown    || this.wasd.up.isDown))    ||
          (dir === 'down'  && (this.cursors.down.isDown  || this.wasd.down.isDown));
        if (stillPressed) this.moveDuration = Math.max(60, this.moveDuration - 15);

        if (this.grid[ny][nx] === TILE.EXIT && !this.finished) {
          this.finished = true;
        }
      },
    });
  }

  // ── handleIDied ───────────────────────────────────────────────────────────
  // Gèle l'input local : le serveur a déjà marqué ce joueur `alive: false`
  // (collision ennemie ou forfait de reconnexion) et ignore ses player_input
  // depuis. Réutilise le même gate que l'arrivée en EXIT (`update()` ignore
  // tout input tant que `this.finished` est vrai).

  private handleIDied(): void {
    this.finished = true;
  }

  // ── handleRemoteStates ────────────────────────────────────────────────────
  // Reçoit le PlayerState de chaque adversaire depuis React et anime le
  // fantôme correspondant vers sa nouvelle position. Un adversaire mort/fini
  // arrête naturellement de bouger : le serveur ne fait plus progresser sa
  // position, donc plus aucune nouvelle valeur ne diffère de la précédente.

  private handleRemoteStates(states: PlayerState[]): void {
    for (const state of states) {
      const ghost = this.remotes.get(state.id);
      if (!ghost) continue;

      const nx = state.position.x;
      const ny = state.position.y;

      ghost.lastDir = state.direction;

      if (nx === ghost.gridX && ny === ghost.gridY) continue;

      ghost.gridX = nx;
      ghost.gridY = ny;

      const targetX = nx * TILE_SIZE + TILE_SIZE / 2;
      const targetY = ny * TILE_SIZE + TILE_SIZE / 2;

      ghost.sprite.anims.play(`remote_walk_${state.id}_${state.direction}`, true);

      if (ghost.moving) {
        // Déjà en mouvement : on saute directement à la cible
        ghost.sprite.setPosition(targetX, targetY);
        ghost.label.setPosition(targetX, targetY - TILE_SIZE);
        continue;
      }

      ghost.moving = true;
      this.tweens.add({
        targets:  [ghost.sprite, ghost.label],
        x: (target: Phaser.GameObjects.GameObject) => (target === ghost.label ? targetX : targetX),
        y: (target: Phaser.GameObjects.GameObject) => (target === ghost.label ? targetY - TILE_SIZE : targetY),
        duration: 140,
        ease:     'Linear',
        onComplete: () => {
          ghost.moving = false;
          ghost.sprite.anims.play(`remote_idle_${state.id}_${ghost.lastDir}`);
        },
      });
    }
  }

  // ── spawnEnemies ──────────────────────────────────────────────────────────
  // Crée uniquement les sprites visuels, à leur position de spawn définie par
  // la grille. Le déplacement n'est plus simulé localement : il est piloté
  // par le tick serveur via handleRemoteEnemies() (cf. duelHandler.ts).

  private spawnEnemies(grid: Grid): void {
    this.enemySprites.clear();

    for (const enemy of extractEnemiesFromGrid(grid)) {
      const px  = enemy.x * TILE_SIZE + TILE_SIZE / 2;
      const py  = enemy.y * TILE_SIZE + TILE_SIZE / 2;
      const key = enemy.kind === 'horizontal' ? KEY_SPRITE_ENEMY_H : KEY_SPRITE_ENEMY_V;
      const fallbackColor = enemy.kind === 'horizontal' ? 0xe53935 : 0xff8c00;

      let obj: EnemyGameObject;

      if (this.textures.exists(key)) {
        const sprite = this.add.sprite(px, py, key)
          .setScale(0.2)
          .setCrop(15, 15, ENEMY_FRAME_W - 30, ENEMY_FRAME_H - 30)
          .setOrigin(0.5, 0.75)
          .setDepth(2);

        (Object.entries(ENEMY_ANIM_FRAMES) as [Direction, number[]][]).forEach(([dir, frames]) => {
          const animKey = `${key}_walk_${dir}`;
          if (!this.anims.exists(animKey)) {
            this.anims.create({
              key:       animKey,
              frames:    this.anims.generateFrameNumbers(key, { frames }),
              frameRate: FRAME_RATE,
              repeat:    -1,
            });
          }
        });

        sprite.anims.play(`${key}_walk_down`);
        obj = sprite;
      } else {
        obj = this.add.rectangle(px, py, TILE_SIZE, TILE_SIZE, fallbackColor).setDepth(2);
      }

      this.enemySprites.set(enemy.id, obj);
    }
  }

  // ── handleRemoteEnemies ───────────────────────────────────────────────────
  // Tween chaque sprite ennemi vers la position reçue du serveur (même
  // cadence que le tick serveur, 400ms — cf. duelHandler.ts ENEMY_TICK_MS).

  private handleRemoteEnemies(enemies: EnemyState[]): void {
    for (const enemy of enemies) {
      const obj = this.enemySprites.get(enemy.id);
      if (!obj) continue;

      const targetX = enemy.position.x * TILE_SIZE + TILE_SIZE / 2;
      const targetY = enemy.position.y * TILE_SIZE + TILE_SIZE / 2;

      if (obj instanceof Phaser.GameObjects.Sprite) {
        const key = enemy.kind === 'horizontal' ? KEY_SPRITE_ENEMY_H : KEY_SPRITE_ENEMY_V;
        const animKey = `${key}_walk_${enemy.direction}`;
        if (obj.anims.currentAnim?.key !== animKey) {
          obj.anims.play(animKey, true);
        }
      }

      this.tweens.add({
        targets:  obj,
        x:        targetX,
        y:        targetY,
        duration: 350,
        ease:     'Linear',
      });
    }
  }

  // ── shutdown ──────────────────────────────────────────────────────────────

  shutdown(): void {
    this.game.events.off('remote_states',  this.handleRemoteStates,  this);
    this.game.events.off('remote_enemies', this.handleRemoteEnemies, this);
    this.game.events.off('i_died',         this.handleIDied,         this);
    this.unregisterTouchInput();
  }
}
