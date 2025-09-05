#!/bin/bash

# Quick Integration Test Suite for Contract Management System
# Fast tests for basic system functionality

set -e

# Load centralized configuration
source scripts/load-config.sh

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}⚡ Running Quick Integration Tests${NC}"
echo "======================================"
echo "Fast tests for essential system functionality"
echo ""

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a quick test
quick_test() {
    local test_name="$1"
    local test_command="$2"
    
    ((TOTAL_TESTS++))
    echo -e "\n${BLUE}🧪 ${test_name}${NC}"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅ PASSED${NC}"
        ((PASSED_TESTS++))
        return 0
    else
        echo -e "  ${RED}❌ FAILED${NC}"
        ((FAILED_TESTS++))
        return 1
    fi
}

echo -e "${BLUE}🔍 Essential System Checks${NC}"

# Core system health
quick_test "Backend Running" "curl -s ${BACKEND_URL}/health > /dev/null"
quick_test "Frontend Running" "curl -s ${FRONTEND_URL} > /dev/null"
quick_test "Keycloak Running" "curl -k -s ${KEYCLOAK_URL}/health > /dev/null"

echo -e "\n${BLUE}🔍 Core API Tests${NC}"

# Essential API endpoints
quick_test "Users API" "curl -s ${BACKEND_URL}/api/users > /dev/null"
quick_test "Health API" "curl -s ${BACKEND_URL}/health > /dev/null"
quick_test "Auth API" "curl -s ${BACKEND_URL}/api/auth/login > /dev/null"

echo -e "\n${BLUE}🔍 Database Tests${NC}"

# Database connectivity (using health endpoint which doesn't require auth)
quick_test "Database Connection" "curl -s ${BACKEND_URL}/health | grep -q 'healthy'"
quick_test "Database Read" "curl -s ${BACKEND_URL}/api/datasets > /dev/null"

echo -e "\n${BLUE}🔍 SCITT CCF Tests${NC}"

# SCITT CCF basic tests
quick_test "SCITT CCF Node" "curl -s ${SCITT_CCF_URL}/health > /dev/null"
quick_test "SCITT CCF Dashboard" "curl -s ${SCITT_CCF_DASHBOARD_URL} > /dev/null"

echo -e "\n${GREEN}🎉 Quick Integration Tests Completed!${NC}"
echo ""
echo -e "${BLUE}📊 Results:${NC}"
echo "  Total: $TOTAL_TESTS"
echo "  Passed: ${GREEN}$PASSED_TESTS${NC}"
echo "  Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✅ All quick tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed.${NC}"
    exit 1
fi
