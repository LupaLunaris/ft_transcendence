# ─────────────────────────────────────────────────────────────────────────────
# Makefile — Guilds of the Deep (ft_transcendence)
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: help install check-platform-deps build build-shared start dev \
		dev-backend dev-frontend \
		test test-backend test-frontend \
		docker-build docker-up docker-down docker-down-v docker-logs \
		docker-logs-backend docker-restart \
		db-generate db-migrate db-seed db-studio \
		certs vault-init vault-wait vault-unseal \
		clean fclean npm-reset docker-clean re

# ── Colors ────────────────────────────────────────────────────────────────────
RESET  := \033[0m
BOLD   := \033[1m
GREEN  := \033[32m
YELLOW := \033[33m
CYAN   := \033[36m
RED    := \033[31m

.DEFAULT_GOAL := help

COMPOSE := docker compose
NPM := npm
NPM_INSTALL := $(NPM) install --include=optional
NPM_CI := $(NPM) ci --include=optional

# ── Help ──────────────────────────────────────────────────────────────────────
help: ## Show available commands
	@printf "$(BOLD)Guilds of the Deep — ft_transcendence$(RESET)\n\n"
	@printf "$(CYAN)Main commands (daily use)$(RESET)\n"
	@grep -E '^(install|dev|docker-up|docker-down|start):.*## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS=":.*?## "}; {printf "  $(GREEN)%-22s$(RESET)%s\n", $$1, $$2}'
	@printf "\n$(CYAN)Advanced commands (optional)$(RESET)\n"
	@grep -E '^(dev-backend|dev-frontend|build|build-shared|test|test-backend|test-frontend|docker-build|docker-logs|docker-logs-backend|docker-restart|certs):.*## ' $(MAKEFILE_LIST) \
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
# PLATFORM COMPATIBILITY
# ─────────────────────────────────────────────────────────────────────────────

check-platform-deps: ## Reject direct dependencies tied to one OS or CPU
	@printf "$(CYAN)Checking platform-specific dependencies...$(RESET)\n"
	@if grep -R -E \
		'"(@rolldown/binding-|@swc/core-(linux|darwin|win32)|@esbuild/[^"]*(linux|darwin|win32)|sharp-(linux|darwin|win32))' \
		package.json backend/package.json frontend/package.json shared/package.json \
		>/dev/null 2>&1; then \
		printf "$(RED)Error: a platform-specific native package is declared directly.$(RESET)\n"; \
		printf "$(YELLOW)Native bindings must be installed automatically by their parent package.$(RESET)\n"; \
		grep -R -n -E \
			'"(@rolldown/binding-|@swc/core-(linux|darwin|win32)|@esbuild/[^"]*(linux|darwin|win32)|sharp-(linux|darwin|win32))' \
			package.json backend/package.json frontend/package.json shared/package.json; \
		exit 1; \
	fi
	@printf "$(GREEN)Platform dependency check passed.$(RESET)\n"

# ─────────────────────────────────────────────────────────────────────────────
# LOCAL DEVELOPMENT
# ─────────────────────────────────────────────────────────────────────────────

install: check-platform-deps ## Install all workspace dependencies
	@if [ -f package-lock.json ]; then \
		printf "$(CYAN)Installing dependencies from package-lock.json...$(RESET)\n"; \
		$(NPM_CI); \
	else \
		printf "$(YELLOW)No package-lock.json found; generating one...$(RESET)\n"; \
		$(NPM_INSTALL); \
	fi

# Build shared first — backend and frontend both depend on @ft/shared
build: check-platform-deps ## Build shared → backend → frontend
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
# SECURITY - Vault TLS certificates
# ─────────────────────────────────────────────────────────────────────────────

certs: ## Generates self-signed TLS certs for Vault (skips if already present)
	@./vault/generate-certs.sh

# ─────────────────────────────────────────────────────────────────────────────
# DOCKER
# ─────────────────────────────────────────────────────────────────────────────
# Note: requires a .env at the project root (copy .env.example and fill values)

docker-build: check-platform-deps ## Build Docker images
	$(COMPOSE) build

docker-build-clean: check-platform-deps ## Build Docker images without cache
	$(COMPOSE) build --no-cache

vault-init: ## First-time Vault setup (called automatically by docker-up)
	@./vault/vault-init.sh

vault-wait:
	@echo "Waiting for Vault API..."
	@until docker exec vault wget --no-check-certificate -qO- https://127.0.0.1:8200/v1/sys/seal-status >/dev/null 2>&1; do \
		sleep 1; \
	done
	@echo "Vault API is reachable."

vault-unseal: vault-wait
	@printf "$(CYAN)Unsealing Vault...$(RESET)\n"
	@docker exec vault vault operator unseal "$$(sed -E 's/\x1B\[[0-9;]*[mK]//g' vault/secrets/init-output.txt | grep 'Unseal Key 1:' | awk '{print $$NF}' | tr -d '\r')"
	@docker exec vault vault operator unseal "$$(sed -E 's/\x1B\[[0-9;]*[mK]//g' vault/secrets/init-output.txt | grep 'Unseal Key 2:' | awk '{print $$NF}' | tr -d '\r')"
	@docker exec vault vault operator unseal "$$(sed -E 's/\x1B\[[0-9;]*[mK]//g' vault/secrets/init-output.txt | grep 'Unseal Key 3:' | awk '{print $$NF}' | tr -d '\r')"
	@docker exec vault vault status

docker-up: check-platform-deps certs ## Build and start all services in detached mode	
	@if [ ! -f .env ]; then \
		printf "$(YELLOW).env not found. .env will now be created based on .env.example.$(RESET)\n"; \
		cp .env.example .env; \
		exit 1; \
	fi
	$(COMPOSE) up --build -d postgres
	$(COMPOSE) up --build -d --no-deps vault
	@$(MAKE) vault-wait
	@if docker exec vault vault status 2>/dev/null | grep -q 'Initialized.*true'; then \
		$(MAKE) vault-unseal; \
	else \
		$(MAKE) vault-init; \
	fi
	$(COMPOSE) up --build -d
	@printf "$(GREEN)Services running:$(RESET)\n"
	@printf "  App:      https://localhost\n"
	@printf "  API:      https://localhost/api/health\n"
	@printf "  HTTP:     http://localhost (redirects to HTTPS)\n"

docker-down: ## Stop and remove containers (keeps volumes)
	$(COMPOSE) down

docker-down-v: ## Stop and remove containers AND volumes (wipes DB data)
	$(COMPOSE) down -v
	rm -f vault/secrets/init-output.txt

docker-logs: ## Stream logs from all services
	$(COMPOSE) logs -f

docker-logs-backend: ## Stream backend logs only
	$(COMPOSE) logs -f backend

docker-restart: certs ## Tear down, rebuild, and restart all services
	$(COMPOSE) down
	$(COMPOSE) up --build -d postgres
	$(COMPOSE) up --build -d --no-deps vault
	@$(MAKE) vault-wait
	@if docker exec vault vault status 2>/dev/null | grep -q 'Initialized.*true'; then \
		$(MAKE) vault-unseal; \
	else \
		$(MAKE) vault-init; \
	fi
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

clean: ## Remove build artifacts
	rm -rf shared/dist backend/dist frontend/dist
	rm -rf frontend/.vite backend/.cache

fclean: clean ## Remove build artifacts + all node_modules + Docker volumes + Vault state
	rm -rf node_modules
	rm -rf backend/node_modules frontend/node_modules shared/node_modules
	rm -rf vault/certs
	rm -f vault/secrets/init-output.txt
	$(COMPOSE) down -v --remove-orphans
	@printf "$(GREEN)Full clean complete. Run 'make docker-up' to start fresh.$(RESET)\n"

npm-reset: ## Regenerate dependencies and package-lock.json
	rm -rf node_modules
	rm -rf backend/node_modules frontend/node_modules shared/node_modules
	rm -f package-lock.json
	$(NPM_INSTALL)

docker-clean: ## Remove project containers and unused Docker build cache
	$(COMPOSE) down --remove-orphans
	docker builder prune -f

re: fclean install build ## Full rebuild from package-lock.json