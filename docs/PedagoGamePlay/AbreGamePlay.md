guild_of_the_deep/
│
├── shared/src/types/
│   ├── game.types.ts        ← types GameState, Player, Position, etc.
│   ├── socket.types.ts      ← events Socket.IO client↔server
│   ├── map.types.ts         ← TileValue, grille 25×25
│   └── tiles.types.ts       ← EMPTY / WALL / EXIT / SPAWN / ENEMY
│
├── backend/src/
│   ├── server.ts            ← point d'entrée Express + Socket.IO
│   ├── routes/
│   │   ├── maps.routes.ts   ← GET/POST grilles de jeu
│   │   ├── scores.routes.ts ← sauvegarde/lecture scores
│   │   └── tower.routes.ts  ← étapes mode tour
│   └── utils/
│       └── grid.utils.ts    ← validation grille (spawn, exit, murs)
│
├── frontend/src/
│   ├── game/                        ← tout Phaser (domaine Martin)
│   │   ├── GameCanvas.tsx           ← monte/démonte l'instance Phaser
│   │   ├── scenes/
│   │   │   ├── BaseScene.ts         ← setup caméra, tilemap, assets communs
│   │   │   └── GameScene.ts         ← boucle de jeu, inputs, collisions
│   │
│   ├── pages/game/
│   │   ├── GamePage.tsx             ← page solo / entraînement
│   │   ├── TowerGamePage.tsx        ← page mode tour (niveau par niveau)
│   │   └── RacePage.tsx             ← page race multijoueur (à faire)
│   │
│   ├── hooks/
│   │   └── useMap.ts                ← fetch + cache de la grille active
│   │
│   └── components/tower/
│       └── CongratulatoryModal.tsx  ← modal de fin de niveau
│
└── backend/prisma/
    ├── schema.prisma        ← modèles Map, Score, TowerStep
    └── seed-tower.ts        ← grilles initiales du mode tour

