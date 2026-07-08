# Duel — passage des ennemis en simulation serveur (tick autoritaire)

## Statut

**Implémenté** (`shared/src/game/enemyLogic.ts`, `backend/src/socket/duelHandler.ts`,
`frontend/src/game/scenes/DuelScene.ts`). `GameScene.ts` (mode solo) n'a
**pas** été touché — il garde sa simulation locale via `entities/Enemy.ts`
(`HorizontalEnemy`/`VerticalEnemy`), ce qui est correct : un seul client, pas
de problème de synchronisation à résoudre en solo.

### Écarts par rapport à la version planifiée

- **`player_died` a été supprimé du protocole** (retiré de
  `ClientToServerEvents` et du handler backend), pas seulement rendu
  inutilisé — plus aucun événement client ne signale une mort par ennemi,
  le serveur la détecte et la diffuse seul via `game_state`
  (`PlayerState.alive`).
- `entities/Enemy.ts` (`HorizontalEnemy`/`VerticalEnemy`) n'a pas été migré
  vers `shared/enemyLogic.ts` — seul `GameScene.ts` (solo) l'utilise encore,
  et il n'a pas besoin de la version partagée puisqu'il n'y a rien à
  synchroniser entre clients en solo.

### Bug post-implémentation : collision manquée entre deux ticks (corrigé 2026-07-07)

Le premier jet ne vérifiait la collision joueur/ennemi **que** dans le tick
serveur (toutes les 400ms), après avoir fait avancer chaque ennemi d'une
case. Ça reproduisait mal l'ancien comportement client (qui vérifiait la
collision des **deux côtés** : après chaque déplacement du joueur *et*
après chaque déplacement d'ennemi).

Scénario de la collision manquée :
```
t=0ms    ennemi en (5,5), joueur en (5,4)
t=100ms  player_input : le joueur avance en (5,5)  — aucune vérification ici
t=400ms  tick ennemi : l'ennemi avance de (5,5) → (6,5), PUIS vérifie
         collision : ennemi=(6,5) vs joueur=(5,5) → pas de match !
```
Le joueur a passé 300ms exactement sur la case de l'ennemi sans jamais être
détecté, parce que la seule vérification avait lieu juste après que
l'ennemi ait déjà quitté cette case. Résultat observé : "la mort par
ennemi ne se produit (presque) plus", et par ricochet, comme un joueur ne
meurt jamais, `isRaceOver()` n'est jamais vrai tant que tous les joueurs
n'ont pas *explicitement* atteint l'EXIT — donc pas de classement affiché
dans les parties de test où un des joueurs restait bloqué.

**Fix :** la collision est maintenant vérifiée à **deux endroits** —
dans le tick ennemi (inchangé) **et** dans le handler `player_input`, juste
après la mise à jour de `player.position` :

```ts
player.position  = { x: nx, y: ny };
player.direction = direction;
race.tick++;

const hitEnemy = race.enemies.some(e => e.x === nx && e.y === ny);
if (hitEnemy) {
  resolvePlayerLoss(io, race, user.id);
  return;
}
```

Ceci restaure la détection "des deux côtés" (mouvement du joueur ET
mouvement de l'ennemi), au prix d'une vérification supplémentaire par
input — négligeable en coût.

### Bug post-implémentation n°2 : la propre mort du joueur local n'était jamais reflétée (corrigé 2026-07-07)

Une fois la collision fiable côté serveur, un second problème est apparu en
test à 3 joueurs : un joueur semblait invincible, traversait les ennemis, et
sa défaite n'était annoncée que quand un autre joueur gagnait la course.

Cause : le mouvement du joueur **local** dans `DuelScene.tryMove()` est
entièrement prédictif — le sprite tween instantanément côté client, sans
attendre de confirmation serveur. Quand le serveur marque ce joueur
`alive: false` (collision détectée), il se contente d'ignorer silencieusement
tous ses futurs `player_input` (`if (!player.alive) return;`) — mais rien
côté client ne l'informe de cette mort : `DuelGamePage.tsx` ne suivait que
`me.finished` (arrivée à l'EXIT), jamais `me.alive`. Résultat : le joueur
mort continue de se déplacer visuellement à l'infini sur son propre écran
(ses touches ne produisent plus aucun effet serveur, mais l'animation locale
ne le sait pas), sans le moindre indice qu'il a perdu — jusqu'au classement
final.

**Fix :**
- `DuelGamePage.tsx` : `game_state` → si `me.alive === false`, `setMyAlive(false)`
  et `game.events.emit('i_died')` vers Phaser. Overlay "Éliminé ! En attente
  des autres joueurs…" tant que `result` n'est pas arrivé.
- `DuelScene.ts` : écoute `game.events.on('i_died', this.handleIDied)` →
  `this.finished = true`, réutilisant le même gate que l'arrivée en EXIT
  dans `update()` pour geler tout input local.

## Pourquoi ce changement est nécessaire pour le sujet 42

Le sujet exige "Fair gameplay mechanics for all participants" et "Proper
synchronization across all clients". Or la simulation ennemie
**purement client-side actuelle est un vrai problème de fairness**, même
en 2 joueurs : rien ne garantit que les deux clients voient les ennemis
exactement à la même position au même instant (dérive d'horloge, léger
retard de `requestAnimationFrame`, etc.) — un joueur peut se faire toucher
sur son écran quand l'ennemi semble ailleurs chez l'adversaire. En
passant à 3-4 joueurs, le risque de divergence visuelle augmente avec le
nombre de clients qui simulent indépendamment la même logique.

La correction : le **serveur** simule les ennemis (source de vérité
unique), et diffuse leur position à tous les clients via `game_state`,
exactement comme c'est déjà fait pour la position des joueurs.

---

## Stack concernée

`backend/src/socket/duelHandler.ts` · nouveau module partagé
`shared/src/game/enemyLogic.ts` · `shared/src/types/game.types.ts` ·
`frontend/src/game/scenes/DuelScene.ts`

---

## Étape 1 — extraire la logique de déplacement dans `shared/`

La logique de rebond déterministe (`HorizontalEnemy`/`VerticalEnemy` dans
`frontend/src/game/entities/Enemy.ts`) doit être dupliquée **à
l'identique** côté serveur pour produire les mêmes trajectoires. Plutôt
que de la réécrire en TS backend (risque de divergence si un jour on
corrige un bug dans un seul des deux), **extraire l'algorithme dans
`shared/`** pour que backend et frontend appellent la même fonction :

```ts
// shared/src/game/enemyLogic.ts (nouveau fichier)
import { TILE, GRID_SIZE, type Grid, type Direction } from '../types';

export interface EnemyRuntimeState {
  id: string;           // ex: `enemy_${row}_${col}` — stable, dérivé du spawn
  kind: 'horizontal' | 'vertical';
  x: number;
  y: number;
  dx: 1 | -1;            // pertinent seulement si kind === 'horizontal'
  dy: 1 | -1;            // pertinent seulement si kind === 'vertical'
  lastDirection: Direction;
}

export function canStepOn(grid: Grid, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) return false;
  return grid[y][x] !== TILE.WALL;
}

// Fonction pure : (état actuel, grille) → nouvel état. Utilisée par le
// serveur (tick autoritaire) ET potentiellement par le client en mode
// solo (GameScene) pour ne garder qu'une seule implémentation.
export function stepEnemy(state: EnemyRuntimeState, grid: Grid): EnemyRuntimeState {
  // reprend exactement la logique de computeNextPosition() de
  // HorizontalEnemy / VerticalEnemy dans entities/Enemy.ts
}
```

`GameScene.ts` (mode solo, hors périmètre duel) peut continuer à utiliser
sa propre classe `Enemy` sans risque — le mode solo n'a pas de problème de
synchronisation puisqu'il n'y a qu'un seul client. Seul `DuelScene.ts`
doit basculer vers une consommation "passive" des positions serveur (voir
Étape 3). Ne migrer `GameScene` vers `shared/enemyLogic.ts` que si on veut
éliminer la duplication par principe — pas requis pour satisfaire le
sujet.

---

## Étape 2 — tick serveur dans `duelHandler.ts`

```ts
interface ActiveRace {
  // ... champs existants ...
  enemies: EnemyRuntimeState[];
  enemy_tick_timer?: ReturnType<typeof setInterval>;
}
```

À la création de la course (dans `tryStartRace`, une fois la grille
chargée) :

```ts
race.enemies = extractEnemiesFromGrid(race.grid); // parcourt la grille,
                                                    // une entrée par case
                                                    // ENEMY_H / ENEMY_V
```

Au démarrage effectif (`race.started = true`, dans `join_race`) :

```ts
race.enemy_tick_timer = setInterval(() => {
  race.enemies = race.enemies.map(e => stepEnemy(e, race.grid));

  // Collision : un joueur vivant, non fini, sur la même case qu'un ennemi
  for (const p of race.players.values()) {
    if (!p.alive || p.finished) continue;
    const hit = race.enemies.some(e => e.x === p.position.x && e.y === p.position.y);
    if (hit) {
      p.alive = false; // mort
      p.death_time = Date.now();
    }
  }

  io.to(`race:${race.race_id}`).emit('game_state', buildGameState(race));

  if (isRaceOver(race)) {
    io.to(`race:${race.race_id}`).emit('race_finished', /* ranking, cf. lobby-and-race-lifecycle.md */);
    cleanupRace(race.race_id);
  }
}, 400); // même cadence que le client actuellement (delay: 400 dans moveEnemies)
```

`cleanupRace()` doit désormais aussi `clearInterval(race.enemy_tick_timer)`
en plus du nettoyage existant (`socketRace`, `disconnect_timer`) —
sinon le tick continue de tourner en mémoire sur une course déjà terminée.

**Le client n'envoie plus jamais `player_died` pour une mort par ennemi**
— c'est le serveur qui détecte la collision et fait autorité. L'event
`player_died` peut être supprimé du protocole *ou* conservé uniquement
pour d'autres cas futurs (abandon volontaire) — à trancher à
l'implémentation ; il n'est en tout cas plus déclenché par
`DuelScene.moveEnemies` côté client puisque ce code disparaît (cf. Étape 3).

---

## Étape 3 — `GameState` transporte les ennemis, `DuelScene` devient passive

### `shared/src/types/game.types.ts`

```ts
export interface EnemyState {
  id: string;
  position: Position;
  direction: Direction;
  kind: 'horizontal' | 'vertical';
}

export interface GameState {
  race_id: string;
  map_id: string;
  players: PlayerState[];
  enemies: EnemyState[];   // ← ajouté
  tick: number;
  started: boolean;
  finished: boolean;
}
```

### `DuelScene.ts`

- `spawnEnemies()` ne crée plus le timer local (`this.time.addEvent(...)`)
  ni n'utilise `HorizontalEnemy`/`VerticalEnemy` pour calculer les
  déplacements — il crée seulement les sprites visuels à leur position
  initiale (identique à aujourd'hui pour le rendu).
- Une nouvelle fonction `handleRemoteEnemies(enemies: EnemyState[])`,
  appelée depuis le handler `game_state` de `DuelGamePage.tsx` (comme
  `handleRemoteState` l'est déjà pour les joueurs distants), tween chaque
  sprite ennemi vers la position reçue du serveur — même pattern que le
  fantôme adverse (`remotePlayer` + tween 140ms), généralisé à une liste.
- Détection de collision joueur/ennemi retirée du client (`hitEnemy` dans
  `tryMove`) : c'est le serveur qui décide qui meurt, le client ne fait
  qu'afficher `alive: false` reçu dans `PlayerState`.

---

## Invariants

- Une seule source de vérité pour la position des ennemis : le tick
  serveur. Aucun client ne recalcule de trajectoire.
- La cadence du tick serveur (400ms) doit rester identique à
  l'ancienne cadence client pour ne pas changer la difficulté perçue des
  maps existantes (vitesse de patrouille inchangée).
- `stepEnemy()` doit produire un comportement **bit-à-bit identique** à
  l'ancien `HorizontalEnemy.computeNextPosition()` / `VerticalEnemy.computeNextPosition()`
  — sinon les maps déjà publiées changent de difficulté sans que personne
  ne l'ait décidé.

## Cas limite

| Situation | Comportement |
|-----------|--------------|
| Map sans aucun ennemi (`ENEMY_H`/`ENEMY_V` absents de la grille) | `race.enemies = []`, le tick tourne pour rien mais reste inoffensif — ou : ne pas démarrer `enemy_tick_timer` si `race.enemies.length === 0` (optimisation, pas obligatoire) |
| Un joueur rejoint après le démarrage (reconnexion) | Reçoit l'état ennemi courant au prochain `game_state` broadcasté (400ms max de latence), pas de désynchronisation durable |
| Grille très grande avec beaucoup d'ennemis | `game_state` grossit linéairement avec le nombre d'ennemis — acceptable aux tailles actuelles (grille 25×25), à surveiller si les maps grossissent beaucoup |
