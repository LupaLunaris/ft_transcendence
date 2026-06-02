# ─────────────────────────────────────────────────────────────────────────────
# Makefile — Guilds of the Deep (ft_transcendence)
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: help install build start dev test test-backend test-frontend \
		docker-build docker-up docker-down docker-logs docker-restart \
		db-generate db-migrate db-seed db-studio \
		clean fclean re

# ── Colors ────────────────────────────────────────────────────────────────────
RESET  := \033[0m
BOLD   := \033[1m
GREEN  := \033[32m
YELLOW := \033[33m
CYAN   := \033[36m
RED    := \033[31m

.DEFAULT_GOAL := help

# ── Help ──────────────────────────────────────────────────────────────────────
help: ## Show available commands
	@printf "$(BOLD)Guilds of the Deep — ft_transcendence$(RESET)\n\n"
	@printf "$(CYAN)Local development$(RESET)\n"
	@grep -E '^(install|build|dev|test.*|clean.*|re):.*## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS=":.*?## "}; {printf "  $(GREEN)%-22s$(RESET)%s\n", $$1, $$2}'
	@printf "\n$(CYAN)Docker$(RESET)\n"
	@grep -E '^docker.*:.*## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS=":.*?## "}; {printf "  $(GREEN)%-22s$(RESET)%s\n", $$1, $$2}'
	@printf "\n$(CYAN)Database (local Prisma dev server)$(RESET)\n"
	@grep -E '^db-.*:.*## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS=":.*?## "}; {printf "  $(GREEN)%-22s$(RESET)%s\n", $$1, $$2}'

# ─────────────────────────────────────────────────────────────────────────────
# LOCAL DEVELOPMENT
# ─────────────────────────────────────────────────────────────────────────────

install: ## Install all workspace dependencies
	npm install

# Build shared first — backend and frontend both depend on @ft/shared
build: ## Build shared → backend → frontend
	@printf "$(CYAN)Building shared types...$(RESET)\n"
	npm run build --workspace=shared
	@printf "$(CYAN)Building backend...$(RESET)\n"
	npm run build --workspace=backend
	@printf "$(CYAN)Building frontend...$(RESET)\n"
	npm run build --workspace=frontend
	@printf "$(GREEN)Build complete.$(RESET)\n"

build-shared: ## Build only @ft/shared (required before running backend/frontend)
	npm run build --workspace=shared

start: install build-shared dev ## Install, build shared, then start dev servers (quick entry point)

dev: ## Start backend + frontend dev servers concurrently
	@printf "$(YELLOW)Starting dev servers (Ctrl-C to stop both)...$(RESET)\n"
	@printf "  Backend:  $(BOLD)http://localhost:3001$(RESET)\n"
	@printf "  Frontend: $(BOLD)http://localhost:5173$(RESET)\n\n"
	npm run dev

dev-backend: build-shared ## Start backend dev server only
	npm run dev --workspace=backend

dev-frontend: build-shared ## Start frontend dev server only
	npm run dev --workspace=frontend

# ─────────────────────────────────────────────────────────────────────────────
# TESTS
# ─────────────────────────────────────────────────────────────────────────────

test: test-backend test-frontend ## Run all tests (backend then frontend)

test-backend: build-shared ## Run backend tests (Jest + supertest)
	@printf "$(CYAN)Running backend tests...$(RESET)\n"
	npm test --workspace=backend

test-frontend: ## Run frontend tests (Vitest + Testing Library)
	@printf "$(CYAN)Running frontend tests...$(RESET)\n"
	npm test --workspace=frontend

# ─────────────────────────────────────────────────────────────────────────────
# DOCKER
# ─────────────────────────────────────────────────────────────────────────────
# Note: requires a .env at the project root (copy .env.example and fill values)

docker-build: ## Build Docker images (no cache)
	docker compose build --no-cache

docker-up: ## Build and start all services in detached mode
	@if [ ! -f .env ]; then \
		printf "$(RED)Error: .env not found. Copy .env.example and fill in values.$(RESET)\n"; \
		exit 1; \
	fi
	docker compose up --build -d
	@printf "$(GREEN)Services running:$(RESET)\n"
	@printf "  Frontend: http://localhost:5173\n"
	@printf "  Backend:  http://localhost:3001/api/v1/health\n"
	@printf "  Postgres: localhost:5432\n"

docker-down: ## Stop and remove containers (keeps volumes)
	docker compose down

docker-down-v: ## Stop and remove containers AND volumes (wipes DB data)
	docker compose down -v

docker-logs: ## Stream logs from all services
	docker compose logs -f

docker-logs-backend: ## Stream backend logs only
	docker compose logs -f backend

docker-restart: ## Tear down, rebuild, and restart all services
	docker compose down
	docker compose up --build -d

# ─────────────────────────────────────────────────────────────────────────────
# DATABASE — local Prisma dev server (prisma+postgres://localhost:51213)
# ─────────────────────────────────────────────────────────────────────────────

db-generate: ## Regenerate Prisma client after schema changes
	npm run db:generate --workspace=backend

db-migrate: ## Run pending Prisma migrations (creates DB if needed)
	npm run db:migrate --workspace=backend

db-seed: ## Seed DB with test users and an AdminMap (order 1)
	npm run db:seed --workspace=backend

db-studio: ## Open Prisma Studio in the browser
	npm run db:studio --workspace=backend

# ─────────────────────────────────────────────────────────────────────────────
# CLEANUP
# ─────────────────────────────────────────────────────────────────────────────

clean: ## Remove build artifacts (dist folders, Vite cache)
	rm -rf shared/dist backend/dist frontend/dist
	rm -rf frontend/.vite backend/.cache

fclean: clean ## Remove build artifacts + all node_modules
	rm -rf node_modules
	rm -rf backend/node_modules frontend/node_modules shared/node_modules

re: fclean install build ## Full rebuild from scratch (fclean → install → build)