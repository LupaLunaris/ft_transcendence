# Duel — généralisation à 2-4 joueurs (lobby, déclenchement, classement, fin de course)

## Statut

**Implémenté** (`backend/src/socket/duelHandler.ts`, `shared/src/types/{game,socket}.types.ts`).
Ce document décrit l'architecture telle que codée — conservé comme référence
technique plutôt que comme spec, cf. `backend_doc/duel-reconnection-grace-period.md`
qui est superseded par la section reconnexion ci-dessous (délai passé à 10s
et généralisé à N joueurs).

## Décisions actées

1. `/duel` est **généralisé** — pas de mode séparé. Une même course peut
   réunir de 2 à 4 joueurs.
2. La course démarre **30 secondes** après l'inscription du premier joueur
   sur une map, quel que soit le nombre de joueurs présents à ce moment
   (2, 3 ou 4) — sauf s'il n'y a qu'1 seul joueur (voir cas limite).
   Si 4 joueurs sont réunis avant l'expiration des 30s, la course démarre
   immédiatement (pas d'attente inutile). *(Passé de 10s à 30s le 2026-07-07,
   suite au premier test en conditions réelles.)*
3. Le résultat n'est plus win/lose binaire mais un **classement**
   (1er, 2e, 3e, 4e).
4. La course se termine **quand tous les joueurs ont terminé** (atteint
   l'`EXIT`, mort par ennemi, ou forfait) — pas dès que le premier finit.
5. Délai de grâce de reconnexion : **10 secondes** (remplace les 3s du
   fix 2-joueurs de la session précédente, cf.
   `backend_doc/duel-reconnection-grace-period.md` — ce doc est mis à jour
   en conséquence lors de l'implémentation).

---

## Stack concernée

`backend/src/socket/duelHandler.ts` · `shared/src/types/socket.types.ts` ·
`shared/src/types/game.types.ts`

---

## Changements de types partagés

### `shared/src/types/game.types.ts`

```ts
// AVANT
export interface RaceResult {
  winner_id: string;
  loser_id: string;
  duration_ms: number;
  map_id: string;
  created_at: string;
}

// APRÈS
export interface RaceRankingEntry {
  user_id: string;
  username: string;
  rank: number;               // 1 = premier ; classement complet, pas de tie
  duration_ms: number | null; // null si n'a pas atteint l'EXIT (mort/forfait)
  finished: boolean;          // true = a atteint l'EXIT
}

export interface RaceResult {
  race_id: string;
  map_id: string;
  ranking: RaceRankingEntry[]; // trié par rank croissant, longueur = nb joueurs
  created_at: string;
}
```

`PlayerState` et `GameState` n'ont pas besoin de changer de forme —
`players: PlayerState[]` est déjà un tableau, donc déjà compatible N
joueurs. (`GameState.enemies` est ajouté séparément, cf.
`backend_doc/duel-server-authoritative-enemies.md`.)

### `shared/src/types/socket.types.ts`

```ts
// AVANT
export interface DuelStartPayload {
  race_id: string;
  map_id: string;
  grid: Grid;
  opponent: { id: string; username: string; avatar: string | null };
}

// APRÈS — un joueur peut avoir 1 à 3 adversaires
export interface DuelStartPayload {
  race_id: string;
  map_id: string;
  grid: Grid;
  opponents: { id: string; username: string; avatar: string | null }[];
}
```

`LobbyEntry` doit refléter une file d'attente, pas un joueur unique :

```ts
// AVANT
export interface LobbyEntry {
  map_id: string;
  player: { id: string; username: string; avatar: string | null };
}

// APRÈS
export interface LobbyEntry {
  map_id: string;
  players: { id: string; username: string; avatar: string | null }[]; // 1 à 4
  countdown_ends_at: number | null; // timestamp ms, null si pas encore lancé
}
```

Impact direct : `DuelPage.tsx` / `useDuelLobby.ts` (affichage "X/4 inscrits,
départ dans Ys") et `DuelGamePage.tsx` (`state.opponents` au lieu de
`state.opponent`) devront être mis à jour — hors périmètre backend de ce
doc, mais à ne pas oublier.

---

## Lobby — file d'attente au lieu d'un seul emplacement

```ts
interface LobbyQueue {
  players: SocketUser[];               // 1 à 4, ordre d'arrivée
  countdown_timer?: ReturnType<typeof setTimeout>;
  countdown_ends_at?: number;
}

const lobbies = new Map<string, LobbyQueue>(); // map_id → file d'attente
```

### `join_lobby({ map_id })`

```
si pas de queue pour map_id :
  créer queue = { players: [user] }
  démarrer countdown_timer (30000ms) → tryStartRace(map_id)
  countdown_ends_at = Date.now() + 30000

sinon si queue existe et user pas déjà dedans :
  si queue.players.length >= 4 : error_event "Lobby complet"
  sinon :
    queue.players.push(user)
    si queue.players.length === 4 :
      clearTimeout(countdown_timer)
      tryStartRace(map_id)   // démarrage immédiat, pas d'attente du countdown

sinon : error_event "Déjà inscrit" (comme aujourd'hui)

toujours : io.emit('lobby_state', { entries: getLobbyEntries() })
```

### `tryStartRace(map_id)` — appelée par le timer OU par le lobby plein

```
queue = lobbies.get(map_id)
si !queue : return

si queue.players.length < 2 :
  // cas limite : personne d'autre ne s'est inscrit en 30s
  // on relance un countdown de 30s plutôt que d'annuler l'inscription du solo
  queue.countdown_timer = setTimeout(() => tryStartRace(map_id), 30000)
  return

lobbies.delete(map_id)
// création de l'ActiveRace avec queue.players (2 à 4 entrées) — même
// logique que le code 2-joueurs actuel, généralisée à N entrées de Map
```

**Pourquoi relancer le countdown plutôt que d'annuler l'inscription** :
le joueur solo a explicitement choisi cette map ; le faire ressortir du
lobby après 30s d'attente sans qu'il n'ait rien demandé serait une
régression UX. Alternative rejetée : annuler et notifier le joueur — plus
de complexité pour un gain marginal.

---

## `join_race` — généralisation du démarrage

```ts
socket.on('join_race', ({ race_id }) => {
  // ... resolution race + player.socket_id = socket.id (inchangé) ...

  const room = io.sockets.adapter.rooms.get(`race:${race_id}`);
  if (room && room.size === race.players.size && !race.started) {
    race.started = true;
    const now = Date.now();
    for (const p of race.players.values()) p.start_time = now;
    io.to(`race:${race_id}`).emit('game_state', buildGameState(race));
  }
});
```

Seul changement : `room.size === 2` devient `room.size === race.players.size`
(2, 3 ou 4 selon combien de joueurs ont rejoint le lobby).

---

## Fin de course — attendre que tous les joueurs soient résolus

Un joueur est **résolu** quand `finished === true` (a atteint l'EXIT) OU
`alive === false` (mort par ennemi ou forfait de reconnexion).

```ts
function isRaceOver(race: ActiveRace): boolean {
  return Array.from(race.players.values())
    .every(p => p.finished || !p.alive);
}
```

Appelé après **chaque** mise à jour d'état joueur (`player_input` atteint
l'EXIT, `player_died`, expiration du délai de grâce de reconnexion). Si
`isRaceOver(race)` devient vrai, on calcule le classement et on termine :

```ts
function buildRanking(race: ActiveRace): RaceRankingEntry[] {
  const players = Array.from(race.players.values());

  const finishers = players
    .filter(p => p.finished)
    .sort((a, b) => (a.finish_time! - a.start_time) - (b.finish_time! - b.start_time));

  const others = players.filter(p => !p.finished)
    // classés après les finishers ; entre eux, par ordre de survie décroissante
    .sort((a, b) => (b.death_time ?? Date.now()) - (a.death_time ?? Date.now()));

  return [...finishers, ...others].map((p, i) => ({
    user_id:     p.user.id,
    username:    p.user.username,
    rank:        i + 1,
    duration_ms: p.finished ? (p.finish_time! - p.start_time) : null,
    finished:    p.finished,
  }));
}
```

Ceci nécessite d'ajouter `finish_time?: number` et `death_time?: number` à
`RacePlayer` (horodatage au moment où `finished`/`!alive` passe à jour),
pour ordonner correctement les non-finishers entre eux (celui qui a
survécu le plus longtemps est mieux classé qu'un forfait précoce).

`game_state` continue d'être broadcasté à chaque changement (comme
aujourd'hui) — les clients dont le joueur a déjà fini voient les autres
continuer et affichent un état "en attente des autres" (à gérer côté
front, hors périmètre de ce doc backend).

`race_finished` n'est émis **qu'une fois**, quand `isRaceOver()` devient
vrai pour la première fois, avec le `ranking` complet.

---

## Reconnexion — généralisation à N joueurs, délai porté à 10s

Reprend le mécanisme de `backend_doc/duel-reconnection-grace-period.md`
(délai de grâce, `connected: boolean`, timer annulé sur `join_race`), avec
deux changements :

1. `DISCONNECT_GRACE_MS` passe de `3000` à `10000`.
2. À l'expiration du délai, le joueur déconnecté est marqué `alive = false`
   (forfait) mais **la course ne s'arrête pas pour les autres** — c'est
   `isRaceOver()` qui décide si la course est terminée (elle ne l'est que
   si tous les autres sont aussi `finished || !alive`). C'est la différence
   clé avec le comportement 2-joueurs actuel, où un forfait terminait
   systématiquement la course puisqu'il ne restait qu'un seul adversaire.

```ts
// dans le timer de grâce, remplace l'appel à forfeitRace() du fix 2-joueurs
const player = race.players.get(user_id);
if (player && !player.connected) {
  player.alive = false;
  player.death_time = Date.now();
  io.to(`race:${race_id}`).emit('game_state', buildGameState(race));
  if (isRaceOver(race)) {
    io.to(`race:${race_id}`).emit('race_finished', { race_id, map_id: race.map_id, ranking: buildRanking(race), created_at: new Date().toISOString() });
    cleanupRace(race_id);
  }
}
```

---

## Invariants

- Une `ActiveRace` a toujours entre 2 et 4 entrées dans `players` — jamais
  1 (le countdown ne déclenche jamais une course solo, cf. cas limite
  ci-dessus) ni plus de 4 (bloqué à l'inscription).
- `race.started` ne passe à `true` qu'une fois, quand tous les joueurs du
  groupe ont rejoint `race:${race_id}` via `join_race` — identique au
  comportement actuel, juste généralisé à `race.players.size`.
- Le classement (`ranking`) a toujours une longueur égale au nombre de
  joueurs de la course, aucune entrée manquante.

## Cas limite

| Situation | Comportement |
|-----------|--------------|
| 1 seul joueur après 30s | Countdown relancé pour 30s de plus, pas de course solo |
| 4 joueurs réunis avant les 30s | Démarrage immédiat, countdown annulé |
| Un joueur quitte le lobby (`leave_lobby`) pendant le countdown, ne laissant qu'1 joueur | Le countdown continue de tourner ; à expiration, retombe dans le cas "1 seul joueur" ci-dessus |
| Deux joueurs terminent en même temps (`finish_time` égaux) | Tri stable par ordre d'insertion dans `players` (Map) — égalité non gérée explicitement, à trancher si ça devient un vrai souci en pratique |
| Tous les joueurs sauf un se déconnectent | La course continue pour le dernier survivant tant qu'il n'a pas fini/n'est pas mort — pas de victoire automatique anticipée, il doit atteindre l'EXIT normalement |
