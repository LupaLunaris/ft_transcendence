# Arbre des dépendances — `game.types.ts`

## Types définis

```
game.types.ts
├── Direction        type union  'up' | 'down' | 'left' | 'right'
├── Position         interface   { x: number; y: number }
├── PlayerState      interface   { id, username, avatar, position, direction, alive }
├── GameState        interface   { race_id, map_id, players, tick, started, finished }
└── RaceResult       interface   { winner_id, loser_id, duration_ms, map_id, created_at }
```

---

## Dépendances sortantes (qui importe game.types.ts)

```
game.types.ts
│
├── socket.types.ts
│   ├── ClientToServerEvents
│   │   └── player_input  →  utilise  Direction
│   └── ServerToClientEvents
│       ├── game_state    →  utilise  GameState
│       ├── race_finished →  utilise  RaceResult
│       └── player_joined →  utilise  PlayerState
│
└── (RaceScene.ts — à créer étape 5)
    ├── update()          →  lira    GameState   (positions sprites)
    ├── sprites adverses  →  liront  PlayerState (username, avatar, alive)
    └── fin de course     →  lira    RaceResult  (winner_id, duration_ms)
```

---

## Dépendances entrantes (ce que game.types.ts utilise)

```
game.types.ts  n'importe rien  (types primitifs uniquement)
```

---

## Flux complet de données en multijoueur (étape 5)

```
Clavier joueur
    ↓
GameScene / RaceScene
    ↓  socket.emit('player_input', { direction: Direction })
SocketService  (frontend/src/services/socket.service.ts — à créer)
    ↓
Serveur backend  (race.handlers.ts — à créer)
    ↓  socket.emit('game_state', GameState)
useRace hook  (frontend/src/hooks/useRace.ts — à créer)
    ↓
RaceScene.update()
    ↓  repositionne les sprites via PlayerState[]
Phaser renderer
    ↓
Écran joueur
```

---

## Fichiers actifs qui N'utilisent PAS game.types.ts (normal)

| Fichier | Raison |
|---|---|
| `HomePage.tsx` | Affiche stats joueur — utilise `UserPublic` |
| `TowerPage.tsx` | Liste niveaux — utilise `TowerLevel` |
| `TrainingPage.tsx` | Liste maps — utilise `MapSummary`, `Difficulty` |
| `ProfilePage.tsx` | Stub vide |
| `CongratulatoryModal.tsx` | Modal résultat — types primitifs (`number`) |
| `useMap.ts` | Fetch grille — utilise `MapData` |
| `useApi.ts` | Générique — utilise `ApiError` |
| `BaseScene.ts` | Tilemap — utilise `Grid`, `TILE` |
| `GameScene.ts` | Solo — utilise `Grid`, `TILE` directement |
| `GameCanvas.tsx` | Conteneur Phaser — utilise `Grid` |

---

## Ce qui va changer à l'étape 5

| Fichier | Changement |
|---|---|
| `RaceScene.ts` | Nouveau — importe `GameState`, `PlayerState`, `Direction` |
| `RacePage.tsx` | Complété — importe `RaceResult` |
| `useRace.ts` | Nouveau — importe `GameState`, `RaceResult` |
| `GameSceneData` | Ajout de `difficulty: Difficulty` si ennemis mobiles |

---

# Résumé de la conversation — ordre pédagogique

## 1. Contexte du projet

Tu es Martin (malafont), Product Owner et responsable Gameplay.
Ton périmètre : tout ce qui se passe à l'écran — scènes Phaser, pages de jeu, éditeur.
Stack qui te concerne : TypeScript → Phaser 3 → React (minimal) → Socket.IO (étape 5).

---

## 2. TypeScript — bases utiles venant de C

```typescript
// C : int x = 5;
const x: number = 5;

// C : struct Position { int x; int y; };
interface Position { x: number; y: number; }

// C : char *avatar;  (peut être NULL)
avatar: string | null;
```

`string | null` — le `|` se lit "ou". Le compilateur t'oblige à vérifier avant d'utiliser
la valeur, comme vérifier un pointeur NULL en C. Sauf qu'en TypeScript l'oubli
est une erreur de compilation, pas un segfault.

---

## 3. Ordre d'apprentissage recommandé

```
Semaine 1  TypeScript  →  lire game.types.ts, socket.types.ts
Semaine 2  Phaser      →  modifier GameScene.ts, expérimenter
Semaine 3  React       →  comprendre GameCanvas.tsx, écrire RaceCanvas.tsx
Semaine 4+ Socket.IO   →  RaceScene.ts avec état serveur
```

---

## 4. Architecture — séparation des responsabilités

Les pages de navigation (`TowerPage`, `TrainingPage`, `HomePage`) n'importent pas
`game.types.ts` — c'est **normal et voulu**.

```
TowerPage.tsx       →  "quels niveaux existent ?"      utilise TowerLevel
TowerGamePage.tsx   →  "on joue le niveau"             utilise Grid
GameScene.ts        →  "boucle, collisions, position"  utilisera GameState (étape 5)
```

`game.types.ts` est entièrement orienté étape 5. Rien de ce fichier n'est encore
réellement branché dans le code actif.

---

## 5. Cas futur — ennemis mobiles avec vitesse selon difficulty

Si les ennemis bougent et que leur vitesse dépend de `Difficulty`,
la frontière change. Propagation nécessaire :

```
MapData (contient difficulty)
    ↓
GamePage / TowerGamePage  →  passent difficulty en prop
    ↓
GameCanvas  →  reçoit difficulty: Difficulty
    ↓
GameSceneData  →  ajoute difficulty: Difficulty
    ↓
GameScene.update()  →  calcule vitesse ennemis
```

Changement localisé — pas de refonte. `TowerPage` n'est toujours pas concernée.

---

## 6. useApi.ts — comprendre la fondation du fetching

```typescript
useApi<T>(fn: () => Promise<T>) → { data, loading, error, refetch }
```

Prend une fonction qui retourne une promesse. Gère automatiquement les trois états
de tout appel réseau : chargement → succès → erreur.

Le `<T>` est un générique (équivalent template C++) — un seul hook, tous les types :

```typescript
useApi<TowerLevelFull>(() => api.tower.getLevel(1))  // data: TowerLevelFull | null
useApi<MapData>(() => api.maps.getById(id))          // data: MapData | null
```

`tick` + `refetch` : compteur qui remonte de 1 à chaque appel, ce qui redéclenche
le `useEffect`. Pattern React classique pour forcer un re-fetch.

`cancelled` : protège contre la mise à jour d'un composant déjà détruit
(équivalent vérifier qu'un pointeur est toujours valide avant d'écrire).

---

## 7. game.types.ts — rôle de chaque type

| Type | Rôle | Utilisé actuellement |
|---|---|---|
| `Direction` | 4 directions de mouvement | `socket.types.ts` player_input |
| `Position` | Case sur la grille {x, y} | Imbriqué dans PlayerState |
| `PlayerState` | Snapshot complet d'un joueur | `socket.types.ts` player_joined |
| `GameState` | Photo de la partie à un tick | `socket.types.ts` game_state |
| `RaceResult` | Résultat final de course | `socket.types.ts` race_finished |

Aucun de ces types n'est encore utilisé dans du code actif —
ils attendent tous `RaceScene.ts` (étape 5).