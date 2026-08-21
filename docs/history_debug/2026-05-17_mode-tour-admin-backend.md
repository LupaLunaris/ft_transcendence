# Debug — Mode tour admin : backend complet

**Date :** 2026-05-17
**Auteur :** jdebrull
**Fichiers concernés :**
- `backend/src/middleware/admin.middleware.ts` *(nouveau)*
- `backend/src/middleware/auth.middleware.ts` *(existant — ordre de chaînage critique)*
- `backend/src/routes/auth.routes.ts` *(modifié — ADMIN_EMAILS)*
- `backend/src/routes/admin.routes.ts` *(nouveau)*
- `backend/src/routes/tower.routes.ts` *(modifié — POST complete)*
- `backend/src/routes/index.ts` *(modifié — ajout /admin)*
- `backend/prisma/seed-tower.ts` *(nouveau)*

---

## Problème 1 — Ordre de chaînage `authMiddleware` → `adminMiddleware`

### Symptôme
Si `adminMiddleware` est utilisé AVANT `authMiddleware` (ou sans lui), `req.user`
est `undefined` et le check `req.user?.is_admin` retourne toujours `false`,
bloquant tous les admins avec un 403.

### Cause
`authMiddleware` est responsable de peupler `req.user` à partir du JWT.
`adminMiddleware` lit `req.user.is_admin`. Sans `req.user`, la lecture échoue
silencieusement à cause de l'optional chaining (`?.`), ce qui rend le bug
difficile à diagnostiquer (pas d'exception, juste un 403 systématique).

### Solution
Toujours chaîner dans cet ordre :
```ts
router.use(authMiddleware, adminMiddleware); // dans admin.routes.ts
```
Ou sur chaque route :
```ts
router.get('/tower', authMiddleware, adminMiddleware, handler);
```

### Leçon
Les middlewares d'Express s'exécutent dans l'ordre de leur déclaration.
Tout middleware qui lit des données posées par un middleware précédent
DOIT être déclaré après lui.

---

## Problème 2 — `prisma.user.update` avec `{ increment: 1 }` sur `diamonds`

### Symptôme
Erreur TypeScript à la compilation si `diamonds` est déclaré optionnel
(`Int?`) dans le schéma Prisma. Prisma ne permet pas `{ increment }` sur
un champ nullable.

### Cause
Prisma's atomic operations (`increment`, `decrement`, `multiply`) ne sont
disponibles que sur les champs `Int` non-optionnels. Un champ `Int?`
(nullable) force une valeur `null | number` que Prisma ne peut pas
incrémenter de façon sûre sans un `coalesce` côté SQL.

### Solution
Dans `schema.prisma`, `diamonds` est bien déclaré `Int @default(0)` (non
nullable). La migration n'est donc pas nécessaire, mais ce point doit être
vérifié si le schéma évolue.

```ts
// Correct — opération atomique sans race condition
await prisma.user.update({
  where: { id: user.id },
  data: {
    tower_progress: orderIndex,
    diamonds: { increment: 1 },
  },
});
```

---

## Problème 3 — Validation `grid_json` dans la route admin PUT

### Symptôme
Un body `{ grid_json: "not-json" }` faisait crasher `JSON.parse()` avec une
exception non catchée, retournant une 500 au lieu d'une 400 propre.

### Cause
`JSON.parse()` lève une `SyntaxError` si la chaîne n'est pas du JSON valide.
Sans try/catch, Express attrape l'exception et retourne une 500 générique.

### Solution
Envelopper le parse dans un try/catch avant d'appeler `validateGrid()` :
```ts
let parsed: unknown;
try {
  parsed = JSON.parse(grid_json);
} catch {
  sendError(res, 'grid_json is not valid JSON', 400);
  return;
}
if (!validateGrid(parsed)) { ... }
```

---

## Problème 4 — Seed `seed-tower.ts` : grilles 25×25 et BFS

### Contraintes rappelées
- Bordures : toutes les cellules `row=0`, `row=24`, `col=0`, `col=24` doivent
  être `WALL (1)`.
- Exactement 1 `SPAWN (3)` et 1 `EXIT (2)`.
- Un chemin BFS doit exister entre SPAWN et EXIT (vérifié par `hasPath()`
  dans `grid.utils.ts`).

### Approche
Chaque grille est construite en partant de l'intérieur rempli de MURs,
puis en "creusant" des couloirs. Cette approche garantit que les bordures
restent des murs (elles ne sont jamais touchées par le creusage).

SPAWN est posé APRÈS le creusage pour ne pas être écrasé. EXIT de même.

### Commande seed
```bash
cd backend && npx ts-node --project tsconfig.json prisma/seed-tower.ts
```
