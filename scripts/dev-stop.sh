#!/bin/bash

# Development Environment Stop Script
# This script stops all development services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log "Stopping AI Model Training Environment - Development Mode"

# Stop backend services
stop_backend() {
    log "Stopping backend services..."
    
    if [ -f ".backend.pid" ]; then
        BACKEND_PID=$(cat .backend.pid)
        if ps -p $BACKEND_PID > /dev/null; then
            log "Stopping backend (PID: $BACKEND_PID)..."
            kill $BACKEND_PID
            success "Backend stopped"
        else
            warning "Backend process not found"
        fi
        rm -f .backend.pid
    else
        warning "Backend PID file not found"
    fi
}

# Stop frontend
stop_frontend() {
    log "Stopping frontend..."
    
    if [ -f ".frontend.pid" ]; then
        FRONTEND_PID=$(cat .frontend.pid)
        if ps -p $FRONTEND_PID > /dev/null; then
            log "Stopping frontend (PID: $FRONTEND_PID)..."
            kill $FRONTEND_PID
            success "Frontend stopped"
        else
            warning "Frontend process not found"
        fi
        rm -f .frontend.pid
    else
        warning "Frontend PID file not found"
    fi
}

# Stop gateway
stop_gateway() {
    log "Stopping gateway..."
    
    if [ -f ".gateway.pid" ]; then
        GATEWAY_PID=$(cat .gateway.pid)
        if ps -p $GATEWAY_PID > /dev/null; then
            log "Stopping gateway (PID: $GATEWAY_PID)..."
            kill $GATEWAY_PID
            success "Gateway stopped"
        else
            warning "Gateway process not found"
        fi
        rm -f .gateway.pid
    else
        warning "Gateway PID file not found"
    fi
}

# Stop database services
stop_database() {
    log "Stopping database services..."
    
    # Stop PostgreSQL container
    if docker ps | grep -q "contract-management-db"; then
        log "Stopping PostgreSQL container..."
        docker stop contract-management-db
        success "PostgreSQL container stopped"
    else
        warning "PostgreSQL container not running"
    fi
    
    # Stop Redis container
    if docker ps | grep -q "contract-management-redis"; then
        log "Stopping Redis container..."
        docker stop contract-management-redis
        success "Redis container stopped"
    else
        warning "Redis container not running"
    fi
}

# Clean up processes
cleanup_processes() {
    log "Cleaning up any remaining processes..."
    
    # Kill any remaining Node.js processes
    pkill -f "node.*server.js" || true
    pkill -f "npm.*start" || true
    pkill -f "npm.*dev" || true
    
    # Clean up PID files
    rm -f .backend.pid .frontend.pid .gateway.pid
    
    success "Process cleanup completed"
}

# Main execution
main() {
    log "Stopping development environment..."
    
    stop_backend
    stop_frontend
    stop_gateway
    stop_database
    cleanup_processes
    
    success "Development environment stopped successfully!"
    echo ""
    echo "💡 To start again, run: ./scripts/dev-start.sh"
}

# Run main function
main "$@"
