# Debug history — 2026-07-17 : Map.play_count toujours à zéro

## Contexte
Ajout d'un hub joueur (PlayerHub) affiché en barre latérale gauche sur
toutes les pages sauf l'éditeur. En vérifiant les stats affichées, le
nombre de parties jouées par map (TrainingPage) restait figé à 0 quelle
que soit l'activité des joueurs.

---

## Problème — Map.play_count jamais incrémenté

### Symptôme
`TrainingPage` affiche `{{count}} parties` par map (`map.play_count`),
toujours à 0 même après plusieurs parties terminées sur la map.

### Cause
`Map.play_count` (schema.prisma) n'était lu que par `GET /maps` et
`GET /maps/:id` (`backend/src/routes/maps.routes.ts`). Aucune route ne
l'incrémentait — `POST /scores` (soumission de score en fin de partie)
ne touchait que `Score` (record personnel, via `upsertBestScore`, qui ne
réécrit même pas la ligne si le temps n'est pas meilleur) et les
récompenses de gamification, jamais le compteur de la map elle-même.

### Fix
Incrément de `play_count` dans la même transaction que la soumission de
score, à chaque partie terminée (indépendamment d'un nouveau record
personnel) :

```ts
// backend/src/routes/scores.routes.ts, POST /
await tx.map.update({
  where: { id: map_id },
  data: { play_count: { increment: 1 } },
});
```

### Fichiers impliqués
- `backend/src/routes/scores.routes.ts`

---

## Notes architecture
- `Map.play_count` est un compteur global (toutes parties, tous joueurs
  confondus) — pas un compteur par utilisateur. Affiché dans la liste
  des maps de `TrainingPage`.
- `Score` ne garde qu'un enregistrement par `(user_id, map_id)` (le
  record personnel) — ce n'est donc pas une source fiable pour compter
  le nombre de parties jouées, d'où l'incrément dédié sur `Map`.
