# Comment fonctionne le système de middleware Express

## La stack utilisée

Express 4 est un framework HTTP minimaliste pour Node.js. Son concept central est
la **pile de middlewares** : chaque requête HTTP traverse une chaîne de fonctions
`(req, res, next)` dans l'ordre où elles sont enregistrées.

```
Requête HTTP
    │
    ▼
[helmet]          ← sécurité headers
    │
    ▼
[cors]            ← CORS
    │
    ▼
[express.json()]  ← parsing body JSON
    │
    ▼
[/api/v1/...]     ← routeur principal
    │        │
    │        ▼
    │   [authMiddleware]   ← vérifie JWT, pose req.user
    │        │
    │        ▼
    │   [adminMiddleware]  ← vérifie req.user.is_admin
    │        │
    │        ▼
    │   [handler métier]   ← répond avec sendSuccess / sendError
    │
    ▼
[errorHandler]    ← catch-all erreurs non gérées
```

Chaque middleware peut :
- Appeler `next()` pour passer au suivant
- Appeler `next(error)` pour sauter à l'error handler
- Répondre directement avec `res.json()` / `res.send()` et NE PAS appeler `next()`

---

## Les enjeux pour ce projet

### 1. Sécurité par couches

Le pattern `authMiddleware → adminMiddleware` illustre le principe de **défense
en profondeur** :

- `authMiddleware` garantit qu'il y a un utilisateur authentifié (`req.user` peuplé).
- `adminMiddleware` garantit que cet utilisateur est admin.

Si les deux étaient fusionnés en un seul middleware, toute modification du check
d'auth (ex. : migration OAuth) obligerait à modifier aussi le check admin.
En les séparant, chaque middleware a **une seule responsabilité**.

### 2. Ordre d'enregistrement = contrat d'exécution

Express exécute les middlewares DANS L'ORDRE où ils sont déclarés.
Ce n'est pas une convention, c'est le comportement garanti du framework.

```ts
// ✅ Correct : req.user est peuplé avant d'être lu
router.use(authMiddleware, adminMiddleware);

// ❌ Incorrect : req.user est undefined quand adminMiddleware l'inspecte
router.use(adminMiddleware, authMiddleware);
```

### 3. `router.use()` vs middleware par route

`router.use(authMiddleware, adminMiddleware)` en haut du fichier s'applique à
TOUTES les routes du router. C'est le choix fait dans `admin.routes.ts` car
toutes les routes admin nécessitent les deux checks.

Dans `tower.routes.ts`, la route `GET /` est publique (pas d'auth) mais
`GET /:order_index` et `POST /:order_index/complete` sont protégées. Les
middlewares sont donc passés **par route**, pas globalement.

---

## Debug comme exemple pratique

### Fichiers impliqués

| Fichier | Rôle |
|---------|------|
| [backend/src/middleware/auth.middleware.ts](../backend/src/middleware/auth.middleware.ts) | Pose `req.user` depuis le JWT Bearer |
| [backend/src/middleware/admin.middleware.ts](../backend/src/middleware/admin.middleware.ts) | Vérifie `req.user.is_admin` |
| [backend/src/routes/admin.routes.ts](../backend/src/routes/admin.routes.ts) | Utilise les deux middlewares en séquence |
| [backend/src/__tests__/admin.middleware.test.ts](../backend/src/__tests__/admin.middleware.test.ts) | Tests unitaires isolés |
| [backend/src/__tests__/admin.routes.test.ts](../backend/src/__tests__/admin.routes.test.ts) | Tests d'intégration avec Supertest |

### Le bug de l'ordre

Lors de l'implémentation, si `adminMiddleware` est déclaré sans `authMiddleware`
devant lui, le check `req.user?.is_admin` retourne `undefined` (falsy) :

```ts
// admin.middleware.ts
export function adminMiddleware(req, res, next) {
  if (!req.user?.is_admin) {   // ← undefined?.is_admin === undefined → !undefined === true
    sendError(res, 'Forbidden', 403);  // ← 403 pour tout le monde
    return;
  }
  next();
}
```

L'optional chaining `?.` est une sécurité TypeScript mais masque le bug :
au lieu d'une `TypeError: Cannot read property 'is_admin' of undefined`,
on reçoit silencieusement un 403. C'est pourquoi le test unitaire couvre
explicitement le cas `req.user === undefined` :

```ts
// admin.middleware.test.ts — ligne 35
it('returns 403 when req.user is undefined', () => {
  const { req, res, next } = makeReqRes(undefined);
  adminMiddleware(req, res, next);
  expect(res.status).toHaveBeenCalledWith(403);
});
```

### Pourquoi Supertest pour les routes

Les tests de routes (`admin.routes.test.ts`) utilisent Supertest et un mini-app
Express car ils testent **l'intégration des middlewares** : l'ordre, la
propagation de `req.user`, la réponse HTTP finale. Un test unitaire du handler
seul ne détecterait pas un bug d'ordre de middleware.

```ts
// Test qui détecterait un bug d'ordre
it('returns 403 for non-admin user', async () => {
  const res = await request(app)
    .get('/api/v1/admin/tower')
    .set('Authorization', `Bearer ${userToken()}`);  // ← token is_admin: false
  expect(res.status).toBe(403);
});
```
