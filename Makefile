# ─────────────────────────────────────────────────────────────────────────────
# Makefile — Guilds of the Deep (ft_transcendence)
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: help install build build-shared start dev dev-backend dev-frontend \
		test test-backend test-frontend \
		docker-build docker-up docker-down docker-down-v docker-logs docker-logs-backend docker-restart \
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

COMPOSE := docker compose

# ── Help ──────────────────────────────────────────────────────────────────────
help: ## Show available commands
	@printf "$(BOLD)Guilds of the Deep — ft_transcendence$(RESET)\n\n"
	@printf "$(CYAN)Main commands (daily use)$(RESET)\n"
	@grep -E '^(install|dev|docker-up|docker-down|start):.*## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS=":.*?## "}; {printf "  $(GREEN)%-22s$(RESET)%s\n", $$1, $$2}'
	@printf "\n$(CYAN)Advanced commands (optional)$(RESET)\n"
	@grep -E '^(dev-backend|dev-frontend|build|build-shared|test|test-backend|test-frontend|docker-build|docker-logs|docker-logs-backend|docker-restart):.*## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS=":.*?## "}; {printf "  $(GREEN)%-22s$(RESET)%s\n", $$1, $$2}'
	@printf "\n$(CYAN)Database commands$(RESET)\n"
	@grep -E '^db-.*:.*## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS=":.*?## "}; {printf "  $(GREEN)%-22s$(RESET)%s\n", $$1, $$2}'
	@printf "\n$(CYAN)Cleanup commands$(RESET)\n"
	@grep -E '^(clean|fclean|re|docker-down-v):.*## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS=":.*?## "}; {printf "  $(GREEN)%-22s$(RESET)%s\n", $$1, $$2}'
	@printf "\n$(CYAN)Documentation$(RESET)\n"
	@printf "  $(GREEN)README.md$(RESET)              Project overview\n"
	@printf "  $(GREEN)README_install...$(RESET)      Setup, startup, troubleshooting\n"
	@printf "  $(GREEN)docs/architecture.md$(RESET)   Architecture reference\n"
	@printf "  $(GREEN)docs/README.md$(RESET)         Documentation map\n"

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

start: ## Print startup guidance
	@printf "$(BOLD)Choose an explicit startup mode:$(RESET)\n\n"
	@printf "  $(GREEN)make dev$(RESET)       Local development: Docker PostgreSQL + local backend/frontend\n"
	@printf "  $(GREEN)make docker-up$(RESET) Docker demo/evaluation: full stack in Docker\n"
	@printf "  $(GREEN)make install$(RESET)   Install dependencies if node_modules are missing\n\n"
	@printf "Tip: use $(GREEN)make help$(RESET) to see the command groups.\n"

dev: ## Start local dev: Docker PostgreSQL + local backend/frontend
	@if [ ! -f .env ]; then \
		printf "$(RED)Error: .env not found. Run: cp .env.example .env$(RESET)\n"; \
		exit 1; \
	fi
	@if [ ! -f backend/.env ]; then \
		printf "$(YELLOW)Creating backend/.env from backend/.env.example for local backend settings.$(RESET)\n"; \
		cp backend/.env.example backend/.env; \
	fi
	@if $(COMPOSE) ps --services --filter status=running 2>/dev/null | grep -Eq '^(backend|frontend)$$'; then \
		printf "$(RED)Error: Docker backend/frontend are already running.$(RESET)\n"; \
		printf "Run $(GREEN)make docker-down$(RESET) before $(GREEN)make dev$(RESET).\n"; \
		exit 1; \
	fi
	@if command -v lsof >/dev/null 2>&1; then \
		if lsof -iTCP:3001 -sTCP:LISTEN -Pn >/dev/null 2>&1; then \
			printf "$(RED)Error: port 3001 is already in use. Backend may already be running.$(RESET)\n"; \
			exit 1; \
		fi; \
		if lsof -iTCP:5173 -sTCP:LISTEN -Pn >/dev/null 2>&1; then \
			printf "$(RED)Error: port 5173 is already in use. Frontend may already be running.$(RESET)\n"; \
			exit 1; \
		fi; \
	fi
	@printf "$(CYAN)Ensuring PostgreSQL is running in Docker...$(RESET)\n"
	@$(COMPOSE) up -d postgres
	@set -a; . ./.env; set +a; \
	for i in $$(seq 1 30); do \
		if $(COMPOSE) exec -T postgres pg_isready -U "$$POSTGRES_USER" -d "$$POSTGRES_DB" >/dev/null 2>&1; then \
			printf "$(GREEN)PostgreSQL is ready on localhost:5432.$(RESET)\n"; \
			break; \
		fi; \
		if [ "$$i" = "30" ]; then \
			printf "$(RED)Error: PostgreSQL did not become ready. Check logs with: docker compose logs postgres$(RESET)\n"; \
			exit 1; \
		fi; \
		sleep 1; \
	done
	@$(MAKE) build-shared
	@$(MAKE) db-generate
	@printf "$(YELLOW)Starting dev servers (Ctrl-C to stop both)...$(RESET)\n"
	@printf "  Backend:  $(BOLD)http://localhost:3001$(RESET)\n"
	@printf "  Frontend: $(BOLD)http://localhost:5173$(RESET)\n\n"
	npx concurrently "npm run dev --workspace=backend" "npm run dev --workspace=frontend"

dev-backend: build-shared db-generate ## Start only local backend (requires PostgreSQL already running)
	@printf "$(YELLOW)Backend only: PostgreSQL must already be running on localhost:5432.$(RESET)\n"
	npm run dev --workspace=backend

dev-frontend: build-shared ## Start only local frontend (requires backend for API calls)
	@printf "$(YELLOW)Frontend only: backend must already be running on localhost:3001 for API calls.$(RESET)\n"
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
	$(COMPOSE) build --no-cache

docker-up: ## Build and start all services in detached mode
	@if [ ! -f .env ]; then \
		printf "$(RED)Error: .env not found. Copy .env.example and fill in values.$(RESET)\n"; \
		exit 1; \
	fi
	$(COMPOSE) up --build -d
	@printf "$(GREEN)Services running:$(RESET)\n"
	@printf "  Frontend: http://localhost:5173\n"
	@printf "  Backend:  http://localhost:3001/api/health\n"
	@printf "  Postgres: localhost:5432\n"

docker-down: ## Stop and remove containers (keeps volumes)
	$(COMPOSE) down

docker-down-v: ## Stop and remove containers AND volumes (wipes DB data)
	$(COMPOSE) down -v

docker-logs: ## Stream logs from all services
	$(COMPOSE) logs -f

docker-logs-backend: ## Stream backend logs only
	$(COMPOSE) logs -f backend

docker-restart: ## Tear down, rebuild, and restart all services
	$(COMPOSE) down
	$(COMPOSE) up --build -d

# ─────────────────────────────────────────────────────────────────────────────
# DATABASE — local Prisma/PostgreSQL
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
