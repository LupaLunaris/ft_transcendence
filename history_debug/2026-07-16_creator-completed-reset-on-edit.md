# Debug history — 2026-07-16 : republication d'une map modifiée sans re-test

## Contexte
Signalement : une fois une map testée, sauvegardée et publiée, il était possible
de la modifier puis de la republier sans avoir à nouveau réussi la map.

---

## Problème 1 — `creator_completed` jamais réinitialisé lors de l'édition

### Symptôme
Un créateur teste sa map (réussit `EXIT`), la publie, puis dépublie, modifie
la grille (ajoute/déplace des murs, ennemis...) et republie — sans repasser
par `/play/:id`. Le serveur acceptait la republication.

### Cause
- `POST /maps/:id/publish` (`backend/src/routes/maps.routes.ts`) ne vérifie
  que le flag `creator_completed` en base, jamais si la grille a changé
  depuis le dernier test réussi.
- `PUT /maps/:id` (même fichier) met à jour `grid_json` mais ne touchait
  jamais `creator_completed` — le flag restait `true` indéfiniment une fois
  posé par `POST /maps/:id/complete`.
- Chemin d'exploitation : test → publish → **unpublish** (repasse
  `published=false`, sans toucher `creator_completed`) → `PUT /:id` (autorisé
  car la map n'est plus publiée) → modification libre de la grille → publish
  à nouveau, `creator_completed` toujours `true` de l'ancien test.

### Fix
Dans `PUT /maps/:id`, dès que le payload contient `grid`, on force
`creator_completed: false` dans la même transaction Prisma :

```ts
const updated = await prisma.map.update({
  where: { id: req.params.id },
  data: {
    ...(name !== undefined && { name }),
    ...(grid !== undefined && { grid_json: JSON.stringify(grid), creator_completed: false }),
  },
});
```

Un simple renommage (payload sans `grid`) ne touche pas `creator_completed`.

### Fichiers impliqués
- `backend/src/routes/maps.routes.ts` (route `PUT /:id`)
- `backend/src/__tests__/maps.routes.test.ts` (3 tests ajoutés : reset sur
  edit de grille, pas de reset sur simple rename, 400 si map déjà publiée)

---

## Problème 2 — état frontend obsolète après sauvegarde

### Symptôme
Après le fix backend, republier une map modifiée sans re-test échoue bien
côté serveur (400 "You must complete your own map before publishing it"),
mais le bouton "Publier" dans `EditorPage` restait affiché comme actif juste
après la sauvegarde (fallait recharger la page pour le voir se désactiver).

### Cause
`handleSave` (`frontend/src/pages/editor/EditorPage.tsx`) appelait
`api.maps.update`/`api.maps.create` sans jamais lire la réponse — l'état
local `creatorCompleted` (qui pilote `disabled={!creatorCompleted || ...}`
sur le bouton Publier) n'était rafraîchi qu'au prochain `getById` (reload ou
navigation retour depuis `/play/:id`).

### Fix
`handleSave` capture désormais la `MapData` retournée et appelle
`setCreatorCompleted(updated.creator_completed)` (et idem à la création).

### Fichiers impliqués
- `frontend/src/pages/editor/EditorPage.tsx`

---

## Notes architecture
- `creator_completed` (Prisma `Map`) est le seul flag de "map testée avec
  succès par son créateur" — pas de champ `is_tested` séparé.
- `POST /maps/:id/complete` est appelé côté client depuis `GamePage.handleExit`
  uniquement quand `map.creator_id === user.id`, au moment où le joueur
  atteint la tuile `EXIT` en jeu.
- `POST /maps/:id/unpublish` ne touche jamais `creator_completed` — c'est
  volontaire (republier immédiatement sans modification reste possible),
  seul un changement de `grid` doit invalider le test.
