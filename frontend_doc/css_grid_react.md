# CSS Grid dans React — mise en page et pièges courants

Ce document explique le fonctionnement de CSS Grid dans le contexte React/TSX du projet,
les enjeux concrets pour l'éditeur de map, et illustre le tout par un bug réel corrigé.

---

## 1. La stack utilisée

### React + inline styles + Tailwind CSS

Dans ce projet, les mises en page complexes (grilles de tuiles, panneaux) utilisent deux
mécanismes complémentaires :

| Mécanisme | Usage | Fichiers |
|-----------|-------|----------|
| **Tailwind CSS** (classes utilitaires) | Espacement, couleurs, flex, overflow | `className="flex-1 overflow-auto"` |
| **Inline styles React** (`style={{...}}`) | Propriétés dynamiques (taille calculée à partir de constantes TS) | `gridTemplateColumns: \`repeat(\${GRID_SIZE}, 22px)\`` |

Les inline styles sont **calculés au moment du rendu** par React et injectés comme attribut
`style` sur les éléments DOM. Cela permet d'utiliser des constantes TypeScript (`GRID_SIZE`,
`CELL_PX`) directement dans les styles — sans générer de classes CSS dynamiques.

### CSS Grid

CSS Grid est un système de mise en page 2D. Il permet de définir des colonnes et lignes
explicites sur un conteneur, puis de placer des éléments enfants dans ces cases.

Vocabulaire clé :

| Terme | Signification |
|-------|---------------|
| **grid container** | L'élément avec `display: grid` |
| **grid item** | Les enfants directs du container |
| **grid track** | Une colonne ou ligne de la grille |
| **`fr`** | Unité « fraction » : part proportionnelle de l'espace disponible |
| **`repeat(N, taille)`** | Raccourci pour créer N colonnes/lignes identiques |

---

## 2. Comment CSS Grid gère l'espace disponible

C'est le cœur du sujet pour comprendre le bug du projet.

### Les unités fixes vs proportionnelles

```css
/* Colonnes fixes : chaque colonne fait exactement 22px */
grid-template-columns: repeat(25, 22px);

/* Colonnes proportionnelles : chaque colonne prend 1/25 de l'espace dispo */
grid-template-columns: repeat(25, 1fr);
```

Avec des colonnes fixes (`22px`), la largeur totale de la grille est **toujours** `25 × 22 = 550px`.

Avec `1fr`, la largeur de chaque colonne dépend du **conteneur**. Si le conteneur fait 1000px :
`1fr = 1000px / 25 = 40px`. Si le conteneur fait 550px : `1fr = 22px`.

### Comment React détermine la largeur d'un conteneur `inline-block`

```tsx
<div
  className="inline-block"           // ← taille = contenu naturel
  style={{ display: 'grid', gridTemplateColumns: 'repeat(25, 1fr)' }}
>
```

Un élément `inline-block` prend **la taille de son contenu**. Mais pour un grid container
avec des colonnes `1fr`, le navigateur doit d'abord connaître la largeur du conteneur pour
calculer `1fr` — c'est circulaire. La spécification CSS résout cela en regardant le **contexte
de formatage parent** (block formatting context).

Dans notre cas, `EditorGrid` est rendu à l'intérieur d'un `<div className="flex-1 overflow-auto">`.
`flex-1` signifie `flex-grow: 1` — l'élément s'étire pour occuper tout l'espace disponible
dans le flex container parent. Sur un viewport de 1280px avec un panneau latéral de 176px,
le div flex reçoit environ 1000px. Le grid container hérite de cette largeur, et `1fr = 40px`.

---

## 3. Enjeux pour le projet

### La grille de l'éditeur est un cas précis

L'éditeur de map génère 625 divs (25×25) dans un grid container. La taille visuelle des tuiles
doit être **identique** à la taille logique définie dans le code (`TILE_SIZE = 22px` dans
l'éditeur, `TILE_SIZE = 32px` dans Phaser). Si les colonnes CSS ne correspondent pas à la
largeur des cellules, des colonnes fantômes apparaissent.

### Règle générale : quand utiliser `fr` vs unités fixes

| Situation | Bonne unité |
|-----------|-------------|
| Grille de tuiles avec taille fixe (éditeur, plateau de jeu) | `px` fixe |
| Mise en page responsive (colonnes d'article, dashboard) | `fr` ou `minmax()` |
| Grille dont la taille dépend du viewport | `fr` avec `min-width` sur les items |

### Interaction avec Tailwind Flexbox

Dans `EditorPage.tsx`, la structure est :

```tsx
<div className="flex gap-6 flex-wrap">
  <div className="flex flex-col gap-5 w-44 shrink-0">  {/* panneau fixe 176px */}
    ...
  </div>
  <div className="flex-1 overflow-auto">               {/* zone grille élastique */}
    <EditorGrid ... />
  </div>
</div>
```

`flex-1` donne toute la largeur résiduelle à la zone grille. C'est intentionnel : la grille
peut scroller horizontalement si le viewport est petit (`overflow-auto`). Mais si `EditorGrid`
utilise `1fr`, ses colonnes s'étirent pour remplir cet espace au lieu de rester à 22px.

---

## 4. Exemple pratique — le bug des colonnes vides

### Ce qui s'est passé

**Fichier :** `frontend/src/components/editor/EditorGrid.tsx`

```tsx
// ❌ AVANT — bug
<div style={{
  display: 'grid',
  gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,  // colonnes proportionnelles
  gap: 0,
}}>
  {grid.map((row, rowIdx) =>
    row.map((tile, colIdx) => (
      <div style={{
        width: 22,     // ← cellule fixe 22px
        height: 22,
        backgroundColor: tileColor(tile),
      }} />
    )),
  )}
</div>
```

Sur un viewport de 1280px, `flex-1` donnait ~1000px à la zone grille. Le grid container
héritait de ces 1000px. Chaque `1fr = 1000 / 25 = 40px`. Mais les cellules faisaient 22px.
Résultat : 22px de tuile + 18px de vide par colonne.

```
Viewport 1280px → zone grille ~1000px → 1fr = 40px
┌────────────────────────────┐
│  ██████ 22px  │  vide 18px │  ← colonne fantôme (≈ une tuile)
└────────────────────────────┘
```

### La correction

```tsx
// ✅ APRÈS — corrigé
<div style={{
  display: 'grid',
  gridTemplateColumns: `repeat(${GRID_SIZE}, 22px)`,  // colonnes fixes = taille des cellules
  gap: 0,
}}>
```

Les colonnes font maintenant exactement 22px, identiques aux cellules. Le conteneur
`inline-block` mesure `25 × 22 = 550px` quelle que soit la largeur du parent.

### Le test de non-régression

Pour éviter que ce bug revienne (ex : si quelqu'un remet `1fr` en pensant rendre la grille
responsive), un test vérifie explicitement la valeur :

```tsx
// frontend/src/__tests__/EditorGrid.test.tsx
it('uses fixed 22px columns — not 1fr', () => {
  const { container } = render(<EditorGrid ... />);
  const wrapper = container.firstElementChild as HTMLElement;
  expect(wrapper.style.gridTemplateColumns).toBe(`repeat(${GRID_SIZE}, 22px)`);
  expect(wrapper.style.gridTemplateColumns).not.toContain('1fr');
});
```

---

## 5. Récapitulatif des fichiers impliqués

| Fichier | Rôle |
|---------|------|
| `frontend/src/components/editor/EditorGrid.tsx` | Composant corrigé — contient le grid container et les 625 cellules |
| `frontend/src/pages/editor/EditorPage.tsx` | Rend `EditorGrid` dans `flex-1` — source du contexte qui agrandissait la grille |
| `shared/src/types/tiles.types.ts` | Exporte `GRID_SIZE = 25` utilisé dans `gridTemplateColumns` |
| `frontend/src/__tests__/EditorGrid.test.tsx` | Tests unitaires dont le test de régression sur les colonnes |
| `frontend/tailwind.config.ts` | Configuration Tailwind — définit `flex-1`, `overflow-auto`, etc. |

---

## Voir aussi

- [modifier_la_grille.md](modifier_la_grille.md) — comment personnaliser taille, couleurs, espacement de la grille
- [textures_tuiles.md](textures_tuiles.md) — remplacer les couleurs par des sprites PNG
- [history_debug/2026-05-16_editor-grid-colonnes-vides.md](../../history_debug/2026-05-16_editor-grid-colonnes-vides.md) — entrée de debug pour ce bug
