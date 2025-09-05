#!/bin/bash

# Test CCRP User Functionality
# Tests Confidential Clean Room Provider user capabilities

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
NC='\033[0m'

echo -e "${BLUE}🏗️ Testing CCRP User Functionality${NC}"
echo "====================================="
echo "Testing Confidential Clean Room Provider capabilities"
echo ""

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test CCRP functionality
test_ccrp_function() {
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

# Test CCRP user login
echo -e "${BLUE}🔍 Testing CCRP User Authentication${NC}"

test_ccrp_function "CCRP User Login" "curl -s -X POST '/api/auth/login' \
    -H 'Content-Type: application/json' \
    -d '{\"email\": \"ccrp.secure@example.com\", \"password\": \"password123\"}' \
    | grep -q 'accessToken'"

# Get auth token for further tests
echo -e "\n${BLUE}🔍 Getting CCRP Auth Token${NC}"
login_response=$(curl -s -X POST "/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"ccrp.secure@example.com\", \"password\": \"password123\"}" 2>/dev/null || echo "FAILED")

if echo "$login_response" | grep -q "accessToken"; then
    token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    echo -e "  ${GREEN}✅ Auth token obtained${NC}"
else
    echo -e "  ${RED}❌ Failed to get auth token${NC}"
    echo "  Response: $login_response"
    exit 1
fi

echo -e "\n${BLUE}🔍 Testing CCRP Training Environment Management${NC}"

# Test training environment creation
test_ccrp_function "Create Training Environment" "curl -s -X POST '/api/training-environments' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer ${token}' \
    -d '{\"name\": \"CCRP Test Environment\", \"description\": \"Test environment for CCRP user\", \"environmentType\": \"DEDICATED\"}' \
    | grep -q 'id'"

# Test environment listing
test_ccrp_function "List Training Environments" "curl -s -X GET '/api/training-environments' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'environments'"

# Test environment access
test_ccrp_function "Access Training Environments" "curl -s -X GET '/api/training-environments' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'environments'"

echo -e "\n${BLUE}🔍 Testing CCRP Compute Resources${NC}"

# Test compute resource creation
test_ccrp_function "Create Compute Resource" "curl -s -X POST '/api/compute-resources' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer ${token}' \
    -d '{\"name\": \"CCRP Test Resource\", \"description\": \"Test compute resource for CCRP user\", \"resourceType\": \"GPU_CLUSTER\"}' \
    | grep -q 'id'"

# Test compute resource listing
test_ccrp_function "List Compute Resources" "curl -s -X GET '/api/compute-resources' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'resources'"

echo -e "\n${BLUE}🔍 Testing CCRP Data Processing Services${NC}"

# Test data processing service creation
test_ccrp_function "Create Data Processing Service" "curl -s -X POST '/api/data-processing-services' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer ${token}' \
    -d '{\"name\": \"CCRP Test Service\", \"description\": \"Test data processing service for CCRP user\", \"serviceType\": \"ANONYMIZATION\"}' \
    | grep -q 'id'"

# Test service listing
test_ccrp_function "List Data Processing Services" "curl -s -X GET '/api/data-processing-services' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'services'"

echo -e "\n${BLUE}🔍 Testing CCRP Security Features${NC}"

# Test security monitoring
test_ccrp_function "Access Security Dashboard" "curl -s -X GET '/api/security' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'security'"

# Test compliance reporting
test_ccrp_function "Access Compliance Reports" "curl -s -X GET '/api/compliance' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'compliance'"

# Test audit logs
test_ccrp_function "Access Audit Logs" "curl -s -X GET '/api/audit' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'audit'"

echo -e "\n${BLUE}🔍 Testing CCRP User Profile${NC}"

# Test user profile access
test_ccrp_function "Access User Profile" "curl -s -X GET '/api/users/profile' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'user'"

# Test user update
test_ccrp_function "Update User Profile" "curl -s -X PUT '/api/users/profile' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer ${token}' \
    -d '{\"name\": \"Updated CCRP User\"}' \
    | grep -q 'success'"

echo -e "\n${BLUE}🔍 Testing CCRP Resource Management${NC}"

# Test resource allocation
test_ccrp_function "Allocate Resources" "curl -s -X POST '/api/resource-allocation' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer ${token}' \
    -d '{\"environmentId\": \"test-env\", \"resourceId\": \"test-resource\", \"allocationType\": \"DEDICATED\"}' \
    | grep -q 'allocation'"

# Test resource monitoring
test_ccrp_function "Monitor Resources" "curl -s -X GET '/api/resource-monitoring' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'monitoring'"

echo -e "\n${GREEN}🎉 CCRP User Testing Completed!${NC}"
echo ""
echo -e "${BLUE}📊 CCRP Test Results:${NC}"
echo "  Total Tests: $TOTAL_TESTS"
echo "  Passed: ${GREEN}$PASSED_TESTS${NC}"
echo "  Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✅ All CCRP user tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some CCRP user tests failed.${NC}"
    exit 1
fi
