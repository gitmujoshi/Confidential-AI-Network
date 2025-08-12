#!/bin/bash

# One-Command Authentication Fix
# This script fixes all common authentication issues automatically
# Now supports both Blockchain and SCITT CCF modes

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

# Function to check SCITT CCF mode
check_scitt_ccf_mode() {
    if [ -f ".env.scitt-ccf" ]; then
        source .env.scitt-ccf
        echo "🔗 SCITT CCF Mode: $MIGRATION_MODE"
        return 0
    else
        echo "🔗 SCITT CCF Mode: Not configured (using blockchain only)"
        return 1
    fi
}

# Function to start SCITT CCF services if needed
start_scitt_ccf_if_needed() {
    if [ -f ".env.scitt-ccf" ] && [ -f "docker-compose.scitt-ccf-dev.yml" ]; then
        echo ""
        echo "🔗 Starting SCITT CCF services..."
        docker-compose -f docker-compose.scitt-ccf-dev.yml up -d
        
        echo "⏳ Waiting for SCITT CCF services to start..."
        sleep 10
        
        # Check if SCITT CCF is running
        if check_service "SCITT CCF Node" "8000" "http://localhost:8000/app/health"; then
            echo "✅ SCITT CCF services are running"
        else
            echo "⚠️  SCITT CCF services failed to start, continuing with blockchain mode"
        fi
    fi
}

# Step 1: Check Keycloak
echo ""
echo "🔐 Step 1: Checking Keycloak..."
if ! check_service "Keycloak" "8080" "http://localhost:8080/health"; then
    echo "   Starting Keycloak..."
    docker-compose -f docker-compose.keycloak-persistent.yml up -d keycloak postgres
    echo "   Waiting for Keycloak to start..."
    sleep 15
fi

# Step 2: Check SCITT CCF configuration and start services if needed
echo ""
echo "🔍 Step 2: Checking SCITT CCF configuration..."
SCITT_CCF_ENABLED=false
if check_scitt_ccf_mode; then
    SCITT_CCF_ENABLED=true
    start_scitt_ccf_if_needed
fi

# Step 3: Auto-fix Keycloak configuration
echo ""
echo "🔧 Step 3: Auto-fixing Keycloak configuration..."
cd backend
node auto-fix-keycloak.js
cd ..

# Step 4: Sync users
echo ""
echo "🔄 Step 4: Syncing users..."
cd backend
node scripts/source/sync-users-to-keycloak.js
cd ..

# Step 5: Restart backend with new configuration
echo ""
echo "🔧 Step 5: Restarting backend..."
pkill -f "node server.js" || true
sleep 2

# Set environment variables for SCITT CCF if enabled
if [ "$SCITT_CCF_ENABLED" = true ]; then
    export SCITT_CCF_ENABLED=true
    export MIGRATION_MODE=HYBRID
    echo "   Starting with SCITT CCF integration enabled"
else
    export SCITT_CCF_ENABLED=false
    export MIGRATION_MODE=ETHEREUM_ONLY
    echo "   Starting with blockchain mode only"
fi

cd backend
node server.js &
cd ..

# Step 6: Wait and test
echo ""
echo "⏳ Step 6: Waiting for backend to start..."
sleep 5

echo ""
echo "🧪 Step 7: Testing authentication..."
TEST_RESULT=$(curl -s -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"tdc-test@example.com","password":"password123"}' \
    | jq -r '.message // .error // "Unknown error"')

if [ "$TEST_RESULT" = "Login successful" ]; then
    echo "✅ Authentication is working!"
    
    # Test SCITT CCF integration if enabled
    if [ "$SCITT_CCF_ENABLED" = true ]; then
        echo ""
        echo "🔗 Step 8: Testing SCITT CCF integration..."
        cd backend
        
        # Test SCITT CCF health
        SCITT_HEALTH=$(curl -s http://localhost:5001/api/system/health 2>/dev/null | jq -r '.scittCcf.isHealthy // false' 2>/dev/null || echo "false")
        if [ "$SCITT_HEALTH" = "true" ]; then
            echo "✅ SCITT CCF integration is healthy"
        else
            echo "⚠️  SCITT CCF integration health check failed"
        fi
        
        cd ..
    fi
    
    echo ""
    echo "🎉 All authentication issues fixed!"
    echo ""
    echo "📋 Available test users:"
    echo "   TDC: tdc-test@example.com / password123"
    echo "   TDP: tdp-test@example.com / password123"
    echo "   CCRP: ccrp-test@example.com / password123"
    echo "   AppAdmin: appadmin-test@example.com / password123"
    
    if [ "$SCITT_CCF_ENABLED" = true ]; then
        echo ""
        echo "🔗 SCITT CCF Integration:"
        echo "   Migration Mode: HYBRID (both blockchain and SCITT CCF)"
        echo "   Test Integration: ./manage-scitt-ccf.sh test"
        echo "   Switch Mode: ./manage-scitt-ccf.sh switch [MODE]"
        echo "   Service Status: ./manage-scitt-ccf.sh status"
    fi
else
    echo "❌ Authentication still failing: $TEST_RESULT"
    echo ""
    echo "💡 Try running this command again, or manually restart the backend:"
    echo "   pkill -f 'node server.js' && cd backend && node server.js &"
fi 