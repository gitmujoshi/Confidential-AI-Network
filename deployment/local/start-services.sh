#!/bin/bash

# Contract Management System - Complete Service Startup Script
# This script starts all services: Keycloak, Blockchain, Backend, and Frontend

set -e  # Exit on any error

echo "🚀 Starting Contract Management System with all services..."

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
    
    print_error "$service_name failed to start within $((max_attempts * 2)) seconds"
    return 1
}

# Function to kill process by PID file
kill_by_pid_file() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            print_status "Stopping $service_name (PID: $pid)..."
            kill $pid 2>/dev/null || true
            rm -f "$pid_file"
        fi
    fi
}

# Create logs directory
mkdir -p ../../logs

# Stop any existing services
print_status "Stopping any existing services..."
./stop-services.sh 2>/dev/null || true

# Step 1: Start Keycloak
print_status "Step 1: Starting Keycloak IAM..."
if check_port 8080; then
    print_warning "Port 8080 is already in use. Skipping Keycloak startup."
else
    print_status "Starting Keycloak on port 8080..."
    
    # Check if Docker is available
    if command -v docker &> /dev/null; then
        docker run -d \
            --name keycloak-cms \
            -p 8080:8080 \
            -e KEYCLOAK_ADMIN=admin \
            -e KEYCLOAK_ADMIN_PASSWORD=admin123 \
            -e KC_HEALTH_ENABLED=true \
            quay.io/keycloak/keycloak:latest start-dev > ../../logs/keycloak.log 2>&1 &
        
        echo $! > ../../.keycloak.pid
        print_success "Keycloak started with Docker (PID: $(cat ../../.keycloak.pid))"
    else
        print_error "Docker not found. Please install Docker to run Keycloak."
        print_warning "Continuing without Keycloak..."
    fi
fi

# Wait for Keycloak to be ready
if [ -f ".keycloak.pid" ]; then
    wait_for_service "http://localhost:8080/health" "Keycloak"
fi

# Step 2: Start Blockchain (Hardhat)
print_status "Step 2: Starting Blockchain (Hardhat)..."
if check_port 8545; then
    print_warning "Port 8545 is already in use. Skipping Hardhat startup."
else
    print_status "Starting Hardhat blockchain on port 8545..."
    cd ../../blockchain
    npx hardhat node > ../../logs/hardhat.log 2>&1 &
    echo $! > ../../.hardhat.pid
    cd ../..
    print_success "Hardhat started (PID: $(cat .hardhat.pid))"
fi

# Wait for blockchain to be ready
if [ -f ".hardhat.pid" ]; then
    wait_for_service "http://127.0.0.1:8545" "Blockchain"
fi

# Step 3: Start Backend
print_status "Step 3: Starting Backend API..."
if check_port 5001; then
    print_warning "Port 5001 is already in use. Skipping backend startup."
else
    print_status "Starting backend on port 5001..."
    cd ../../backend
    
    # Enable blockchain in config
    sed -i '' 's/BLOCKCHAIN_ENABLED=false/BLOCKCHAIN_ENABLED=true/' config.env
    
    node server.js > ../../logs/backend.log 2>&1 &
    echo $! > ../../.backend.pid
    cd ../..
    print_success "Backend started (PID: $(cat .backend.pid))"
fi

# Wait for backend to be ready
if [ -f ".backend.pid" ]; then
    wait_for_service "http://localhost:5001/health" "Backend"
fi

# Step 4: Start Frontend
print_status "Step 4: Starting Frontend..."
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

cd ../../frontend
npm start > ../../logs/frontend.log 2>&1 &
echo $! > ../../.frontend.pid
cd ../..
print_success "Frontend started (PID: $(cat .frontend.pid))"

# Wait for frontend to be ready
if [ -f ".frontend.pid" ]; then
    local frontend_port=${PORT:-3000}
    wait_for_service "http://localhost:$frontend_port" "Frontend"
fi

# Final status check
echo ""
print_success "🎉 All services started successfully!"
echo ""
echo "📊 Service Status:"
echo "=================="

# Check each service
services=(
    "Keycloak:http://localhost:8080:8080"
    "Blockchain:http://127.0.0.1:8545:8545"
    "Backend:http://localhost:5001/health:5001"
    "Frontend:http://localhost:${PORT:-3000}:${PORT:-3000}"
)

for service in "${services[@]}"; do
    IFS=':' read -r name url port <<< "$service"
    if check_port $port; then
        echo -e "  ${GREEN}✅${NC} $name (http://localhost:$port)"
    else
        echo -e "  ${RED}❌${NC} $name (http://localhost:$port)"
    fi
done

echo ""
echo "🔗 Access URLs:"
echo "==============="
echo "  Frontend: http://localhost:${PORT:-3000}"
echo "  Backend API: http://localhost:5001/api"
echo "  Keycloak Admin: http://localhost:8080 (admin/admin123)"
echo "  Blockchain: http://127.0.0.1:8545"
echo ""
echo "📝 Logs are available in the 'logs/' directory"
echo "🛑 To stop all services, run: ./stop-services.sh"
echo ""
print_success "Contract Management System is ready! 🚀" 