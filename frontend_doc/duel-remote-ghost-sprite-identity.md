# Mode Duel — le fantôme adverse affichait le skin du joueur local

## Stack concernée
Phaser 3.80 `AnimationManager` · `DuelScene.ts` · `DuelGamePage.tsx`

---

## Symptôme

Dans `/duel/game`, le sprite fantôme (teinté bleu, alpha 0.55) censé
représenter l'adversaire affichait en réalité le skin du **joueur local**
lui-même, quel que soit l'avatar de l'adversaire.

---

## Cause racine : une seule texture chargée, partagée par les deux sprites

`DuelScene` ne chargeait qu'une seule spritesheet joueur —
`KEY_SPRITE_PLAYER`, résolue depuis `data.my_sprite` (l'avatar du joueur
**local**). `localPlayer` et `remotePlayer` étaient tous les deux créés
avec cette même texture :

```ts
this.remotePlayer = this.add.sprite(spawnPx, spawnPy, KEY_SPRITE_PLAYER);
this.localPlayer  = this.add.sprite(spawnPx, spawnPy, KEY_SPRITE_PLAYER);
```

Pire : même en donnant à `remotePlayer` une texture différente à la
création, le bug aurait persisté à cause d'une propriété moins connue de
Phaser — **une animation créée via `generateFrameNumbers(textureKey, …)`
porte sa propre référence de texture, indépendamment du sprite qui la
joue.** Les animations `walk_${dir}` / `idle_${dir}` étaient toutes créées
une seule fois à partir de `KEY_SPRITE_PLAYER`. Appeler
`remotePlayer.anims.play('walk_down')` forçait donc l'affichage des frames
de `KEY_SPRITE_PLAYER` (skin local) sur le sprite `remotePlayer`, quelle
que soit sa texture de départ.

`data.opponent.avatar` était bien reçu par la scène (utilisé pour le label
pseudo) mais jamais utilisé pour résoudre une texture distincte.

---

## Fix appliqué

### 1. Charger une deuxième texture dédiée à l'adversaire

```ts
// DuelScene.ts
const KEY_SPRITE_OPPONENT = 'sprite_opponent'; // clé locale à la scène

private opponentSpriteUrl = DEFAULT_PLAYER_SPRITE;

init(data: DuelSceneData): void {
  if (data.my_sprite)       this.playerSpriteUrl   = data.my_sprite;
  if (data.opponent_sprite) this.opponentSpriteUrl = data.opponent_sprite;
}

preload(): void {
  // ...
  if (!this.textures.exists(KEY_SPRITE_OPPONENT)) {
    this.load.spritesheet(KEY_SPRITE_OPPONENT, this.opponentSpriteUrl, {
      frameWidth: FRAME_W, frameHeight: FRAME_H,
    });
  }
}
```

### 2. Un jeu d'animations séparé, lié à cette texture

```ts
if (!this.anims.exists(`remote_walk_${dir}`)) {
  this.anims.create({
    key:    `remote_walk_${dir}`,
    frames: this.anims.generateFrameNumbers(KEY_SPRITE_OPPONENT, { frames: walk }),
    frameRate: FRAME_RATE, repeat: -1,
  });
}
// idem pour remote_idle_${dir}
```

`remotePlayer.anims.play(...)` utilise désormais exclusivement les clés
`remote_walk_*` / `remote_idle_*` (dans `create()` et `handleRemoteState`).

### 3. Propager le sprite adversaire depuis React

```tsx
// DuelGamePage.tsx
game.scene.add('DuelScene', DuelScene, true, {
  ...
  my_sprite:       AVATAR_TO_SPRITE[user.avatar ?? '']          ?? DEFAULT_PLAYER_SPRITE,
  opponent_sprite: AVATAR_TO_SPRITE[state.opponent.avatar ?? ''] ?? DEFAULT_PLAYER_SPRITE,
  opponent:        state.opponent,
});
```

---

## Invariant à retenir

> Dans Phaser, une animation créée avec `generateFrameNumbers(textureKey, …)`
> est **liée à cette texture pour toujours**, même jouée sur un sprite
> d'une autre texture. Pour afficher deux personnages visuellement
> différents (joueur local vs adversaire) il faut : une texture par
> personnage **et** un jeu d'animations par texture — jamais un jeu
> d'animations partagé entre deux textures différentes.

## Cas limite

| Situation | Comportement |
|-----------|-------------|
| Adversaire sans avatar personnalisé (`avatar: null`) | `AVATAR_TO_SPRITE['']` → `undefined` → fallback `DEFAULT_PLAYER_SPRITE`, identique au comportement du joueur local sans avatar |
| Les deux joueurs ont le même skin | Chargé deux fois sous deux clés différentes (`sprite_player` / `sprite_opponent`) — redondant mais sans effet visuel incorrect |
