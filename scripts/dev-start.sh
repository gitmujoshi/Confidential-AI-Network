#!/bin/bash

# Development Environment Startup Script
# This script starts all services for local development

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
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running in correct directory
if [ ! -f "package.json" ]; then
    error "Please run this script from the project root directory"
fi

# Check if config file exists
if [ ! -f "config.local.env" ]; then
    warning "config.local.env not found, creating from example..."
    cp config.env.example config.local.env
    warning "Please edit config.local.env with your local settings"
fi

# Load environment variables
if [ -f "config.local.env" ]; then
    export $(cat config.local.env | grep -v '^#' | xargs)
fi

log "Starting AI Model Training Environment - Development Mode"

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is required but not installed"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is required but not installed"
    fi
    
    # Check Docker (optional)
    if ! command -v docker &> /dev/null; then
        warning "Docker not found, some services may not work"
    fi
    
    success "Prerequisites check completed"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install backend dependencies
    if [ -d "backend" ]; then
        log "Installing backend dependencies..."
        cd backend && npm install && cd ..
    fi
    
    # Install frontend dependencies
    if [ -d "frontend" ]; then
        log "Installing frontend dependencies..."
        cd frontend && npm install && cd ..
    fi
    
    # Install gateway dependencies
    if [ -d "gateway" ]; then
        log "Installing gateway dependencies..."
        cd gateway && npm install && cd ..
    fi
    
    success "Dependencies installed"
}

# Start database services
start_database() {
    log "Starting database services..."
    
    # Check if Docker is available
    if command -v docker &> /dev/null; then
        # Start PostgreSQL with Docker
        if ! docker ps | grep -q "contract-management-db"; then
            log "Starting PostgreSQL container..."
            docker run --name contract-management-db \
                -e POSTGRES_DB=${DB_NAME:-contract_management_dev} \
                -e POSTGRES_USER=${DB_USER:-***REMOVED-DB_PASSWORD***} \
                -e POSTGRES_PASSWORD=${DB_PASSWORD:-password} \
                -p ${DB_PORT:-5432}:5432 \
                -d ***REMOVED-DB_PASSWORD***:13
            
            # Wait for database to be ready
            log "Waiting for database to be ready..."
            sleep 10
        else
            log "PostgreSQL container already running"
        fi
        
        # Start Redis with Docker
        if ! docker ps | grep -q "contract-management-redis"; then
            log "Starting Redis container..."
            docker run --name contract-management-redis \
                -p ${REDIS_PORT:-6379}:6379 \
                -d redis:6-alpine
        else
            log "Redis container already running"
        fi
    else
        warning "Docker not available, assuming local database services are running"
    fi
    
    success "Database services started"
}

# Setup database
setup_database() {
    log "Setting up database..."
    
    if [ -d "backend" ]; then
        cd backend
        
        # Run migrations
        log "Running database migrations..."
        npm run db:migrate || warning "Migration failed, continuing..."
        
        # Seed development data
        log "Seeding development data..."
        npm run db:seed || warning "Seeding failed, continuing..."
        
        cd ..
    fi
    
    success "Database setup completed"
}

# Start backend services
start_backend() {
    log "Starting backend services..."
    
    if [ -d "backend" ]; then
        cd backend
        
        # Start backend in background
        log "Starting backend API server..."
        npm run dev &
        BACKEND_PID=$!
        echo $BACKEND_PID > ../.backend.pid
        
        # Wait for backend to start
        log "Waiting for backend to start..."
        sleep 5
        
        # Check if backend is running
        if ps -p $BACKEND_PID > /dev/null; then
            success "Backend started (PID: $BACKEND_PID)"
        else
            error "Backend failed to start"
        fi
        
        cd ..
    else
        warning "Backend directory not found"
    fi
}

# Start frontend
start_frontend() {
    log "Starting frontend..."
    
    if [ -d "frontend" ]; then
        cd frontend
        
        # Start frontend in background
        log "Starting frontend development server..."
        npm start &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > ../.frontend.pid
        
        # Wait for frontend to start
        log "Waiting for frontend to start..."
        sleep 10
        
        # Check if frontend is running
        if ps -p $FRONTEND_PID > /dev/null; then
            success "Frontend started (PID: $FRONTEND_PID)"
        else
            error "Frontend failed to start"
        fi
        
        cd ..
    else
        warning "Frontend directory not found"
    fi
}

# Start gateway
start_gateway() {
    log "Starting gateway..."
    
    if [ -d "gateway" ]; then
        cd gateway
        
        # Start gateway in background
        log "Starting API gateway..."
        npm start &
        GATEWAY_PID=$!
        echo $GATEWAY_PID > ../.gateway.pid
        
        # Wait for gateway to start
        log "Waiting for gateway to start..."
        sleep 5
        
        # Check if gateway is running
        if ps -p $GATEWAY_PID > /dev/null; then
            success "Gateway started (PID: $GATEWAY_PID)"
        else
            error "Gateway failed to start"
        fi
        
        cd ..
    else
        warning "Gateway directory not found"
    fi
}

# Verify services
verify_services() {
    log "Verifying services..."
    
    # Check backend
    if curl -s http://localhost:${API_PORT:-3001}/health > /dev/null; then
        success "Backend API is responding"
    else
        warning "Backend API is not responding"
    fi
    
    # Check frontend
    if curl -s http://localhost:${FRONTEND_PORT:-3000} > /dev/null; then
        success "Frontend is responding"
    else
        warning "Frontend is not responding"
    fi
    
    # Check gateway
    if curl -s http://localhost:${GATEWAY_PORT:-8080}/health > /dev/null; then
        success "Gateway is responding"
    else
        warning "Gateway is not responding"
    fi
}

# Display access information
display_access_info() {
    echo ""
    echo "🎉 Development environment started successfully!"
    echo ""
    echo "📊 Access URLs:"
    echo "  - Frontend: http://localhost:${FRONTEND_PORT:-3000}"
    echo "  - Backend API: http://localhost:${API_PORT:-3001}"
    echo "  - Gateway: http://localhost:${GATEWAY_PORT:-8080}"
    echo "  - API Health: http://localhost:${API_PORT:-3001}/health"
    echo ""
    echo "🔧 Management Commands:"
    echo "  - Stop services: ./scripts/dev-stop.sh"
    echo "  - View logs: ./scripts/dev-logs.sh"
    echo "  - Check status: ./scripts/dev-status.sh"
    echo "  - Restart services: ./scripts/dev-restart.sh"
    echo ""
    echo "📚 Documentation:"
    echo "  - Developer Guide: docs/development/DEVELOPER_GUIDE.md"
    echo "  - Local Setup: docs/development/LOCAL_DEVELOPMENT_SETUP.md"
    echo "  - Testing Guide: docs/development/TESTING_GUIDE.md"
    echo ""
    echo "💡 Tips:"
    echo "  - Check logs if services don't start properly"
    echo "  - Use 'npm test' to run tests"
    echo "  - Use 'npm run dev:debug' for debugging"
    echo ""
}

# Cleanup function
cleanup() {
    log "Cleaning up on exit..."
    
    # Kill background processes
    if [ -f ".backend.pid" ]; then
        kill $(cat .backend.pid) 2>/dev/null || true
        rm -f .backend.pid
    fi
    
    if [ -f ".frontend.pid" ]; then
        kill $(cat .frontend.pid) 2>/dev/null || true
        rm -f .frontend.pid
    fi
    
    if [ -f ".gateway.pid" ]; then
        kill $(cat .gateway.pid) 2>/dev/null || true
        rm -f .gateway.pid
    fi
}

# Set up signal handlers
trap cleanup EXIT INT TERM

# Main execution
main() {
    log "Starting development environment setup..."
    
    check_prerequisites
    install_dependencies
    start_database
    setup_database
    start_backend
    start_frontend
    start_gateway
    verify_services
    display_access_info
    
    success "Development environment started successfully!"
    
    # Keep script running
    log "Press Ctrl+C to stop all services"
    wait
}

# Run main function
main "$@"
