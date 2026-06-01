# Debug history — 2026-05-18 : Boutons de niveau admin non visibles dans l'éditeur

## Contexte
Implémentation du mode admin dans EditorPage pour créer/éditer les maps de la tour.
Les 8 boutons de niveau devaient s'afficher automatiquement dès qu'un admin ouvre l'éditeur,
mais ils n'apparaissaient pas malgré les changements de code.

---

## Problème 1 — Cycle de rendu double pour l'activation du mode admin

### Symptôme
Les 8 boutons de niveau n'apparaissaient pas dans l'éditeur même pour un utilisateur avec `is_admin=true`.

### Cause
L'approche initiale utilisait `useState(false)` + `useEffect` pour activer `adminMode` :

```tsx
const [adminMode, setAdminMode] = useState(false);

useEffect(() => {
  if (user?.is_admin) setAdminMode(true);
}, [user?.is_admin]);
```

Problème : le composant rend une première fois avec `adminMode=false` (panel absent),
puis l'effet s'exécute et relance un rendu avec `adminMode=true`. Si un remontage
du composant se produit avant ce deuxième rendu (navigation rapide, StrictMode React 18,
etc.), `adminMode` reste `false` et le panel admin ne s'affiche jamais.

De plus, cette approche est redondante : `ProtectedRoute` garantit que `user` est
non-null au moment où `EditorPage` monte (il attend `loading=false` avant de rendre
ses enfants). Il est donc inutile de retarder l'initialisation à un effect.

### Fix
Remplacer par une initialisation paresseuse de `useState` :

```tsx
// Avant
const [adminMode, setAdminMode] = useState(false);
useEffect(() => {
  if (user?.is_admin) setAdminMode(true);
}, [user?.is_admin]);

// Après
const [adminMode, setAdminMode] = useState(() => !!user?.is_admin);
```

`user` est disponible dès le premier rendu (garanti par `ProtectedRoute`).
`adminMode` est donc `true` dès le rendu initial pour les admins.
L'`useEffect([adminMode])` qui charge `getTowerLevels()` s'exécute après ce premier rendu.

### Fichiers impliqués
- `frontend/src/pages/editor/EditorPage.tsx` (ligne ~59)

---

## Problème 2 — Données DB stales : is_admin=false pour des comptes admin

### Symptôme
Même après le fix code, les boutons n'apparaissent pas si `user.is_admin` vaut `false`.

### Cause
`is_admin` est fixé **à l'inscription** en comparant l'email avec `ADMIN_EMAILS`
(dans `backend/src/routes/auth.routes.ts`). Si le compte a été créé avant que cette
liste ait été ajoutée, la colonne `is_admin` est `false` dans la DB et dans le JWT.

Le JWT encode `is_admin` depuis la DB au moment du login. Si la DB dit `false`,
le frontend voit `user.is_admin = false` → `adminMode` reste `false` → pas de panel.

### Fix
Mettre à jour manuellement la DB :
```bash
cd backend
npx prisma studio
# ou directement :
sqlite3 prisma/data.db "UPDATE User SET is_admin=1 WHERE email IN ('malafont@student.42belgium.be','jdebrull@student.42belgium.be','jpaulis@student.42belgium.be','evan-dro@student.42belgium.be');"
```
Puis se reconnecter (nouveau JWT avec `is_admin=true`).

### Fichiers impliqués
- `backend/prisma/data.db` (données)
- `backend/src/routes/auth.routes.ts` (ligne ~73 : `ADMIN_EMAILS`)

---

## Problème 3 — Cache local upsert : nouveau niveau non ajouté à la liste

### Symptôme
Après avoir sauvegardé un niveau qui n'existait pas encore (premier save du niveau N),
le bouton correspondant ne se mettait pas à jour dans l'interface sans rechargement.

### Cause
```tsx
// Avant — ne gère que l'update, pas le create
setAdminLevels((prev) =>
  prev.map((l) => (l.order_index === selectedLevel ? updated : l)),
);
```
Si le niveau n'était pas dans `prev`, `map()` retournait le même tableau sans l'ajouter.

### Fix
```tsx
setAdminLevels((prev) => {
  const exists = prev.some((l) => l.order_index === selectedLevel);
  return exists
    ? prev.map((l) => (l.order_index === selectedLevel ? updated : l))
    : [...prev, updated].sort((a, b) => a.order_index - b.order_index);
});
```

### Fichiers impliqués
- `frontend/src/pages/editor/EditorPage.tsx` (handleSave)

---

## Notes architecture

- `ProtectedRoute` garantit `user !== null` au montage de tout composant protégé.
  Utiliser `useState(() => !!user?.is_admin)` (lazy init) plutôt qu'un `useEffect`
  pour les états dérivés de `user` disponibles dès le premier rendu.
- `adminMode` déclenche deux useEffects en cascade :
  1. `useEffect([adminMode])` → charge `getTowerLevels()`
  2. Le résultat peuple `adminLevels` → les 8 boutons s'affichent
- La route `GET /admin/tower` exige `is_admin=true` dans le JWT (via `adminMiddleware`).
  Un 403 silencieux (toast d'erreur) peut masquer un problème de données.
- Les 8 boutons sont toujours rendus (`Array.from({ length: 8 })`), même si `adminLevels`
  est vide. Un niveau absent de la DB affiche "Niveau N" comme fallback.
