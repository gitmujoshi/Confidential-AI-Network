#!/bin/bash

# One-Command Authentication Fix
# This script fixes all common authentication issues automatically

set -e

echo "🔧 Fixing Authentication Issues..."
echo "=================================="

# Function to check if a service is running
check_service() {
    local service_name=$1
    local port=$2
    local url=$3
    
    if curl -s "$url" > /dev/null 2>&1; then
        echo "✅ $service_name is running"
        return 0
    else
        echo "❌ $service_name is not running"
        return 1
    fi
}

# Step 1: Check Keycloak
echo ""
echo "🔐 Step 1: Checking Keycloak..."
if ! check_service "Keycloak" "8080" "http://localhost:8080/health"; then
    echo "   Starting Keycloak..."
    docker-compose -f docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.yml up -d ***REMOVED-KEYCLOAK_DB_PASSWORD*** ***REMOVED-DB_PASSWORD***
    echo "   Waiting for Keycloak to start..."
    sleep 15
fi

# Step 2: Auto-fix Keycloak configuration
echo ""
echo "🔧 Step 2: Auto-fixing Keycloak configuration..."
cd backend
node auto-fix-***REMOVED-KEYCLOAK_DB_PASSWORD***.js
cd ..

# Step 3: Sync users
echo ""
echo "🔄 Step 3: Syncing users..."
cd backend
node scripts/source/sync-users-to-***REMOVED-KEYCLOAK_DB_PASSWORD***.js
cd ..

# Step 4: Restart backend with new configuration
echo ""
echo "🔧 Step 4: Restarting backend..."
pkill -f "node server.js" || true
sleep 2
cd backend
node server.js &
cd ..

# Step 5: Wait and test
echo ""
echo "⏳ Step 5: Waiting for backend to start..."
sleep 5

echo ""
echo "🧪 Step 6: Testing authentication..."
TEST_RESULT=$(curl -s -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"tdc-test@example.com","password":"password123"}' \
    | jq -r '.message // .error // "Unknown error"')

if [ "$TEST_RESULT" = "Login successful" ]; then
    echo "✅ Authentication is working!"
    echo ""
    echo "🎉 All authentication issues fixed!"
    echo ""
    echo "📋 Available test users:"
    echo "   TDC: tdc-test@example.com / password123"
    echo "   TDP: tdp-test@example.com / password123"
    echo "   CCRP: ccrp-test@example.com / password123"
    echo "   AppAdmin: appadmin-test@example.com / password123"
else
    echo "❌ Authentication still failing: $TEST_RESULT"
    echo ""
    echo "💡 Try running this command again, or manually restart the backend:"
    echo "   pkill -f 'node server.js' && cd backend && node server.js &"
fi 