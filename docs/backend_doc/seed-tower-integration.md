# Pipeline de seed — intégration des niveaux de la tour

## Contexte

Le mode tour repose sur 8 niveaux pré-dessinés stockés dans la table `AdminMap`.
Ces niveaux doivent exister en base dès le premier démarrage — avant qu'un admin
puisse les modifier via l'éditeur.

Deux fichiers de seed coexistent :

| Fichier | Rôle |
|---------|------|
| `prisma/seed.ts` | Point d'entrée Prisma. Crée les utilisateurs de test. |
| `prisma/seed-tower.ts` | Définit et insère les 8 niveaux de la tour. |

---

## Architecture du pipeline

```
make docker-up
  └─► prisma db seed          (déclenché par docker-compose au démarrage du backend)
        └─► seed.ts           (seul fichier déclaré dans package.json › prisma.seed)
              ├─ upsert alice, bob
              ├─ upsert AdminMap order_index=1 (placeholder)
              └─ seedTower(prisma)             ← appel explicite
                    ├─ upsert level 1 — Les Catacombes
                    ├─ upsert level 2 — Le Couloir Brisé
                    ├─ ...
                    └─ upsert level 8 — L'Abîme Final
```

Un seul `PrismaClient` est ouvert dans `seed.ts` et passé en paramètre à
`seedTower`. Pas de double connexion.

---

## Ce qui a été modifié

### `prisma/seed-tower.ts`

**Avant :** `main()` créait son propre `PrismaClient` et s'exécutait à la racine
du fichier — impossible à importer sans déclencher une exécution immédiate.

**Après :**

```typescript
// Fonction exportée — reçoit le client en paramètre
export async function seedTower(prisma: PrismaClient): Promise<void> { ... }

// Exécution standalone conservée pour usage manuel
if (require.main === module) {
  const prisma = new PrismaClient();
  seedTower(prisma)
    .catch(...)
    .finally(() => prisma.$disconnect());
}
```

Le bloc `require.main === module` est vrai uniquement quand Node.js exécute
**directement** ce fichier. Quand `seed.ts` l'importe, ce bloc est ignoré.

### `prisma/seed.ts`

```typescript
import { seedTower } from './seed-tower';

async function main() {
  // ... upsert users, placeholder AdminMap ...
  await seedTower(prisma);   // ← ajout
}
```

---

## Idempotence

Les deux fichiers utilisent `upsert` (pas `create`).
Relancer le seed ne produit ni doublon ni erreur — utile après un `make docker-down-v`.

`seed.ts` crée level 1 avec un placeholder ("The Depths — Level 1").
`seedTower` le remplace ensuite avec la vraie grille "Les Catacombes".
C'est intentionnel : `seedTower` est autoritaire sur le contenu des niveaux.

---

## Exécution manuelle

```bash
# Via le pipeline complet
npm run db:seed --workspace=backend

# Seed tour seul (utile pour tester seed-tower.ts en isolation)
npx ts-node --transpile-only backend/prisma/seed-tower.ts
```

---

## Invariants

- `order_index` est unique (contrainte Prisma) et borné 1-8 côté route admin.
- L'admin peut modifier n'importe quel niveau après le seed — le seed ne réécrase
  que si on relance explicitement `db:seed`.
- Les niveaux n'ont pas de valeur `ENEMY_H` (4) ni `ENEMY_V` (5) dans ce seed :
  les grilles actuelles sont statiques (murs uniquement).
