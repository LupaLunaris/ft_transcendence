# Debug history — 2026-07-17 : Score non enregistré après complétion de map

## Contexte
Après avoir intégré `POST /scores` au système de points de classement
(scoring MVP, même session), un joueur signale qu'après avoir réussi une
map, un toast "score non enregistré" s'affiche et le score n'apparaît
effectivement pas dans le classement.

---

## Problème — Transaction Postgres "aborted" avale l'écriture du score

### Symptôme
`POST /scores` échoue côté client (catch → toast d'erreur), et le score
n'est jamais visible dans le classement, alors que l'upsert du meilleur
temps (`upsertBestScore`) avait pourtant réussi plus tôt dans la même
transaction.

### Cause
`backend/src/services/gamification.service.ts` (`awardXpOnce` et
`unlockAchievement`, code déjà présent avant cette session — gamification
MVP, commit 5d5e5aa) catchaient une violation de contrainte unique P2002
(`xpEvent.create` sur `(action, key)`, `userAchievement.create` sur
`(user_id, code)`) puis continuaient à interroger le **même** client de
transaction (`tx`) pour construire une réponse de repli
(`getCurrentRewardState` → `tx.user.findUnique(...)`).

Ça ne fonctionne pas avec les transactions interactives Prisma/Postgres :
dès qu'une requête échoue à l'intérieur d'une transaction, Postgres passe
la transaction entière en état *aborted* et **toute** requête suivante sur
ce `tx` échoue avec `25P02 current transaction is aborted`, même si
l'erreur a été catchée côté JS (pas de savepoint implicite). L'exception
`25P02` remonte alors hors du callback `prisma.$transaction(...)`, qui
`ROLLBACK` toute la transaction — y compris les écritures déjà réussies
plus tôt dans ce même callback (l'upsert du `Score`).

Ce bug était latent dans le code gamification MVP original (même schéma :
`score.create` puis `rewardPublicMapCompletion` dans la même transaction),
mais il ne se déclenche que quand l'action de récompense a **déjà été
créditée** pour cette clé (`action`+`key`) — typiquement un joueur qui
rejoue une map déjà complétée. L'intégration du scoring l'a rendu
systématique et visible : `upsertBestScore` tourne maintenant dans la même
transaction que `rewardPublicMapCompletion`, donc tout replay d'une map
déjà réussie fait échouer (et rollback) l'écriture du score en même temps
que la récompense XP déjà accordée.

Logs backend observés (`docker logs ft_transcendence-backend-1`) :
```
Invalid `prisma.xpEvent.create()` invocation:
Unique constraint failed on the fields: (`action`,`key`)
prisma:error
Invalid `prisma.user.findUnique()` invocation:
Error occurred during query execution:
ConnectorError(... PostgresError { code: "25P02", message: "current
transaction is aborted, commands ignored until end of transaction block" ...})
```

### Fix
Remplacer le pattern "insert puis catch P2002" par une vérification
d'existence **avant** l'insertion (`findUnique` puis `create` seulement si
absent), pour ne jamais déclencher la violation de contrainte dans le
chemin normal ("déjà récompensé"), et ne plus jamais interroger `tx` après
une erreur.

```ts
// avant (cassé)
try {
  await tx.xpEvent.create({ data: {...} });
} catch (error) {
  if (isUniqueConstraintError(error)) return getCurrentRewardState(tx, userId); // tx déjà aborted
  throw error;
}

// après (fix)
const already = await tx.xpEvent.findUnique({ where: { action_key: { action, key } } });
if (already) return getCurrentRewardState(tx, userId);
await tx.xpEvent.create({ data: {...} });
```

Même correction pour `unlockAchievement` (`userAchievement.findUnique`
avant `create`).

### Fichiers impliqués
- `backend/src/services/gamification.service.ts`

---

## Notes architecture
- **Ne jamais catcher une erreur Prisma à l'intérieur d'une transaction
  interactive puis continuer à interroger le même `tx`** — une fois qu'une
  requête échoue dans une transaction Postgres, toute requête suivante sur
  cette transaction échoue (`25P02`) jusqu'au `ROLLBACK`/`COMMIT`, quoi que
  fasse le code JS. Préférer un `findUnique` de garde avant l'écriture
  quand le cas "déjà existant" est un chemin normal (pas une vraie race
  condition), et laisser une vraie violation de contrainte concurrente
  (rare) remonter et faire échouer toute la requête plutôt que de tenter
  une récupération sur le même `tx`.
- Ce bug affecte toute fonction de `gamification.service.ts` appelée dans
  la même transaction qu'une autre écriture qu'on veut voir persister
  (score, publication de map, etc.) — vérifié pour les trois call sites
  (`scores.routes.ts`, `maps.routes.ts`, `duelHandler.ts#finishRace`).
