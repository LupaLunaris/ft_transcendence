# Prisma Client — génération et imports

## Comment fonctionne la stack

Prisma est un ORM (Object-Relational Mapper) : il fait le pont entre le code TypeScript et la base de données. Il fonctionne en **deux phases distinctes** qu'il ne faut pas confondre.

**Phase 1 — Définir le schéma** (`schema.prisma`)  
C'est le fichier de configuration central. Il décrit :
- La base de données cible (`datasource`)
- Ce qu'on veut générer (`generator`)
- Les modèles de données (`model User`, `model Map`…)

**Phase 2 — Générer le client** (`prisma generate`)  
La commande lit le schéma et **génère du code TypeScript** dans `node_modules/@prisma/client`. Ce code est une API typée, calquée exactement sur vos modèles. Il faut la relancer à chaque modification du schéma.

```
schema.prisma  ──prisma generate──▶  node_modules/@prisma/client
                                              │
                                              ▼
                                    import { PrismaClient } from '@prisma/client'
```

---

## Les enjeux pour le projet

Le `schema.prisma` du projet contient ce bloc en haut :

```prisma
generator client {
  provider = "prisma-client-js"
}
```

Ce bloc dit à Prisma : "utilise le générateur officiel JavaScript/TypeScript". C'est le seul générateur dont on ait besoin ici. Sans lui, `prisma generate` ne sait pas quoi produire.

La conséquence directe : dans **tout le code backend**, on importe depuis `@prisma/client` — jamais depuis `prisma` ou autre chose.

```typescript
// ✅ correct — c'est le client généré
import { PrismaClient } from '@prisma/client';

// ❌ incorrect — ce package ne contient que la CLI, pas le client
import { PrismaClient } from 'prisma';
```

Le piège classique : oublier de relancer `prisma generate` après avoir modifié `schema.prisma`. Le code compile, mais `PrismaClient` n'a pas les nouveaux champs — les erreurs arrivent à l'exécution, pas à la compilation.

---

## L'exemple du projet : `src/lib/prisma.ts`

Dans ce projet, on n'instancie pas `PrismaClient` directement dans chaque fichier. On utilise un **singleton** :

```typescript
// backend/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query'],  // affiche les requêtes SQL en dev
});

export default prisma;
```

Pourquoi un singleton ? Node.js garde les modules en cache : importer `prisma.ts` depuis dix fichiers différents retourne toujours la **même instance**. Si on instanciait `new PrismaClient()` dans chaque fichier, on ouvrirait des dizaines de connexions à la base simultanément — catastrophique en production.

**Workflow à retenir pour l'équipe :**

| Action | Commande |
|--------|----------|
| Modifier `schema.prisma` | `npm run db:generate` (= `prisma generate`) |
| Appliquer les changements en DB | `npm run db:migrate` (= `prisma migrate dev`) |
| Vérifier le schéma sans toucher la DB | `prisma validate` |

Le résultat du `prisma validate` sur ce projet : ✅ 0 erreur (vérifié le 15/05/2026).
