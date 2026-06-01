#!/usr/bin/env bash
# push_in_order.sh — Commite les fichiers de l'étape 4.5 dans le bon ordre puis push.
# Arrête immédiatement si une commande échoue.
set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RESET='\033[0m'

step() { echo -e "\n${CYAN}▶ $*${RESET}"; }
ok()   { echo -e "${GREEN}✓ $*${RESET}"; }

# ── Vérification préalable ────────────────────────────────────────────────────

if ! git diff --quiet HEAD -- 2>/dev/null || git status --porcelain | grep -qE '^(\?\?|M| M)'; then
  : # il y a des changements, on continue
fi

step "Correction — build shared automatique"
git add package.json
git commit -m "chore(root): add concurrently and prebuild script for shared_jer"
ok "package.json commité"

# ── Backend — Jour 3 (jdebrull) ──────────────────────────────────────────────

step "Backend Jour 3 — schema Prisma (String + index)"
git add backend/prisma/schema.prisma
git commit -m "feat(prisma): ensure grid_json as String type and add score perf index_jer"
ok "schema.prisma commité"

step "Backend Jour 3 — admin middleware"
git add backend/src/middleware/admin.middleware.ts \
      backend/src/__tests__/admin.middleware.test.ts
git commit -m "feat(backend): add admin middleware with is_admin check_jer"
ok "admin.middleware.ts + test commités"

step "Backend Jour 3 — admin routes (GET + PUT tower)"
git add backend/src/routes/admin.routes.ts \
      backend/src/__tests__/admin.routes.test.ts
git commit -m "feat(backend): add admin tower GET and PUT routes with grid validation_jer"
ok "admin.routes.ts + test commités"

step "Backend Jour 3 — seed 8 niveaux"
git add backend/prisma/seed-tower.ts
git commit -m "feat(prisma): add seed-tower with 8 themed admin maps_jer"
ok "seed-tower.ts commité"

step "Backend Jour 3 — tower complete route"
git add backend/src/routes/tower.routes.ts \
      backend/src/__tests__/tower.complete.test.ts
git commit -m "feat(backend): add tower complete route with progression and diamonds_jer"
ok "tower.routes.ts + tower.complete.test.ts commités"

step "Backend Jour 3 — auto-admin + toUserPublic is_admin + montage /admin"
git add backend/src/routes/auth.routes.ts \
      backend/src/routes/index.ts
git commit -m "feat(backend): add auto-admin promotion and is_admin in toUserPublic_jer"
ok "auth.routes.ts + index.ts commités"

# ── Shared types — Jour 4 (jpaulis) ──────────────────────────────────────────

step "Shared Jour 4 — is_admin dans UserPublic"
git add shared/src/types/user.types.ts
git commit -m "feat(shared): add is_admin field to UserPublic_jen"
ok "user.types.ts commité"

# ── Frontend — Jour 4 (jpaulis) ───────────────────────────────────────────────

step "Frontend Jour 4 — api service (admin namespace + tower.complete)"
git add frontend/src/services/api.service.ts
git commit -m "feat(frontend): add admin namespace and tower.complete to api service_jen"
ok "api.service.ts commité"

step "Frontend Jour 4 — App.tsx (route tower avant play)"
git add frontend/src/App.tsx
git commit -m "feat(frontend): declare tower route before play for correct matching_jen"
ok "App.tsx commité"

# ── Frontend — Jour 4 (evan-dro) ─────────────────────────────────────────────

step "Frontend Jour 4 — CongratulatoryModal"
git add frontend/src/components/tower/CongratulatoryModal.tsx
git commit -m "feat(frontend): add CongratulatoryModal with animated diamond counter_eli"
ok "CongratulatoryModal.tsx commité"

# ── Frontend — Jour 4 (malafont) ─────────────────────────────────────────────

step "Frontend Jour 4 — TowerGamePage"
git add frontend/src/pages/game/TowerGamePage.tsx
git commit -m "feat(frontend): add TowerGamePage with complete and congratulatory flow_mar"
ok "TowerGamePage.tsx commité"

step "Frontend Jour 4 — TowerPage (8 niveaux + progression)"
git add frontend/src/pages/TowerPage.tsx
git commit -m "feat(frontend): update TowerPage with 8 levels and progress tracking_mar"
ok "TowerPage.tsx commité"

step "Frontend Jour 4 — EditorPage (mode admin)"
git add frontend/src/pages/editor/EditorPage.tsx
git commit -m "feat(frontend): add admin mode to EditorPage with level management_mar"
ok "EditorPage.tsx commité"

# ── Documentation ─────────────────────────────────────────────────────────────

step "Documentation — debug history 2026-05-17"
git add history_debug/2026-05-17_mode-tour-admin-backend.md \
      history_debug/2026-05-17_mode-tour-admin-frontend.md
git commit -m "docs(root): add debug history for 2026-05-17 tour admin session_jer"
ok "history_debug 17 mai commité"

step "Documentation — background_doc"
git add background_doc/backend_middleware_express.md \
      background_doc/backend_prisma_seed_grilles.md \
      background_doc/frontend_contexte_auth_tour.md
git commit -m "docs(root): add background documentation for middleware and auth tour_jer"
ok "background_doc/ commité"

step "Documentation — probleme_rencontre"
git add probleme_rencontre/corrections.md \
      probleme_rencontre/schema_prisma.md
git commit -m "docs(root): add troubleshooting notes for corrections and schema_jer"
ok "probleme_rencontre/ commité"

step "Documentation — CLAUDE.md + CONTEXT.md"
git add CLAUDE.md CONTEXT.md
git commit -m "docs(root): add CLAUDE.md and CONTEXT.md for session context_jer"
ok "CLAUDE.md + CONTEXT.md commités"

step "Documentation — ordre_de_commit.txt + organisation_role_push.md"
git add ordre_de_commit.txt organisation_role_push.md
git commit -m "docs(root): update commit order and organisation documentation_jer"
ok "ordre_de_commit.txt + organisation_role_push.md commités"

# ── Push final ────────────────────────────────────────────────────────────────

step "Push vers origin"
git push
echo -e "\n${BOLD}${GREEN}Tous les commits ont été pushés avec succès.${RESET}"
