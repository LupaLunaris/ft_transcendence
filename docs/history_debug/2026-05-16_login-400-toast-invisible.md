# 2026-05-16 — Login bloqué : erreur 400 silencieuse sur `/login`

## Périmètre

Bug bloquant empêchant la reconnexion après inscription : cliquer sur "Se connecter"
ne produisait aucun effet visible — ni redirection, ni message d'erreur. La requête
POST `/api/v1/auth/login` retournait 400, mais l'utilisateur ne le voyait jamais.

**Fichiers corrigés :**
- `frontend/src/App.tsx` — `<ToastContainer>` déplacé ici (disponible partout)
- `frontend/src/components/layout/Layout.tsx` — `<ToastContainer>` retiré (évite doublons)

---

## Symptômes observés

1. S'inscrire (fonctionne)
2. Naviguer vers `/login`
3. Entrer ses identifiants, cliquer "Se connecter"
4. Résultat attendu : redirection vers la page d'accueil
5. Résultat observé : rien — le bouton charge brièvement, puis revient à l'état normal.
   Pas de message d'erreur, pas de redirection.

---

## Deux bugs concomitants

### Bug 1 — `<ToastContainer>` absent sur la page de connexion (bug de code)

`LoginPage` et `RegisterPage` ne passent pas par `<Layout>`.
Or `<ToastContainer>` n'était déclaré que dans `Layout.tsx` :

```
App.tsx
  └── ToastProvider                ← état des toasts (showToast disponible)
        └── AuthProvider
              └── BrowserRouter
                    └── AppRoutes
                          ├── LoginPage       ← PAS de Layout → PAS de ToastContainer
                          ├── RegisterPage    ← PAS de Layout → PAS de ToastContainer
                          └── pages avec Layout
                                └── Layout
                                      └── ToastContainer  ← seul endroit !
```

Conséquence : quand `showToast("Invalid email", "error")` était appelé depuis
`LoginPage`, le toast rejoignait le state du contexte, mais **aucun composant ne
le rendait**. L'utilisateur voyait le bouton charger puis rien.

### Bug 2 — Email invalide (400 Bad Request)

La requête `POST /api/v1/auth/login` retournait :
```json
{"error":"Invalid email","code":400}
```
(36 bytes — signature exacte du message Zod `z.string().email('Invalid email')`)

Cause : l'utilisateur entrait probablement son **nom d'utilisateur** (username)
dans le champ Email, croyant que c'était son "login". Le formulaire est labellisé
"Email" mais le chemin mental "login → identifiant → nom d'utilisateur" est naturel.

Ce 400 était le déclencheur du toast d'erreur — lui-même invisible (Bug 1).

---

## Correction appliquée

### `App.tsx` — `<ToastContainer>` au niveau racine

```tsx
// AVANT
export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

// APRÈS
import { ToastContainer } from '@/components/ui/Toast';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
      <ToastContainer />   {/* toujours monté, quelle que soit la page */}
    </ToastProvider>
  );
}
```

`ToastContainer` utilise `position: fixed` — sa position dans le DOM ne change
rien à son rendu visuel. Le placer comme dernier enfant de `<ToastProvider>`
garantit qu'il est actif sur TOUTES les pages, y compris `/login` et `/register`.

### `Layout.tsx` — suppression du `<ToastContainer>`

```tsx
// AVANT
<div>
  <Navbar />
  <main>{children}</main>
  <ToastContainer />   // ← retiré
</div>

// APRÈS
<div>
  <Navbar />
  <main>{children}</main>
</div>
```

Sans cette suppression, les pages qui utilisent `Layout` auraient affiché
chaque toast **deux fois** (une depuis `App.tsx`, une depuis `Layout`).

---

## Flux corrigé

```
Utilisateur clique "Se connecter" (formulaire)
        ↓
POST /api/v1/auth/login { email, password }
        ↓
  [Si 400 Invalid email]
  showToast("Invalid email", "error")
        ↓
  ToastContainer (dans App.tsx) rend le toast ✓
  → utilisateur voit "Invalid email" en bas à droite
  → comprend qu'il doit entrer son email, pas son username

  [Si 401 Invalid credentials]
  showToast("Invalid credentials", "error") ✓

  [Si 200 OK]
  setUser(me), setToken(jwt)
  <Navigate to="/" replace /> → redirection vers home ✓
```

---

## Tests ajoutés

### `LoginPage.toast.test.tsx` (3 tests d'intégration)

Ces tests n'utilisent **pas** le mock de `useToast`. Ils montent la structure
réelle `<ToastProvider> + <LoginPage> + <ToastContainer>` et vérifient
que `screen.getByRole('alert')` est présent dans le DOM après un échec de login.

- **400 "Invalid email"** → toast "Invalid email" visible dans le DOM ✓
- **401 "Invalid credentials"** → toast "Invalid credentials" visible ✓
- **Erreur réseau (TypeError)** → toast "Échec de la connexion" visible ✓

---

## Leçon retenue

Tout composant de feedback UI (toasts, modals d'erreur) doit être ancré
à un niveau suffisamment haut dans l'arbre de composants pour être disponible
sur toutes les pages — pas uniquement dans les pages qui utilisent un layout
partagé. La règle : si le provider est à la racine, le container aussi.

**Fichiers impliqués :**

| Fichier | Rôle |
|---|---|
| `frontend/src/App.tsx` | Racine — `<ToastContainer>` déplacé ici |
| `frontend/src/components/layout/Layout.tsx` | `<ToastContainer>` retiré |
| `frontend/src/components/ui/Toast.tsx` | `ToastContainer` (position fixed, DOM-position-agnostic) |
| `frontend/src/components/ui/useToast.ts` | `ToastProvider`, `showToast`, état des toasts |
| `frontend/src/pages/auth/LoginPage.tsx` | Appelle `showToast` — n'a pas de `<Layout>` |
| `frontend/src/pages/auth/RegisterPage.tsx` | Même situation |
