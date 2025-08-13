#!/bin/bash

# Contract Management System - SCITT CCF Integrated Startup Script
# This script starts all services with proper SCITT CCF integration

set -e

echo "🚀 Starting Contract Management System with SCITT CCF Integration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start after $max_attempts attempts"
    return 1
}

# Store the script directory for later use
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

print_status "Project root: $PROJECT_ROOT"

# Step 1: Stop any existing services
print_status "Step 1: Stopping existing services..."
./stop-services.sh 2>/dev/null || true

# Step 2: Start Main Database and Keycloak
print_status "Step 2: Starting Main Database and Keycloak..."
cd "$PROJECT_ROOT"

if command -v docker &> /dev/null; then
    # Start main services
    docker-compose -f docker-compose.main.yml up -d ***REMOVED-DB_PASSWORD***-app ***REMOVED-DB_PASSWORD***-***REMOVED-KEYCLOAK_DB_PASSWORD*** ***REMOVED-KEYCLOAK_DB_PASSWORD***
    
    # Wait for main database to be ready
    print_status "Waiting for main database to be ready..."
    wait_for_service "http://localhost:5432" "Main Database"
    
    # Wait for Keycloak to be ready
    print_status "Waiting for Keycloak to be ready..."
    wait_for_service "http://localhost:8080/health" "Keycloak"
    
    print_success "Main database and Keycloak started successfully"
else
    print_error "Docker not found. Please install Docker."
    exit 1
fi

# Step 3: Start SCITT CCF Services
print_status "Step 3: Starting SCITT CCF Services..."
if command -v docker &> /dev/null; then
    # Start SCITT CCF services
    docker-compose -f docker-compose.scitt-ccf-dev.yml up -d
    
    # Wait for SCITT CCF node to be ready
    print_status "Waiting for SCITT CCF node to be ready..."
    wait_for_service "http://localhost:8000/app/health" "SCITT CCF Node"
    
    print_success "SCITT CCF services started successfully"
else
    print_error "Docker not found. Please install Docker."
    exit 1
fi

# Step 4: Setup Keycloak Configuration
print_status "Step 4: Setting up Keycloak configuration..."
cd "$SCRIPT_DIR"
if [ -f "setup-***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.sh" ]; then
    ./setup-***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.sh
    print_success "Keycloak configuration completed"
else
    print_warning "Keycloak setup script not found, skipping configuration"
fi

# Step 5: Start Backend
print_status "Step 5: Starting Backend API..."
if check_port 5001; then
    print_warning "Port 5001 is already in use. Skipping backend startup."
else
    print_status "Starting backend on port 5001..."
    cd "$PROJECT_ROOT/backend"
    
    # Set SCITT CCF mode
    export MIGRATION_MODE=SCITT_CCF_ONLY
    
    # Start the backend
    npm start > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
    echo $! > "$PROJECT_ROOT/.backend.pid"
    
    cd "$SCRIPT_DIR"
    print_success "Backend started (PID: $(cat "$PROJECT_ROOT/.backend.pid"))"
    
    # Wait for backend to be ready
    print_status "Waiting for backend to be ready..."
    wait_for_service "http://localhost:5001/health" "Backend"
fi

# Step 6: Start Frontend
print_status "Step 6: Starting Frontend..."
if check_port 3000; then
    print_warning "Port 3000 is already in use. Trying port 3001..."
    if check_port 3001; then
        print_error "Both ports 3000 and 3001 are in use. Please free up a port."
        exit 1
    else
        export PORT=3001
        print_status "Starting frontend on port 3001..."
    fi
else
    print_status "Starting frontend on port 3000..."
fi

cd "$PROJECT_ROOT/frontend"
npm start > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
echo $! > "$PROJECT_ROOT/.frontend.pid"
cd "$SCRIPT_DIR"
print_success "Frontend started (PID: $(cat "$PROJECT_ROOT/.frontend.pid"))"

# Wait for frontend to be ready
if [ -f "$PROJECT_ROOT/.frontend.pid" ]; then
    local frontend_port=${PORT:-3000}
    wait_for_service "http://localhost:$frontend_port" "Frontend"
fi

# Step 7: Display Status
print_success "🎉 Contract Management System with SCITT CCF Integration started successfully!"
echo ""
echo "📊 Service Status:"
echo "   Main Database: http://localhost:5432 ✅"
echo "   Keycloak: http://localhost:8080 ✅"
echo "   SCITT CCF Node: http://localhost:8000 ✅"
echo "   SCITT CCF Dashboard: http://localhost:8082 ✅"
echo "   Backend API: http://localhost:5001 ✅"
echo "   Frontend: http://localhost:${PORT:-3000} ✅"
echo ""
echo "🔗 SCITT CCF Integration:"
echo "   Migration Mode: SCITT_CCF_ONLY"
echo "   API Endpoints: /api/scitt-ccf/*"
echo "   Dashboard: Admin → SCITT CCF Dashboard"
echo ""
echo "📝 Next Steps:"
echo "   1. Access the frontend at http://localhost:${PORT:-3000}"
echo "   2. Login with admin credentials"
echo "   3. Navigate to Admin → SCITT CCF Dashboard"
echo "   4. Test SCITT CCF integration"
echo ""
echo "🛑 To stop all services: ./stop-services.sh"
echo "📊 To check status: ./status.sh"
