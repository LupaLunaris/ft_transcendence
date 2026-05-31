# ft_transcendence — Exact File Ownership

## Ownership Rules

- **Main Owner** = responsible for implementation, maintenance, reviews, and evaluation explanation.
- **Support** = secondary contributor/reviewer.
- **Ownership does NOT prevent others from contributing.**
- **Every member remains a developer.**

---

## Root Files

| File | Main Owner | Support |
| --- | --- | --- |
| README.md | Jennifer | Everyone |
| README_install_and_start.md | Jerem | Jennifer |
| Makefile | Jerem | Jennifer |
| docker-compose.yml | Jerem | Jennifer |
| .env.example | Jerem | Jennifer |
| .gitignore | Jerem | Jennifer |
| package.json | Jennifer | Jerem |
| package-lock.json | Jennifer | Jerem |
| CLAUDE.md | Jennifer | Everyone |
| CONTEXT.md | Jennifer | Everyone |
| Arbre.md | Jennifer | Everyone |
| organisation_role_push.md | Jennifer | Everyone |
| ordre_de_commit.txt | Jerem | Jennifer |
| push_in_order.sh | Jerem | Jennifer |
| structure.txt | Jennifer | Everyone |

---

## Backend

### Backend Config

| File | Main Owner | Support |
| --- | --- | --- |
| backend/package.json | Jerem | Jennifer |
| backend/tsconfig.json | Jerem | Jennifer |
| backend/Dockerfile | Jerem | Jennifer |
| backend/.gitignore | Jerem | Jennifer |

### Prisma / Database

| File | Main Owner | Support |
| --- | --- | --- |
| backend/prisma/schema.prisma | Jerem | Jennifer |
| backend/prisma/seed.ts | Jerem | Martin |
| backend/prisma/seed-tower.ts | Martin | Jerem |
| backend/prisma/tsconfig.json | Jerem | Jennifer |
| backend/prisma/migrations/** | Jerem | Jennifer |

### Backend Core

| File | Main Owner | Support |
| --- | --- | --- |
| backend/src/server.ts | Jerem | Jennifer |
| backend/src/lib/prisma.ts | Jerem | Jennifer |

### Backend Routes

| File | Main Owner | Support |
| --- | --- | --- |
| backend/src/routes/index.ts | Jerem | Jennifer |
| backend/src/routes/auth.routes.ts | Jerem | Élise |
| backend/src/routes/admin.routes.ts | Jerem | Jennifer |
| backend/src/routes/maps.routes.ts | Jerem | Martin |
| backend/src/routes/scores.routes.ts | Martin | Jerem |
| backend/src/routes/tower.routes.ts | Martin | Jerem |

### Backend Middleware

| File | Main Owner | Support |
| --- | --- | --- |
| backend/src/middleware/auth.middleware.ts | Jerem | Jennifer |
| backend/src/middleware/admin.middleware.ts | Jerem | Jennifer |
| backend/src/middleware/validate.middleware.ts | Jerem | Élise |

### Backend Schemas

| File | Main Owner | Support |
| --- | --- | --- |
| backend/src/schemas/auth.schemas.ts | Jerem | Élise |
| backend/src/schemas/map.schemas.ts | Martin | Jerem |

### Backend Utils

| File | Main Owner | Support |
| --- | --- | --- |
| backend/src/utils/grid.utils.ts | Martin | Jerem |
| backend/src/utils/response.utils.ts | Jerem | Jennifer |

### Backend Tests

| File | Main Owner | Support |
| --- | --- | --- |
| backend/src/tests/admin.middleware.test.ts | Jerem | Jennifer |
| backend/src/tests/admin.routes.test.ts | Jerem | Jennifer |
| backend/src/tests/auth.middleware.test.ts | Jerem | Jennifer |
| backend/src/tests/auth.routes.test.ts | Jerem | Élise |
| backend/src/tests/maps.routes.test.ts | Jerem | Martin |
| backend/src/tests/tower.complete.test.ts | Martin | Jerem |
| backend/src/tests/grid.utils.test.ts | Martin | Jerem |
| backend/src/tests/helpers/grid.helper.ts | Martin | Jerem |

---

## Frontend

### Frontend Config

| File | Main Owner | Support |
| --- | --- | --- |
| frontend/package.json | Jennifer | Jerem |
| frontend/tsconfig.json | Jennifer | Jerem |
| frontend/vite.config.ts | Jennifer | Jerem |
| frontend/postcss.config.cjs | Élise | Jennifer |
| frontend/Dockerfile | Jerem | Jennifer |
| frontend/index.html | Élise | Jennifer |
| frontend/tailwind.config.ts | Élise | Jennifer |

### Frontend Core

| File | Main Owner | Support |
| --- | --- | --- |
| frontend/src/App.tsx | Jennifer | Élise |
| frontend/src/main.tsx | Jennifer | Élise |
| frontend/src/index.css | Élise | Jennifer |

### Context / Hooks / Services

| File | Main Owner | Support |
| --- | --- | --- |
| frontend/src/context/auth.context.tsx | Jennifer | Élise |
| frontend/src/hooks/useApi.ts | Jennifer | Élise |
| frontend/src/hooks/useMap.ts | Jennifer | Martin |
| frontend/src/services/api.service.ts | Jennifer | Jerem |

---

## UI Components

### UI System

| File | Main Owner | Support |
| --- | --- | --- |
| frontend/src/components/ui/Button.tsx | Élise | Jennifer |
| frontend/src/components/ui/Input.tsx | Élise | Jennifer |
| frontend/src/components/ui/Modal.tsx | Élise | Jennifer |
| frontend/src/components/ui/Spinner.tsx | Élise | Jennifer |
| frontend/src/components/ui/Toast.tsx | Élise | Jennifer |
| frontend/src/components/ui/useToast.ts | Élise | Jennifer |

### Layout Components

| File | Main Owner | Support |
| --- | --- | --- |
| frontend/src/components/layout/Layout.tsx | Élise | Jennifer |
| frontend/src/components/layout/Navbar.tsx | Élise | Jennifer |

### Editor Components

| File | Main Owner | Support |
| --- | --- | --- |
| frontend/src/components/editor/EditorGrid.tsx | Élise | Martin |
| frontend/src/components/editor/TileSelector.tsx | Élise | Martin |

### Gameplay Components

| File | Main Owner | Support |
| --- | --- | --- |
| frontend/src/components/game/GameOverModal.tsx | Élise | Martin |
| frontend/src/components/tower/CongratulatoryModal.tsx | Élise | Martin |

---

## Gameplay / Phaser

| File | Main Owner | Support |
| --- | --- | --- |
| frontend/src/game/GameCanvas.tsx | Martin | Jennifer |
| frontend/src/game/assets.ts | Jennifer | Martin |
| frontend/src/game/entities/Enemy.ts | Martin | Jennifer |
| frontend/src/game/scenes/BaseScene.ts | Martin | Jennifer |
| frontend/src/game/scenes/GameScene.ts | Martin | Jennifer |

---

## Pages

### General Pages

| File | Main Owner | Support |
| --- | --- | --- |
| frontend/src/pages/HomePage.tsx | Élise | Jennifer |
| frontend/src/pages/ProfilePage.tsx | Élise | Jennifer |
| frontend/src/pages/NotFoundPage.tsx | Élise | Jennifer |
| frontend/src/pages/TrainingPage.tsx | Martin | Élise |
| frontend/src/pages/TowerPage.tsx | Martin | Élise |

### Auth Pages

| File | Main Owner | Support |
| --- | --- | --- |
| frontend/src/pages/auth/LoginPage.tsx | Élise | Jennifer |
| frontend/src/pages/auth/RegisterPage.tsx | Élise | Jennifer |

### Editor Pages

| File | Main Owner | Support |
| --- | --- | --- |
| frontend/src/pages/editor/EditorPage.tsx | Martin | Jennifer |

### Game Pages

| File | Main Owner | Support |
| --- | --- | --- |
| frontend/src/pages/game/GamePage.tsx | Martin | Jennifer |
| frontend/src/pages/game/RacePage.tsx | Martin | Jennifer |
| frontend/src/pages/game/TowerGamePage.tsx | Martin | Jennifer |

---

## Frontend Tests

| File | Main Owner | Support |
| --- | --- | --- |
| frontend/src/tests/Button.test.tsx | Élise | Jennifer |
| frontend/src/tests/Input.test.tsx | Élise | Jennifer |
| frontend/src/tests/Modal.test.tsx | Élise | Jennifer |
| frontend/src/tests/EditorGrid.test.tsx | Élise | Martin |
| frontend/src/tests/EditorPage.test.tsx | Martin | Jennifer |
| frontend/src/tests/GamePage.test.tsx | Martin | Jennifer |
| frontend/src/tests/LoginPage.test.tsx | Élise | Jennifer |
| frontend/src/tests/LoginPage.toast.test.tsx | Élise | Jennifer |
| frontend/src/tests/api.service.test.ts | Jennifer | Jerem |
| frontend/src/tests/useApi.test.tsx | Jennifer | Élise |
| frontend/src/tests/useToast.test.tsx | Élise | Jennifer |
| frontend/src/tests/setup.ts | Jennifer | Everyone |

---

## Shared

| File | Main Owner | Support |
| --- | --- | --- |
| shared/package.json | Jennifer | Jerem |
| shared/tsconfig.json | Jennifer | Jerem |
| shared/src/index.ts | Jennifer | Jerem |
| shared/src/types/api.types.ts | Jennifer | Jerem |
| shared/src/types/auth.types.ts | Jennifer | Jerem |
| shared/src/types/game.types.ts | Jennifer | Martin |
| shared/src/types/map.types.ts | Jennifer | Martin |
| shared/src/types/socket.types.ts | Jennifer | Jerem |
| shared/src/types/tiles.types.ts | Martin | Jennifer |
| shared/src/types/user.types.ts | Jennifer | Élise |

---

## Visual Direction / Design

### Artistic Direction

Jennifer owns:

- global visual direction,
- gameplay rendering coherence,
- sprites validation,
- tile coherence,
- visual identity,
- React/Phaser visual integration,
- overall artistic consistency.

### UI Implementation

Élise owns:

- Tailwind implementation,
- reusable UI components,
- responsive behavior,
- forms systems,
- notification UI,
- loading/error states,
- accessibility basics,
- i18n integration.

---

## Visual Assets

| File / Folder | Main Owner | Support |
| --- | --- | --- |
| frontend/public/assets/sprites/** | Jennifer | Élise |
| frontend/public/assets/tiles/** | Jennifer | Martin |
| image_recherche/** | Jennifer | Martin |

---

## Documentation

| File / Folder | Main Owner | Support |
| --- | --- | --- |
| backend_doc/** | Jerem | Jennifer |
| frontend_doc/** | Jennifer | Élise |
| PedagoGamePlay/** | Martin | Jennifer |
| background_doc/** | Jennifer | Jerem |
| probleme_rencontre/** | Shared | Shared |
| history_debug/** | Shared | Shared |

---

## Files To Clean Before Evaluation

These files should probably be removed from the repository before final evaluation:

- backend/.env
- backend/prisma/dev.db
- all *.Zone.Identifier files
- unused sprite duplicates
- temporary debug files
