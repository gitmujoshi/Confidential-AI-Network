#!/bin/bash

# Test System Script
# This script tests the system components and creates test data

set -e

# Load centralized configuration
if [ -f "config.env" ]; then
    source config.env
fi

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing Contract Management System${NC}"
echo "=================================="

# Test 1: Check if services are running
echo -e "\n${BLUE}📊 Step 1: Checking service status...${NC}"

# Check Keycloak
if curl -k -s "${KEYCLOAK_URL:-https://localhost:8443}/realms/master" > /dev/null 2>&1; then
    echo -e "  Keycloak: ${GREEN}✅ Running${NC}"
else
    echo -e "  Keycloak: ${RED}❌ Not accessible${NC}"
fi

# Check Backend
if curl -s "http://localhost:${BACKEND_PORT:-5001}/health" > /dev/null 2>&1; then
    echo -e "  Backend: ${GREEN}✅ Running${NC}"
else
    echo -e "  Backend: ${RED}❌ Not accessible${NC}"
fi

# Check Frontend
if curl -s "http://localhost:${FRONTEND_PORT:-3000}" > /dev/null 2>&1; then
    echo -e "  Frontend: ${GREEN}✅ Running${NC}"
else
    echo -e "  Frontend: ${RED}❌ Not accessible${NC}"
fi

# Check SCITT CCF
if curl -s "${SCITT_CCF_URL:-http://localhost:8000}/app/health" > /dev/null 2>&1; then
    echo -e "  SCITT CCF: ${GREEN}✅ Running${NC}"
else
    echo -e "  SCITT CCF: ${RED}❌ Not accessible${NC}"
fi

# Test 2: Create test data
echo -e "\n${BLUE}📝 Step 2: Creating test data...${NC}"

if [ -f "deployment/create-test-data.sh" ]; then
    echo "  Running test data creation script..."
    if ./deployment/create-test-data.sh; then
        echo -e "  Test data: ${GREEN}✅ Created${NC}"
    else
        echo -e "  Test data: ${RED}❌ Failed${NC}"
    fi
else
    echo -e "  Test data script: ${YELLOW}⚠️ Not found${NC}"
fi

# Test 3: Run sanity tests
echo -e "\n${BLUE}🔍 Step 3: Running sanity tests...${NC}"

# Test backend health
echo "  Testing backend health..."
BACKEND_HEALTH=$(curl -s "http://localhost:${BACKEND_PORT:-5001}/health" 2>/dev/null || echo "FAILED")
if echo "$BACKEND_HEALTH" | grep -q "healthy"; then
    echo -e "  Backend health: ${GREEN}✅ Healthy${NC}"
else
    echo -e "  Backend health: ${RED}❌ Failed${NC}"
fi

# Test authentication
echo "  Testing authentication..."
AUTH_RESPONSE=$(curl -s -X POST "http://localhost:${BACKEND_PORT:-5001}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@contractmanagement.com","password":"***REMOVED-KEYCLOAK_ADMIN_PASSWORD***"}' 2>/dev/null || echo "FAILED")

if echo "$AUTH_RESPONSE" | grep -q "accessToken\|token"; then
    echo -e "  Authentication: ${GREEN}✅ Working${NC}"
else
    echo -e "  Authentication: ${RED}❌ Failed${NC}"
fi

# Test users API
echo "  Testing users API..."
USERS_RESPONSE=$(curl -s "http://localhost:${BACKEND_PORT:-5001}/api/users" 2>/dev/null || echo "FAILED")
if echo "$USERS_RESPONSE" | grep -q "\["; then
    echo -e "  Users API: ${GREEN}✅ Working${NC}"
else
    echo -e "  Users API: ${RED}❌ Failed${NC}"
fi

# Test datasets API
echo "  Testing datasets API..."
DATASETS_RESPONSE=$(curl -s "http://localhost:${BACKEND_PORT:-5001}/api/datasets" 2>/dev/null || echo "FAILED")
if echo "$DATASETS_RESPONSE" | grep -q "\["; then
    echo -e "  Datasets API: ${GREEN}✅ Working${NC}"
else
    echo -e "  Datasets API: ${RED}❌ Failed${NC}"
fi

# Test AI models API
echo "  Testing AI models API..."
MODELS_RESPONSE=$(curl -s "http://localhost:${BACKEND_PORT:-5001}/api/ai-models" 2>/dev/null || echo "FAILED")
if echo "$MODELS_RESPONSE" | grep -q "\["; then
    echo -e "  AI Models API: ${GREEN}✅ Working${NC}"
else
    echo -e "  AI Models API: ${RED}❌ Failed${NC}"
fi

echo -e "\n${BLUE}🎉 System test completed!${NC}"
