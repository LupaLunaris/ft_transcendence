# Authentification — JWT, Context React et cycle de démarrage

## Comment fonctionne la stack

L'authentification du projet repose sur trois couches distinctes qui communiquent
via des interfaces bien définies.

### Côté backend (`backend/src/`)

Le backend est un serveur **Express + TypeScript** avec **Prisma** comme ORM
et **SQLite** comme base de données.

- `routes/auth.routes.ts` expose quatre routes :
  - `POST /api/v1/auth/register` — création de compte (hash bcrypt du mot de passe)
  - `POST /api/v1/auth/login` — vérification des credentials, émission d'un JWT
  - `GET /api/v1/auth/me` — validation d'un token existant, retour du profil
  - `PUT /api/v1/auth/profile` — mise à jour du profil (username, avatar)

- `middleware/auth.middleware.ts` intercepte les routes protégées : il lit le header
  `Authorization: Bearer <token>`, vérifie la signature JWT avec `JWT_SECRET`,
  et attache le payload décodé à `req.user`.

- `utils/response.utils.ts` normalise toutes les réponses :
  - Succès : `{ data: <payload> }` avec un statut 2xx
  - Erreur : `{ error: <message>, code: <status> }` avec un statut 4xx/5xx

Le JWT est signé avec `JWT_SECRET` (variable d'environnement) et expire après
`JWT_EXPIRES_IN` (défaut : `7d`). Il contient `{ id, email, is_admin }`.

### Côté types partagés (`shared/src/types/`)

`auth.types.ts` définit les contrats d'interface entre backend et frontend :

```ts
interface AuthResponse { user: UserPublic; token: string; }
interface LoginRequest { email: string; password: string; }
interface RegisterRequest { username: string; email: string; password: string; }
```

Ces types sont importés des deux côtés via le package `@ft/shared`, garantissant
la cohérence sans duplication.

### Côté frontend (`frontend/src/`)

Le frontend est une **SPA React + TypeScript** (Vite + React Router v7).

**`services/api.service.ts`** — couche HTTP :
- Méthode `request<T>()` : lit le JWT dans `localStorage.getItem('ft_token')`,
  ajoute le header `Authorization: Bearer`, appelle `fetch()`, désérialise
  la réponse `{ data: T }`, et lève une exception `ApiError` si le statut n'est pas 2xx.

**`context/auth.context.tsx`** — état global d'authentification :
- `AuthProvider` maintient trois états : `user`, `token`, `loading`
- Expose `login()`, `register()`, `logout()`, `updateUser()` via `useAuth()`
- Persiste le token dans `localStorage` sous la clé `ft_token`

**`App.tsx`** — structure des routes :
- `<ProtectedRoute>` bloque l'accès aux routes privées si `user === null`
- Les routes publiques (`/`, `/login`, `/register`) sont accessibles sans auth

---

## Les enjeux pour le projet

### 1. Persistance de session avec localStorage

Le JWT est stocké dans le `localStorage` du navigateur. C'est un choix délibéré :

- **Avantage** : la session survit à la fermeture de l'onglet et même du navigateur
  (contrairement à `sessionStorage`). L'utilisateur n'a pas à se reconnecter à chaque
  visite tant que le token n'est pas expiré (7 jours).

- **Contrainte** : le token doit être validé côté serveur à chaque démarrage de
  l'application. C'est le rôle de `GET /auth/me`.

### 2. La phase de démarrage (`loading = true`)

À chaque montage de `AuthProvider`, un `useEffect` s'exécute :

```tsx
// context/auth.context.tsx
useEffect(() => {
  const stored = localStorage.getItem(TOKEN_KEY);
  if (!stored) { setLoading(false); return; }

  setToken(stored);
  api.auth.getMe()
    .then((me) => setUser(me))
    .catch(() => {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    })
    .finally(() => setLoading(false));
}, []);
```

Pendant cet appel asynchrone, l'application est dans un état **transitoire** :
- `loading = true` → la vérification est en cours
- `user = null` → l'utilisateur n'est PAS encore confirmé comme connecté
- `token = stored` → le token est en mémoire mais pas encore validé

Tout composant qui rend différemment selon `user` doit impérativement traiter
ce troisième état, sous peine de produire un rendu incorrect pendant la transition.

### 3. Routes protégées et état de chargement

```tsx
// App.tsx
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;        // attendre la fin de la vérification
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

`ProtectedRoute` gère correctement les trois états. Les routes **publiques**
(`/login`, `/register`) doivent faire de même — sinon elles peuvent rendre
un formulaire alors que l'utilisateur est en réalité déjà connecté.

---

## Exemple pratique — le bug du 2026-05-16

### Symptôme

Après fermeture et réouverture de l'application, cliquer sur "Connexion"
dans la Navbar ou sur "Se connecter" sur la HomePage ne produisait aucun effet :
le formulaire de connexion apparaissait brièvement (ou pas du tout) puis
l'utilisateur se retrouvait de nouveau sur la page d'accueil.

### Diagnostic

La `Navbar` et la `LoginPage` ne traitaient pas l'état `loading = true`.

**`Navbar.tsx` :** le bloc ternaire `{user ? <profil> : <Connexion>}` était évalué
avec `user = null` pendant la phase de chargement. Le bouton "Connexion" apparaissait
donc **avant** que la validation du token soit terminée.

**`LoginPage.tsx` :** la garde `if (user) return <Navigate to="/" replace />` ne
vérifiait pas `loading`. Si `getMe()` réussissait pendant que l'utilisateur était
sur `/login`, la `LoginPage` se re-rendait avec `user` défini et redirectionnait
immédiatement vers `/`, sans que l'utilisateur ait pu interagir avec le formulaire.

```
Timeline du bug (token valide en localStorage) :
t=0ms   AuthProvider monte : loading=true, user=null
t=1ms   Navbar rend "Connexion" (user=null, pas de check loading)
t=50ms  Clic utilisateur → navigate('/login')
t=51ms  LoginPage rend le formulaire (user=null, pas de check loading)
t=120ms getMe() résout → setUser(me)
t=121ms LoginPage re-rend → if(user) → <Navigate to="/" replace />
        L'utilisateur se retrouve sur home — comme si le clic n'avait rien fait
```

### Correction

**`LoginPage.tsx`** — ajouter un spinner tant que `authLoading` est vrai :

```tsx
// AVANT
const { user, login } = useAuth();
if (user) return <Navigate to="/" replace />;

// APRÈS
const { user, login, loading: authLoading } = useAuth();
if (authLoading)
  return <div className="min-h-screen bg-surface flex items-center justify-center">
    <Spinner size="lg" className="text-deep-400" />
  </div>;
if (user) return <Navigate to="/" replace />;
```

**`Navbar.tsx`** — masquer les boutons auth pendant le chargement :

```tsx
// AVANT
const { user, logout } = useAuth();
{user ? (<profil/logout>) : (<Connexion/Inscription>)}

// APRÈS
const { user, logout, loading } = useAuth();
{!loading && (user ? (<profil/logout>) : (<Connexion/Inscription>))}
```

La correction est appliquée aux deux sections de la Navbar : desktop et mobile.

### Pourquoi ce pattern est correct

Après la correction, les trois états sont tous traités :

| État | Navbar | LoginPage |
|------|--------|-----------|
| `loading=true` | Rien (ni Connexion ni profil) | Spinner |
| `loading=false, user=null` | Connexion + Inscription | Formulaire |
| `loading=false, user=set` | Profil + Déconnexion | Redirect vers `/` |

---

## Fichiers impliqués

| Fichier | Rôle |
|---|---|
| `backend/src/routes/auth.routes.ts` | Routes register, login, me, profile |
| `backend/src/middleware/auth.middleware.ts` | Vérification JWT sur les routes protégées |
| `backend/src/utils/response.utils.ts` | Normalisation `{ data }` / `{ error }` |
| `shared/src/types/auth.types.ts` | Types `AuthResponse`, `LoginRequest`, etc. |
| `frontend/src/context/auth.context.tsx` | État global auth, persistance localStorage, `getMe()` au démarrage |
| `frontend/src/services/api.service.ts` | Couche HTTP, injection du token JWT |
| `frontend/src/App.tsx` | `ProtectedRoute`, structure des routes |
| `frontend/src/components/layout/Navbar.tsx` | Boutons auth conditionnels (corrigé) |
| `frontend/src/pages/auth/LoginPage.tsx` | Formulaire de connexion (corrigé) |
| `frontend/src/pages/auth/RegisterPage.tsx` | Formulaire d'inscription (même pattern à surveiller) |
| `frontend/src/__tests__/LoginPage.test.tsx` | Tests du comportement corrigé |
