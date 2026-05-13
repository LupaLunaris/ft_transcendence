.PHONY: run stop install

run: stop install
	@echo "Starting backend..."
	@cd backend && node server.js &
	@echo "Starting frontend..."
	@cd frontend && npm run dev

stop:
	@fuser -k 3000/tcp 2>/dev/null || true
	@fuser -k 5173/tcp 2>/dev/null || true

install:
	@cd backend && npm install --silent
	@cd frontend && npm install --silent
