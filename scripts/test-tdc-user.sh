#!/bin/bash

# Test TDC User Functionality
# Tests Training Data Consumer user capabilities

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

echo -e "${BLUE}🤖 Testing TDC User Functionality${NC}"
echo "====================================="
echo "Testing Training Data Consumer capabilities"
echo ""

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test TDC functionality
test_tdc_function() {
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

# Test TDC user login
echo -e "${BLUE}🔍 Testing TDC User Authentication${NC}"

test_tdc_function "TDC User Login" "curl -s -X POST '/api/auth/login' \
    -H 'Content-Type: application/json' \
    -d '{\"email\": \"tdc.healthcare@example.com\", \"password\": \"password123\"}' \
    | grep -q 'accessToken'"

# Get auth token for further tests
echo -e "\n${BLUE}🔍 Getting TDC Auth Token${NC}"
login_response=$(curl -s -X POST "/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"tdc.healthcare@example.com\", \"password\": \"password123\"}" 2>/dev/null || echo "FAILED")

if echo "$login_response" | grep -q "accessToken"; then
    token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    echo -e "  ${GREEN}✅ Auth token obtained${NC}"
else
    echo -e "  ${RED}❌ Failed to get auth token${NC}"
    echo "  Response: $login_response"
    exit 1
fi

echo -e "\n${BLUE}🔍 Testing TDC AI Model Management${NC}"

# Test AI model creation
test_tdc_function "Create AI Model" "curl -s -X POST '/api/ai-models' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer ${token}' \
    -d '{\"name\": \"TDC Test Model\", \"description\": \"Test AI model for TDC user\", \"category\": \"Healthcare\"}' \
    | grep -q 'id'"

# Test model listing
test_tdc_function "List AI Models" "curl -s -X GET '/api/ai-models' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'models'"

# Test model access
test_tdc_function "Access AI Models" "curl -s -X GET '/api/ai-models' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'models'"

echo -e "\n${BLUE}🔍 Testing TDC Training Requests${NC}"

# Test training request creation
test_tdc_function "Create Training Request" "curl -s -X POST '/api/training-requests' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer ${token}' \
    -d '{\"title\": \"TDC Training Request\", \"description\": \"Test training request for TDC user\", \"budget\": 10000}' \
    | grep -q 'id'"

# Test training request listing
test_tdc_function "List Training Requests" "curl -s -X GET '/api/training-requests' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'requests'"

echo -e "\n${BLUE}🔍 Testing TDC Data Access${NC}"

# Test dataset browsing
test_tdc_function "Browse Available Datasets" "curl -s -X GET '/api/datasets' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'datasets'"

# Test dataset search
test_tdc_function "Search Datasets" "curl -s -X GET '/api/datasets/search?category=Healthcare' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'datasets'"

echo -e "\n${BLUE}🔍 Testing TDC Model Training${NC}"

# Test model training initiation
test_tdc_function "Initiate Model Training" "curl -s -X POST '/api/training' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer ${token}' \
    -d '{\"modelId\": \"test-model\", \"datasetId\": \"test-dataset\", \"trainingConfig\": {}}' \
    | grep -q 'training'"

# Test training status
test_tdc_function "Check Training Status" "curl -s -X GET '/api/training/status' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'status'"

echo -e "\n${BLUE}🔍 Testing TDC User Profile${NC}"

# Test user profile access
test_tdc_function "Access User Profile" "curl -s -X GET '/api/users/profile' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'user'"

# Test user update
test_tdc_function "Update User Profile" "curl -s -X PUT '/api/users/profile' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer ${token}' \
    -d '{\"name\": \"Updated TDC User\"}' \
    | grep -q 'success'"

echo -e "\n${GREEN}🎉 TDC User Testing Completed!${NC}"
echo ""
echo -e "${BLUE}📊 TDC Test Results:${NC}"
echo "  Total Tests: $TOTAL_TESTS"
echo "  Passed: ${GREEN}$PASSED_TESTS${NC}"
echo "  Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✅ All TDC user tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some TDC user tests failed.${NC}"
    exit 1
fi
