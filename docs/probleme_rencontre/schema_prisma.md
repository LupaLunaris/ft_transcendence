# Vérifications du schéma Prisma — ft_transcendence

Ce document explique pédagogiquement les trois vérifications appliquées au schéma Prisma
dans le cadre de l'étape 5 (Socket.IO race + diamants).
Chaque section présente **ce qui a été vérifié**, **pourquoi c'est important**, et **l'état constaté**.

---

## Vérification 1 — Persistance des diamants gagnés en course

### Ce qui était demandé

Quand un joueur gagne une course, il doit gagner un diamant.
La question était : faut-il un nouveau modèle `Race` pour stocker ce fait ?

### Pourquoi la réponse est non

Le champ `diamonds` existe déjà sur le modèle `User` :

```prisma
model User {
  diamonds Int @default(0)
  // ...
}
```

Les diamants sont une **propriété de l'utilisateur**, pas un événement à retracer.
Il suffit d'incrémenter ce compteur côté backend à la fin de la race :

```ts
// backend — à la fin d'une race gagnée
await prisma.user.update({
  where: { id: winner.id },
  data: { diamonds: { increment: 1 } },
});
```

### Quand créer un modèle séparé ?

Un modèle `Race` ne serait utile que si on voulait :
- Afficher l'historique de toutes les courses (qui a joué contre qui, quand)
- Connaître le nombre exact de victoires en race (différent des diamants)
- Distinguer les diamants gagnés en race de ceux obtenus autrement

Ici, aucune de ces exigences n'est présente → pas de modèle supplémentaire.

### État constaté

`User.diamonds Int @default(0)` — **déjà présent**, aucune modification nécessaire.

---

## Vérification 2 — `grid_json` doit être `String`, pas `Json`

### Le problème potentiel

Prisma dispose d'un type `Json` pour stocker du JSON. Sur PostgreSQL, ce type
est stocké dans une colonne native `jsonb` avec des index et des requêtes dédiées.

Sur **SQLite**, le type `Json` de Prisma n'existe pas nativement.
Prisma le traduit silencieusement en `TEXT`, mais le type TypeScript généré reste `JsonValue`
(de `@prisma/client`), ce qui crée une **désynchronisation entre le type TS et le stockage réel**.

### Ce que ça implique en pratique

```ts
// Avec type Json (Prisma) sur SQLite :
const map = await prisma.map.findUnique({ where: { id } });
map.grid_json // type : JsonValue — objet JS désérialisé automatiquement ? Non.
              // SQLite renvoie une string. Prisma ne parse pas le JSON pour toi.
              // Résultat : comportement imprévisible selon la version de Prisma.
```

Avec le type `String`, le comportement est **explicite et prévisible** :

```ts
const map = await prisma.map.findUnique({ where: { id } });
const grid: Grid = JSON.parse(map.grid_json); // désérialisation explicite, toujours correcte
```

### La règle à retenir

> Sur SQLite avec Prisma : toujours utiliser `String` pour les colonnes JSON.
> La désérialisation est explicite (`JSON.parse`) et la sérialisation aussi (`JSON.stringify`).
> Ne jamais utiliser le type `Json` de Prisma sur SQLite.

### État constaté

```prisma
model Map {
  grid_json String  // ✓ correct
}

model AdminMap {
  grid_json String  // ✓ correct
}
```

Les deux modèles utilisent déjà `String`. **Aucune modification nécessaire.**

---

## Vérification 3 — Index de performance sur `Score`

### Pourquoi un index composite ?

Le leaderboard d'une map est la requête la plus fréquente sur la table `Score` :

```ts
// backend/src/routes/scores.routes.ts — leaderboard
prisma.score.findMany({
  where: { map_id: id },
  orderBy: { completion_time_ms: 'asc' },
  take: 10,
});
```

Sans index, SQLite fait un **full table scan** : il parcourt toutes les lignes de `Score`
pour trouver celles qui correspondent à `map_id`, puis les trie.

Avec l'index `@@index([map_id, completion_time_ms])`, SQLite peut :
1. Sauter directement aux entrées du bon `map_id` (B-tree lookup)
2. Les renvoyer déjà triées par `completion_time_ms` (ordre naturel de l'index)

Le `ORDER BY` devient gratuit — pas de tri supplémentaire nécessaire.

### Pourquoi l'ordre des colonnes dans l'index compte

Un index `(map_id, completion_time_ms)` est utilisable pour :
- Filtrer par `map_id` seul ✓
- Filtrer par `map_id` ET trier par `completion_time_ms` ✓

Un index `(completion_time_ms, map_id)` ne serait utilisable que pour trier globalement
par temps, ce qui n'est jamais notre cas d'usage.

**Règle : la colonne de filtre (`WHERE`) passe avant la colonne de tri (`ORDER BY`).**

### État constaté

```prisma
model Score {
  // ...
  @@index([map_id, completion_time_ms])  // ✓ déjà présent
}
```

**Aucune modification nécessaire.**

---

## Conclusion — Aucune migration n'était nécessaire

Les trois vérifications confirment que le schéma était déjà dans l'état cible.

```
npx prisma migrate status   ← vérifie que la base locale est synchrone
```

Si la base locale (`data.db`) n'existe pas encore ou est en retard :

```bash
npx prisma migrate dev --name add_score_index_and_string_grid
```

### Récapitulatif

| Vérification | Attendu | Constaté | Migration |
|---|---|---|---|
| `User.diamonds` | `Int @default(0)` | Présent | Non |
| `Map.grid_json` | `String` | `String` | Non |
| `AdminMap.grid_json` | `String` | `String` | Non |
| `Score @@index` | `[map_id, completion_time_ms]` | Présent | Non |

### Règles retenues pour la suite du projet

1. Sur SQLite + Prisma → toujours `String` pour les colonnes JSON, jamais `Json`.
2. Les compteurs simples (diamonds, play_count) → champ sur le modèle + `increment` Prisma.
3. Un index composite : colonne de filtre d'abord, colonne de tri ensuite.
4. Un nouveau modèle = seulement si on a besoin de requêter ou d'afficher l'historique des événements.
