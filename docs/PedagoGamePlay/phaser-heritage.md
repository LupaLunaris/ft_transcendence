# Héritage Phaser — Comment ça marche dans notre projet

## 1. L'idée de base : hériter d'une classe

En C, si tu veux réutiliser du code tu copies des fonctions ou tu passes des pointeurs.
En C++ (et TypeScript), tu **hérites** d'une classe : tu récupères tout son contenu,
et tu peux en ajouter ou en modifier certaines parties.

```typescript
// Phaser te donne cette classe :
class Phaser.Scene { ... }  // contient la caméra, le système d'objets, le clavier, etc.

// Tu en hérites avec "extends" :
class BaseScene extends Phaser.Scene { ... }  // tu récupères tout + tu ajoutes buildTilemap()

// Et tu hérites encore :
class GameScene extends BaseScene { ... }     // tu récupères tout + tu ajoutes le gameplay
```

Le mot-clé `extends` = "je veux tout ce que cette classe contient, plus ce que j'ajoute".

---

## 2. Schéma de l'héritage complet

```
Phaser.Scene   (bibliothèque Phaser — code que tu n'écris pas)
│
│  Propriétés disponibles via "this" :
│  ├── this.add          → factory d'objets (rectangle, graphics, sprite…)
│  ├── this.cameras      → gestion de la caméra
│  ├── this.input        → clavier, souris, touch
│  ├── this.time         → temps écoulé, timers
│  ├── this.physics      → moteur physique (arcade, matter)
│  └── this.game         → accès à l'instance Phaser.Game globale
│
│  Méthodes que Phaser appelle automatiquement :
│  ├── preload()         → charge les assets (images, sons)
│  ├── create()          → construit la scène au démarrage
│  └── update(time, delta) → boucle ~60x/sec
│
│
└── BaseScene   (ton code — BaseScene.ts)
    │
    │  Ajoute :
    │  └── buildTilemap(grid)  → dessine la grille 25×25 avec this.add.graphics()
    │                             méthode "protected" = accessible aux enfants seulement
    │
    │  Hérite de Phaser.Scene :
    │  └── tout ce qui est listé au-dessus
    │
    │
    └── GameScene   (ton code — GameScene.ts)

        Ajoute :
        ├── grid, gridX, gridY     → position joueur sur la grille
        ├── player                 → rectangle orange (this.add.rectangle)
        ├── cursors, wasd          → touches clavier (this.input.keyboard)
        ├── startTime, holdTimer   → gestion du temps
        └── tryMove(dx, dy)        → logique de déplacement + détection EXIT

        Override (remplace les méthodes vides de Phaser) :
        ├── preload()              → vide pour l'instant
        ├── create(data)           → construit la scène avec la grille reçue
        └── update(time, delta)    → lit les touches, appelle tryMove()

        Hérite de BaseScene :
        └── buildTilemap()         → appelé dans create() sans re-écrire le code

        Hérite de Phaser.Scene (via BaseScene) :
        └── tout this.add, this.cameras, this.input, this.time, this.game…
```

---

## 3. Ce que `this` contient dans GameScene

Quand tu écris `this.quelquechose` dans `GameScene`, tu peux accéder à TOUT
ce qui vient des trois niveaux :

```
this.add.rectangle(...)         ← vient de Phaser.Scene
this.cameras.main.startFollow() ← vient de Phaser.Scene
this.input.keyboard.addKey()    ← vient de Phaser.Scene
this.time.now                   ← vient de Phaser.Scene
this.game.events.emit(...)      ← vient de Phaser.Scene

this.buildTilemap(grid)         ← vient de BaseScene

this.grid                       ← défini dans GameScene
this.player                     ← défini dans GameScene
this.tryMove(dx, dy)            ← défini dans GameScene
```

Tu ne vois qu'un seul objet (`this`), mais il contient les trois niveaux empilés.

---

## 4. Le mot-clé `protected` — pourquoi `buildTilemap` n'est pas `private`

```typescript
// BaseScene.ts
export abstract class BaseScene extends Phaser.Scene {
  protected buildTilemap(grid: Grid): void { ... }
//^^^^^^^^^^
```

| Mot-clé     | Qui peut appeler la méthode ?                        |
|-------------|------------------------------------------------------|
| `private`   | Seulement la classe qui la définit (BaseScene seule) |
| `protected` | La classe + ses enfants (BaseScene ET GameScene)     |
| `public`    | N'importe qui                                        |

Sans `protected`, `GameScene` ne pourrait pas appeler `this.buildTilemap()`.
Le compilateur TypeScript bloquerait avec une erreur.

---

## 5. Le mot-clé `abstract` — pourquoi BaseScene ne s'instancie pas seule

```typescript
export abstract class BaseScene extends Phaser.Scene { ... }
//              ^^^^^^^^
```

`abstract` signifie : "cette classe existe uniquement pour être héritée — jamais utilisée directement".

```typescript
// INTERDIT par TypeScript :
const scene = new BaseScene();  // Erreur : cannot create instance of abstract class

// AUTORISÉ :
const scene = new GameScene();  // OK — GameScene hérite de BaseScene
```

C'est utile quand tu veux partager du code (`buildTilemap`) entre plusieurs scènes
(`GameScene`, `RaceScene` à venir) sans jamais lancer `BaseScene` elle-même.

---

## 6. Flux d'exécution — dans quel ordre Phaser appelle quoi

```
new Phaser.Game(config)
    │
    ↓  Phaser initialise le canvas
    ↓
game.events.once('ready', () => {
    game.scene.add('GameScene', GameScene, true, { grid, player_id })
})                                                 ↑
                                            données passées à create()
    │
    ↓  Phaser instancie GameScene
    ↓
GameScene.preload()     ← Phaser appelle — charge les assets
    │
    ↓  assets chargés
    ↓
GameScene.create(data)  ← Phaser appelle — tu construis la scène
    │  buildTilemap(data.grid)   ← appel à BaseScene
    │  trouve SPAWN → gridX, gridY
    │  crée this.player (rectangle)
    │  setup caméra
    │  setup clavier
    │
    ↓  scène prête
    ↓
GameScene.update(time, delta)  ← Phaser appelle en boucle (~60x/sec)
    │  lit les touches
    │  gère holdTimer pour accélération
    │  tryMove() si délai écoulé
    │      └── si EXIT → this.game.events.emit('player_reached_exit', elapsed)
    │                              ↓
    │                    GameCanvas.tsx reçoit l'événement
    │                    React prend la main (score, modal)
    │
    ↓  repeat jusqu'à destroy()
```

---

## 7. Ce qui arrive à l'étape 5 — RaceScene

Tu vas créer `RaceScene extends BaseScene`, exactement comme `GameScene`.
Elle réutilise `buildTilemap()` mais son `update()` fonctionnera différemment :

```
GameScene.update()         RaceScene.update()
    ↓                           ↓
lit le clavier local       reçoit GameState du serveur via Socket.IO
    ↓                           ↓
tryMove()                  repositionne les sprites des deux joueurs
    ↓                           ↓
émet player_reached_exit   émet race_finished
```

Même structure, logique différente — c'est exactement pour ça que l'héritage existe.
