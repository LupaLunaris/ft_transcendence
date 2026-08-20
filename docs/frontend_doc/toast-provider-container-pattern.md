# Système de notifications (toasts) — Provider/Container pattern en React

## Comment fonctionne la stack

### Le pattern Provider/Consumer en React

React n'a pas de système de notification global intégré. Pour qu'un composant
profond dans l'arbre puisse déclencher une notification visible n'importe où
dans l'UI, le projet utilise le **pattern Provider/Consumer** via la Context API.

Ce pattern repose sur trois rôles distincts :

```
ToastProvider   ← détient l'état (tableau de toasts), expose showToast()
    │
    ├── Tout l'arbre de l'application
    │       └── N'importe quel composant peut appeler useToast().showToast()
    │
    └── ToastContainer  ← lit l'état, rend les <ToastItem> dans le DOM
```

**Les fichiers impliqués dans ce système :**

| Fichier | Rôle |
|---|---|
| `frontend/src/components/ui/useToast.ts` | `ToastProvider` (état), `useToast()` (écriture), `useToastContext()` (lecture) |
| `frontend/src/components/ui/Toast.tsx` | `ToastContainer` (rendu), `ToastItem` (mise en forme d'un toast) |

### `ToastProvider` — le détenteur d'état

```ts
// useToast.ts (simplifié)
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);         // liste des toasts actifs

  const showToast = (message, type = 'info') => {
    const id = ++nextId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), 4000);            // auto-dismiss à 4s
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}
```

`ToastProvider` expose deux hooks :
- `useToast()` → retourne `{ showToast }` (pour déclencher un toast)
- `useToastContext()` → retourne `{ toasts, showToast, dismiss }` (pour lire et afficher)

### `ToastContainer` — le rendu visuel

```tsx
// Toast.tsx (simplifié)
export function ToastContainer() {
  const { toasts } = useToastContext();   // lit l'état depuis le contexte
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
}
```

`ToastContainer` est un composant **de lecture seule**. Il utilise `position: fixed`
donc sa position dans le DOM n'a aucune incidence sur le rendu visuel — un toast
s'affiche toujours en bas à droite de la fenêtre, quel que soit l'endroit où
`<ToastContainer>` est déclaré dans l'arbre JSX.

**Contrainte fondamentale** : `ToastContainer` doit être à l'intérieur de
`ToastProvider` pour accéder au contexte. Il doit être monté **pendant toute
la durée de vie de l'application**, sans quoi les toasts d'une page donnée
ne seront jamais rendus dans le DOM.

---

## Les enjeux pour le projet

### 1. Dissociation déclencheur / affichage

Le pattern Provider/Container dissocie intentionnellement **qui déclenche** un
toast de **où il est rendu**. C'est l'avantage central :

- Un composant métier (`LoginPage`, `EditorPage`) appelle `showToast("message", "error")`
  sans savoir où le message sera affiché.
- `ToastContainer` gère l'affichage de façon centralisée.
- On peut changer le style, la position ou la durée des toasts sans toucher
  aux composants métier.

### 2. La règle de positionnement du Container

Parce que `ToastContainer` rend les toasts en `position: fixed` (hors du flux
normal du DOM), on pourrait croire que le placer n'importe où est équivalent.

**Ce n'est pas le cas.** `ToastContainer` doit être **monté en permanence**,
quel que soit la page affichée. Si on le place à l'intérieur d'un composant de
layout conditionnel (par exemple `<Layout>`), il n'est monté que sur les pages
qui utilisent ce layout. Les pages sans layout (comme `/login` ou `/register`)
n'auraient pas de container actif, et leurs toasts seraient silencieusement
perdus.

**La règle :** le `Container` doit être enfant direct du `Provider`, au même
niveau que le reste de l'application. Pas à l'intérieur d'un layout partiel.

```tsx
// ✅ Correct — ToastContainer toujours monté
<ToastProvider>
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />   ← toutes les pages (avec ou sans Layout)
    </BrowserRouter>
  </AuthProvider>
  <ToastContainer />  ← toujours présent, quel que soit la route
</ToastProvider>

// ❌ Incorrect — ToastContainer absent sur les pages sans Layout
<ToastProvider>
  ...
  <Route path="/login" element={<LoginPage />} />  ← pas de Layout
  <Route path="/home"  element={<Layout><HomePage /></Layout>} />
                                         └── <ToastContainer /> ici seulement
</ToastProvider>
```

### 3. Feedback utilisateur sur les pages d'authentification

Les pages `/login` et `/register` sont les pages où l'utilisateur est le plus
susceptible de faire des erreurs (mauvais mot de passe, email invalide, nom
d'utilisateur déjà pris). Ce sont précisément les pages où les toasts
d'erreur sont **les plus critiques**.

Or ces pages n'utilisent pas `<Layout>` — elles ont leur propre mise en page
centrée. Si `<ToastContainer>` n'est disponible qu'à travers `<Layout>`,
toutes les erreurs d'authentification sont invisibles pour l'utilisateur.

---

## Exemple pratique — le bug du 2026-05-16

### Symptôme

Après inscription, cliquer sur "Se connecter" avec ses identifiants ne
produisait aucun effet : le bouton chargeait brièvement, puis revenait
à son état initial. Aucun message d'erreur n'apparaissait.

### Diagnostic

**Cause 1 — `<ToastContainer>` absent sur `/login`**

`LoginPage` ne passe pas par `<Layout>`. `<ToastContainer>` n'était déclaré
que dans `Layout.tsx`, donc absent de l'arbre de rendu sur `/login`.

Quand le login échouait, `showToast("Invalid email", "error")` était appelé.
Le toast rejoignait le state de `ToastContext`. Mais comme `<ToastContainer>`
n'était pas monté, personne ne lisait ce state pour l'afficher.

```
showToast("Invalid email") appelé dans LoginPage
      ↓
setToasts([{ id: 1, message: "Invalid email", type: "error" }]) dans ToastProvider
      ↓
ToastContainer non monté sur /login → rien rendu dans le DOM
      ↓
Utilisateur voit : [bouton charge] → [bouton retour à normal] → silence total
```

**Cause 2 — La requête POST retournait 400**

Le backend rejetait la requête avec `{"error":"Invalid email","code":400}`
(36 bytes — signature exacte de `z.string().email('Invalid email')` dans Zod).

L'utilisateur entrait son **nom d'utilisateur** dans le champ Email, croyant
que c'était son identifiant de connexion. "Login" ≠ "Email" dans le vocabulaire
commun. Le message `"Invalid email"` aurait guidé l'utilisateur s'il avait
été visible.

### Correction

**`App.tsx`** — `<ToastContainer>` ancré à la racine, toujours monté :

```tsx
// AVANT
export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter><AppRoutes /></BrowserRouter>
      </AuthProvider>
    </ToastProvider>  // ← ToastContainer absent ici
  );
}

// APRÈS
import { ToastContainer } from '@/components/ui/Toast';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter><AppRoutes /></BrowserRouter>
      </AuthProvider>
      <ToastContainer />  // ← toujours monté, quelle que soit la page
    </ToastProvider>
  );
}
```

**`Layout.tsx`** — `<ToastContainer>` retiré pour éviter les doublons :

```tsx
// AVANT
export function Layout({ children }) {
  return (
    <div>
      <Navbar />
      <main>{children}</main>
      <ToastContainer />  // ← retiré
    </div>
  );
}
```

### Ce que voit maintenant l'utilisateur

Après correction :
1. L'utilisateur entre son nom d'utilisateur dans le champ "Email"
2. Clique "Se connecter"
3. **Toast rouge visible** : "Invalid email"
4. L'utilisateur comprend qu'il doit entrer son **adresse email** (celle
   renseignée lors de l'inscription, pas son nom d'utilisateur)

---

## Tests ajoutés

**`frontend/src/__tests__/LoginPage.toast.test.tsx`** (3 tests d'intégration)

Ces tests n'utilisent PAS le mock de `useToast`. Ils montrent la structure
réelle `<ToastProvider> + <LoginPage> + <ToastContainer>` et vérifient
que `screen.getByRole('alert')` est présent dans le DOM après une tentative
de connexion échouée.

```tsx
// Structure reproduite dans les tests — identique à App.tsx après correction
<ToastProvider>
  <MemoryRouter>
    <LoginPage />
  </MemoryRouter>
  <ToastContainer />
</ToastProvider>
```

- **400 "Invalid email"** → toast "Invalid email" visible dans le DOM ✓
- **401 "Invalid credentials"** → toast "Invalid credentials" visible ✓
- **Erreur réseau (TypeError)** → toast "Échec de la connexion" visible ✓

---

## Fichiers impliqués

| Fichier | Rôle |
|---|---|
| `frontend/src/components/ui/useToast.ts` | `ToastProvider`, état, `showToast()`, `useToastContext()` |
| `frontend/src/components/ui/Toast.tsx` | `ToastContainer`, `ToastItem` — rendu visuel |
| `frontend/src/App.tsx` | Ancrage de `<ToastContainer>` à la racine (corrigé) |
| `frontend/src/components/layout/Layout.tsx` | `<ToastContainer>` retiré (évite les doublons) |
| `frontend/src/pages/auth/LoginPage.tsx` | Appelle `showToast()` sur erreur — pas de `<Layout>` |
| `frontend/src/pages/auth/RegisterPage.tsx` | Même situation — bénéficie aussi de la correction |
| `frontend/src/__tests__/LoginPage.toast.test.tsx` | Tests d'intégration du toast visible sur `/login` |
| `frontend/src/__tests__/useToast.test.tsx` | Tests unitaires du provider/container (préexistants) |
