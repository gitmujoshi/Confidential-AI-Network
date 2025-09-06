#!/bin/bash

# Contract Management System - Backend Only Startup Script
# This script starts only the backend service without blockchain

set -e  # Exit on any error

echo "🚀 Starting Contract Management Backend (without blockchain)..."

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

# Create logs directory
mkdir -p ../../logs

# Stop any existing backend
print_status "Stopping any existing backend..."
if [ -f "../.backend.pid" ]; then
    pid=$(cat "../.backend.pid")
    if ps -p $pid > /dev/null 2>&1; then
        print_status "Stopping backend (PID: $pid)..."
        kill $pid 2>/dev/null || true
        rm -f "../.backend.pid"
    fi
fi

# Start Backend
print_status "Starting Backend API..."
if check_port 5001; then
    print_warning "Port 5001 is already in use. Skipping backend startup."
else
    print_status "Starting backend on port 5001 (blockchain disabled)..."
    cd backend
    
    # Load centralized configuration
    source ../config.env
    
    # Start backend with blockchain disabled
    BLOCKCHAIN_ENABLED=false node server.js > ../../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../../.backend.pid
    cd ../deployment/local
    print_success "Backend started (PID: $BACKEND_PID)"
fi

# Wait for backend to be ready
if [ -f "../../.backend.pid" ]; then
    wait_for_service "http://localhost:${BACKEND_PORT:-5001}/health" "Backend"
fi

# Final status check
echo ""
print_success "🎉 Backend started successfully!"
echo ""
echo "📊 Service Status:"
echo "=================="

if check_port ${BACKEND_PORT:-5001}; then
    echo -e "  ${GREEN}✅${NC} Backend (http://localhost:${BACKEND_PORT:-5001})"
else
    echo -e "  ${RED}❌${NC} Backend (http://localhost:${BACKEND_PORT:-5001})"
fi

echo ""
echo "🔗 Access URLs:"
echo "==============="
echo "  Backend API: http://localhost:${BACKEND_PORT:-5001}/api"
echo "  Health Check: http://localhost:${BACKEND_PORT:-5001}/health"
echo ""
echo "📝 Logs are available in the 'logs/backend.log' file"
echo "🛑 To stop the backend, run: kill \$(cat ../../.backend.pid)"
echo ""
print_success "Backend is ready! 🚀" 