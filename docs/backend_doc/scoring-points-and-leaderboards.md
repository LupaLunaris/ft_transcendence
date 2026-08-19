# Scoring, points de classement et leaderboards (2026-07-17)

## Statut

**Implémenté.** Étend le système de gamification (XP/achievements,
cf. gamification MVP) avec un système de points de classement de vitesse,
indépendant de l'XP, et des leaderboards par map + global.

## Score : d'un historique d'essais à un record personnel

Avant cette évolution, `Score` créait une ligne par essai (`POST /scores`
faisait un `create` systématique). Depuis, `Score` a une contrainte
`@@unique([user_id, map_id])` : **une seule ligne par (joueur, map)**, son
record personnel (temps le plus rapide). La migration
`20260717010000_add_scoring_points` dédoublonne les lignes existantes avant
d'ajouter la contrainte (garde le temps le plus bas, puis le `id` le plus
petit en cas d'égalité).

`backend/src/services/scoring.service.ts#upsertBestScore(tx, userId, mapId, completionTimeMs)` :
- Si aucun score existant, ou si `completionTimeMs` est meilleur → `upsert`
  la ligne et déclenche `recalculateMapPoints`.
- Sinon (temps moins bon qu'un essai précédent) → ne touche rien, `improved: false`.

Appelé depuis deux endroits :
- `backend/src/routes/scores.routes.ts` (`POST /scores`, mode solo)
- `backend/src/socket/duelHandler.ts#finishRace` (mode duel, cf. plus bas)

## Points de classement de vitesse (MapRankingPoints)

Nouveau modèle `MapRankingPoints` (`map_id`, `user_id`, `points`,
`@@unique([map_id, user_id])`) : stocke les points **actuels** d'un joueur
sur une map, pas un historique. Rang 1 = 5 points, rang 2 = 4, ... rang 5 =
1 point ; au-delà du top 5, aucune ligne (retirée si un joueur en sortait).

`scoring.service.ts#recalculateMapPoints(tx, mapId)` :
1. Relit le top 5 de `Score` pour cette map (`orderBy: completion_time_ms asc`).
2. Calcule les nouveaux points par `user_id`.
3. Supprime les lignes `MapRankingPoints` des joueurs qui ne sont plus dans
   le top 5.
4. Upsert les points des joueurs qui y sont.

Recalculé à **chaque** amélioration de record personnel sur la map (solo ou
duel), jamais en lecture — les leaderboards lisent directement
`MapRankingPoints`, pas de calcul à la volée.

## Duel : chaque finisseur compte comme un essai solo

`duelHandler.ts#finishRace` est passé en `async` (les deux points d'appel
`if (isRaceOver(race)) finishRace(...)` sont préfixés `void` — fire and
forget, ne bloque pas l'émission de `race_finished`). Après avoir diffusé le
classement de course, dans une transaction séparée :

- Pour **chaque joueur ayant atteint l'EXIT** (`entry.finished &&
  entry.duration_ms !== null`) → `upsertBestScore(tx, entry.user_id,
  race.map_id, entry.duration_ms)`. Un joueur mort/forfait n'est pas compté
  — cohérent avec le mode solo, où seul un `POST /scores` réussi (donc une
  arrivée) crée un essai.
- Le vainqueur (`rank === 1 && finished` — un seul joueur peut avoir le rang
  1, `buildRanking` assigne des rangs uniques) reçoit en plus
  `gamification.service.ts#rewardDuelVictory` (XP + achievement
  `DUEL_CHAMPION`, cf. plus bas). La récompense n'est envoyée qu'à lui, via
  un event socket dédié `reward_earned` (`io.to(winnerPlayer.socket_id)`),
  puisque `race_finished` est diffusé identique à toute la room et ne peut
  pas porter une récompense spécifique à un seul joueur.
- Toute la persistance est dans un `try/catch` séparé de l'émission
  `race_finished` : un échec DB ne doit pas empêcher les clients de voir le
  résultat de la course (juste logué en `console.error`).

## Récompense de victoire en duel (gamification.service.ts)

`rewardDuelVictory(tx, userId, raceId)` : `action='DUEL_VICTORY'`,
`key=${userId}:${raceId}` (idempotent par course, répétable à chaque
victoire — contrairement aux récompenses de complétion de map qui ne
paient qu'une fois par (user, map)), +25 XP, débloque l'achievement
`DUEL_CHAMPION` (une seule fois, comme les autres achievements).

## Leaderboards (lecture)

Trois routes dans `scores.routes.ts`, dans cet ordre précis (l'ordre est
significatif pour Express — une route littérale doit être déclarée avant
une route paramétrée qui capturerait le même segment) :

1. `GET /scores/leaderboard/global` — **tous** les joueurs ayant au moins un
   point (aucune limite), par somme de `MapRankingPoints.points` groupée par
   `user_id` (`prisma.mapRankingPoints.groupBy`, sans `take`). **Doit** être
   déclarée avant `/leaderboard/:map_id`, sinon `map_id` capturerait le
   littéral `global`.
2. `GET /scores/leaderboard/:map_id` — inchangée, liste les temps bruts
   (désormais naturellement dédupliqués par joueur puisque `Score` est
   1 ligne/joueur/map).
3. `GET /scores/leaderboard/:map_id/points` — malgré son nom, lit `Score`
   directement (pas `MapRankingPoints`) : top 5 par `completion_time_ms`
   croissant, `points` recalculé positionnellement via `POINTS_BY_RANK`
   (exporté par `scoring.service.ts`, mêmes valeurs que
   `recalculateMapPoints` — les deux listes sont donc toujours identiques,
   sans dépendre l'une de l'autre). Renvoie en plus `completion_time_ms`
   pour chaque entrée.

Toutes renvoient `LeaderboardEntry[]` (shared, `leaderboard.types.ts`) :
`{ rank, user_id, username, avatar, points, completion_time_ms? }` —
`completion_time_ms` seulement sur la route par map (2026-07-17, sur
demande explicite : afficher le meilleur temps du joueur plutôt que ses
points sur le leaderboard d'une map précise).

## Frontend

- `frontend/src/hooks/useLeaderboard.ts` — `useMapLeaderboard(mapId)` /
  `useGlobalLeaderboard()`, wrappers `useApi` classiques (pas de
  rafraîchissement automatique — les pages de jeu se démontent après la
  course, pas besoin de refetch).
- `frontend/src/components/leaderboard/Leaderboard.tsx` — composant unique
  réutilisé partout (titre + liste rang/avatar/pseudo/valeur), pas de
  variante par page. La valeur affichée par ligne dépend de la donnée
  reçue, pas de la page : `entry.completion_time_ms !== undefined` → temps
  formaté (`(ms/1000).toFixed(2)` + `s`, clé i18n `leaderboard.time_value`)
  ; sinon → points (`leaderboard.points_value`). Donc **temps** sur
  `GamePage`/`DuelGamePage` (leaderboard d'une map précise), **points** sur
  `TrainingPage`/`DuelPage` (leaderboard global).
- Placé à droite du canvas de jeu sur `GamePage` (solo) et `DuelGamePage`
  (duel) — leaderboard **de la map en cours**.
- Placé à droite du contenu sur `TrainingPage` et `DuelPage` — leaderboard
  **global** (toutes maps confondues, tous les joueurs).
- `DuelGamePage` écoute `reward_earned` (toast XP + achievement, puis
  `api.auth.getMe()` pour rafraîchir le contexte auth) — même pattern que
  `GamePage`/`EditorPage` pour les récompenses solo, cf.
  `frontend/src/pages/game/GamePage.tsx#handleReward`.

## Bug corrigé le jour même : score perdu sur une transaction "poisoned"

`gamification.service.ts` (`awardXpOnce`/`unlockAchievement`, code du
gamification MVP, antérieur à cette évolution) catchait une violation de
contrainte unique (XP/achievement déjà accordé) puis continuait à
interroger le **même** `tx` Prisma pour construire une réponse de repli.
Dans Postgres, une transaction dont une requête a échoué passe en état
*aborted* : toute requête suivante sur ce `tx` échoue (`25P02`), même
catchée côté JS — pas de savepoint implicite. L'exception remontait donc
hors du `prisma.$transaction(...)`, qui `ROLLBACK` tout, y compris l'upsert
du `Score` déjà réussi plus tôt dans la même transaction.

Le scénario qui déclenchait systématiquement le bug : un joueur qui rejoue
une map déjà complétée → `rewardPublicMapCompletion` retombe sur une clé
XP déjà utilisée → catch-and-continue → transaction poisoned → tout le
`POST /scores` échoue → "score non enregistré" côté client, alors que le
score aurait dû être mis à jour (ou conservé si pas amélioré).

Fix : vérifier l'existence (`findUnique`) **avant** d'insérer, plutôt que
d'insérer et catcher. Détails complets et reproduction vérifiée en
conditions réelles : `history_debug/2026-07-17_score-not-saved-poisoned-transaction.md`.

**Règle à retenir** : ne jamais catcher une erreur Prisma à l'intérieur
d'une transaction interactive puis continuer à interroger le même `tx`.
