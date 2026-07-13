# Duel — rendu de 1 à 3 adversaires distincts (généralisation du fantôme)

## Statut

**Implémenté** (`frontend/src/game/scenes/DuelScene.ts`,
`frontend/src/pages/duel/DuelGamePage.tsx`). Prolonge directement le fix de
la session précédente (`frontend_doc/duel-remote-ghost-sprite-identity.md`,
qui a introduit une texture + un jeu d'animations dédiés à l'unique
adversaire) en le généralisant à N-1 adversaires (jusqu'à 3).

### Écart par rapport à la version planifiée : clé par id, pas par index

La version décidée initialement indexait les fantômes par position dans le
tableau (`sprite_opponent_${i}`, `remote_walk_${i}_${dir}`). L'implémentation
finale clé plutôt par `user_id` (`sprite_opponent_${id}`,
`remote_walk_${id}_${dir}`), cohérent avec `this.remotes: Map<user_id,
RemoteGhost>` — plus robuste qu'un index de position (aucune ambiguïté
possible si l'ordre du tableau `opponents` variait). `DuelStartPayload`
transporte `opponent_sprites` comme `Record<user_id, string>` plutôt qu'un
tableau parallèle à `opponents`, pour la même raison.

Dépend de `backend_doc/duel-nplayer-lobby-and-race-lifecycle.md` (payload
`DuelStartPayload.opponents: [...]` au lieu de `opponent`) et de
`backend_doc/duel-server-authoritative-enemies.md` (`GameState.enemies`,
tween des ennemis depuis le serveur plutôt que simulation locale).

---

## Stack concernée

`frontend/src/game/scenes/DuelScene.ts` · `frontend/src/pages/duel/DuelGamePage.tsx`

---

## Rappel — pourquoi un fantôme ne peut pas juste changer de texture

Trouvé pendant le fix du fantôme 1v1 : une animation Phaser créée via
`this.anims.generateFrameNumbers(textureKey, { frames })` **reste liée à
cette texture pour toujours**, même jouée sur un sprite qui a une autre
texture par défaut. Il faut donc, pour chaque adversaire affiché : sa
propre texture chargée **et** son propre jeu d'animations
(`walk_*`/`idle_*`) généré à partir de cette texture. Ce n'était pas un
problème avec 1 seul adversaire (une texture + un jeu d'anims suffisait) ;
avec 3 adversaires potentiellement différents, il faut généraliser en
collection indexée plutôt qu'en champs nommés uniques.

---

## Remplacement des champs scalaires par une collection

```ts
// AVANT (DuelScene.ts actuel)
private remotePlayer!: Phaser.GameObjects.Sprite;
private remoteGridX = 0;
private remoteGridY = 0;
private remoteMoving = false;
private remoteLastDir: Direction = 'down';
private remoteLabel!: Phaser.GameObjects.Text;

// APRÈS
interface RemoteGhost {
  user_id:     string;
  sprite_key:  string;           // `sprite_opponent_${index}` — 0, 1 ou 2
  sprite:      Phaser.GameObjects.Sprite;
  label:       Phaser.GameObjects.Text;
  gridX:       number;
  gridY:       number;
  moving:      boolean;
  lastDir:     Direction;
}

private remotes = new Map<string, RemoteGhost>(); // clé = user_id de l'adversaire
```

`DuelSceneData` reçoit `opponents: { id, username, avatar }[]` (1 à 3
entrées) au lieu de `opponent` singulier — cf. le changement de
`DuelStartPayload` documenté côté backend. `DuelGamePage.tsx` doit résoudre
une sprite URL par adversaire (`AVATAR_TO_SPRITE[opponent.avatar ?? ''] ??
DEFAULT_PLAYER_SPRITE`) et les transmettre sous forme de tableau
`opponent_sprites: string[]` (même index que `opponents`).

---

## `preload()` — une texture par adversaire, clé indexée

```ts
data.opponents.forEach((_, i) => {
  const key = `sprite_opponent_${i}`;
  if (!this.textures.exists(key)) {
    this.load.spritesheet(key, this.opponentSpriteUrls[i] ?? DEFAULT_PLAYER_SPRITE, {
      frameWidth: FRAME_W, frameHeight: FRAME_H,
    });
  }
});
```

Ne **pas** clé par `user_id` directement (chaîne trop longue / caractères
potentiellement problématiques comme clé de texture Phaser) — préférer
l'index de position dans `opponents` (stable pour la durée d'une course).

---

## `create()` — une entrée `RemoteGhost` par adversaire, un jeu d'anims par texture

```ts
data.opponents.forEach((opponent, i) => {
  const key = `sprite_opponent_${i}`;
  const sprite = this.add.sprite(spawnPx, spawnPy, key)
    .setScale(0.20).setOrigin(0.5, 0.75).setDepth(1)
    .setAlpha(0.55).setTint(0x66aaff);
  const label = this.add.text(spawnPx, spawnPy - TILE_SIZE, opponent.username, {
    fontSize: '10px', color: '#99ccff', fontFamily: 'monospace',
  }).setOrigin(0.5, 1).setDepth(3).setAlpha(0.85);

  (Object.entries(ANIM_FRAMES) as [Direction, { walk: number[]; idle: number }][])
    .forEach(([dir, { walk, idle }]) => {
      const walkKey = `remote_walk_${i}_${dir}`;
      const idleKey = `remote_idle_${i}_${dir}`;
      if (!this.anims.exists(walkKey)) {
        this.anims.create({ key: walkKey, frames: this.anims.generateFrameNumbers(key, { frames: walk }), frameRate: FRAME_RATE, repeat: -1 });
      }
      if (!this.anims.exists(idleKey)) {
        this.anims.create({ key: idleKey, frames: this.anims.generateFrameNumbers(key, { frames: [idle] }), frameRate: 1, repeat: 0 });
      }
    });

  sprite.anims.play(`remote_idle_${i}_down`);
  this.remotes.set(opponent.id, {
    user_id: opponent.id, sprite_key: key, sprite, label,
    gridX: this.gridX, gridY: this.gridY, moving: false, lastDir: 'down',
  });
});
```

Note la clé d'animation `remote_walk_${i}_${dir}` (indexée) plutôt que
`remote_walk_${dir}` (fixe, comme dans le fix 1v1) — indispensable puisque
3 adversaires ont 3 textures différentes et donc 3 jeux d'animations
distincts qui doivent coexister dans le même `AnimationManager` de scène.

---

## `handleRemoteState` → `handleRemoteStates` (pluriel, un event par tick)

Le `game_state` reçu contient déjà `players: PlayerState[]` pour tous les
joueurs. Aujourd'hui, `DuelGamePage.tsx` filtre `p.id !== user?.id` pour
extraire *le* seul adversaire et émet `remote_state` (singulier). À
généraliser :

```ts
// DuelGamePage.tsx
socket.on('game_state', (gameState) => {
  if (!gameState.started) return;
  if (waiting) setWaiting(false);

  const remotes = gameState.players.filter(p => p.id !== user?.id);
  gameRef.current?.events.emit('remote_states', remotes); // pluriel, tableau
});
```

```ts
// DuelScene.ts
this.game.events.on('remote_states', this.handleRemoteStates, this);

private handleRemoteStates(states: PlayerState[]): void {
  for (const state of states) {
    const ghost = this.remotes.get(state.id);
    if (!ghost) continue; // adversaire inconnu — ne devrait pas arriver
    this.tweenGhost(ghost, state);
  }
}
```

`tweenGhost` reprend exactement la logique actuelle de
`handleRemoteState` (tween 140ms, saut direct si déjà en mouvement,
retour à l'idle en fin de tween) appliquée à un `RemoteGhost` au lieu des
champs scalaires `this.remotePlayer`/`this.remoteGridX`/etc.

---

## Ennemis — tween depuis `GameState.enemies` (cf. doc serveur)

`DuelScene` n'a plus de logique de déplacement d'ennemi locale (voir
`backend_doc/duel-server-authoritative-enemies.md`) : un handler
symétrique à `handleRemoteStates` reçoit `GameState.enemies` à chaque
`game_state` et tween chaque sprite ennemi (déjà créé par `spawnEnemies`
pour le rendu initial) vers sa position serveur. Pas de collection
supplémentaire nécessaire ici : les `Enemy` existants (`entities/Enemy.ts`)
n'ont plus besoin de `computeNextPosition()` côté client — seul
`applyPosition()`/le tween visuel reste utile.

---

## Bug post-implémentation : ghost figé au spawn si la scène charge lentement (corrigé 2026-07-07)

Symptôme observé en test à 3 joueurs : un joueur qui termine la course très
vite (avant même que les autres n'aient commencé à bouger) reste affiché
figé à la case SPAWN sur l'écran d'**un des autres** joueurs.

Cause : `game.events.emit('remote_states', ...)` (émis par
`DuelGamePage.tsx` à chaque `game_state`) est un simple `EventEmitter` —
un événement émis **avant** que `DuelScene.create()` ait enregistré
`this.game.events.on('remote_states', ...)` est perdu, sans file d'attente
ni relecture. Le chargement des textures (`preload()` : sprite joueur,
sprite(s) adversaire(s), tuiles, ennemis) prend un temps non nul et
indépendant du round-trip socket — sur un écran qui charge plus lentement,
plusieurs `game_state` peuvent arriver et être ignorés avant que `create()`
ne soit prêt. Si l'adversaire concerné a *déjà fini* pendant cette fenêtre,
sa position ne change plus jamais dans les diffusions suivantes — donc
même une fois les listeners enregistrés, plus aucun message ne le fait
"rattraper" sa vraie position : son fantôme reste au spawn indéfiniment.

**Fix — cache + relecture au lieu de compter sur le timing :**

- `DuelGamePage.tsx` conserve `lastGameStateRef` (le dernier `game_state`
  reçu, indépendamment de l'état de chargement de Phaser).
- `DuelScene.create()` émet `this.game.events.emit('scene_ready')` **une
  fois ses propres listeners enregistrés** (dernière ligne de `create()`).
- `DuelGamePage.tsx` écoute `scene_ready` et rejoue immédiatement
  `remote_states` / `remote_enemies` (et `i_died` si pertinent) à partir de
  `lastGameStateRef.current` — indépendamment de ce qui a pu être perdu
  pendant le chargement.

Cette relecture est **idempotente et sans risque** : elle a lieu même si
rien n'a été perdu (dans ce cas, elle ne fait que renvoyer l'état déjà à
jour). Elle ne dépend d'aucune hypothèse de timing entre le round-trip
socket et le chargement des assets Phaser — corrige la classe entière de
bug, pas seulement le cas observé en test.

---

## Invariants

- `this.remotes.size === data.opponents.length` en permanence après
  `create()` — jamais plus, jamais moins (pas d'ajout/retrait
  d'adversaire en cours de course, cf. reconnexion : un adversaire
  déconnecté reste affiché, juste figé/`alive: false`, jusqu'à la fin de
  la course).
- Chaque `RemoteGhost.sprite_key` est unique dans la scène — jamais deux
  adversaires sur la même texture, même si leur avatar réel est identique
  (cf. cas limite du fix 1v1 : redondant en mémoire mais sans effet visuel
  incorrect).
- Un joueur `alive: false` (mort ou forfait) garde son fantôme visible à
  l'écran (dernière position connue), pour que les autres joueurs
  comprennent visuellement qu'il est éliminé — pas de disparition brutale
  du sprite (à moins de décider explicitement d'un traitement visuel du
  type grisé/statique, à trancher à l'implémentation).

## Cas limite

| Situation | Comportement |
|-----------|--------------|
| Course à 2 joueurs (minimum) | `data.opponents.length === 1`, un seul `RemoteGhost` — comportement visuel identique à l'ancien fix 1v1, juste passé par la collection généralisée |
| Un adversaire meurt en cours de course | Son `PlayerState.alive` passe à `false` dans `game_state` ; le ghost correspondant arrête de recevoir de nouvelles positions tweenées (le serveur ne bouge plus un joueur mort) — reste visuellement figé à la dernière position |
| Recharge de page / remount de `DuelScene` | `this.remotes` est reconstruit entièrement dans `create()` à partir de `data.opponents` — pas d'état résiduel entre deux courses |
