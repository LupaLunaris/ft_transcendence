# Project Cleanup Audit

Date: 2026-06-03

Scope: unused files, duplicated documentation, obsolete documents, unused React components/hooks/services/assets, unused npm dependencies, dead exports, and duplicated configuration files.

This PR includes the cleanup actions taken based on this audit (see git history for the exact deletions).

## Summary

The active application appears to use:

- `frontend/src/App.tsx` routes into `frontend/src/pages/auth`, `frontend/src/pages/editor`, `frontend/src/pages/game`, `frontend/src/pages/duel`, plus `HomePage`, `TrainingPage`, `TowerPage`, `ProfilePage`, and `NotFoundPage`.
- Active reusable UI is mostly under `frontend/src/components/ui` and `frontend/src/components/layout`.
- Active API client is `frontend/src/services/api.service.ts`.
- Active backend is `backend/src` with Prisma under `backend/prisma`.
- Root `package-lock.json` is the meaningful workspace lockfile.

Several older/prototype files remain next to the active implementation.

## Findings

| Path | Reason it seems unused | Confidence | Recommended action |
|---|---|---:|---|
| `frontend/src/pages/LoginPage.tsx` | Not imported by `frontend/src/App.tsx`; active login route imports `@/pages/auth/LoginPage`. This file uses the old default `Button`/`Card` components and has no auth logic. | High | Archive or remove after confirming no external branch imports it. |
| `frontend/src/pages/EditorPage.tsx` | Not imported by `App.tsx`; active editor route imports `@/pages/editor/EditorPage`. This file is a small placeholder. | High | Archive or remove after branch check. |
| `frontend/src/pages/ExplorePage.tsx` | No route in `App.tsx`; only references found are self/import of old `Card`. | High | Remove or move to an archive/docs folder if it is only a prototype. |
| `frontend/src/pages/PlayPage.tsx` | No route in `App.tsx`; only references found are self/import of old `Card`. Current play routes are `/play/:map_id`, `/play/:map_id/race`, and `/play/tower/:order_index`. | High | Remove or archive prototype. |
| `frontend/src/components/Button.tsx` | Only used by old `frontend/src/pages/LoginPage.tsx`; active app uses `frontend/src/components/ui/Button.tsx`. | High | Remove together with old placeholder pages if no branch depends on it. |
| `frontend/src/components/Card.tsx` | Only used by old placeholder pages (`LoginPage`, `EditorPage`, `ExplorePage`, `PlayPage`). Active screens use layout/UI components instead. | High | Remove together with old placeholder pages. |
| `frontend/src/components/Layout.tsx` | Not imported by active routes; active layout is `frontend/src/components/layout/Layout.tsx`. This file uses `Outlet` and old links such as `/play` and `/explore`. | High | Remove or archive after confirming old router setup is gone. |
| `frontend/src/services/api.ts` | No imports found. Active client is `frontend/src/services/api.service.ts`. Also defaults to `http://localhost:3000`, inconsistent with backend port `3001` and `/api/v1` proxy. | High | Remove or archive; do not use for new code. |
| `frontend/src/types/index.ts` | No imports found from app/tests. Types duplicate concepts now provided by `@ft/shared` (`MapSummary`, user/game types). | High | Remove or migrate any future local-only types elsewhere. |
| `frontend/tests/useApi.test.tsx` | Duplicate of `frontend/src/__tests__/useApi.test.tsx`. Vite config uses `setupFiles: ./src/__tests__/setup.ts`; current test suite lives under `src/__tests__`. | High | Remove duplicate top-level test folder after verifying CI does not target it explicitly. |
| `frontend/tests/api.service.test.ts` | Duplicate of `frontend/src/__tests__/api.service.test.ts`. | High | Remove duplicate top-level test folder after CI check. |
| `frontend/tests/setup.ts` | Duplicate setup file; Vite config points at `frontend/src/__tests__/setup.ts`, not this file. | High | Remove duplicate top-level test setup after CI check. |
| `backend/package-lock.json` | Tiny lockfile with empty `packages`; root `package-lock.json` is the actual npm workspace lockfile and Dockerfiles copy the root lockfile. | High | Remove if the project standard is root workspace lockfile only. |
| `backend/.env_exemple` | French/misspelled example name; docs and common tooling expect `.env.example`. A correctly named `backend/.env.example` may be preferable. | Medium | Rename/replace with `backend/.env.example` in a dedicated startup-doc cleanup. |
| `frontend/nginx.conf` | Frontend Dockerfile runs Vite dev server on port `5173`; no Dockerfile stage copies this nginx config or serves `/usr/share/nginx/html`. | Medium | Keep only if planned for production HTTPS/Nginx deployment; otherwise archive or document as future config. |
| `docker-compose.yml` environment `VITE_BACKEND_URL` | Set for frontend container, but no code reference found except docs/config search. Vite proxy uses `BACKEND_INTERNAL_URL`; API client uses `VITE_API_URL`. | Medium | Remove from compose only after confirming no runtime code needs it. |
| `frontend/package.json` dependency `@types/react-router-dom` | React Router v7 includes its own TypeScript types; package is v5-era and no code imports it directly. | Medium | Try removing and run `npm install`, `npm run build --workspace=frontend`, and tests. |
| `frontend/package.json` dependency `@vitest/coverage-v8` | No coverage script found in `frontend/package.json`; `vitest run` does not need it unless coverage is invoked manually. | Medium | Keep if coverage is planned; otherwise remove after checking CI. |
| `backend/prisma.config.ts` | Prisma CLI commands currently work from `backend/package.json`; this config may be useful for newer Prisma versions but is not obviously required by current scripts. | Low | Keep unless a Prisma command audit confirms it is unused. |
| `frontend/public/assets/sprites/Enemy_v (2).png` | No code or docs reference by exact filename. Active enemy sprites are `enemy_h.png` and `enemy_v.png`. | High | Move to asset archive or delete after visual review. |
| `frontend/public/assets/sprites/Girl_Left.png` | No code reference found. | High | Move to asset archive or delete after visual review. |
| `frontend/public/assets/sprites/Girl_Right.png` | No code reference found. | High | Move to asset archive or delete after visual review. |
| `frontend/public/assets/sprites/Girl_Up.png` | No code reference found. | High | Move to asset archive or delete after visual review. |
| `frontend/public/assets/sprites/Girl_Win.png` | No code reference found. | High | Move to asset archive or delete after visual review. |
| `frontend/public/assets/sprites/Martin.png` | No code reference found. | High | Move to asset archive or delete after visual review. |
| `frontend/public/assets/sprites/Martin1.png` | No code reference found. | High | Move to asset archive or delete after visual review. |
| `frontend/public/assets/sprites/Martin_right.png` | No code reference found. | High | Move to asset archive or delete after visual review. |
| `frontend/public/assets/sprites/ennemy.png` | No code reference found; likely older misspelled enemy asset. | High | Move to asset archive or delete after visual review. |
| `frontend/public/assets/sprites/player1.png` | No code reference found. | High | Move to asset archive or delete after visual review. |
| `frontend/public/assets/sprites/player2.png` | No code reference found. | High | Move to asset archive or delete after visual review. |
| `frontend/public/assets/sprites/player3.png` | No code reference found. | High | Move to asset archive or delete after visual review. |
| `frontend/public/assets/sprites/player5.png` | No code reference found. | High | Move to asset archive or delete after visual review. |
| `frontend/public/assets/sprites/player8.png` | No code reference found. | High | Move to asset archive or delete after visual review. |
| `frontend/public/assets/sprites/player11.png` | No code reference found. | High | Move to asset archive or delete after visual review. |
| `frontend/public/assets/sprites/player.png` | Not used by `assets.ts`; only mentioned in comments/docs. Active player sprite is `martinPlayer.png`. | Medium | Keep until the team decides whether it is a fallback/reference sprite. |
| `frontend/public/assets/sprites/JenTopBiche.png` | Mentioned only in a comment next to `martinPlayer.png`; not loaded at runtime. | Medium | Keep as reference or move to archive. |
| `frontend/public/assets/tiles/sprite tuile/aucun.png` | No runtime reference found. | Medium | Keep if source tile-set material; otherwise archive. |
| `frontend/public/assets/tiles/sprite tuile/bas.png` | No runtime reference found. | Medium | Keep if source tile-set material; otherwise archive. |
| `frontend/public/assets/tiles/sprite tuile/bas_droit.png` | No runtime reference found. | Medium | Keep if source tile-set material; otherwise archive. |
| `frontend/public/assets/tiles/sprite tuile/bas_gauche.png` | No runtime reference found. | Medium | Keep if source tile-set material; otherwise archive. |
| `frontend/public/assets/tiles/sprite tuile/haut.png` | No runtime reference found. | Medium | Keep if source tile-set material; otherwise archive. |
| `frontend/public/assets/tiles/sprite tuile/haut_droit.png` | No runtime reference found. | Medium | Keep if source tile-set material; otherwise archive. |
| `frontend/public/assets/tiles/sprite tuile/haut_gauche.png` | No runtime reference found. | Medium | Keep if source tile-set material; otherwise archive. |
| `frontend/public/assets/tiles/sprite tuile/spritesheet.png` | No runtime reference found; active wall sheet is `titleSheet.png`. | Medium | Keep as generated source/output or archive. |
| `frontend/public/assets/tiles/sprite tuile/tous.png` | No runtime reference found. | Medium | Keep if source tile-set material; otherwise archive. |
| `frontend/public/assets/tiles/sprite tuile/wall.png` | Path is different from active `frontend/public/assets/tiles/wall.png`; no runtime reference found to nested version. | Medium | Keep as source material or archive. |
| `frontend/public/assets/tiles/sprite tuile/spritesheet_assembler.py` | Python utility inside public web assets; no app import. It is not needed at runtime and may be exposed by Vite static serving. | Medium | Move to tooling/scripts folder if still useful. |
| `CONTEXT.md` | Claude-oriented context summary, likely not app/runtime documentation. May be obsolete compared with README/docs. | Medium | Keep only if actively used by the team; otherwise archive. |
| `CLAUDE.md` | Tool-specific instructions and historical TODOs; overlaps with README/docs and may include obsolete startup notes. | Medium | Review for current relevance; archive if not used. |
| `Arbre.md` | Tree/ownership summary overlaps with `docs/architecture.md`, `docs/Role_par_fichier.md`, and current file tree. | Medium | Replace with generated tree or archive. |
| `docs/Role_par_fichier.md` | Duplicates ownership data also present in root role docs/ownership docs. | Medium | Consolidate into one ownership document. |
| `docs/ownership-migration.md` | Duplicates file ownership information with `docs/Role_par_fichier.md` and organization docs. | Medium | Consolidate or mark historical. |
| `docs/organisation_role_push.md` | Overlaps with `docs/team-organization.md`, role docs, and historical implementation notes. | Medium | Keep as historical if useful; otherwise consolidate. |
| `docs/Martin_role.md` | Role-specific subset of broader ownership docs. | Medium | Consolidate into team/ownership doc. |
| `docs/team-organization.md` | Broad team process doc; overlaps with role/ownership docs but may still be canonical. | Low | Pick a canonical ownership/process doc before removing anything. |
| `docs/modules.md` | States planned module scope including features not obviously implemented (friends/i18n/badges). May be planning rather than current status. | Low | Update status or mark as proposal. |
| `docs/architecture.md` | High-level tree appears stale compared with current backend/frontend structure. | Medium | Update or archive. |
| `docs/setup.md` | Potential duplicate of `README_install_and_start.md`. | Medium | Merge current setup into one canonical startup guide. |
| `docs/dev-mode-check.md` | Narrow startup/debug note likely superseded by README startup docs. | Medium | Archive or link from troubleshooting if still useful. |
| `docs/ticket.txt` | Large ticket/planning file under docs; may duplicate GitHub/issues or project board. | Medium | Archive once tickets are migrated. |
| `backend_doc/*` | Backend implementation notes overlap with current code and `history_debug`; some may be useful but not runtime docs. | Low | Mark as technical notes or archive old entries after review. |
| `frontend_doc/*` | Frontend implementation notes overlap with current code and `history_debug`; some describe past bugs/decisions. | Low | Mark as technical notes or archive old entries after review. |
| `history_debug/*` | Debug journal files are historical and not required at runtime. | Low | Keep as history or move to an archive folder; do not treat as app docs. |
| `PedagoGamePlay/*` | Pedagogical notes, not runtime/project startup docs. | Low | Keep if teaching material is intentional; otherwise archive. |
| `probleme_rencontre/*` | Problem/correction notes, not runtime docs. | Low | Archive if resolved. |

## Items Checked But Not Flagged

| Path or package | Why it appears active |
|---|---|
| `frontend/src/components/ui/*` | Imported by active pages/components and tests. |
| `frontend/src/components/layout/*` | Active `Layout` and `Navbar` are imported by current pages. |
| `frontend/src/hooks/useApi.ts` | Used by `useMap`, `TowerPage`, and `TowerGamePage`; also tested. |
| `frontend/src/hooks/useMap.ts` | Used by `GamePage`, `TrainingPage`, and `DuelPage`. |
| `frontend/src/hooks/useDuelLobby.ts` | Used by `DuelPage`. |
| `frontend/src/services/api.service.ts` | Main active API client, imported by auth context, hooks, pages, and tests. |
| `frontend/public/assets/tiles/floor.png`, `wall.png`, `exit.png` | Referenced by `frontend/src/game/assets.ts`. |
| `frontend/public/assets/tiles/sprite tuile/titleSheet.png` | Referenced by `ASSET_TILE_WALL_SHEET`. |
| `frontend/public/assets/sprites/martinPlayer.png`, `enemy_h.png`, `enemy_v.png` | Referenced by active Phaser asset constants. |
| `phaser` | Imported by game scenes/canvas and aliased in Vite config. |
| `socket.io-client` | Used by duel lobby/game code. |
| `tailwindcss`, `postcss`, `autoprefixer` | Used through Tailwind/PostCSS config. |
| `@testing-library/user-event` | Used in frontend tests. |
| Backend dependencies `cors`, `helmet`, `express-rate-limit`, `express-async-errors`, `bcryptjs`, `jsonwebtoken`, `socket.io`, `zod`, `@prisma/client` | Referenced by active backend source. |
| Backend dev dependencies `supertest`, `ts-jest`, `nodemon`, `prisma`, `ts-node` | Used by backend tests, dev server, Prisma scripts, and seed command. |

## Suggested Cleanup Order

1. Remove/archive clearly dead frontend prototypes: old root pages, old `Button`, old `Card`, old `Layout`, old `api.ts`, old local `types/index.ts`.
2. Remove duplicate `frontend/tests/*` after confirming CI only uses Vitest defaults/current config.
3. Consolidate env/config duplicates: `backend/.env_exemple`, `backend/package-lock.json`, and possibly `frontend/nginx.conf`.
4. Review assets visually, then archive unused sprites and tile source files outside `public/`.
5. Pick canonical docs: likely `README.md`, `README_install_and_start.md`, `docs/architecture.md`, and one ownership/team document. Mark the rest as historical or move them under an archive folder.
6. Only after each cleanup batch, run `npm run build`, `make test`, and a Docker startup smoke test.
