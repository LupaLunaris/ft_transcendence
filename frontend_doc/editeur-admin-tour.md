# Éditeur admin — mode tour

## Stack concernée
`frontend/src/pages/editor/EditorPage.tsx` · `frontend/src/services/api.service.ts`
`backend/src/routes/admin.routes.ts` · `backend/src/middleware/admin.middleware.ts`

---

## Schéma du flux

```
ProtectedRoute (garantit user != null)
  └─ EditorPage
       ├─ useState(() => !!user?.is_admin)  →  adminMode = true dès le 1er rendu
       ├─ useEffect([adminMode])            →  GET /admin/tower
       │    └─ adminLevels: AdminMap[]
       └─ panel droit (adminMode && ...)
            └─ Array.from({ length: 8 }) → 8 boutons
                 ├─ niveau connu  → affiche level.name, charge grid au clic
                 └─ niveau absent → affiche "Niveau N", grille vide au clic

Sauvegarde (handleSave en adminMode)
  └─ PUT /admin/tower/:order_index  (upsert)
       ├─ crée si absent
       └─ met à jour si existant
       → sync cache local (replace ou append + sort)
```

---

## Invariants

### Initialisation de adminMode
`ProtectedRoute` n'affiche `EditorPage` qu'après `loading=false` et `user!=null`.
`user.is_admin` est donc disponible dès le premier rendu : utiliser la lazy init
`useState(() => !!user?.is_admin)` au lieu d'un `useEffect`.

Ne pas faire :
```tsx
const [adminMode, setAdminMode] = useState(false);
useEffect(() => { if (user?.is_admin) setAdminMode(true); }, [user?.is_admin]);
// Risque de rendu intermédiaire avec adminMode=false visible brièvement,
// et comportement instable si le composant remonte entre les deux effets.
```

Faire :
```tsx
const [adminMode, setAdminMode] = useState(() => !!user?.is_admin);
// adminMode=true dès le premier rendu → useEffect([adminMode]) charge les niveaux.
```

### Les 8 boutons sont toujours présents
Le panel génère toujours 8 boutons via `Array.from({ length: 8 }, (_, i) => i + 1)`.
Si un niveau n'est pas encore en DB (`adminLevels.find(l => l.order_index === n)` retourne `undefined`),
le bouton affiche `"Niveau N"` et le clic initialise une grille vide.

### Upsert du cache local après sauvegarde
Après `PUT /admin/tower/:n`, le niveau peut être nouveau (pas dans `adminLevels`).
Il faut tester `exists` avant de faire `map()` — sinon les niveaux créés n'apparaissent
pas avant rechargement.

### Condition is_admin en DB
`is_admin` est fixé à l'inscription via `ADMIN_EMAILS` (auth.routes.ts).
Si un compte admin a été créé avant que la liste soit ajoutée, il faut mettre à jour la DB :
```bash
sqlite3 backend/prisma/data.db \
  "UPDATE User SET is_admin=1 WHERE email IN ('malafont@student.42belgium.be','jdebrull@student.42belgium.be','jpaulis@student.42belgium.be','evan-dro@student.42belgium.be');"
```
Puis se reconnecter (le JWT encode `is_admin` au login depuis la DB).

---

## Interface AdminMap

```typescript
interface AdminMap {
  id: string;
  order_index: number;   // 1–8
  name: string;
  grid_json: Grid;       // déjà parsé (backend sérialise avant d'envoyer)
}
```

---

## Routes API

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/v1/admin/tower` | admin | Liste des 8 niveaux avec grid_json |
| PUT | `/api/v1/admin/tower/:n` | admin | Upsert niveau n (1–8) |
| GET | `/api/v1/tower` | public | Liste sans grid (pour joueurs) |
| GET | `/api/v1/tower/:n` | user | Grille du niveau n (progression vérifiée) |

---

## Cas limites

| Cas | Comportement |
|-----|-------------|
| `is_admin=false` en DB | adminMode=false, panel absent, GET /admin/tower → 403 |
| `getTowerLevels` retourne 403 | Toast d'erreur, `adminLevels=[]`, boutons affichent "Niveau N" |
| Sauvegarde sans niveau sélectionné | Toast d'erreur, updateTowerLevel non appelé |
| Niveau 1–8 non seedé | Bouton présent avec fallback, PUT crée le niveau |
| Sauvegarde grille invalide (<25x25 ou sans SPAWN/EXIT) | 400 du backend, toast d'erreur |
