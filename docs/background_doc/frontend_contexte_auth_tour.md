# Frontend — Contexte Auth, progression tour et mode admin

## Comment fonctionne la stack

### React Context + JWT

Le frontend utilise **React Context** (`AuthContext`) pour partager l'état
utilisateur entre tous les composants de l'arbre sans avoir à passer des props
à chaque niveau.

Cycle de vie :
1. Au démarrage, `AuthProvider` lit `localStorage["ft_token"]`.
2. Si un token est présent, il appelle `GET /api/v1/auth/me` pour récupérer le
   profil complet (`UserPublic`).
3. La réponse est stockée dans `useState<UserPublic | null>`. Tous les
   composants qui appellent `useAuth()` lisent ce state partagé.
4. `updateUser(newUser)` remplace l'état en mémoire — aucun fetch
   supplémentaire, mise à jour synchrone dans tous les abonnés.

### React Router v7 — correspondance de routes

React Router résout les routes dans l'ordre de déclaration dans `<Routes>`.
Pour les segments dynamiques (`:param`), le premier pattern qui correspond gagne.
Un segment littéral (`tower`) l'emporte sur un paramètre (`:map_id`) **si** la
route littérale est déclarée en premier.

### useApi — fetching déclaratif

`useApi<T>(fn)` est un hook qui exécute `fn()` au montage et expose
`{ data, loading, error, refetch }`. Il annule les requêtes en vol si le
composant est démonté (flag `cancelled`), évitant les memory leaks et les
setState après unmount.

---

## Enjeux pour le projet

### 1. Synchronisation auth ↔ progression tour

Quand un joueur complète un niveau tour, le backend retourne
`{ tower_progress, diamonds }`. Pour que la `HomePage` et la `TowerPage`
reflètent immédiatement les nouvelles valeurs **sans rechargement**, il faut :

- appeler `updateUser({ ...user, tower_progress, diamonds })` dans
  `TowerGamePage` après le `POST /tower/:order_index/complete` réussi
- que `HomePage` et `TowerPage` lisent leurs données depuis `useAuth().user`
  et non depuis un state local ou un fetch séparé

Si `HomePage` faisait son propre `GET /auth/me`, la mise à jour serait
asynchrone et décalée. En lisant directement le contexte, la mise à jour est
instantanée.

### 2. is_admin — champ absent de UserPublic

Le champ `is_admin` existait dans Prisma, le JWT et la table SQLite, mais
n'était pas sérialisé dans la réponse `GET /auth/me`. Sans lui dans
`UserPublic`, la condition `user?.is_admin` retourne `undefined` (falsy), et
le bouton « Mode Admin » de l'éditeur n'apparaît jamais.

Ce type d'oubli est fréquent quand un champ est ajouté au modèle Prisma mais
que la fonction de sérialisation (`toUserPublic`) n'est pas mise à jour en
parallèle.

### 3. Ordre des routes — collision `/play/:map_id` vs `/play/tower/:order_index`

React Router traite `/play/:map_id` comme un catch-all pour tout chemin
commençant par `/play/`. Si cette route est déclarée avant
`/play/tower/:order_index`, naviguer vers `/play/tower/1` affecte `map_id =
"tower"` et charge `GamePage` au lieu de `TowerGamePage`.

La règle : **toujours déclarer les routes plus spécifiques (littérales) avant
les routes génériques (paramétriques)**.

### 4. Replay d'un niveau tour — 403 non géré

Le backend interdit de compléter un niveau déjà complété (ordre strict).
Si le joueur rejoue un niveau débloqué et sort de la carte, `POST
/tower/:order_index/complete` retourne 403. Sans bloc `catch`, l'exception
remonte silencieusement et le joueur reste bloqué sur l'écran de jeu.

La solution : le `catch` de `TowerGamePage.handleExit` redirige vers `/tower`
sans ouvrir le modal. L'utilisateur comprend implicitement que les niveaux déjà
complétés ne donnent pas de récompense supplémentaire.

---

## Debug comme exemple pratique

### Fichiers impliqués dans le flux complet

```
shared/src/types/user.types.ts          ← UserPublic avec is_admin
backend/src/routes/auth.routes.ts       ← toUserPublic() sérialise is_admin
frontend/src/context/auth.context.tsx   ← stocke user, expose updateUser()
frontend/src/services/api.service.ts    ← api.tower.complete(), api.admin.*
frontend/src/App.tsx                    ← ordre des routes
frontend/src/pages/TowerPage.tsx        ← liste les 8 niveaux, lit tower_progress
frontend/src/pages/game/TowerGamePage.tsx  ← joue un niveau, appelle complete()
frontend/src/components/tower/CongratulatoryModal.tsx  ← affiche le résultat
frontend/src/pages/editor/EditorPage.tsx  ← mode admin, charge les AdminMap
```

### Flux de données — complétion d'un niveau

```
TowerPage
  └─ clic sur case débloquée
       └─ navigate('/play/tower/3')
            └─ TowerGamePage monte
                 ├─ useApi(() => api.tower.getLevel(3))   → GET /api/v1/tower/3
                 └─ GameCanvas reçoit level.grid_json
                      └─ joueur atteint EXIT → onExit(time_ms)
                           └─ api.tower.complete(3)         → POST /api/v1/tower/3/complete
                                └─ { tower_progress: 3, diamonds: 5 }
                                     ├─ updateUser({ ...user, tower_progress: 3, diamonds: 5 })
                                     │     └─ AuthContext.user mis à jour
                                     │          ├─ HomePage re-render (diamants, niveau)
                                     │          └─ TowerPage re-render (cases débloquées)
                                     └─ setShowModal(true)
                                          └─ CongratulatoryModal s'ouvre
```

### Flux admin — édition d'un niveau tour

```
EditorPage (adminMode = true)
  ├─ useEffect → api.admin.getTowerLevels()    → GET /api/v1/admin/tower
  │    └─ 8 AdminMap stockés dans adminLevels[]
  ├─ clic bouton "3" → handleSelectAdminLevel(level3)
  │    ├─ setGrid(level3.grid_json)
  │    └─ setMapName(level3.name)
  └─ clic "Sauvegarder niveau 3"
       └─ api.admin.updateTowerLevel(3, { name, grid_json: JSON.stringify(grid) })
            └─ PUT /api/v1/admin/tower/3
                 └─ AdminMap mis à jour en base
```

Note sur `grid_json` : l'API admin reçoit `grid_json` comme **string JSON**
dans le body (pas un objet). L'éditeur fait `JSON.stringify(grid)` avant
l'envoi. Le backend re-parse avec `JSON.parse()` pour valider la grille.
C'est différent des maps utilisateur où `grid` est passé directement comme
objet (la sérialisation est faite par `JSON.stringify(body)` dans `request()`).
