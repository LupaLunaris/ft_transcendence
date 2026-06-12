.
├── .claude/
│   ├── settings.json
│   └── settings.local.json
├── .env / .env.example
├── CLAUDE.md / CONTEXT.md / README.md / README_install_and_start.md / Arbre.md
├── Makefile / docker-compose.yml / package.json / package-lock.json
│
├── backend/
│   ├── .env / .env.example / .gitignore
│   ├── Dockerfile / tsconfig.json / package.json / prisma.config.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts / seed-tower.ts
│   │   ├── dev.db
│   │   └── migrations/
│   │       ├── migration_lock.toml
│   │       └── 20260527000000_init_postgres/
│   │           └── migration.sql
│   └── src/
│       ├── server.ts
│       ├── errors.ts
│       ├── lib/
│       │   └── prisma.ts
│       ├── middleware/
│       │   ├── admin.middleware.ts
│       │   ├── auth.middleware.ts
│       │   └── validate.middleware.ts
│       ├── routes/
│       │   ├── index.ts
│       │   ├── admin.routes.ts
│       │   ├── auth.routes.ts
│       │   ├── maps.routes.ts
│       │   ├── scores.routes.ts
│       │   └── tower.routes.ts
│       ├── schemas/
│       │   ├── auth.schemas.ts
│       │   └── map.schemas.ts
│       ├── socket/
│       │   └── duelHandler.ts
│       ├── utils/
│       │   ├── grid.utils.ts
│       │   └── response.utils.ts
│       └── __tests__/
│           ├── admin.middleware.test.ts
│           ├── admin.routes.test.ts
│           ├── auth.middleware.test.ts
│           ├── auth.routes.test.ts
│           ├── grid.utils.test.ts
│           ├── maps.routes.test.ts
│           ├── tower.complete.test.ts
│           └── helpers/
│               └── grid.helper.ts
│
├── frontend/
│   ├── Dockerfile / package.json / index.html / nginx.conf
│   ├── tsconfig.json / vite.config.ts / tailwind.config.ts / postcss.config.cjs
│   ├── public/assets/
│   │   ├── icons/         (diamond, duel, map, tower, training — SVG)
│   │   ├── sprites/       (PNGs joueur, ennemis, variantes Martin/Girl)
│   │   └── tiles/         (exit, floor, wall + spritesheet)
│   └── src/
│       ├── App.tsx / main.tsx / index.css
│       ├── types/
│       │   └── index.ts
│       ├── context/
│       │   └── auth.context.tsx
│       ├── hooks/
│       │   ├── useApi.ts
│       │   ├── useDuelLobby.ts
│       │   └── useMap.ts
│       ├── services/
│       │   └── api.service.ts
│       ├── components/
│       │   ├── editor/
│       │   │   ├── EditorGrid.tsx
│       │   │   └── TileSelector.tsx
│       │   ├── game/
│       │   │   └── GameOverModal.tsx
│       │   ├── layout/
│       │   │   ├── Layout.tsx
│       │   │   └── Navbar.tsx
│       │   ├── tower/
│       │   │   └── CongratulatoryModal.tsx
│       │   └── ui/
│       │       ├── Button.tsx
│       │       ├── Input.tsx
│       │       ├── Modal.tsx
│       │       ├── Spinner.tsx
│       │       ├── Toast.tsx
│       │       └── useToast.ts
│       ├── game/                        ← Martin
│       │   ├── GameCanvas.tsx
│       │   ├── assets.ts
│       │   ├── entities/
│       │   │   └── Enemy.ts
│       │   └── scenes/
│       │       ├── BaseScene.ts
│       │       ├── DuelScene.ts
│       │       └── GameScene.ts
│       ├── pages/
│       │   ├── HomePage.tsx
│       │   ├── NotFoundPage.tsx
│       │   ├── ProfilePage.tsx
│       │   ├── TowerPage.tsx
│       │   ├── TrainingPage.tsx
│       │   ├── auth/
│       │   │   ├── LoginPage.tsx
│       │   │   └── RegisterPage.tsx
│       │   ├── duel/
│       │   │   ├── DuelPage.tsx
│       │   │   └── DuelGamePage.tsx
│       │   ├── editor/
│       │   │   └── EditorPage.tsx       ← Martin
│       │   └── game/                   ← Martin
│       │       ├── GamePage.tsx
│       │       ├── RacePage.tsx
│       │       └── TowerGamePage.tsx
│       └── __tests__/
│           ├── setup.ts
│           ├── Button.test.tsx
│           ├── EditorGrid.test.tsx
│           ├── EditorPage.test.tsx
│           ├── GamePage.test.tsx
│           ├── Input.test.tsx
│           ├── LoginPage.test.tsx
│           ├── LoginPage.toast.test.tsx
│           ├── Modal.test.tsx
│           ├── api.service.test.ts
│           ├── useApi.test.tsx
│           └── useToast.test.tsx
│
├── shared/
│   ├── package.json / tsconfig.json
│   ├── src/
│   │   ├── index.ts
│   │   └── types/
│   │       ├── api.types.ts
│   │       ├── auth.types.ts
│   │       ├── game.types.ts
│   │       ├── map.types.ts
│   │       ├── socket.types.ts
│   │       ├── tiles.types.ts
│   │       └── user.types.ts
│   └── dist/
│
├── docs/
│   ├── architecture.md
│   ├── modules.md
│   ├── Martin_role.md
│   ├── Role_par_fichier.md
│   ├── team-organization.md
│   ├── git-commands-guide.md
│   ├── git-organization.md
│   ├── organisation_role_push.md
│   ├── ownership-migration.md
│   ├── dev-mode-check.md
│   ├── project-cleanup-audit.md
│   ├── ft_transcendence.subject.pdf
│   ├── 42 EvalHub.pdf
│   └── proposition_mvp_kickoff/
│       ├── description_mvp.md
│       └── screenshots/  (editor, explore, inscription, saved_not_validated)
│
├── backend_doc/
│   ├── cycle-de-vie-map.md
│   ├── difficulty_enum.md
│   ├── docker-seed-autorun.md
│   ├── grille_seed.md
│   ├── prisma_client.md
│   ├── seed-tower-integration.md
│   └── seed_ts_node.md
│
├── frontend_doc/
│   ├── animation_joueur.md
│   ├── authentification-jwt-context.md
│   ├── css_grid_react.md
│   ├── editeur-admin-tour.md
│   ├── flux-editeur-gamepage.md
│   ├── modifier_la_grille.md
│   ├── textures_tuiles.md
│   ├── toast-provider-container-pattern.md
│   └── tower-navigation-entre-niveaux.md
│
├── background_doc/
│   ├── backend_middleware_express.md
│   ├── backend_prisma_seed_grilles.md
│   └── frontend_contexte_auth_tour.md
│
├── PedagoGamePlay/
│   ├── AbreGamePlay.md
│   ├── TS_explaine.md
│   └── phaser-heritage.md
│
├── history_debug/
│   ├── 2026-05-15_backend-routes-setup.md
│   ├── 2026-05-15_frontend-setup.md
│   ├── 2026-05-15_migration-js-vers-typescript.md
│   ├── 2026-05-15_npm-vulnerabilities.md
│   ├── 2026-05-15_types-schema-seed.md
│   ├── 2026-05-16_carte-perdue-et-non-publiable.md
│   ├── 2026-05-16_editor-grid-colonnes-vides.md
│   ├── 2026-05-16_login-400-toast-invisible.md
│   ├── 2026-05-16_reconnexion-impossible-apres-fermeture.md
│   ├── 2026-05-17_mode-tour-admin-backend.md
│   ├── 2026-05-17_mode-tour-admin-frontend.md
│   ├── 2026-05-18_EditorPage_makeEmptyGrid.md
│   ├── 2026-05-18_admin-editor-level-buttons.md
│   ├── 2026-05-18_backend_prisma_generate.md
│   └── 2026-05-22_player-sprite-scale-crop.md
│
└── probleme_rencontre/
    ├── corrections.md
    └── schema_prisma.md
