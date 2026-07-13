# Duel — délai de grâce sur déconnexion en cours de course

## Superseded

Ce doc couvrait la version 2 joueurs (délai de **3000ms**, un seul
adversaire gagne automatiquement). Depuis la généralisation à 2-4 joueurs,
le mécanisme décrit ici (champ `connected`, `disconnect_timer`, annulation
sur `join_race`) est **toujours en place et inchangé dans son principe**,
mais avec deux différences :

- `DISCONNECT_GRACE_MS` est passé à **10000** (10s).
- Le forfait ne termine plus systématiquement la course : il ne fait que
  marquer ce joueur résolu (`alive = false`) — c'est `isRaceOver()` qui
  décide si la course entière est terminée (voir
  `backend_doc/duel-nplayer-lobby-and-race-lifecycle.md`, section
  "Reconnexion — généralisation à N joueurs").

Le contenu ci-dessous reste correct pour comprendre le mécanisme de base ;
se référer au doc N-joueurs pour le comportement actuel exact.

## Contexte

`socket.io-client` reconnecte automatiquement en cas de coupure réseau
(`reconnection: true` par défaut). Le socket de jeu (`DuelGamePage.tsx`)
ré-émet déjà `join_race({ race_id })` dans son handler `connect`, qui
tourne aussi bien à la première connexion qu'à une reconnexion — le
front-end n'a donc rien à faire de plus pour *tenter* de revenir dans la
course.

Le problème était côté backend : `duelHandler.ts` traitait tout
`disconnect` pendant une course active comme une défaite immédiate et
définitive (forfait), sans laisser aucune chance à une reconnexion rapide
(page qui recharge le socket, micro-coupure Wi-Fi, etc.) d'aboutir.

---

## Comportement avant

```
socket 'disconnect' pendant une course
  → cleanupLobby(socket.id)
  → race.finished = true            ← immédiat, aucune fenêtre
  → race_finished émis (forfait)
  → cleanupRace(race_id)
```

## Comportement après

```
socket 'disconnect'
  → cleanupLobby(socket.id)          ← toujours immédiat : désinscription
  │                                    des lobbies en attente, pas de délai
  │                                    de grâce hors course active
  └─ si le socket était dans une course active non terminée :
       player.connected = false
       setTimeout(3000ms):
         si player.connected est toujours false → forfeitRace()
         sinon (reconnecté entre-temps) → ne rien faire

socket 'join_race' (reconnexion, même race_id, même user.id)
  → player.socket_id = nouveau socket.id
  → player.connected = true
  → clearTimeout(player.disconnect_timer)   ← annule le forfait programmé
```

`DISCONNECT_GRACE_MS = 3000` dans `backend/src/socket/duelHandler.ts`.

---

## Pourquoi keyed par `user.id` et pas par `socket.id`

`race.players` est une `Map<user_id, RacePlayer>` — la position, direction,
et vie du joueur sont attachées à son identité, pas à son socket. Le champ
`RacePlayer.socket_id` est mis à jour à chaque `join_race`, ce qui permet à
un nouveau socket (après reconnexion) de reprendre exactement l'état du
joueur (position, `alive`, `finished`) sans recréer la course.

Garde anti-course : sur `disconnect`, on ne programme le forfait que si
`player.socket_id === socket.id` — évite qu'un `disconnect` tardif de
l'ancien socket n'annule à tort la reconnexion si celle-ci a déjà eu lieu
sur un nouveau socket avant que l'event `disconnect` de l'ancien ne soit
traité.

---

## `forfeitRace()` — helper partagé

Factorisé hors du handler `disconnect` pour être appelé aussi bien
immédiatement (course pas commencée, cas non couvert ici) que différé (fin
du délai de grâce) :

```ts
function forfeitRace(io, race_id, loser_user_id): void {
  const race = activeRaces.get(race_id);
  if (!race || race.finished) return;   // déjà terminée entre-temps
  // ... calcule le gagnant, émet race_finished, cleanupRace()
}
```

Le garde `race.finished` couvre le cas où la course se termine par un
autre moyen (l'adversaire atteint l'`EXIT`, ou meurt) pendant que le délai
de grâce court encore — `cleanupRace()` annule alors le timer en attente
via `clearTimeout(p.disconnect_timer)`.

---

## Invariants

- Désinscription du lobby en attente : **toujours immédiate**, aucun délai
  de grâce (un joueur qui n'a pas encore de course en cours n'a besoin
  d'aucune tolérance réseau côté matchmaking).
- Délai de grâce : **uniquement si une course a démarré** pour ce joueur.
- Le délai ne met pas la course en pause pour l'adversaire : ses propres
  inputs continuent d'être traités normalement pendant les 3 secondes
  (aucun blocage de `player_input` pour l'autre joueur).

## Cas limite

| Situation | Comportement |
|-----------|-------------|
| Reconnexion à 2999ms | `join_race` arrive avant le `setTimeout`, timer annulé, course continue normalement |
| Reconnexion après 3000ms (forfait déjà émis) | `activeRaces.get(race_id)` renvoie `undefined` → `join_race` répond `error_event` "Course introuvable" |
| Les deux joueurs se déconnectent en même temps | Deux timers indépendants programmés ; le premier à expirer forfait l'autre — `race.finished` empêche le second timer de rejouer un forfait |
| Déconnexion avant que la course démarre (`race.started === false`) | Pas de gestion spécifique ici : aucun des deux joueurs n'a encore `socketRace` défini côté `join_race` tant qu'ils n'ont pas rejoint `race:${race_id}` — cas non couvert par ce fix, à surveiller si le flux lobby→race évolue |
