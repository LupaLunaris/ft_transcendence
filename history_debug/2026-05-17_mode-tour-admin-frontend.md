# Debug history — 2026-05-17 : Mode tour admin frontend

## Contexte

Session du 17/05/2026 — implémentation du mode tour admin côté frontend :
éditeur admin (panneau 8 niveaux), page TowerPage avec progression,
TowerGamePage, CongratulatoryModal, et mise à jour du contexte auth.

---

## Problème 1 — `is_admin` absent de UserPublic : bouton Mode Admin invisible

### Symptôme
Le bouton « Mode Admin » n'apparaissait jamais dans l'éditeur, même connecté
avec un compte admin (email dans `ADMIN_EMAILS`).

### Cause
`UserPublic` dans `shared/src/types/user.types.ts` ne contenait pas `is_admin`.
Le champ existait dans :
- le modèle Prisma (`User.is_admin Boolean`)
- le payload JWT (`{ id, email, is_admin }`)
- la table SQLite

Mais `toUserPublic()` dans `backend/src/routes/auth.routes.ts` ne le sérialisait
pas dans la réponse JSON. Résultat : `user.is_admin` était `undefined` côté
frontend, et `user?.is_admin` évaluait à `false`.

### Fix
1. `shared/src/types/user.types.ts` : ajout `is_admin: boolean` dans `UserPublic`
2. `backend/src/routes/auth.routes.ts` : ajout `is_admin: user.is_admin` dans `toUserPublic()`

### Fichiers impliqués
- `shared/src/types/user.types.ts`
- `backend/src/routes/auth.routes.ts`
- `frontend/src/pages/editor/EditorPage.tsx`
- `frontend/src/context/auth.context.tsx`

---

## Problème 2 — Route `/play/tower/:order_index` capturée par `/play/:map_id`

### Symptôme
Naviguer vers `/play/tower/1` chargeait `GamePage` avec `map_id = "tower"`,
retournant une erreur 404 de l'API maps.

### Cause
Dans `frontend/src/App.tsx`, la route `/play/:map_id` était déclarée avant
`/play/tower/:order_index`. React Router v6/v7 évalue les routes dans l'ordre
de déclaration — le segment `"tower"` était consommé comme valeur du paramètre
dynamique `map_id`.

### Fix
Déplacer la route `/play/tower/:order_index` AVANT `/play/:map_id` dans
`AppRoutes()`.

```tsx
// Correct — plus spécifique d'abord
<Route path="/play/tower/:order_index" element={<ProtectedRoute><TowerGamePage /></ProtectedRoute>} />
<Route path="/play/:map_id"            element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
```

### Fichiers impliqués
- `frontend/src/App.tsx`
- `frontend/src/pages/game/TowerGamePage.tsx`
- `frontend/src/pages/game/GamePage.tsx`

---

## Problème 3 — `tower.complete` retourne 403 sur un niveau déjà complété

### Symptôme
En mode replay (cliquer sur un niveau déjà complété dans TowerPage),
`TowerGamePage.handleExit` levait une exception non catchée, laissant
l'utilisateur sur un écran vide.

### Cause
Le backend `POST /api/v1/tower/:order_index/complete` vérifie :
```typescript
if (orderIndex !== user.tower_progress + 1) {
  sendError(res, 'You must complete levels in order', 403);
}
```
Si `orderIndex <= tower_progress` (replay), la condition échoue et retourne 403.
`TowerGamePage` ne gérait pas ce cas — l'exception remontait sans handler.

### Fix
Dans `TowerGamePage.handleExit`, le bloc `catch` redirige silencieusement
vers `/tower` sans afficher le modal :
```typescript
} catch {
  navigate('/tower');
}
```

### Fichiers impliqués
- `frontend/src/pages/game/TowerGamePage.tsx`
- `backend/src/routes/tower.routes.ts`

---

## Notes architecture

- `updateUser()` dans `AuthContext` met à jour l'état React en mémoire.
  `HomePage` lit directement `useAuth().user` → la mise à jour se propage
  immédiatement sans rechargement ni fetch supplémentaire.
- Les `AdminMap` chargés via `GET /api/v1/admin/tower` sont mis en cache dans
  l'état local de `EditorPage` pour éviter de refetch à chaque clic de bouton.
  Un `PUT` réussi met à jour le cache local (`setAdminLevels`).
