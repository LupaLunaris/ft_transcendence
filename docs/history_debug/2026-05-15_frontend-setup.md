# 2026-05-15 — Setup frontend complet (React + Phaser)

## Périmètre

Génération des 22+ fichiers frontend : services, context, hooks, composants UI, layout,
pages, scènes Phaser, éditeur, routing. Suite de la session backend.

---

## Problèmes bloquants rencontrés

### 1. `baseUrl` déprécié — erreur TypeScript

**Symptôme :** Diagnostic VSCode — `L'option 'baseUrl' est déconseillée et cessera de fonctionner dans TypeScript 7.0`

**Cause :** TypeScript 5.x+ avec `moduleResolution: "bundler"` déprécie `baseUrl`.
L'option `paths` peut fonctionner de manière autonome en référençant les chemins
depuis la racine du `tsconfig.json`.

**Fix dans `frontend/tsconfig.json` :**
```diff
- "baseUrl": ".",
  "paths": {
-   "@/*": ["src/*"]
+   "@/*": ["./src/*"]
  }
```

Le `./` explicite indique que le chemin est relatif au `tsconfig.json`, sans nécessiter `baseUrl`.

**Note :** Le `vite.config.ts` garde son alias `resolve.alias` indépendamment — les deux
systèmes (TS pour les types, Vite pour le bundling) sont séparés.

---

### 2. React Router v7 installé (spec demandait v6)

**Symptôme :** `npm install react-router-dom` installe v7.15.1 (dernière stable).

**Impact :** Aucun pour le code produit. L'API `<Routes>/<Route>`, `useParams`,
`useNavigate`, `Navigate`, `Link`, `NavLink` est identique entre v6 et v7 pour le
routing basé sur composants.

**Décision :** Garder v7 — rétrocompatible, plus maintenu, actif.

---

### 3. `vi.useFakeTimers()` incompatible avec `userEvent.click()`

**Symptôme :** Tests `useToast.test.tsx` timeoutent à 5000ms dès que `useFakeTimers()`
est actif et qu'on utilise `userEvent.click()`.

**Cause :** `@testing-library/user-event` v14 utilise des microtasks internes (`await delay()`)
pour simuler des événements réalistes. Avec `vi.useFakeTimers()`, ces microtasks ne se
résolvent jamais sans avancer manuellement les timers — créant une attente infinie.

`userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })` devrait théoriquement
résoudre cela mais nécessite que Vitest avance les timers dans le bon ordre de microtasks.

**Fix appliqué :** Utiliser `fireEvent` (synchrone, pas de microtasks) pour le test qui
nécessite `useFakeTimers`. `userEvent` reste utilisé pour tous les autres tests.

```typescript
// AVANT — timeout
await userEvent.click(screen.getByText("Show"));

// APRÈS — synchrone, compatible fake timers
act(() => { fireEvent.click(screen.getByText("Show")); });
act(() => { vi.advanceTimersByTime(4000); });
```

---

### 4. Race condition Phaser — `game.scene.getScene()` retourne `null`

**Symptôme :** `game.scene.getScene('GameScene')` appelé juste après `new Phaser.Game()`
retourne `null` parce que le jeu n'a pas encore booté.

**Cause :** Phaser initialise le game de façon asynchrone. La scène n'est pas disponible
dans le SceneManager jusqu'à l'événement `'ready'`.

**Approche retenue :** Émettre les événements sur `game.events` (le bus global) depuis
l'intérieur de la scène via `this.game.events.emit(...)`, et écouter sur `game.events`
immédiatement après `new Phaser.Game(...)`, avant même l'événement `'ready'`.

```typescript
// GameScene.ts — émet sur le bus global
this.game.events.emit('player_reached_exit', elapsed);

// GameCanvas.tsx — écoute avant le démarrage de la scène
const game = new Phaser.Game(config);
game.events.on('player_reached_exit', (time_ms: number) => {
  onExitRef.current(time_ms);
});
game.events.once('ready', () => {
  game.scene.add('GameScene', GameScene, true, { grid, player_id });
});
```

---

### 5. Réponses paginées — double enveloppe evitée

**Symptôme :** `api.maps.getPublished()` retourne `{ data: [], total, page, limit }` directement,
pas `{ data: { data: [], total, page, limit } }`.

**Cause :** Le backend pour les routes paginées construit le `PaginatedResponse` comme
objet racine (pas via `sendSuccess`). La méthode `request<T>` qui unwrap `.data`
causerait une perte de `total`/`page`/`limit`.

**Fix :** `ApiService` expose deux méthodes privées :
- `request<T>` → unwrap `{ data: T }` → retourne `T`
- `requestPaginated<T>` → retourne la réponse brute comme `PaginatedResponse<T>`

---

## Dépendances ajoutées

| Package | Type | Raison |
|---------|------|--------|
| `react-router-dom@^7` | prod | Routing SPA |
| `vitest@^4` | dev | Runner de tests (natif Vite) |
| `@vitest/coverage-v8` | dev | Couverture de code |
| `@testing-library/react@^16` | dev | Tests composants React |
| `@testing-library/user-event@^14` | dev | Simulation événements utilisateur |
| `@testing-library/jest-dom@^6` | dev | Matchers DOM supplémentaires |
| `jsdom@^29` | dev | Environnement DOM pour Vitest |
| `@types/react-router-dom@^5` | dev | Types (compatibles v6/v7 API) |

---

## Surface produite

| Catégorie | Fichiers | Tests |
|-----------|----------|-------|
| Services | `api.service.ts` | 5 |
| Context & Hooks | `auth.context.tsx`, `useApi.ts`, `useMap.ts` | 4 (useApi) |
| UI components | Button, Input, Spinner, Modal, Toast, useToast | 6+4+5+4 = 19 |
| Layout | Navbar, Layout | — |
| Game (Phaser) | BaseScene, GameScene, GameCanvas | — |
| Pages | Login, Register, Home, Game, Editor, stubs (5) | — |
| Editor | EditorGrid, TileSelector | — |
| Routing | App.tsx + ProtectedRoute | — |

---

## État final

| Vérification | Résultat |
|---|---|
| `tsc --noEmit` (frontend) | ✅ 0 erreur |
| `npm test` (frontend) | ✅ 28/28 |
| `tsc --noEmit` (backend) | ✅ 0 erreur (inchangé) |
| `npm test` (backend) | ✅ 41/41 (inchangé) |
| `npm audit` | ✅ 0 vulnérabilité |
