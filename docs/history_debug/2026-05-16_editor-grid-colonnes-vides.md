# 2026-05-16 — Éditeur de map : colonnes vides entre chaque tuile

## Périmètre

Bug visuel dans l'éditeur de map : chaque colonne de tuile éditables était séparée par une
colonne vide de même largeur. La grille affichait visuellement 50 colonnes au lieu de 25.

**Fichier corrigé :** `frontend/src/components/editor/EditorGrid.tsx`  
**Test ajouté :** `frontend/src/__tests__/EditorGrid.test.tsx`

---

## Symptôme

Dans l'éditeur de map (route `/editor`), la grille 25×25 s'affichait avec des colonnes fantômes :
une colonne de tuiles colorées, une colonne vide, une colonne de tuiles, une colonne vide, etc.
Le clic fonctionnait correctement sur les tuiles visibles, mais la largeur totale était doublée.

---

## Diagnostic

### Cause racine : conflit `1fr` vs `width: 22px` fixe

La grille CSS était définie avec `gridTemplateColumns: repeat(25, 1fr)`. En CSS Grid, `1fr`
signifie « une fraction de l'espace disponible du conteneur ». Si le conteneur est plus large
que `25 × 22px = 550px`, chaque colonne `1fr` devient plus large que 22px.

Or, chaque cellule avait `width: 22` (valeur fixe en pixels). La cellule de 22px occupait
la moitié gauche de sa colonne, laissant 22px de vide à droite — exactement la largeur d'une
tuile. Visuellement : colonne tuile + colonne vide + colonne tuile + colonne vide...

```
Colonne CSS Grid (1fr = 44px si conteneur = 1100px)
┌──────────────────────────────────┐
│  ████████ div 22px │  vide 22px  │
└──────────────────────────────────┘
     ↑ tuile visible     ↑ "colonne fantôme"
```

### Pourquoi le conteneur dépassait-il 550px ?

Le composant `EditorGrid` est rendu dans un `<div className="flex-1 overflow-auto">` dans
`EditorPage.tsx`. Sur un écran large, `flex-1` donne au conteneur toute la largeur disponible
après le panneau latéral (~176px). Sur un viewport de 1280px, la zone grid reçoit ~1000px,
ce qui rend chaque `1fr` = 40px. Les cellules de 22px occupent alors 55% de leur colonne.

---

## Fix

**Fichier :** `frontend/src/components/editor/EditorGrid.tsx` — ligne 42

```diff
- gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
+ gridTemplateColumns: `repeat(${GRID_SIZE}, 22px)`,
```

Les colonnes ont maintenant une largeur fixe identique à celle des cellules. La grille mesure
toujours `25 × 22px = 550px` quelle que soit la largeur du parent. Le conteneur `inline-block`
se réduit à cette taille exacte.

---

## Tests

Nouveau fichier de test : `frontend/src/__tests__/EditorGrid.test.tsx` (5 cas)

| Test | Ce qu'il vérifie |
|------|-----------------|
| `renders exactly 625 cells` | La grille génère bien 25×25 = 625 divs |
| `uses fixed 22px columns — not 1fr` | **Régression** : `gridTemplateColumns` contient `22px`, jamais `1fr` |
| `calls onTileClick with (colIdx, rowIdx)` | Coordonnées correctes au clic |
| `drag paint on mouseenter buttons=1` | Peindre en maintenant le bouton fonctionne |
| `no paint on mouseenter buttons=0` | Pas de peinture au simple survol |
| `applies WALL color to WALL tiles` | Couleur correcte selon le type de tuile |

Résultat de la suite complète après correction :

```
Test Files  7 passed (7)
     Tests  34 passed (34)
```

---

## Fichiers impliqués

| Fichier | Rôle dans le bug |
|---------|-----------------|
| `frontend/src/components/editor/EditorGrid.tsx` | Source du bug (`1fr` → corrigé en `22px`) |
| `frontend/src/pages/editor/EditorPage.tsx` | Rend `EditorGrid` dans `flex-1` — élargit le conteneur |
| `shared/src/types/tiles.types.ts` | Définit `GRID_SIZE = 25` importé dans `EditorGrid` |
| `frontend/src/__tests__/EditorGrid.test.tsx` | Test de non-régression ajouté |

---

## Note de prévention

Si la taille des tuiles change à l'avenir, mettre à jour les **deux** valeurs en cohérence :

```tsx
// EditorGrid.tsx
const CELL_PX = 22;                                     // ← une seule source de vérité
// dans le conteneur :
gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_PX}px)`
// dans la cellule :
style={{ width: CELL_PX, height: CELL_PX, ... }}
```
