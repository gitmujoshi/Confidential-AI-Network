#!/bin/bash


source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../lib/common.sh"
resolve_repo_root
# Development Environment Startup Script
# This script starts the containerized development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose > /dev/null 2>&1; then
        print_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Function to create necessary directories
create_directories() {
    print_step "Creating necessary directories..."
    
    mkdir -p nginx/ssl
    mkdir -p logs
    mkdir -p data
    
    print_success "Directories created"
}

# Function to build and start services
start_services() {
    print_header "Starting Development Environment"
    
    print_step "Building and starting services..."
    run_compose "docker-compose.dev.yml" up --build -d
    
    print_success "Services started"
}

# Function to wait for services to be ready
wait_for_services() {
    print_step "Waiting for services to be ready..."
    
    # Wait for databases
    print_status "Waiting for PostgreSQL databases..."
    timeout 60 bash -c 'until docker exec ***REMOVED-DB_PASSWORD***-app-dev pg_isready -U ***REMOVED-DB_PASSWORD***; do sleep 2; done'
    timeout 60 bash -c 'until docker exec ***REMOVED-DB_PASSWORD***-***REMOVED-KEYCLOAK_DB_PASSWORD***-dev pg_isready -U ***REMOVED-KEYCLOAK_DB_PASSWORD***; do sleep 2; done'
    
    # Wait for Keycloak
    print_status "Waiting for Keycloak..."
    timeout 120 bash -c 'until curl -f http://localhost:8080/health/ready; do sleep 5; done'
    
    # Wait for backend
    print_status "Waiting for backend API..."
    timeout 120 bash -c 'until curl -f http://localhost:5001/health; do sleep 5; done'
    
    # Wait for frontend
    print_status "Waiting for frontend..."
    timeout 120 bash -c 'until curl -f http://localhost:3000; do sleep 5; done'
    
    print_success "All services are ready"
}

# Function to setup Keycloak
setup_***REMOVED-KEYCLOAK_DB_PASSWORD***() {
    print_step "Setting up Keycloak..."
    
    # Wait a bit more for Keycloak to be fully ready
    sleep 10
    
    # Run Keycloak setup
    docker exec backend-dev node setup-***REMOVED-KEYCLOAK_DB_PASSWORD***-simple.js || print_warning "Keycloak setup failed, but continuing..."
    
    print_success "Keycloak setup completed"
}

# Function to run database migrations
run_migrations() {
    print_step "Running database migrations..."
    
    docker exec backend-dev node run-migrations.js || print_warning "Migrations failed, but continuing..."
    
    print_success "Database migrations completed"
}

# Function to display service information
display_service_info() {
    print_header "Development Environment Ready!"
    
    echo -e "${GREEN}🎉 All services are running successfully!${NC}"
    echo ""
    echo -e "${CYAN}📋 Service URLs:${NC}"
    echo "  Frontend:     http://localhost:3000"
    echo "  Backend API:  http://localhost:5001"
    echo "  Keycloak:     http://localhost:8080"
    echo "  Mailhog:      http://localhost:8025"
    echo "  Redis:        localhost:6379"
    echo ""
    echo -e "${CYAN}🔧 Management Commands:${NC}"
    echo "  View logs:    ./dev-start.sh logs [service]"
    echo "  Stop all:     ./dev-start.sh stop"
    echo "  Restart:      ./dev-start.sh restart [service]"
    echo "  Shell access: docker exec -it [container-name] /bin/bash"
    echo ""
    echo -e "${CYAN}🐳 Container Names:${NC}"
    echo "  Frontend:     frontend-dev"
    echo "  Backend:      backend-dev"
    echo "  Keycloak:     ***REMOVED-KEYCLOAK_DB_PASSWORD***-dev"
    echo "  PostgreSQL:   ***REMOVED-DB_PASSWORD***-app-dev, ***REMOVED-DB_PASSWORD***-***REMOVED-KEYCLOAK_DB_PASSWORD***-dev"
    echo "  Dev Tools:    dev-tools"
    echo ""
    echo -e "${YELLOW}⚠️  Development Notes:${NC}"
    echo "- Code changes are automatically reflected (hot reload enabled)"
    echo "- Database data persists between restarts"
    echo "- Use './dev-start.sh logs' to view logs"
    echo "- Access dev tools container: docker exec -it dev-tools /bin/bash"
    echo ""
}

# Function to show service status
show_status() {
    print_header "Service Status"
    
    run_compose "docker-compose.dev.yml" ps
    
    echo ""
    print_status "Health Checks:"
    curl -s http://localhost:5001/health | jq . 2>/dev/null || echo "❌ Backend not responding"
    curl -s http://localhost:3000 | head -1 || echo "❌ Frontend not responding"
    curl -s http://localhost:8080/health/ready | jq . 2>/dev/null || echo "❌ Keycloak not responding"
}

# Main execution
main() {
    print_header "Contract Management System - Development Environment"
    
    # Pre-flight checks
    check_docker
    check_docker_compose
    
    # Setup
    create_directories
    
    # Start services
    start_services
    
    # Wait for services
    wait_for_services
    
    # Setup services
    setup_***REMOVED-KEYCLOAK_DB_PASSWORD***
    run_migrations
    
    # Display information
    display_service_info
    show_status
}

# Handle command line arguments
case "${1:-}" in
    "status")
        show_status
        ;;
    "logs")
        run_compose "docker-compose.dev.yml" logs -f "${2:-}"
        ;;
    "stop")
        print_status "Stopping development environment..."
        run_compose "docker-compose.dev.yml" down
        print_success "Development environment stopped"
        ;;
    "restart")
        print_status "Restarting development environment..."
        run_compose "docker-compose.dev.yml" restart "${2:-}"
        print_success "Development environment restarted"
        ;;
    "shell")
        container="${2:-dev-tools}"
        print_status "Opening shell in $container..."
        docker exec -it "$container" /bin/bash
        ;;
    *)
        main
        ;;
esac
