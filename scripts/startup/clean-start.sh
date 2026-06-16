#!/bin/bash


source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../lib/common.sh"
resolve_repo_root
# Clean Contract Management System Startup Script
# This script starts the system from scratch with minimal dependencies

set -e

echo "🚀 Starting Contract Management System (Clean Setup)..."

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a service is running
check_service() {
    local service_name=$1
    local port=$2
    local url=$3
    
    if curl -s "$url" > /dev/null 2>&1; then
        print_success "$service_name is running on port $port"
        return 0
    else
        print_warning "$service_name is not running on port $port"
        return 1
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local service_name=$1
    local port=$2
    local url=$3
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start after $((max_attempts * 2)) seconds"
    return 1
}

# Step 1: Stop any existing services
print_status "Step 1: Cleaning up existing services..."
run_compose "docker-compose.main.yml" down --remove-orphans 2>/dev/null || true
run_compose "docker-compose.scitt-ccf-dev.yml" down --remove-orphans 2>/dev/null || true

# Kill any existing Node.js processes
pkill -f "node server.js" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true

# Step 2: Start core services (databases + Keycloak)
print_status "Step 2: Starting core services..."
run_compose "docker-compose.main.yml" up -d

# Wait for databases to be ready
print_status "Waiting for databases to be ready..."
wait_for_service "Main Database" "5432" "http://localhost:5432" || {
    print_warning "Database health check failed, but continuing..."
}

# Wait for Keycloak to be ready
wait_for_service "Keycloak" "8080" "http://localhost:8080/health"

# Step 3: Setup Keycloak (if needed)
print_status "Step 3: Setting up Keycloak configuration..."
cd backend
if [ -f "setup-***REMOVED-KEYCLOAK_DB_PASSWORD***-simple.js" ]; then
    node setup-***REMOVED-KEYCLOAK_DB_PASSWORD***-simple.js
else
    print_warning "Keycloak setup script not found, skipping..."
fi
cd ..

# Step 4: Setup database tables
print_status "Step 4: Setting up database tables..."
cd backend
if [ -f "run-migrations.js" ]; then
    node run-migrations.js
else
    print_warning "Migration script not found, skipping..."
fi
cd ..

# Step 5: Start backend
print_status "Step 5: Starting backend server..."
cd backend
node server.js &
BACKEND_PID=$!
echo $BACKEND_PID > ../.backend.pid
cd ..

# Wait for backend to be ready
wait_for_service "Backend" "5001" "http://localhost:5001/health"

# Step 6: Start frontend
print_status "Step 6: Starting frontend..."
cd frontend
npm start &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../.frontend.pid
cd ..

# Wait for frontend to be ready
wait_for_service "Frontend" "3000" "http://localhost:3000"

# Final status check
echo ""
print_success "🎉 System startup completed!"
echo ""
echo "📊 Service Status:"
echo "=================="

# Check each service
services=(
    "Keycloak:8080:http://localhost:8080/health"
    "Backend:5001:http://localhost:5001/health"
    "Frontend:3000:http://localhost:3000"
)

for service in "${services[@]}"; do
    IFS=':' read -r name port url <<< "$service"
    if check_service "$name" "$port" "$url"; then
        echo -e "  ${GREEN}✅${NC} $name (http://localhost:$port)"
    else
        echo -e "  ${RED}❌${NC} $name (http://localhost:$port)"
    fi
done

echo ""
echo "🔗 Access URLs:"
echo "==============="
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:5001/api"
echo "  Keycloak Admin: http://localhost:8080 (admin/***REMOVED-KEYCLOAK_ADMIN_PASSWORD***)"
echo ""
echo "👤 Test Users:"
echo "   TDC: tdc-test@example.com / password123"
echo "   TDP: tdp-test@example.com / password123"
echo "   CCRP: ccrp-test@example.com / password123"
echo "   AppAdmin: appadmin-test@example.com / password123"
echo ""
echo "🛑 To stop all services, run: ./clean-stop.sh"
echo ""
print_success "Contract Management System is ready! 🚀"
