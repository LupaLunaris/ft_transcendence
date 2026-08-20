# Modifier la grille de l'éditeur de map

Ce document explique le fonctionnement de la grille dans l'éditeur, diagnostique le problème de colonnes vides, et décrit comment modifier le comportement visuel.

---

## Fichiers concernés

```
shared/src/types/tiles.types.ts          ← GRID_SIZE, TILE, Grid (source de vérité)
frontend/src/components/editor/
├── EditorGrid.tsx                        ← rendu de la grille (CSS Grid)
└── TileSelector.tsx                      ← sélecteur de type de tuile
frontend/src/pages/editor/
└── EditorPage.tsx                        ← état de la grille, logique d'édition
```

Seul `EditorGrid.tsx` contrôle l'affichage visuel de la grille. Les autres fichiers lui fournissent des données.

---

## Architecture du composant `EditorGrid.tsx`

Le composant reçoit quatre props :

| Prop | Type | Rôle |
|------|------|------|
| `grid` | `Grid` (= `TileValue[][]`, 25×25) | Données de la carte |
| `selectedTile` | `TileValue` | Tuile active dans le sélecteur |
| `onTileClick(x, y)` | `(number, number) => void` | Callback clic gauche / drag gauche |
| `onTileRightClick?(x, y)` | `(number, number) => void` | Callback clic droit / drag droit (optionnel) |

### Rendu

La grille est un `<div>` avec `display: grid`. Chaque tuile est un `<div>` enfant, les 625 divs (25×25) sont générés par une double boucle `.map()` :

```tsx
// EditorGrid.tsx : ligne 41-44 — conteneur
<div style={{
  display: 'grid',
  gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,  // ← 25 colonnes en fractions
  gap: 0,
}}>

// EditorGrid.tsx : ligne 52-58 — chaque cellule
<div style={{
  width: 22,    // ← 22 px fixe
  height: 22,
  backgroundColor: tileColor(tile),
  border: tileBorder(tile),
}} />
```

---

## Diagnostic : pourquoi y a-t-il une colonne vide entre chaque tuile ?

### La cause

Il y a une **incompatibilité entre `1fr` et `width: 22px` fixe**.

En CSS Grid, `1fr` signifie « une fraction de l'espace disponible du conteneur ». Si le conteneur est plus large que `25 × 22px = 550px`, chaque colonne `1fr` devient plus large que 22px. Or, la cellule a une largeur fixe de 22px — elle n'occupe pas toute la colonne.

**Exemple concret** : si le conteneur mesure 1100px de large, chaque `1fr` = 44px. La cellule de 22px se place à gauche de la colonne, laissant 22px vides à droite. Visuellement, on voit une colonne de tuiles, puis une colonne vide, puis une colonne de tuiles, etc. — exactement comme si on avait le double de colonnes.

```
┌──────── 44px (1fr) ────────┐
│ ██████ 22px │ vide 22px    │  ← colonne fantôme
└────────────────────────────┘
```

### Pourquoi ça arrive maintenant ?

Le conteneur `inline-block` n'a pas de largeur explicite. Sa largeur est déterminée par son contexte (parent, flexbox, etc.). Dès que le parent est assez large, `1fr` devient > 22px et le bug apparaît.

---

## Correction

Il faut que la largeur de colonne CSS Grid corresponde à la largeur des cellules. Deux approches :

### Option A — Colonnes en pixels fixes (recommandée)

Remplacer `1fr` par la taille réelle de la cellule. La grille et les cellules utilisent alors la même valeur.

**Fichier** : [EditorGrid.tsx](../src/components/editor/EditorGrid.tsx) ligne 42

```tsx
// AVANT
gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,

// APRÈS
gridTemplateColumns: `repeat(${GRID_SIZE}, 22px)`,
```

Avantage : simple, prévisible, la taille totale de la grille est `25 × 22px = 550px`.

> Si tu changes la taille des tuiles plus tard, il faut mettre à jour les deux endroits : `gridTemplateColumns` et `width`/`height` des cellules. Pour éviter ça, tu peux extraire une constante :
>
> ```tsx
> const CELL_PX = 22;
> // ...
> gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_PX}px)`,
> // ...
> style={{ width: CELL_PX, height: CELL_PX, ... }}
> ```

### Option B — Cellules `width: 100%`

Supprimer `width` fixe sur les cellules et les laisser remplir leur colonne.

```tsx
// Cellule : supprimer width, garder height
style={{
  height: 22,         // hauteur toujours fixe
  // width: 22,       ← supprimé, la cellule remplit la colonne
  backgroundColor: tileColor(tile),
  border: tileBorder(tile),
}}
```

Avec `1fr`, chaque cellule occupera exactement sa colonne. Mais la largeur totale de la grille dépendra de son conteneur — moins prévisible.

---

## Comment personnaliser la grille

### Changer la taille des tuiles

Modifier `width` et `height` des cellules, et `gridTemplateColumns` en cohérence (voir Option A ci-dessus).

### Changer l'espacement entre tuiles

Modifier `gap` sur le conteneur (actuellement `0`) :

```tsx
// Ajouter 1px entre chaque tuile
style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, 22px)`, gap: 1 }}
```

### Changer les couleurs des tuiles

Modifier la fonction `tileColor()` (ligne 21) :

```tsx
function tileColor(tile: TileValue): string {
  switch (tile) {
    case TILE.WALL:  return '#5c3d8f';   // ← couleur hex CSS
    case TILE.EXIT:  return '#00e5a0';
    case TILE.SPAWN: return '#f4511e';
    case TILE.ENEMY: return '#e53935';
    default:         return '#2a2a3e';   // EMPTY
  }
}
```

### Changer les bordures des tuiles

Modifier `tileBorder()` (ligne 31) :

```tsx
function tileBorder(tile: TileValue): string {
  if (tile === TILE.WALL) return '1px solid #3d2a5c';
  return '1px solid #1a1a2e';
}
```

Pour supprimer les bordures : `return 'none'`.

### Changer la taille de la grille (nombre de tuiles)

`GRID_SIZE` est défini dans `shared/src/types/tiles.types.ts`. C'est la source de vérité pour tout le projet (éditeur, moteur Phaser, backend). **Ne pas dupliquer cette valeur dans `EditorGrid.tsx`** — elle est importée via `@ft/shared`.

---

## Interactions souris

| Geste | Résultat |
|-------|----------|
| Clic gauche | Place `selectedTile` sur la cellule |
| Drag gauche (`buttons === 1`) | Peint `selectedTile` en continu |
| Clic droit | Efface la cellule → `TILE.EMPTY` (sol) |
| Drag droit (`buttons === 2`) | Efface en continu |

Le menu contextuel natif du navigateur est supprimé (`e.preventDefault()`) sur chaque cellule — le droit-clic ne déclenche pas de menu.

Les bordures extérieures (row/col = 0 ou 24) sont inaltérables dans les deux sens : `setTile` et `clearTile` retournent sans modifier la grille si la cellule est sur un bord.

La prop `onTileRightClick` est `undefined` quand la map est publiée (`!adminMode && isPublished`), ce qui désactive silencieusement le clic droit — cohérent avec `onTileClick` qui reçoit `() => {}` dans le même cas.

---

## Récapitulatif du flux de données

```
EditorPage.tsx
  ├─ state: grid (Grid = TileValue[][]  25×25)
  ├─ state: selectedTile (TileValue)
  │
  ├─→ TileSelector.tsx
  │     onChange → setSelectedTile()
  │
  └─→ EditorGrid.tsx
        onTileClick      → setTile(x, y)   ← place selectedTile
        onTileRightClick → clearTile(x, y) ← force TILE.EMPTY
        │
        └─ [CSS Grid : 625 divs, 25 colonnes]
              tileColor(tile) → backgroundColor
              tileBorder(tile) → border
```

Le backend ne voit jamais les couleurs ni les tailles de tuile — il stocke et reçoit uniquement les entiers `0–4` dans `grid[][]`.

---

## Voir aussi

- [textures_tuiles.md](textures_tuiles.md) — remplacer les couleurs par des sprites PNG
- `shared/src/types/tiles.types.ts` — définition de `TILE`, `GRID_SIZE`, `Grid`
- `frontend/src/game/scenes/BaseScene.ts` — rendu de la grille côté Phaser (jeu)
