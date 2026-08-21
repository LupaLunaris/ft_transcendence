# Corrections appliquées — ft_transcendence

Ce document explique pédagogiquement trois corrections apportées au projet.
Chaque section présente **le problème**, **pourquoi il pose problème**, et **la solution choisie**.

---

## Correction 1 — Double définition de `UpdateProfileRequest`

### Fichier concerné
`frontend/src/services/api.service.ts`

### Le problème

Le fichier importait déjà de nombreux types depuis `@ft/shared` :

```ts
import type { UserPublic, AuthResponse, ... } from '@ft/shared';
```

Mais juste en dessous, une interface identique était redéfinie localement :

```ts
// AVANT (doublon)
interface UpdateProfileRequest {
  username?: string;
  avatar?: string;
}
```

Pendant ce temps, `shared/src/types/user.types.ts` définit **exactement** la même chose :

```ts
export interface UpdateProfileRequest {
  username?: string;
  avatar?: string;
}
```

Et `shared/src/index.ts` la réexporte via `export * from './types/user.types'`.

### Pourquoi c'est un problème

1. **Désynchronisation silencieuse** : si quelqu'un modifie la définition dans `shared/` (ex. ajoute un champ `bio`), la version locale dans `api.service.ts` n'est pas mise à jour automatiquement. TypeScript ne se plaint pas, mais les deux types divergent.
2. **Source de vérité multiple** : un type ne doit vivre qu'à un seul endroit. Ici `shared/` est la source de vérité inter-packages ; redéfinir ailleurs casse cette règle.
3. **Confusion pour les futurs contributeurs** : lequel des deux est "officiel" ?

### La solution

Supprimer la redéfinition locale et ajouter `UpdateProfileRequest` dans l'import existant :

```ts
// APRÈS
import type {
  UserPublic,
  AuthResponse,
  // ...
  UpdateProfileRequest,   // ← ajouté ici
} from '@ft/shared';
```

La réexportation en bas du fichier (`export type { UpdateProfileRequest, ... }`) est conservée afin de ne pas casser les imports existants qui pointent vers `api.service.ts`.

---

## Correction 2 — Build automatique de `shared/` au démarrage

### Fichier concerné
`package.json` (racine du monorepo)

### Le problème

Le script `dev` de la racine était :

```json
"dev": "concurrently \"npm run dev --workspace=backend\" \"npm run dev --workspace=frontend\""
```

Les packages `backend` et `frontend` importent des types depuis `@ft/shared`, mais celui-ci est un package TypeScript qui doit être **compilé** avant d'être consommé. Sa sortie compilée se trouve dans `shared/dist/`.

Si `shared/dist/` est absent ou obsolète :
- Le frontend obtient des erreurs de type au démarrage de Vite.
- Le backend peut planter au démarrage de ts-node/tsx.
- La résolution de module échoue (`Cannot find module '@ft/shared'`).

Le même problème existait pour `npm run build` : `shared` était buildé en premier dans la chaîne, mais cela n'était pas garanti via un hook automatique.

### Pourquoi le monorepo aggrave le problème

Dans un monorepo npm workspaces, les packages locaux sont liés via `node_modules/@ft/shared → ../../shared`. Npm résout le module au dossier `shared/`, mais TypeScript lit le champ `main`/`types` du `package.json` de `shared`, qui pointe vers `dist/`. Si `dist/` n'existe pas, tout explose.

### La solution

```json
"scripts": {
  "dev":      "npm run build -w shared && concurrently \"npm run dev -w backend\" \"npm run dev -w frontend\"",
  "prebuild": "npm run build -w shared"
}
```

Deux mécanismes complémentaires :

| Script | Déclenchement | Effet |
|---|---|---|
| `dev` | `npm run dev` | Build `shared` **synchrone** avant de lancer les deux watchers en parallèle |
| `prebuild` | **automatiquement** avant `npm run build` | npm exécute `pre<script>` avant `<script>` — garantit que `shared` est à jour avant le build complet |

`concurrently` est déjà présent dans les `devDependencies` (`^8.2.2`), aucune installation supplémentaire n'est nécessaire.

**Note** : `-w shared` est l'alias court de `--workspace=shared`, les deux sont équivalents ; la forme courte est préférée par cohérence avec la convention npm moderne.

---

## Correction 3 — Zod v4 dans le middleware de validation

### Fichier concerné
`backend/src/middleware/validate.middleware.ts`

### Contexte : changement d'API entre Zod v3 et Zod v4

Zod v3 exposait les erreurs de validation sous `error.errors` (un tableau de `ZodIssue`) :

```ts
// ZOD v3 — ancienne API
const message = result.error.errors[0]?.message ?? 'Validation error';
```

Zod v4 a renommé cette propriété en `error.issues` pour plus de clarté sémantique (`issues` désigne les problèmes de validation, `errors` était ambigu) :

```ts
// ZOD v4 — nouvelle API (correcte)
const message = result.error.issues[0]?.message ?? 'Validation error';
```

Si on utilise `.errors` avec Zod v4, TypeScript signale une erreur de type (`Property 'errors' does not exist`) et à l'exécution la valeur est `undefined`, ce qui provoque une exception ou un message d'erreur vide.

### État du fichier

Le middleware utilisait **déjà** la bonne syntaxe `result.error.issues[0].message` :

```ts
sendError(res, result.error.issues[0].message, 400);
```

**Cette correction était donc déjà appliquée.** Elle est documentée ici pour mémoire et pour s'assurer que tous les nouveaux middlewares de validation suivront le même pattern Zod v4.

### Règle à retenir pour l'équipe

> Dans ce projet, Zod v4 est utilisé (voir `CLAUDE.md` → section Zod).
> Toujours utiliser `.issues` (jamais `.errors`).
> Le message final : `result.error.issues[0]?.message ?? 'Validation error'`

---

## Résumé des fichiers modifiés

| Fichier | Nature de la correction |
|---|---|
| `frontend/src/services/api.service.ts` | Suppression du doublon `UpdateProfileRequest`, ajout dans l'import `@ft/shared` |
| `package.json` | Script `dev` avec build `shared` en amont, ajout de `prebuild` |
| `backend/src/middleware/validate.middleware.ts` | Déjà correct — aucune modification nécessaire |
