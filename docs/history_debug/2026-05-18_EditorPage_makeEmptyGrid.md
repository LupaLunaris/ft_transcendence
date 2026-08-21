# Debug — EditorPage : makeEmptyGrid + selectedLevel check
**Date :** 2026-05-18  
**Fichier principal :** `frontend/src/pages/editor/EditorPage.tsx`  
**Auteur :** malafont  

---

## Bug 1 — CRITIQUE : makeEmptyGrid() sans SPAWN ni EXIT

### Symptôme
Quand un admin clique sur un niveau inexistant dans le panneau admin, puis sauvegarde, le backend retourne :
```
400 — grid_json must be a valid 25x25 grid (borders WALL, 1 SPAWN, 1 EXIT)
```

### Cause racine
`makeEmptyGrid()` dans le frontend générait une grille 25×25 avec uniquement des WALL sur les bords et EMPTY à l'intérieur — **sans SPAWN (3) ni EXIT (2)**.

`validateGrid()` dans `backend/src/utils/grid.utils.ts` impose strictement `spawnCount === 1 && exitCount === 1`.

La version backend de `makeEmptyGrid` (dans `admin.routes.ts`) plaçait correctement SPAWN en [1][1] et EXIT en [23][23]. Les deux fonctions étaient désynchronisées.

### Flux de reproduction
1. Se connecter avec un compte admin
2. Aller sur `/editor`
3. Cliquer sur "Mode Admin"
4. Cliquer sur un niveau qui n'existe pas encore en DB
5. Dessiner quelques murs sans placer SPAWN ni EXIT
6. Cliquer "Sauvegarder niveau N"
→ Toast erreur 400

### Fix appliqué
`frontend/src/pages/editor/EditorPage.tsx` — `makeEmptyGrid()` :

```diff
- return Array.from({ length: GRID_SIZE }, (_, row) =>
-   Array.from({ length: GRID_SIZE }, (__, col) => {
-     if (row === 0 || row === GRID_SIZE - 1 || col === 0 || col === GRID_SIZE - 1)
-       return TILE.WALL;
-     return TILE.EMPTY;
-   }),
- ) as Grid;

+ const grid = Array.from(...) as Grid;
+ grid[1][1] = TILE.SPAWN;
+ grid[GRID_SIZE - 2][GRID_SIZE - 2] = TILE.EXIT;
+ return grid;
```

---

## Bug 2 — MINEUR : `selectedLevel ?` check sémantiquement incorrect

### Symptôme
Pas de crash observé (niveaux 1-8 toujours ≥ 1), mais check dangereux.

### Cause racine
```typescript
`Éditeur admin${selectedLevel ? ` — Niveau ${selectedLevel}` : ''}`
```
`selectedLevel` est `number | null`. Un `selectedLevel === 0` serait évalué falsy à tort.

### Fix appliqué
```diff
- `Éditeur admin${selectedLevel ? ` — Niveau ${selectedLevel}` : ''}`
+ `Éditeur admin${selectedLevel !== null ? ` — Niveau ${selectedLevel}` : ''}`
```

---

## Fichiers analysés
| Fichier | Rôle |
|---|---|
| `frontend/src/pages/editor/EditorPage.tsx` | Page éditeur + mode admin |
| `frontend/src/services/api.service.ts` | Client API — namespace `admin` |
| `backend/src/routes/admin.routes.ts` | Routes PUT/GET `/admin/tower` + `makeEmptyGrid` backend |
| `backend/src/utils/grid.utils.ts` | `validateGrid` — impose 1 SPAWN + 1 EXIT |
| `frontend/src/pages/game/TowerGamePage.tsx` | Page jeu tour — `useApi` + `CongratulatoryModal` |
| `frontend/src/pages/TowerPage.tsx` | Liste 8 niveaux avec progression |
| `frontend/src/context/auth.context.tsx` | `updateUser` vérifié présent |

## État après fix
- `makeEmptyGrid()` frontend = `makeEmptyGrid()` backend (SPAWN + EXIT par défaut)
- Sauvegarde d'un nouveau niveau admin fonctionne sans manipulation manuelle préalable
