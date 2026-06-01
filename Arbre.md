.
├── .claude/
│   ├── settings.json
│   └── settings.local.json
├── .env / .env.example
├── CLAUDE.md / CONTEXT.md / README.md
├── Makefile / docker-compose.yml
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts / seed-tower.ts
│   │   └── migrations/
│   └── src/
│       ├── __tests__/
│       ├── lib/prisma.ts
│       ├── middleware/
│       │   ├── admin.middleware.ts
│       │   ├── auth.middleware.ts
│       │   └── validate.middleware.ts
│       ├── routes/
│       │   ├── admin.routes.ts
│       │   ├── auth.routes.ts
│       │   ├── maps.routes.ts
│       │   ├── scores.routes.ts
│       │   └── tower.routes.ts
│       ├── schemas/
│       │   ├── auth.schemas.ts
│       │   └── map.schemas.ts
│       ├── utils/
│       │   ├── grid.utils.ts
│       │   └── response.utils.ts
│       └── server.ts
│
├── frontend/
│   ├── public/assets/
│   │   ├── sprites/   (PNGs joueur, ennemis)
│   │   └── tiles/     (exit, floor, wall)
│   └── src/
│       ├── App.tsx / main.tsx
│       ├── __tests__/
│       ├── components/
│       │   ├── editor/
│       │   │   ├── EditorGrid.tsx
│       │   │   └── TileSelector.tsx
│       │   ├── game/GameOverModal.tsx
│       │   ├── layout/ (Layout, Navbar)
│       │   ├── tower/CongratulatoryModal.tsx
│       │   └── ui/ (Button, Input, Modal, Spinner, Toast)
│       ├── context/auth.context.tsx
│       ├── game/                        ← Martin
│       │   ├── GameCanvas.tsx
│       │   ├── assets.ts
│       │   ├── entities/Enemy.ts
│       │   └── scenes/
│       │       ├── BaseScene.ts
│       │       └── GameScene.ts
│       ├── hooks/ (useApi, useMap)
│       ├── pages/
│       │   ├── auth/ (Login, Register)
│       │   ├── editor/EditorPage.tsx    ← Martin
│       │   └── game/                   ← Martin
│       │       ├── GamePage.tsx
│       │       ├── RacePage.tsx
│       │       └── TowerGamePage.tsx
│       └── services/api.service.ts
│
├── shared/src/types/
│   ├── api.types.ts / auth.types.ts / game.types.ts
│   ├── map.types.ts / socket.types.ts
│   ├── tiles.types.ts / user.types.ts
│   └── index.ts
│
├── backend_doc/      (docs backend)
├── frontend_doc/     (docs frontend)
├── history_debug/    (journaux de debug)
├── PedagoGamePlay/   (docs pédago)
└── probleme_rencontre/

