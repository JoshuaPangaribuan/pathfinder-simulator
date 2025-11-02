.PHONY: help deps deps-go deps-web setup quick-start build build-web build-server embed run run-dev dev dev-server dev-web test test-go test-web lint fmt clean clean-web clean-server kill-be kill-fe kill-dev

# Variables
BINARY_NAME=pathfinder
BINARY_PATH=./bin/$(BINARY_NAME)
WEB_DIR=web
GO_FILES=$(shell find . -name "*.go" -not -path "./vendor/*")
WEB_PORT=5173
API_PORT=8080

# Default target
help: ## Show this help message
	@echo "Pathfinder & Maze Visualizer - Makefile"
	@echo ""
	@echo "Quick Start:"
	@echo "  make setup          # Initial project setup"
	@echo "  make quick-start    # Setup and start development servers"
	@echo "  make dev            # Show development workflow info"
	@echo ""
	@echo "Available targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Dependencies
deps: deps-go deps-web ## Install all dependencies (Go and Bun)

deps-go: ## Install Go dependencies
	go mod download
	go mod tidy

deps-web: ## Install Bun dependencies
	cd $(WEB_DIR) && bun install

# Setup targets
setup: deps ## Setup project for development (install all dependencies)
	@echo "Project setup complete! Run 'make quick-start' to get started."

quick-start: setup ## Quick start development (setup + start dev servers in background)
	@echo "Starting development servers..."
	@echo "API Server will be available at: http://localhost:$(API_PORT)"
	@echo "Web Server will be available at: http://localhost:$(WEB_PORT)"
	@echo ""
	@echo "Press Ctrl+C to stop both servers"
	@make dev-server & make dev-web & wait

# Build targets
build: build-web build-server ## Build both frontend and backend for production

build-web: ## Build frontend production bundle
	cd $(WEB_DIR) && bun run build

build-server: embed ## Build Go server binary with embedded assets
	go build -o $(BINARY_PATH) ./cmd/server

embed: build-web ## Generate embedded assets for Go (called automatically by build-server)

# Run targets
run: ## Run production binary
	$(BINARY_PATH) -addr :$(API_PORT)

run-dev: ## Run server in development mode (no embedded assets)
	go run ./cmd/server -dev -addr :$(API_PORT)

dev: ## Show development workflow information
	@echo "Development Workflow Options:"
	@echo ""
	@echo "Option 1 - Quick start (recommended for beginners):"
	@echo "  make quick-start"
	@echo ""
	@echo "Option 2 - Manual setup (for advanced users):"
	@echo "  Terminal 1: make dev-server"
	@echo "  Terminal 2: make dev-web"
	@echo ""
	@echo "Option 3 - Run in background:"
	@echo "  make dev-server & make dev-web & wait"
	@echo ""
	@echo "URLs:"
	@echo "  Frontend: http://localhost:$(WEB_PORT)"
	@echo "  Backend:  http://localhost:$(API_PORT)"
	@echo ""
	@echo "To stop servers: make kill-dev"

dev-server: ## Run Go API server in development mode
	go run ./cmd/server -dev -addr :$(API_PORT)

dev-web: ## Run Vite development server
	cd $(WEB_DIR) && bun run dev

# Test targets
test: test-go ## Run all tests

test-go: ## Run Go tests
	go test ./...

test-web: ## Run frontend tests (if configured)
	cd $(WEB_DIR) && bun test

# Code quality
lint: lint-go lint-web ## Run all linters

lint-go: ## Run Go linter
	go vet ./...
	@if command -v golangci-lint >/dev/null 2>&1; then \
		golangci-lint run; \
	else \
		echo "golangci-lint not installed. Install with: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest"; \
	fi

lint-web: ## Run frontend linter
	cd $(WEB_DIR) && bun run lint

fmt: fmt-go fmt-web ## Format all code

fmt-go: ## Format Go code
	go fmt ./...

fmt-web: ## Format frontend code
	cd $(WEB_DIR) && bun fmt --write .

# Clean targets
clean: clean-web clean-server ## Clean all build artifacts

clean-web: ## Clean frontend build artifacts
	rm -rf $(WEB_DIR)/dist
	rm -rf $(WEB_DIR)/node_modules
	rm -f $(WEB_DIR)/bun.lockb

clean-server: ## Clean Go build artifacts
	rm -rf bin/
	go clean

# Development utilities
kill-be: ## Kill backend (Go server) processes
	@echo "Killing backend processes..."
	@-pkill -f "$(BINARY_NAME)" 2>/dev/null || true
	@-pkill -f "go run.*cmd/server" 2>/dev/null || true
	@-lsof -ti:$(API_PORT) | xargs kill -9 2>/dev/null || true
	@echo "Backend processes killed"

kill-fe: ## Kill frontend (Vite dev server) processes
	@echo "Killing frontend processes..."
	@-pkill -f "vite" 2>/dev/null || true
	@-pkill -f "bun.*dev" 2>/dev/null || true
	@-pkill -f "npm.*dev" 2>/dev/null || true
	@-pkill -f "node.*vite" 2>/dev/null || true
	@-lsof -ti:$(WEB_PORT) | xargs kill -9 2>/dev/null || true
	@echo "Frontend processes killed"

kill-dev: kill-be kill-fe ## Kill both backend and frontend development processes

watch-go: ## Watch Go files and rebuild on changes (requires air)
	@if command -v air >/dev/null 2>&1; then \
		air; \
	else \
		echo "air not installed. Install with: go install github.com/cosmtrek/air@latest"; \
		echo "Then create .air.toml config file."; \
	fi

docker-build: ## Build Docker image
	docker build -t pathfinder:latest .

docker-run: ## Run Docker container
	docker run -p $(API_PORT):$(API_PORT) pathfinder:latest
