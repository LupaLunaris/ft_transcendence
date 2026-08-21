# Debug history — 2026-05-22 : Artefacts visuels du sprite joueur

## Contexte
Session de corrections sur GameScene.ts : 3 fixes appliqués (scale natif, caméra sans lerp,
accélération progressive), puis diagnostic de nouveaux artefacts visuels signalés par l'utilisateur.
Le spritesheet player.png a été re-vérifié pixel par pixel.

---

## Problème 1 — Sprite coupé et mains dans les cases adjacentes

### Symptôme
En marchant haut/bas, des parties des mains du personnage apparaissent dans les cases adjacentes
(gauche/droite). En marchant contre un mur, le personnage débordait visuellement dans la case mur.

### Cause
Mismatch dimensionnel fondamental : sprite source 36×64px sur une case de jeu 32×32px.
- Overflow horizontal : (36−32)/2 = **2px de chaque côté**
- Overflow vertical   : (64−32)/2 = **16px haut et bas**

Avec `setScale(1)`, le sprite est à taille native et déborde. Avec l'ancienne valeur
`setScale(TILE_SIZE/FRAME_W) = 0.888`, le débordement était masqué mais créait des artefacts
WebGL (scale non-entier oscillant entre 31px et 32px selon le frame).

### Fix — solution finale retenue
```typescript
// BaseScene.ts
export const TILE_SIZE = 36; // était 32 — correspond exactement à FRAME_W du sprite

// GameScene.ts
this.player.setScale(1); // aucun crop nécessaire, sprite 36px = tile 36px
```
Overflow résiduel vertical : (64−36)/2 = **14px haut et bas** — look RPG voulu, confirmé en runtime.
Le crop `setCrop(2, 8, 32, 48)` utilisé temporairement a été retiré.

### Fichiers impliqués
- `frontend/src/game/scenes/BaseScene.ts` — TILE_SIZE
- `frontend/src/game/scenes/GameScene.ts`

---

## Problème 2 — Personnage coupé 1 déplacement sur 3 (latéral, appui continu)

### Symptôme
En maintenant une touche directionnelle latérale, le personnage semble visuellement coupé/slicé
environ tous les 3 mouvements.

### Cause (hypothèse, non confirmée en runtime)
Deux candidats :
1. **Camera + roundPixels** : le canvas fait 800px et la carte 25×32=800px — la caméra ne scrolle
   jamais horizontalement. À certaines positions pixel, l'arrondi `roundPixels` peut créer un saut
   d'1px dans la position d'affichage, coïncidant avec un frame d'animation particulier.
2. **Animation frame + durée de tween** : le cycle walk est 4 frames à 8fps (125ms/frame). La
   durée du tween (150→135→120ms) peut s'aligner sur des frames problématiques.

### Fix
Non appliqué — nécessite validation en runtime. Le setCrop (Problème 1) peut réduire ce symptôme
si la cause était le débordement horizontal.

### Fichiers impliqués
- `frontend/src/game/scenes/GameScene.ts`

---

## Problème 3 — Même position de pied lors d'avance touche par touche

### Symptôme
En appuyant touche par touche (sans maintien), le personnage repart toujours du même frame de
marche (même position des pieds), au lieu d'alterner.

### Cause
La séquence est : `play('walk_right')` → tween termine → `isMoving=false` → dans `update()` else
branch : `play('idle_right')` (frame 4, 1 frame statique). Au prochain appui : `play('walk_right',
true)` — comme `idle_right` est en cours (pas `walk_right`), l'animation redémarre depuis frame 0.

### Fix
Non demandé. Correction possible : dans le else branch de `update()`, utiliser
`this.player.anims.stop()` au lieu de `play('idle_dir')` pour rester au frame courant. Mais le
personnage resterait figé en mid-stride, ce qui peut sembler bizarre.

---

## Notes architecture
- `setCrop(x, y, w, h)` en Phaser 3 : coordonnées locales au frame source (pixels dans la texture).
  Persiste à travers les frames d'animation. N'affecte pas `FRAME_W`/`FRAME_H` qui restent les
  dimensions **source** pour le chargement de la spritesheet.
- Les constantes `FRAME_W=36` / `FRAME_H=64` décrivent le **spritesheet source**, pas le rendu.
  Ne pas les changer pour correspondre au crop.
- La spritesheet player.png est correctement découpée : 144×256px, 36×64 par frame, 4×4 layout
  parfaitement aligné. Pas de padding entre frames.
- Avec TILE_SIZE=36, la carte fait 25×36=900px > canvas 800px : la caméra scrolle **aussi horizontalement** désormais.
- TILE_SIZE est isolé dans `BaseScene.ts` et importé par `GameScene.ts` et `Enemy.ts`. L'éditeur a sa propre constante indépendante — pas d'impact sur l'éditeur.
