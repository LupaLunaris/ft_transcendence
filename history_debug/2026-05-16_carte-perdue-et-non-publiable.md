# 2026-05-16 — Carte "perdue" après test et impossible à publier

## Périmètre

Bug fonctionnel bloquant le cycle de vie complet d'une map créateur :
après avoir testé sa propre map, le créateur était renvoyé vers une page vide,
la map semblait introuvable dans l'éditeur, et rien n'était publiable.

**Fichiers corrigés :**
- `frontend/src/pages/game/GamePage.tsx`
- `frontend/src/pages/editor/EditorPage.tsx`
- `frontend/src/pages/TrainingPage.tsx`

**Tests ajoutés :**
- `frontend/src/__tests__/GamePage.test.tsx`
- `frontend/src/__tests__/EditorPage.test.tsx`

---

## Symptômes observés

1. Créer une map → sauvegarder → cliquer "Tester" → terminer le niveau
2. Toast "Terminé en X.XXs !" apparaît (la seule "fenêtre pop" visible)
3. Redirection automatique vers `/train` (page vide, placeholder "sprint 3")
4. Retour manuel vers `/editor` → éditeur vide (nouvelle map, sans ID)
5. Même en retournant vers `/editor/{id}` : bouton "Publier" toujours bloqué
6. `TrainingPage` affichait uniquement le texte "Liste des maps publiées — sprint 3"

---

## Analyse des causes racines

### Cause 1 — `markComplete` jamais appelé (bug principal)

Le backend impose une règle métier stricte : une map ne peut être publiée
que si `creator_completed = true` dans la BDD (route `POST /maps/:id/publish`
dans `backend/src/routes/maps.routes.ts` ligne 213).

Or dans `frontend/src/pages/game/GamePage.tsx`, la fonction `handleExit`
ne faisait qu'envoyer le score puis naviguer vers `/train` — sans jamais
appeler `api.maps.markComplete(map_id)`. Le flag `creator_completed` restait
donc définitivement à `false` dans la base.

```ts
// ❌ Code d'avant — markComplete jamais appelé
navigate('/train');
```

### Cause 2 — Redirection vers `/train` au lieu de `/editor/:id`

Après avoir terminé sa propre map, le créateur était envoyé sur `/train`
(placeholder vide). Il n'avait aucun moyen de retrouver sa map depuis
cette page pour la publier, à moins de connaître l'URL complète `/editor/{id}`.

### Cause 3 — EditorPage ne trackait pas `creator_completed` ni `published`

`frontend/src/pages/editor/EditorPage.tsx` chargeait bien la map depuis l'API
(qui retourne `creator_completed` et `published`), mais ne stockait pas ces
valeurs en state. Le bouton "Publier" était conditionné uniquement à `!!mapId`,
donc toujours cliquable. L'échec survenait silencieusement côté backend
(`"You must complete your own map before publishing it"`), avec juste un toast
d'erreur difficile à interpréter.

### Cause 4 — TrainingPage vide

`frontend/src/pages/TrainingPage.tsx` était un placeholder explicite marqué
"sprint 3". Les maps publiées n'étaient donc jamais accessibles en jeu.

---

## Corrections appliquées

### 1. `GamePage.tsx` — Détecter créateur + appeler `markComplete` + rediriger vers éditeur

```ts
// ✅ Après correction
if (map && user && map.creator_id === user.id) {
  try {
    await api.maps.markComplete(map_id);
  } catch {
    // Silently ignore — map may already be marked complete
  }
  navigate(`/editor/${map_id}`);
} else {
  navigate('/train');
}
```

La comparaison `map.creator_id === user.id` exploite les champs déjà disponibles
dans `MapData` (type partagé dans `shared/src/types/map.types.ts`) et `UserPublic`
(via `useAuth` dans `context/auth.context.tsx`).

### 2. `EditorPage.tsx` — Tracker `creatorCompleted` et `isPublished` en state

Deux nouveaux états chargés depuis l'API au montage :

```ts
const [creatorCompleted, setCreatorCompleted] = useState(false);
const [isPublished, setIsPublished] = useState(false);
```

Le bouton "Publier" est désormais conditionné à :
```tsx
disabled={!mapId || !creatorCompleted || isPublished}
title={!creatorCompleted ? "Teste ta map d'abord" : isPublished ? "Map déjà publiée" : undefined}
```

Quand `isPublished = true`, les boutons "Sauvegarder" et "Tester" sont aussi
désactivés, et la grille passe en lecture seule (`onTileClick={() => {}}`).

### 3. `TrainingPage.tsx` — Implémentation complète avec maps publiées

Page refaite avec `usePublishedMaps(page, difficulty)` (hook existant dans
`frontend/src/hooks/useMap.ts`), filtre de difficulté, pagination, et lien
direct vers `/play/{id}`.

---

## Flux corrigé (créateur)

```
/editor/{id}  →  [Tester]  →  /play/{id}
                                   ↓
                            [joue et termine]
                                   ↓
                         markComplete() appelé
                                   ↓
                         navigate("/editor/{id}")
                                   ↓
              EditorPage charge la map : creator_completed=true
                                   ↓
                    bouton "Publier" s'active
                                   ↓
              [Publier] → modal → api.publish() → isPublished=true
                                   ↓
               map accessible dans /train (TrainingPage)
```

---

## Tests ajoutés

### `GamePage.test.tsx` (4 tests)
- Score toujours soumis à la complétion
- Créateur : `markComplete` appelé + navigation vers `/editor/:id`
- Non-créateur : `markComplete` non appelé + navigation vers `/train`
- Résistance si `markComplete` rejette (déjà complété) : navigation quand même

### `EditorPage.test.tsx` (5 tests)
- Bouton "Publier" désactivé quand `creator_completed: false`
- Bouton "Publier" actif quand `creator_completed: true` et non publié
- Bouton "Publier" désactivé + label "Publiée" quand déjà publié
- Bouton "Sauvegarder" désactivé quand publié
- Nom de map chargé depuis l'API dans l'input

---

## Leçon retenue

La règle métier "il faut avoir complété sa propre map pour la publier"
(`creator_completed`) était correctement implémentée côté backend mais
n'avait aucun équivalent côté frontend : ni appel à `markComplete`,
ni état local pour refléter la condition. Le frontend doit toujours
représenter fidèlement les invariants du modèle de données.
