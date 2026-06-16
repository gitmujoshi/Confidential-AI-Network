#!/bin/bash


source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../lib/common.sh"
resolve_repo_root
# Clean Contract Management System Stop Script

echo "🛑 Stopping Contract Management System..."

# Load centralized configuration
if [ -f "config.env" ]; then
    echo "✅ Loading centralized configuration from config.env"
    source config.env
else
    echo "❌ Centralized configuration file not found: config.env"
    echo "⚠️ Please ensure config.env exists"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Stop Docker services
print_status "Stopping Docker services..."
run_compose "docker-compose.main.yml" down 2>/dev/null || true
run_compose "docker-compose.scitt-ccf-dev.yml" down 2>/dev/null || true

# Stop Node.js processes
print_status "Stopping Node.js processes..."
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID 2>/dev/null || true
        print_success "Backend stopped (PID: $BACKEND_PID)"
    fi
    rm -f .backend.pid
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID 2>/dev/null || true
        print_success "Frontend stopped (PID: $FRONTEND_PID)"
    fi
    rm -f .frontend.pid
fi

# Kill any remaining Node.js processes
pkill -f "node server.js" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true

print_success "All services stopped!"
