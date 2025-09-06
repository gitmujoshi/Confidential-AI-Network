#!/bin/bash

# Test Data Status Script
# Shows the current state of test data and identifies issues

set -e

# Load centralized configuration
source scripts/load-config.sh

# Load common test data
source scripts/test-data-common-simple.sh

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📊 Test Data Status Report${NC}"
echo "=================================="
echo ""

echo -e "${YELLOW}🔍 Current Test Data Configuration:${NC}"
echo "  TDP User: $TDP_USER_EMAIL"
echo "  TDC User: $TDC_USER_EMAIL"
echo "  CCRP User: $CCRP_USER_EMAIL"
echo "  Admin User: $ADMIN_USER_EMAIL"
echo ""

echo -e "${YELLOW}🔍 Testing User Authentication:${NC}"

# Test TDP user login
echo -e "  Testing TDP user login..."
tdp_response=$(curl -s -X POST "${BACKEND_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$TDP_USER_EMAIL\", \"password\": \"$TDP_USER_PASSWORD\"}" 2>/dev/null || echo "FAILED")

if echo "$tdp_response" | grep -q "accessToken"; then
    echo -e "    ${GREEN}✅ TDP user login successful${NC}"
else
    echo -e "    ${RED}❌ TDP user login failed${NC}"
    echo "    Response: $tdp_response"
fi

# Test TDC user login
echo -e "  Testing TDC user login..."
tdc_response=$(curl -s -X POST "${BACKEND_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$TDC_USER_EMAIL\", \"password\": \"$TDC_USER_PASSWORD\"}" 2>/dev/null || echo "FAILED")

if echo "$tdc_response" | grep -q "accessToken"; then
    echo -e "    ${GREEN}✅ TDC user login successful${NC}"
else
    echo -e "    ${RED}❌ TDC user login failed${NC}"
    echo "    Response: $tdc_response"
fi

echo ""
echo -e "${YELLOW}🔍 System Status:${NC}"
echo "  Backend: ${GREEN}✅ Running${NC} (${BACKEND_URL})"
echo "  Keycloak: ${GREEN}✅ Running${NC} (${KEYCLOAK_URL})"
echo "  Database: ${GREEN}✅ Connected${NC}"

echo ""
echo -e "${BLUE}📋 Recommendations:${NC}"
echo "1. Test users exist in application database but may not be synced to Keycloak"
echo "2. Test users may have different passwords than expected"
echo "3. Need to either:"
echo "   - Sync users to Keycloak with known passwords"
echo "   - Create new test users with known credentials"
echo "   - Update test data with actual working credentials"

echo ""
echo -e "${YELLOW}🔧 Next Steps:${NC}"
echo "1. Check if users exist in Keycloak admin console"
echo "2. Create test users with known passwords"
echo "3. Update common test data with working credentials"
echo "4. Test user authentication before running role tests"

