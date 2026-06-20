#!/bin/bash

# Full Integration Test Suite for Contract Management System
# Tests all user roles, workflows, and system functionality end-to-end

set -e

# Load centralized configuration
# Load centralized configuration
source scripts/load-config.sh    echo -e "${BLUE}✅ Loading centralized configuration from config.env${NC}"
else
    echo -e "${RED}❌ config.env not found${NC}"
    exit 1
fi

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}🔄 Running Full Integration Test Suite${NC}"
echo "=============================================="
echo "Testing complete system functionality across all user roles"
echo ""

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    ((TOTAL_TESTS++))
    echo -e "\n${CYAN}🧪 Test: ${test_name}${NC}"
    echo "Command: ${test_command}"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "  Result: ${GREEN}✅ PASSED${NC}"
        ((PASSED_TESTS++))
        return 0
    else
        echo -e "  Result: ${RED}❌ FAILED${NC}"
        ((FAILED_TESTS++))
        return 1
    fi
}

# Function to test API endpoint
test_api_endpoint() {
    local endpoint="$1"
    local method="${2:-GET}"
    local expected_status="${3:-200}"
    local auth_token="$4"
    
    local response_code
    if [ -n "$auth_token" ]; then
        response_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
            -H "Authorization: Bearer $auth_token" \
            "${endpoint}")
    else
        response_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
            "${endpoint}")
    fi
    
    if [ "$response_code" = "$expected_status" ]; then
        return 0
    else
        echo "Expected status: $expected_status, got: $response_code"
        return 1
    fi
}

# Function to get auth token
get_auth_token() {
    local email="$1"
    local password="$2"
    
    local response=$(curl -s -X POST "/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${email}\", \"password\": \"${password}\"}" 2>/dev/null || echo "FAILED")
    
    if echo "$response" | grep -q "accessToken"; then
        echo "$response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4
        return 0
    else
        return 1
    fi
}

echo -e "${BLUE}🔍 Step 1: System Health Checks${NC}"

# Test system health
run_test "Backend Health Check" "curl -s /health > /dev/null"
run_test "Keycloak Health Check" "curl -k -s ${KEYCLOAK_URL}/health > /dev/null"
run_test "Frontend Accessibility" "curl -s  > /dev/null"

echo -e "\n${BLUE}🔍 Step 2: Authentication System Tests${NC}"

# Test authentication endpoints
run_test "Login Endpoint Available" "test_api_endpoint '/api/auth/login' 'POST' '400'"
run_test "Register Endpoint Available" "test_api_endpoint '/api/auth/register' 'POST' '400'"
run_test "Health Endpoint Available" "test_api_endpoint '/health' 'GET' '200'"

echo -e "\n${BLUE}🔍 Step 3: User Registration Tests${NC}"

# Test user registration for each role
run_test "TDP User Registration" "curl -s -X POST '/api/auth/register' \
    -H 'Content-Type: application/json' \
    -d '{\"name\": \"Test TDP\", \"email\": \"test-tdp@example.com\", \"partyType\": \"TDP\", \"organization\": \"Test Org\"}' \
    | grep -q 'success.*true'"

run_test "TDC User Registration" "curl -s -X POST '/api/auth/register' \
    -H 'Content-Type: application/json' \
    -d '{\"name\": \"Test TDC\", \"email\": \"test-tdc@example.com\", \"partyType\": \"TDC\", \"organization\": \"Test Org\"}' \
    | grep -q 'success.*true'"

run_test "TSP User Registration" "curl -s -X POST '/api/auth/register' \
    -H 'Content-Type: application/json' \
    -d '{\"name\": \"Test TSP\", \"email\": \"test-tsp@example.com\", \"partyType\": \"TSP\", \"organization\": \"Test Org\"}' \
    | grep -q 'success.*true'"

echo -e "\n${BLUE}🔍 Step 4: API Endpoint Tests${NC}"

# Test core API endpoints
run_test "Users API Endpoint" "test_api_endpoint '/api/users' 'GET' '200'"
run_test "Datasets API Endpoint" "test_api_endpoint '/api/datasets' 'GET' '200'"
run_test "AI Models API Endpoint" "test_api_endpoint '/api/ai-models' 'GET' '200'"
run_test "Contracts API Endpoint" "test_api_endpoint '/api/contracts' 'GET' '200'"

echo -e "\n${BLUE}🔍 Step 5: Database Connectivity Tests${NC}"

# Test database operations
run_test "Database Connection" "curl -s '/api/users' | grep -q 'users'"
run_test "Database Read Operations" "curl -s '/api/datasets' | grep -q 'datasets'"

echo -e "\n${BLUE}🔍 Step 6: SCITT CCF Integration Tests${NC}"

# Test SCITT CCF integration
run_test "SCITT CCF Node Health" "curl -s ${SCITT_CCF_URL:-${SCITT_CCF_URL:-http://localhost:8000}}/health > /dev/null"
run_test "SCITT CCF Dashboard" "curl -s ${SCITT_CCF_DASHBOARD_URL:-${SCITT_CCF_DASHBOARD_URL:-http://localhost:8082}} > /dev/null"

echo -e "\n${BLUE}🔍 Step 7: Cross-Service Communication Tests${NC}"

# Test inter-service communication
run_test "Backend to Database" "curl -s '/api/users' | grep -q 'users'"
run_test "Frontend to Backend" "curl -s '' | grep -q 'html'"

echo -e "\n${BLUE}🔍 Step 8: Error Handling Tests${NC}"

# Test error handling
run_test "Invalid Endpoint Handling" "test_api_endpoint '/api/invalid' 'GET' '404'"
run_test "Invalid Method Handling" "test_api_endpoint '/api/users' 'DELETE' '405'"

echo -e "\n${BLUE}🔍 Step 9: Performance Tests${NC}"

# Test response times
run_test "API Response Time < 2s" "timeout 2s curl -s '/api/users' > /dev/null"
run_test "Frontend Load Time < 3s" "timeout 3s curl -s '' > /dev/null"

echo -e "\n${BLUE}🔍 Step 10: Security Tests${NC}"

# Test security headers and CORS
run_test "CORS Headers Present" "curl -s -I '/api/users' | grep -q 'Access-Control-Allow-Origin'"
run_test "Security Headers Present" "curl -s -I '/api/users' | grep -q 'X-Content-Type-Options'"

echo -e "\n${GREEN}🎉 Full Integration Test Suite Completed!${NC}"
echo ""
echo -e "${BLUE}📊 Test Results Summary:${NC}"
echo "  Total Tests: $TOTAL_TESTS"
echo "  Passed: ${GREEN}$PASSED_TESTS${NC}"
echo "  Failed: ${RED}$FAILED_TESTS${NC}"
echo "  Skipped: ${YELLOW}$SKIPPED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✅ All tests passed! System is fully functional.${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please check the system configuration.${NC}"
    exit 1
fi
