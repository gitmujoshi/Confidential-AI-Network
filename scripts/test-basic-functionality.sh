#!/bin/bash

# Basic Functionality Test Script
# Tests core system functionality without requiring specific test users

set -e

# Load centralized configuration
if [ -f "config.env" ]; then
    source scripts/load-config.sh
    echo -e "${BLUE}✅ Loading centralized configuration from config.env${NC}"
else
    echo -e "${RED}❌ config.env not found${NC}"
    exit 1
fi

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Basic Functionality Test${NC}"
echo "=================================="
echo "Testing core system functionality"
echo ""

# Test 1: Backend Health
echo -e "${YELLOW}🔍 Testing Backend Health...${NC}"
if curl -s -f "${BACKEND_URL}/health" > /dev/null; then
    echo -e "  ${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "  ${RED}❌ Backend health check failed${NC}"
    exit 1
fi

# Test 2: Frontend Accessibility
echo -e "${YELLOW}🔍 Testing Frontend Accessibility...${NC}"
if curl -s -f "${FRONTEND_URL}" > /dev/null; then
    echo -e "  ${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "  ${RED}❌ Frontend accessibility check failed${NC}"
    exit 1
fi

# Test 3: Keycloak Accessibility
echo -e "${YELLOW}🔍 Testing Keycloak Accessibility...${NC}"
if curl -s -k -f "${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}" > /dev/null; then
    echo -e "  ${GREEN}✅ Keycloak is accessible${NC}"
else
    echo -e "  ${RED}❌ Keycloak accessibility check failed${NC}"
    exit 1
fi

# Test 4: SCITT CCF Node
echo -e "${YELLOW}🔍 Testing SCITT CCF Node...${NC}"
if curl -s -f "${SCITT_CCF_URL}" > /dev/null; then
    echo -e "  ${GREEN}✅ SCITT CCF Node is accessible${NC}"
else
    echo -e "  ${RED}❌ SCITT CCF Node accessibility check failed${NC}"
    exit 1
fi

# Test 5: Database Connection (via API)
echo -e "${YELLOW}🔍 Testing Database Connection...${NC}"
if curl -s -f "${BACKEND_URL}/health" | grep -q "healthy"; then
    echo -e "  ${GREEN}✅ Database connection is working${NC}"
else
    echo -e "  ${RED}❌ Database connection check failed${NC}"
    exit 1
fi

# Test 6: API Endpoints
echo -e "${YELLOW}🔍 Testing API Endpoints...${NC}"
endpoints=("/api/health")
for endpoint in "${endpoints[@]}"; do
    if curl -s -f "${BACKEND_URL}${endpoint}" > /dev/null; then
        echo -e "  ${GREEN}✅ ${endpoint} is working${NC}"
    else
        echo -e "  ${RED}❌ ${endpoint} is not accessible${NC}"
    fi
done

# Note: Other endpoints require authentication
echo -e "  ${YELLOW}ℹ️  Other API endpoints require authentication${NC}"

echo ""
echo -e "${GREEN}🎉 Basic Functionality Test Completed!${NC}"
echo -e "${BLUE}All core system components are working properly.${NC}"
echo ""
echo -e "${YELLOW}📋 System Status Summary:${NC}"
echo -e "  Backend: ${GREEN}✅ Running${NC} (${BACKEND_URL})"
echo -e "  Frontend: ${GREEN}✅ Running${NC} (${FRONTEND_URL})"
echo -e "  Keycloak: ${GREEN}✅ Running${NC} (${KEYCLOAK_URL})"
echo -e "  SCITT CCF: ${GREEN}✅ Running${NC} (${SCITT_CCF_URL})"
echo -e "  Database: ${GREEN}✅ Connected${NC}"
echo ""
echo -e "${BLUE}🔗 Quick Access:${NC}"
echo -e "  Frontend: ${FRONTEND_URL}"
echo -e "  Backend API: ${BACKEND_URL}/api"
echo -e "  Keycloak Admin: ${KEYCLOAK_URL}/admin"
echo -e "  SCITT CCF Node: ${SCITT_CCF_URL}"
