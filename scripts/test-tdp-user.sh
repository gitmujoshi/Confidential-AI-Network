#!/bin/bash

# Test TDP User Functionality
# Tests Training Data Provider user capabilities

set -e

# Load centralized configuration
source scripts/load-config.sh

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📊 Testing TDP User Functionality${NC}"
echo "====================================="
echo "Testing Training Data Provider capabilities"
echo ""

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test TDP functionality
test_tdp_function() {
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

# Test TDP user login
echo -e "${BLUE}🔍 Testing TDP User Authentication${NC}"

test_tdp_function "TDP User Login" "curl -s -X POST '${BACKEND_URL}/api/auth/login' \
    -H 'Content-Type: application/json' \
    -d '{\"email\": \"tdp.medical@example.com\", \"password\": \"password123\"}' \
    | grep -q 'accessToken'"

# Get auth token for further tests
echo -e "\n${BLUE}🔍 Getting TDP Auth Token${NC}"
login_response=$(curl -s -X POST "${BACKEND_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"tdp.medical@example.com\", \"password\": \"password123\"}" 2>/dev/null || echo "FAILED")

if echo "$login_response" | grep -q "accessToken"; then
    token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    echo -e "  ${GREEN}✅ Auth token obtained${NC}"
else
    echo -e "  ${RED}❌ Failed to get auth token${NC}"
    echo "  Response: $login_response"
    exit 1
fi

echo -e "\n${BLUE}🔍 Testing TDP Dataset Management${NC}"

# Test dataset creation
test_tdp_function "Create Dataset" "curl -s -X POST '${BACKEND_URL}/api/datasets' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer ${token}' \
    -d '{\"name\": \"TDP Test Dataset\", \"description\": \"Test dataset for TDP user\", \"category\": \"Healthcare\"}' \
    | grep -q 'id'"

# Test dataset listing
test_tdp_function "List Datasets" "curl -s -X GET '${BACKEND_URL}/api/datasets' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'datasets'"

# Test dataset access
test_tdp_function "Access Datasets" "curl -s -X GET '${BACKEND_URL}/api/datasets' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'datasets'"

echo -e "\n${BLUE}🔍 Testing TDP User Profile${NC}"

# Test user profile access
test_tdp_function "Access User Profile" "curl -s -X GET '${BACKEND_URL}/api/users/profile' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'user'"

# Test user update
test_tdp_function "Update User Profile" "curl -s -X PUT '${BACKEND_URL}/api/users/profile' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer ${token}' \
    -d '{\"name\": \"Updated TDP User\"}' \
    | grep -q 'success'"

echo -e "\n${BLUE}🔍 Testing TDP Data Sharing${NC}"

# Test data sharing capabilities
test_tdp_function "View Available Contracts" "curl -s -X GET '${BACKEND_URL}/api/contracts' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'contracts'"

# Test contract creation
test_tdp_function "Create Data Sharing Contract" "curl -s -X POST '${BACKEND_URL}/api/contracts' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer ${token}' \
    -d '{\"title\": \"TDP Test Contract\", \"description\": \"Test contract for data sharing\", \"contractType\": \"DATA_SHARING\"}' \
    | grep -q 'id'"

echo -e "\n${BLUE}🔍 Testing TDP Compliance${NC}"

# Test compliance features
test_tdp_function "Access Compliance Dashboard" "curl -s -X GET '${BACKEND_URL}/api/compliance' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'compliance'"

# Test data privacy features
test_tdp_function "Access Privacy Settings" "curl -s -X GET '${BACKEND_URL}/api/privacy' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'privacy'"

echo -e "\n${GREEN}🎉 TDP User Testing Completed!${NC}"
echo ""
echo -e "${BLUE}📊 TDP Test Results:${NC}"
echo "  Total Tests: $TOTAL_TESTS"
echo "  Passed: ${GREEN}$PASSED_TESTS${NC}"
echo "  Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✅ All TDP user tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some TDP user tests failed.${NC}"
    exit 1
fi
