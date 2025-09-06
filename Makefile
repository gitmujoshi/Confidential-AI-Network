# Contract Management System - Development Makefile
# This Makefile provides convenient commands for development

.PHONY: help setup start stop restart status logs clean build test

# Default target
help: ## Show this help message
	@echo "Contract Management System - Development Commands"
	@echo "================================================"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Examples:"
	@echo "  make setup    # Setup development environment"
	@echo "  make start    # Start all services"
	@echo "  make logs     # View logs"
	@echo "  make test     # Run tests"

# Setup commands
setup: ## Setup development environment
	@echo "🚀 Setting up development environment..."
	chmod +x dev-setup.sh dev-start.sh
	./dev-setup.sh

# Service management
start: ## Start all development services
	@echo "🚀 Starting development environment..."
	./dev-start.sh

stop: ## Stop all development services
	@echo "🛑 Stopping development environment..."
	./dev-start.sh stop

restart: ## Restart all development services
	@echo "🔄 Restarting development environment..."
	./dev-start.sh restart

status: ## Show service status
	@echo "📊 Checking service status..."
	./dev-start.sh status

# Logging
logs: ## View logs for all services
	@echo "📋 Viewing logs..."
	./dev-start.sh logs

logs-backend: ## View backend logs
	@echo "📋 Viewing backend logs..."
	./dev-start.sh logs backend

logs-frontend: ## View frontend logs
	@echo "📋 Viewing frontend logs..."
	./dev-start.sh logs frontend

logs-keycloak: ## View Keycloak logs
	@echo "📋 Viewing Keycloak logs..."
	./dev-start.sh logs keycloak

# Development tools
shell: ## Access development tools container
	@echo "🐚 Opening shell in dev-tools container..."
	./dev-start.sh shell dev-tools

shell-backend: ## Access backend container shell
	@echo "🐚 Opening shell in backend container..."
	./dev-start.sh shell backend-dev

shell-frontend: ## Access frontend container shell
	@echo "🐚 Opening shell in frontend container..."
	./dev-start.sh shell frontend-dev

# Database operations
db-shell: ## Access database shell
	@echo "🗄️ Opening database shell..."
	docker exec -it postgres-app-dev psql -U postgres -d contract_management

db-migrate: ## Run database migrations
	@echo "🗄️ Running database migrations..."
	docker exec backend-dev node run-migrations.js

db-reset: ## Reset database (WARNING: This will delete all data)
	@echo "⚠️ Resetting database..."
	docker-compose -f docker-compose.dev.yml down -v
	./dev-start.sh

# Keycloak operations
keycloak-setup: ## Setup Keycloak
	@echo "🔐 Setting up Keycloak..."
	docker exec backend-dev node setup-keycloak-simple.js

keycloak-admin: ## Open Keycloak admin console
	@echo "🔐 Opening Keycloak admin console..."
	@echo "URL: http://localhost:8080"
	@echo "Username: admin"
	@echo "Password: admin123"
	@if command -v open >/dev/null 2>&1; then open http://localhost:8080; fi

# Testing
test: ## Run all tests
	@echo "🧪 Running tests..."
	docker exec backend-dev npm test
	docker exec frontend-dev npm test

test-backend: ## Run backend tests
	@echo "🧪 Running backend tests..."
	docker exec backend-dev npm test

test-frontend: ## Run frontend tests
	@echo "🧪 Running frontend tests..."
	docker exec frontend-dev npm test

# Building
build: ## Build all services
	@echo "🔨 Building all services..."
	docker-compose -f docker-compose.dev.yml build

build-backend: ## Build backend service
	@echo "🔨 Building backend service..."
	docker-compose -f docker-compose.dev.yml build backend

build-frontend: ## Build frontend service
	@echo "🔨 Building frontend service..."
	docker-compose -f docker-compose.dev.yml build frontend

# Cleaning
clean: ## Clean up containers and volumes
	@echo "🧹 Cleaning up..."
	docker-compose -f docker-compose.dev.yml down -v --remove-orphans
	docker system prune -f

clean-logs: ## Clean up log files
	@echo "🧹 Cleaning up logs..."
	rm -rf logs/*.log
	rm -rf backend/logs/*.log
	rm -rf frontend/logs/*.log

# Health checks
health: ## Check service health
	@echo "🏥 Checking service health..."
	@echo "Backend:"
	@curl -s http://localhost:5001/health | jq . 2>/dev/null || echo "❌ Backend not responding"
	@echo "Frontend:"
	@curl -s http://localhost:3000 | head -1 || echo "❌ Frontend not responding"
	@echo "Keycloak:"
	@curl -s http://localhost:8080/health/ready | jq . 2>/dev/null || echo "❌ Keycloak not responding"

# Development utilities
install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	docker exec backend-dev npm install
	docker exec frontend-dev npm install

update: ## Update dependencies
	@echo "📦 Updating dependencies..."
	docker exec backend-dev npm update
	docker exec frontend-dev npm update

lint: ## Run linting
	@echo "🔍 Running linting..."
	docker exec backend-dev npm run lint
	docker exec frontend-dev npm run lint

format: ## Format code
	@echo "✨ Formatting code..."
	docker exec backend-dev npm run format
	docker exec frontend-dev npm run format

# Documentation
docs: ## Generate documentation
	@echo "📚 Generating documentation..."
	docker exec backend-dev npm run docs

# Production deployment
prod-build: ## Build production images
	@echo "🏭 Building production images..."
	docker-compose -f docker-compose.prod.yml build

prod-deploy: ## Deploy to production
	@echo "🚀 Deploying to production..."
	docker-compose -f docker-compose.prod.yml up -d

# Monitoring
monitor: ## Monitor resource usage
	@echo "📊 Monitoring resource usage..."
	docker stats

# Backup
backup: ## Backup database
	@echo "💾 Backing up database..."
	docker exec postgres-app-dev pg_dump -U postgres contract_management > backup_$(shell date +%Y%m%d_%H%M%S).sql

# Quick development workflow
dev: setup start ## Quick development setup and start
	@echo "🎉 Development environment ready!"
	@echo "Access the application at http://localhost:3000"

# Default target
.DEFAULT_GOAL := help
