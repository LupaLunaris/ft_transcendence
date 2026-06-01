# Enum Difficulty — le double standard Prisma / TypeScript

## Comment fonctionne la stack

Un **enum** (énumération) est un type qui ne peut prendre qu'un ensemble fini de valeurs. Il existe dans deux contextes dans ce projet, avec des règles différentes :

**Dans Prisma (côté base de données) :**  
Les enums Prisma sont stockés comme des chaînes en base. Par convention et par contrainte technique, Prisma les attend **en majuscules**. Le générateur de client TypeScript les expose aussi en majuscules.

**Dans TypeScript (côté application) :**  
Les types partagés du projet (`shared/src/types/`) définissent `Difficulty` en **minuscules**, ce qui est idiomatique en TypeScript et plus naturel pour les APIs JSON et les interfaces utilisateur.

Ces deux représentations coexistent et ne sont pas compatibles directement — il faut un **mapping explicite** dans la couche API pour passer de l'une à l'autre.

---

## Les enjeux pour le projet

### Le problème concret

Le schéma `schema.prisma` stocke la difficulté comme une `String` avec une valeur par défaut `"EASY"` :

```prisma
model Map {
  difficulty  String  @default("EASY")
  ...
}
```

Et le type TypeScript dans `shared/` définit :

```typescript
// shared/src/types/map.types.ts
type Difficulty = 'easy' | 'medium' | 'hard';
```

Si on retourne la valeur brute de la base de données sans la transformer :

```typescript
// ❌ Renvoie { difficulty: "EASY" } — TypeScript l'accepte (c'est un String)
// mais le frontend reçoit "EASY" alors qu'il attend "easy"
const map = await prisma.map.findUnique({ where: { id } });
res.json(map);
```

Le frontend fait ensuite :

```typescript
if (map.difficulty === 'easy') { ... }  // ← ne sera JAMAIS vrai si difficulty = "EASY"
```

Le bug est silencieux : pas d'erreur TypeScript, pas de crash — juste une condition qui ne se déclenche jamais.

### Pourquoi la DB utilise des majuscules ?

C'est une convention Prisma issue du monde SQL : les valeurs d'enum en base sont généralement en majuscules (`ACTIVE`, `PENDING`, `CANCELLED`). Cette convention améliore la lisibilité dans les outils SQL et évite des ambiguïtés de casse selon les moteurs de base de données.

---

## L'exemple du projet : le mapping à implémenter

Le projet a identifié ce problème dès le 15/05/2026. La **couche API** (les handlers Express dans `src/`) est l'endroit correct pour faire ce mapping — ni dans Prisma, ni dans le frontend.

**Pattern à suivre dans les routes du backend :**

```typescript
// Mapping dans un sens (DB → API)
function toApiDifficulty(dbValue: string): Difficulty {
  const map: Record<string, Difficulty> = {
    EASY:   'easy',
    MEDIUM: 'medium',
    HARD:   'hard',
  };
  return map[dbValue] ?? 'easy';
}

// Mapping dans l'autre sens (API → DB)
function toDbDifficulty(apiValue: Difficulty): string {
  return apiValue.toUpperCase();  // 'easy' → 'EASY'
}
```

**Utilisation dans un handler Express :**

```typescript
// GET /maps/:id
app.get('/maps/:id', async (req, res) => {
  const map = await prisma.map.findUnique({ where: { id: req.params.id } });
  if (!map) return res.status(404).json({ error: 'Not found', code: 404 });

  res.json({
    ...map,
    difficulty: toApiDifficulty(map.difficulty),  // ← transformation ici
  });
});

// POST /maps
app.post('/maps', async (req, res) => {
  const { difficulty, ...rest } = req.body;
  const map = await prisma.map.create({
    data: {
      ...rest,
      difficulty: toDbDifficulty(difficulty),  // ← transformation ici
    },
  });
  res.json({ ...map, difficulty });  // renvoyer la valeur API, pas la valeur DB
});
```

**Résumé du flux de données :**

```
Frontend          API Layer         Base de données
────────          ─────────         ───────────────
'easy'    ──────▶ 'EASY'    ──────▶ stocké "EASY"
                  toDbDifficulty()

stocké "EASY" ──▶ 'easy'    ──────▶ { difficulty: 'easy' }
                  toApiDifficulty()
```

**Règle à retenir :** toute valeur lue depuis Prisma et exposée via l'API doit passer par `toApiDifficulty()`. Toute valeur reçue du frontend et écrite en base doit passer par `toDbDifficulty()`. Ce mapping est la responsabilité exclusive de la couche backend — le frontend ne doit jamais connaître les majuscules.
