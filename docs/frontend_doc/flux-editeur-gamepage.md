# Flux éditeur ↔ GamePage — Frontend

## Comment fonctionne la stack

Le frontend est une **Single Page Application React + TypeScript** construite avec Vite.
La navigation est gérée par **React Router v7** (`App.tsx`).
Les appels API transitent tous par `services/api.service.ts` qui lit le JWT dans le
`localStorage` (`ft_token`) et construit les headers `Authorization`.
La gestion d'état est locale aux composants (hooks React), sans store global.
Les types sont importés depuis le package partagé `@ft/shared`.

---

## Les pages impliquées

| Route | Composant | Fichier |
|---|---|---|
| `/editor` | `EditorPage` (nouvelle map) | `pages/editor/EditorPage.tsx` |
| `/editor/:id` | `EditorPage` (map existante) | `pages/editor/EditorPage.tsx` |
| `/play/:map_id` | `GamePage` | `pages/game/GamePage.tsx` |
| `/train` | `TrainingPage` | `pages/TrainingPage.tsx` |

---

## Le cycle de vie côté frontend

### 1. `EditorPage` — création et sauvegarde

Au montage sur `/editor/:id`, un `useEffect` charge la map via `api.maps.getById(id)`.
Le state local mémorise la grille (`Grid`), le nom, l'id, et les flags métier :

```tsx
// pages/editor/EditorPage.tsx
const [creatorCompleted, setCreatorCompleted] = useState(false);
const [isPublished, setIsPublished] = useState(false);
```

Ces deux états conditionnent directement l'interface :
- `!creatorCompleted` → bouton "Publier" désactivé + tooltip explicatif
- `isPublished` → grille en lecture seule, "Sauvegarder" désactivé, label "Map publiée"

### 2. Bouton "Tester" → `GamePage`

```tsx
// pages/editor/EditorPage.tsx
const handleTest = () => {
  navigate(`/play/${mapId}`);
};
```

C'est une simple navigation vers `/play/{id}`. La map est rechargée indépendamment
par `GamePage` via le hook `useMap(map_id)` qui appelle `api.maps.getById`.

### 3. `GamePage` — détection créateur + `markComplete`

`GamePage` reçoit la complétion via l'événement Phaser `player_reached_exit`
(émis par `game/scenes/GameScene.ts`, intercepté dans `game/GameCanvas.tsx`).
La callback `onExit(time_ms)` est passée à `GameCanvas` et maintenue à jour
via une ref pour éviter les re-renders de Phaser.

```tsx
// pages/game/GamePage.tsx
const handleExit = useCallback(
  async (time_ms: number) => {
    await api.scores.submit(map_id, time_ms);

    if (map && user && map.creator_id === user.id) {
      await api.maps.markComplete(map_id);  // POST /maps/:id/complete
      navigate(`/editor/${map_id}`);        // retour vers l'éditeur
    } else {
      navigate('/train');                   // joueur normal → liste des maps
    }
  },
  [map_id, map, user, navigate, showToast],
);
```

La comparaison `map.creator_id === user.id` utilise :
- `map` — chargé par `useMap()` depuis `hooks/useMap.ts`
- `user` — fourni par `useAuth()` depuis `context/auth.context.tsx`
- Les deux viennent de `@ft/shared` et ont `id` comme identifiant stable

### 4. Retour sur `EditorPage` avec `creator_completed: true`

Quand `navigate('/editor/map-id')` s'exécute, React Router monte une nouvelle
instance de `EditorPage` (ou réutilise l'existante si elle était déjà montée).
Le `useEffect([id])` se re-déclenche → `api.maps.getById` retourne la map avec
`creator_completed: true` → `setCreatorCompleted(true)` → le bouton "Publier" s'active.

### 5. `TrainingPage` — liste des maps publiées

```tsx
// pages/TrainingPage.tsx
const { maps, total, loading, error } = usePublishedMaps(page, difficulty);
```

`usePublishedMaps` (dans `hooks/useMap.ts`) appelle `api.maps.getPublished(page, difficulty)`,
qui frappe `GET /api/v1/maps?page=1&difficulty=...`. Le backend filtre `published: true`.
Chaque map affiche un bouton "Jouer" qui navigue vers `/play/{id}`.

---

## Enjeux pour le projet

### Synchronisation état local / état serveur

`EditorPage` maintient un state local (`creatorCompleted`, `isPublished`) qui est
une copie locale des champs serveur. Cette copie est initialisée au chargement
de la map et mise à jour après chaque opération réussie (`setIsPublished(true)`).
**Elle n'est pas reactive** : si une autre session modifie la map, l'état local
ne se rafraîchit pas automatiquement. Pour ce projet single-joueur en cours de
développement, c'est acceptable.

### Le props drilling de `onExit`

`GameCanvas` reçoit `onExit` en prop depuis `GamePage`. Phaser tourne dans un
environnement non-React (canvas WebGL), donc la communication se fait via un
événement sur le `game.events` emitter de Phaser. La ref `onExitRef` dans
`GameCanvas.tsx` garantit que la callback utilisée est toujours la dernière version,
évitant le problème classique de closure "stale" dans les hooks.

### Pourquoi `markComplete` peut échouer silencieusement

Si le créateur joue sa map deux fois, le deuxième appel à `markComplete` reçoit
une 200 (idempotent) ou une erreur. Dans les deux cas on navigue quand même vers
l'éditeur. La map est déjà `creator_completed: true` donc tout va bien.

---

## Exemple pratique — le bug du 2026-05-16

### Symptôme

Après avoir terminé sa map, le créateur était envoyé sur `/train` (placeholder vide).
En retournant manuellement sur `/editor/{id}`, la map se chargeait correctement,
mais le bouton "Publier" restait désactivé sans explication claire.

### Diagnostic

Deux ruptures dans la chaîne :

1. `handleExit` dans `GamePage.tsx` ne différenciait pas créateur et joueur,
   et n'appelait jamais `api.maps.markComplete()`. Le flag `creator_completed`
   restait `false` en base.

2. `EditorPage.tsx` ne stockait pas `creator_completed` en state. Le bouton
   "Publier" était conditionné uniquement à `!!mapId` (toujours vrai pour
   une map existante), donc toujours cliquable. Le clic déclenchait la modal,
   puis l'appel `api.maps.publish()` revenait avec une erreur serveur 400 :
   `"You must complete your own map before publishing it"`. L'utilisateur
   voyait juste un toast d'erreur peu explicite.

### Correction

**`GamePage.tsx`** : détecter `map.creator_id === user.id` → appeler
`markComplete` → rediriger vers `/editor/{id}` plutôt que `/train`.

**`EditorPage.tsx`** : charger `creator_completed` et `published` dans le state
local au montage, les utiliser pour conditionner les boutons et la grille.

**`TrainingPage.tsx`** : implémenter la liste des maps publiées pour que la
redirection des joueurs non-créateurs vers `/train` ait du sens.

**Fichiers impliqués :**

| Fichier | Modification |
|---|---|
| `frontend/src/pages/game/GamePage.tsx` | `handleExit` : `markComplete` + redirect créateur |
| `frontend/src/pages/editor/EditorPage.tsx` | State `creatorCompleted`/`isPublished` + UI conditionnelle |
| `frontend/src/pages/TrainingPage.tsx` | Implémentation complète avec hooks + pagination |
| `frontend/src/__tests__/GamePage.test.tsx` | 4 tests nouveaux |
| `frontend/src/__tests__/EditorPage.test.tsx` | 5 tests nouveaux |
| `frontend/src/hooks/useMap.ts` | (lu, non modifié) hook `usePublishedMaps` déjà disponible |
| `frontend/src/services/api.service.ts` | (lu, non modifié) `markComplete` déjà disponible |
