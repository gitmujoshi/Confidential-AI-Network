#!/bin/bash

# Contract Management System Startup Script
# This script ensures all components are properly configured and started

set -e

echo "🚀 Starting Contract Management System..."

# Function to check if a service is running
check_service() {
    local service_name=$1
    local port=$2
    local url=$3
    
    if curl -s "$url" > /dev/null 2>&1; then
        echo "✅ $service_name is running on port $port"
        return 0
    else
        echo "❌ $service_name is not running on port $port"
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
    
    echo "⏳ Waiting for $service_name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        echo "   Attempt $attempt/$max_attempts..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name failed to start after $max_attempts attempts"
    return 1
}

# Check if we're in the right directory
if [ ! -f "backend/server.js" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Step 1: Start Keycloak with persistent storage
echo ""
echo "🔐 Step 1: Starting Keycloak..."
if ! check_service "Keycloak" "8080" "http://localhost:8080/health"; then
    echo "   Starting Keycloak with persistent storage..."
    docker-compose -f docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.yml up -d ***REMOVED-KEYCLOAK_DB_PASSWORD*** ***REMOVED-DB_PASSWORD***
    
    # Wait for Keycloak to be ready
    wait_for_service "Keycloak" "8080" "http://localhost:8080/health"
fi

# Step 2: Setup Keycloak configuration
echo ""
echo "🔧 Step 2: Setting up Keycloak configuration..."
cd backend
./setup-***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.sh
cd ..

# Step 3: Start backend server
echo ""
echo "🔧 Step 3: Starting backend server..."
if ! check_service "Backend" "5001" "http://localhost:5001/health"; then
    echo "   Starting backend server..."
    cd backend
    pkill -f "node server.js" || true
    sleep 2
    node server.js &
    cd ..
    
    # Wait for backend to be ready
    wait_for_service "Backend" "5001" "http://localhost:5001/health"
fi

# Step 4: Start frontend (if needed)
echo ""
echo "🌐 Step 4: Checking frontend..."
if ! check_service "Frontend" "3000" "http://localhost:3000"; then
    echo "   Frontend is not running. You can start it with:"
    echo "   cd frontend && npm start"
fi

# Step 5: Verify authentication
echo ""
echo "🔐 Step 5: Testing authentication..."
cd backend
TEST_RESULT=$(curl -s -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"tdc-test@example.com","password":"password123"}' \
    | jq -r '.message // .error')

if [ "$TEST_RESULT" = "Login successful" ]; then
    echo "✅ Authentication is working!"
else
    echo "❌ Authentication test failed: $TEST_RESULT"
fi
cd ..

echo ""
echo "🎉 System startup completed!"
echo ""
echo "📋 Service Status:"
check_service "Keycloak" "8080" "http://localhost:8080/health"
check_service "Backend" "5001" "http://localhost:5001/health"
check_service "Frontend" "3000" "http://localhost:3000"
echo ""
echo "🔗 Access URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5001"
echo "   Keycloak Admin: http://localhost:8080/admin/"
echo ""
echo "👤 Test Users:"
echo "   TDC: tdc-test@example.com / password123"
echo "   TDP: tdp-test@example.com / password123"
echo "   CCRP: ccrp-test@example.com / password123"
echo "   AppAdmin: appadmin-test@example.com / password123" 