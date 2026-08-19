# Mode Duel — freeze après quelques secondes + sprite ennemi hors cadre

## Stack concernée
Phaser 3.80 · `DuelScene.ts` · `GameScene.ts` (référence qui fonctionne)

---

## Symptôme

En mode duel (`/duel/game`), la partie tournait quelques secondes — le
sprite de l'ennemi apparaissant visuellement "hors cadre", comme si le
crop ne s'appliquait pas — puis le jeu se bloquait complètement.

---

## Cause racine : mauvais découpage du spritesheet ennemi

Le fichier `enemy_test.png` (utilisé pour `KEY_SPRITE_ENEMY_H` et
`KEY_SPRITE_ENEMY_V`) fait **962×1375px**.

`GameScene.ts` le découpe en `240×343` → grille 4×4 exacte (floor, quelques
pixels perdus en bord), soit **16 frames** (index 0–15), ce qui correspond
aux index utilisés dans `ENEMY_ANIM_FRAMES` (jusqu'à 15).

`DuelScene.ts` déclarait `ENEMY_FRAME_W = 258` / `ENEMY_FRAME_H = 353` →
`962/258 ≈ 3.7` et `1375/353 ≈ 3.9`, Phaser tronque (floor) à une grille
**3×3 = 9 frames** (index 0–8) seulement. Or `ENEMY_ANIM_FRAMES` dans ce
même fichier référence des index jusqu'à 15 (`up: [12,13,14,15]`,
`left: [8,9,10,11]`).

Conséquence :
- Le découpage erroné coupe les limites de frame au mauvais endroit →
  bavure visuelle entre frames adjacentes ("hors cadre").
- Dès qu'un ennemi doit jouer `walk_left` / `walk_right` / `walk_up`
  (frames 8–15, inexistantes dans la feuille mal découpée à 9 frames),
  Phaser tente d'animer vers une frame qui n'existe pas → plantage de la
  boucle de rendu. Ça survient après le premier rebond sur un mur
  (~quelques secondes après le spawn), ce qui correspond exactement au
  symptôme observé.

`DuelScene.spawnEnemies` n'appelait en plus jamais `.setCrop(...)` sur le
sprite ennemi, contrairement à `GameScene` — accentuant l'effet visuel de
sprite mal cadré même sur les frames valides.

---

## Fix appliqué — `DuelScene.ts`

```ts
// avant
const ENEMY_FRAME_W = 258;
const ENEMY_FRAME_H = 353;

// après — aligné sur GameScene.ts, seul découpage cohérent avec l'image réelle
const ENEMY_FRAME_W = 240;
const ENEMY_FRAME_H = 343;
```

```ts
const sprite = this.add.sprite(px, py, key)
  .setScale(0.2)
  .setCrop(15, 15, ENEMY_FRAME_W - 30, ENEMY_FRAME_H - 30)
  .setOrigin(0.5, 0.75)
  .setDepth(2);
```

---

## Invariant à retenir

> `KEY_SPRITE_ENEMY_H` / `KEY_SPRITE_ENEMY_V` pointent vers le même fichier
> physique (`enemy_test.png`, 962×1375px) dans `GameScene` et `DuelScene`.
> Les deux scènes **doivent** déclarer le même `frameWidth`/`frameHeight`
> au chargement — un découpage différent dans une des deux scènes casse
> silencieusement le nombre de frames disponibles et peut faire planter
> `anims.play()` sur un index de frame inexistant.

## Cas limite

| Situation | Comportement |
|-----------|-------------|
| Ennemi horizontal qui ne rebondit jamais (mur jamais atteint) | Reste sur `walk_down`/`walk_right` (frames 0–7, valides même avec l'ancien découpage) → bug invisible, explique pourquoi ça "marchait quelques secondes" |
| Remplacement futur de `enemy_test.png` par un fichier aux dimensions différentes | Il faudra recalculer `ENEMY_FRAME_W`/`ENEMY_FRAME_H` dans **les deux scènes** (`GameScene.ts` et `DuelScene.ts`) à l'identique |
