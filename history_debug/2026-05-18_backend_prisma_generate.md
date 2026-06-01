# Debug — Backend : prisma generate manquant
**Date :** 2026-05-18  
**Fichiers en erreur :** 4 routes backend  
**Fix :** `npx prisma generate --schema=backend/prisma/schema.prisma`

---

## Symptôme
```
Found 4 errors in 4 files.
  admin.routes.ts:30    TS7006 — Parameter 'l' implicitly has an 'any' type
  auth.routes.ts:17     TS2305 — Module '@prisma/client' has no exported member 'User'
  maps.routes.ts:14     TS2305 — Module '@prisma/client' has no exported member 'Map'
  scores.routes.ts:69   TS7006 — Parameter 's' implicitly has an 'any' type
npm error Lifecycle script `build` failed with error code 2
```

## Cause racine
**`prisma generate` n'avait pas été lancé.** Le dossier `node_modules/.prisma/client/` contenait uniquement un stub vide (~110 lignes) sans les types générés pour les modèles `User`, `Map`, `AdminMap`, `Score`.

### Cascade des 4 erreurs depuis 1 seule cause
| Erreur | Origine |
|---|---|
| `TS2305 — no exported member 'User'` | Client Prisma stub → `User` n'existe pas |
| `TS2305 — no exported member 'Map'` | Client Prisma stub → `Map` n'existe pas |
| `TS7006 — 'l' implicitly any` (admin.routes.ts:30) | `prisma.adminMap.findMany()` retourne `any[]` → callback `l` est `any` |
| `TS7006 — 's' implicitly any` (scores.routes.ts:69) | `prisma.score.findMany()` retourne `any[]` → callback `s` est `any` |

## Fix
```bash
npx prisma generate --schema=backend/prisma/schema.prisma
```

Généré : Prisma Client v5.22.0 dans `node_modules/@prisma/client`.  
`tsc --noEmit` → 0 erreurs.

## Quand relancer prisma generate
- Après chaque modification de `backend/prisma/schema.prisma`
- Après un `npm install` propre (si node_modules recréés)
- Le Makefile cible `build` devrait inclure `prisma generate` avant `tsc`

## Schéma actuel (modèles)
`User` · `Map` · `AdminMap` · `Score`  
Fichier : `backend/prisma/schema.prisma`
