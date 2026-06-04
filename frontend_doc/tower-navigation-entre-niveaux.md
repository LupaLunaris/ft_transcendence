# Navigation entre niveaux — Mode Tour

## Stack concernée
React Router v6 · `useApi` hook · `TowerGamePage`

---

## Problème : réutilisation du composant par React Router

Quand on navigue de `/play/tower/1` vers `/play/tower/2`, React Router **réutilise la même instance** du composant `TowerGamePage` (même path pattern → pas de démontage/remontage).

Conséquence : `orderIndex` change dans `useParams`, mais tous les états internes (`level`, `dead`, `showModal`, etc.) conservent leurs valeurs précédentes.

---

## Cause racine : `useApi` ne réagit pas aux params de route

```
useApi(() => api.tower.getLevel(orderIndex))
         ↑ orderIndex change       ↑ mais useEffect([tick]) ne re-run pas
```

`useApi` utilise `fnRef.current = fn` pour capturer la dernière fonction, mais son `useEffect` n'a que `[tick]` comme dépendance. Changer `orderIndex` ne déclenche pas de nouveau fetch.

---

## Fix appliqué — `TowerGamePage.tsx`

Ajout d'un `useEffect` qui réagit à `orderIndex` et réinitialise tout l'état local + force un refetch.

```tsx
const isMounted = useRef(false);
useEffect(() => {
  if (!isMounted.current) { isMounted.current = true; return; }
  setDead(false);
  setShowModal(false);
  setCompletionData(null);
  setGameKey((k) => k + 1);
  refetch();
}, [orderIndex, refetch]);
```

Le guard `isMounted` est obligatoire : sans lui, l'effet s'exécute aussi au premier montage et provoque un double fetch (tick 0 → tick 1) inutile.

---

## Flux complet après fix

```
navigate('/play/tower/2')
  → React Router réutilise TowerGamePage
  → orderIndex = 2  (via useParams)
  → useEffect([orderIndex]) se déclenche
  → reset dead / showModal / completionData / gameKey
  → refetch() → tick++ → useApi re-fetch api.tower.getLevel(2)
  → level = nouvelle map → GameCanvas re-monte (key change)
```

---

## Invariant à retenir

> `useApi` ne réagit pas automatiquement aux dépendances externes passées dans la fonction lambda. Toute variable de route/prop qui change et doit déclencher un nouveau fetch doit appeler `refetch()` explicitement via un `useEffect`.

---

## Cas limite

| Situation | Comportement |
|-----------|-------------|
| Retour arrière navigateur (2→1) | Même mécanisme, le fix couvre aussi ce cas |
| Replay du niveau (même `orderIndex`) | `orderIndex` ne change pas → l'effet ne se déclenche pas → comportement normal |
| Dernier niveau (8→accueil) | `navigate('/')` → composant démonté → pas de problème |
