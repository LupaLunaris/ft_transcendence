# 2026-05-16 — Reconnexion impossible après fermeture de l'application

## Périmètre

Bug fonctionnel bloquant la reconnexion manuelle : après avoir fermé l'application
et l'avoir réouverte, cliquer sur "Se connecter" ou "Connexion" ne produisait
aucun effet visible — le formulaire de connexion n'était jamais affiché durablement
ou l'utilisateur était immédiatement renvoyé sur la page d'accueil.

**Fichiers corrigés :**
- `frontend/src/pages/auth/LoginPage.tsx`
- `frontend/src/components/layout/Navbar.tsx`

**Tests ajoutés :**
- `frontend/src/__tests__/LoginPage.test.tsx`

---

## Symptômes observés

1. Fermer l'onglet du navigateur (ou le navigateur entier)
2. Rouvrir l'URL de l'application
3. Cliquer sur "Connexion" dans la Navbar ou "Se connecter" sur la HomePage
4. Résultat attendu : affichage du formulaire de connexion
5. Résultat observé : rien — retour immédiat sur la page d'accueil, sans formulaire

---

## Analyse des causes racines

### Cause — Race condition entre `getMe()` et le clic utilisateur

Quand l'application démarre avec un token valide dans le `localStorage`, le contexte
d'authentification (`auth.context.tsx`) entre dans l'état `loading = true`
et lance un appel asynchrone `api.auth.getMe()` pour valider le token et restaurer
la session.

**Pendant cet intervalle (`loading = true`, `user = null`)** :

1. `Navbar.tsx` ne vérifiait PAS l'état `loading`. Il affichait le bouton "Connexion"
   dès que `user === null`, même si l'authentification était en cours de vérification.

2. L'utilisateur voyait le bouton "Connexion" et cliquait dessus, naviguant vers `/login`.

3. `LoginPage.tsx` ne vérifiait PAS non plus l'état `loading`. Il rendait le formulaire
   dès que `user === null`.

4. `getMe()` se résolvait (token valide → l'utilisateur EST connecté) →
   `setUser(me)` était appelé → `LoginPage` se re-rendait → `if (user) return <Navigate to="/" replace />` → **redirect immédiat vers la homepage**.

**Résultat perçu :** le clic sur "Connexion" semblait ne rien faire car l'utilisateur
était renvoyé aussitôt sur la page d'accueil sans jamais voir le formulaire.

```
Timeline du bug :
t=0ms   App monte : loading=true, user=null
t=1ms   Navbar rend → bouton "Connexion" visible (user=null, pas de check loading)
t=50ms  Utilisateur clique "Connexion" → navigate('/login')
t=51ms  LoginPage rend le formulaire (user=null, pas de check loading)
t=120ms getMe() résout → setUser(me) → loading=false
t=121ms LoginPage re-rend → if (user) → <Navigate to="/" replace /> → retour home
```

---

## Corrections appliquées

### 1. `LoginPage.tsx` — Attendre la fin du chargement auth

**Avant :**
```tsx
const { user, login } = useAuth();
if (user) return <Navigate to="/" replace />;
```

**Après :**
```tsx
const { user, login, loading: authLoading } = useAuth();

if (authLoading)
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <Spinner size="lg" className="text-deep-400" />
    </div>
  );
if (user) return <Navigate to="/" replace />;
```

Le spinner bloque le rendu du formulaire jusqu'à ce que l'état auth soit résolu.
Une fois `loading = false` :
- Si `user` est défini → redirect vers `/` (session restaurée automatiquement) ✓
- Si `user` est null → affichage du formulaire de connexion ✓

### 2. `Navbar.tsx` — Masquer les boutons pendant le chargement

**Avant :**
```tsx
const { user, logout } = useAuth();
// ...
{user ? (<>profile + logout</>) : (<>Connexion + Inscription</>)}
```

**Après :**
```tsx
const { user, logout, loading } = useAuth();
// ...
{!loading && (user ? (<>profile + logout</>) : (<>Connexion + Inscription</>))}
```

Pendant `loading = true`, aucun bouton auth n'est affiché — ni "Connexion", ni le profil.
L'utilisateur ne peut donc pas cliquer sur "Connexion" avant que l'état auth soit résolu.
Correction appliquée aux deux sections : desktop et mobile.

---

## Flux corrigé

```
App rouverte (token en localStorage)
        ↓
loading=true, user=null
        ↓
Navbar : aucun bouton auth affiché (loading=true)
        ↓
getMe() résout (token valide → user restauré)
        ↓
loading=false, user=set
        ↓
Navbar : affiche profil + "Déconnexion"
HomePage : affiche la carte joueur

(Si token invalide/expiré)
        ↓
getMe() rejette → token supprimé → loading=false, user=null
        ↓
Navbar : affiche "Connexion" + "Inscription"
Clic "Connexion" → /login → LoginPage affiche le formulaire immédiatement
```

---

## Tests ajoutés

### `LoginPage.test.tsx` (5 tests)

- Formulaire visible quand non authentifié et `loading=false`
- Spinner visible (formulaire absent) quand `loading=true`
- Aucun formulaire rendu si `user` est déjà défini → redirect
- `login()` appelé avec les bonnes valeurs lors du submit
- Toast d'erreur affiché si `login()` rejette

---

## Leçon retenue

Tout composant qui rend différemment selon l'état d'authentification
(`user === null` vs `user !== null`) doit aussi gérer l'état de transition
`loading === true`. L'ignorer crée une fenêtre de temps pendant laquelle
l'UI affiche un état incorrect (ici : "pas connecté" alors que la vérification
est en cours), ce qui peut provoquer des interactions utilisateur prématurées
et des effets de bord inattendus (redirect depuis la LoginPage).
