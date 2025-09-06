#!/bin/bash

# Test All User Roles Script
# Tests functionality for TDP, TDC, CCRP, and Admin users

set -e

# Load centralized configuration
if [ -f "config.env" ]; then
    source scripts/load-config.sh
    echo -e "${BLUE}✅ Loading centralized configuration from config.env${NC}"
else
    echo -e "${RED}❌ config.env not found${NC}"
    exit 1
fi

# Load common test data
source scripts/test-data-common-simple.sh
echo -e "${BLUE}✅ Loading common test data${NC}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}👥 Testing All User Roles${NC}"
echo "=============================="
echo "Testing functionality for TDP, TDC, CCRP, and Admin users"
echo ""

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test user role
test_user_role() {
    local role="$1"
    local email="$2"
    local password="$3"
    local expected_capabilities="$4"
    
    echo -e "\n${PURPLE}🔍 Testing ${role} User: ${email}${NC}"
    
    # Test login
    ((TOTAL_TESTS++))
    echo "  Testing login..."
    local login_response=$(curl -s -X POST "${BACKEND_URL}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${email}\", \"password\": \"${password}\"}" 2>/dev/null || echo "FAILED")
    
    if echo "$login_response" | grep -q "accessToken"; then
        echo -e "  ${GREEN}✅ Login successful${NC}"
        ((PASSED_TESTS++))
        
        # Get token for further tests
        local token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        
        # Test role-specific capabilities
        case $role in
            "TDP")
                test_tdp_capabilities "$token"
                ;;
            "TDC")
                test_tdc_capabilities "$token"
                ;;
            "CCRP")
                test_ccrp_capabilities "$token"
                ;;
            "Admin")
                test_admin_capabilities "$token"
                ;;
        esac
    else
        echo -e "  ${RED}❌ Login failed${NC}"
        echo "    Response: $login_response"
        ((FAILED_TESTS++))
    fi
}

# Test TDP capabilities
test_tdp_capabilities() {
    local token="$1"
    
    echo "  Testing TDP capabilities..."
    
    # Test dataset creation
    ((TOTAL_TESTS++))
    local dataset_response=$(curl -s -X POST "/api/datasets" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${token}" \
        -d '{"name": "Test Dataset", "description": "Test dataset for TDP", "category": "Test"}' 2>/dev/null || echo "FAILED")
    
    if echo "$dataset_response" | grep -q "id\|success"; then
        echo -e "    ${GREEN}✅ Dataset creation successful${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "    ${RED}❌ Dataset creation failed${NC}"
        ((FAILED_TESTS++))
    fi
    
    # Test dataset listing
    ((TOTAL_TESTS++))
    local datasets_response=$(curl -s -X GET "/api/datasets" \
        -H "Authorization: Bearer ${token}" 2>/dev/null || echo "FAILED")
    
    if echo "$datasets_response" | grep -q "datasets\|\[\]"; then
        echo -e "    ${GREEN}✅ Dataset listing successful${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "    ${RED}❌ Dataset listing failed${NC}"
        ((FAILED_TESTS++))
    fi
}

# Test TDC capabilities
test_tdc_capabilities() {
    local token="$1"
    
    echo "  Testing TDC capabilities..."
    
    # Test AI model creation
    ((TOTAL_TESTS++))
    local model_response=$(curl -s -X POST "/api/ai-models" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${token}" \
        -d '{"name": "Test Model", "description": "Test model for TDC", "category": "Test"}' 2>/dev/null || echo "FAILED")
    
    if echo "$model_response" | grep -q "id\|success"; then
        echo -e "    ${GREEN}✅ AI model creation successful${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "    ${RED}❌ AI model creation failed${NC}"
        ((FAILED_TESTS++))
    fi
    
    # Test model listing
    ((TOTAL_TESTS++))
    local models_response=$(curl -s -X GET "/api/ai-models" \
        -H "Authorization: Bearer ${token}" 2>/dev/null || echo "FAILED")
    
    if echo "$models_response" | grep -q "models\|\[\]"; then
        echo -e "    ${GREEN}✅ AI model listing successful${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "    ${RED}❌ AI model listing failed${NC}"
        ((FAILED_TESTS++))
    fi
}

# Test CCRP capabilities
test_ccrp_capabilities() {
    local token="$1"
    
    echo "  Testing CCRP capabilities..."
    
    # Test training environment creation
    ((TOTAL_TESTS++))
    local env_response=$(curl -s -X POST "/api/training-environments" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${token}" \
        -d '{"name": "Test Environment", "description": "Test environment for CCRP", "environmentType": "DEDICATED"}' 2>/dev/null || echo "FAILED")
    
    if echo "$env_response" | grep -q "id\|success"; then
        echo -e "    ${GREEN}✅ Training environment creation successful${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "    ${RED}❌ Training environment creation failed${NC}"
        ((FAILED_TESTS++))
    fi
    
    # Test environment listing
    ((TOTAL_TESTS++))
    local envs_response=$(curl -s -X GET "/api/training-environments" \
        -H "Authorization: Bearer ${token}" 2>/dev/null || echo "FAILED")
    
    if echo "$envs_response" | grep -q "environments\|\[\]"; then
        echo -e "    ${GREEN}✅ Training environment listing successful${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "    ${RED}❌ Training environment listing failed${NC}"
        ((FAILED_TESTS++))
    fi
}

# Test Admin capabilities
test_admin_capabilities() {
    local token="$1"
    
    echo "  Testing Admin capabilities..."
    
    # Test user management
    ((TOTAL_TESTS++))
    local users_response=$(curl -s -X GET "/api/users" \
        -H "Authorization: Bearer ${token}" 2>/dev/null || echo "FAILED")
    
    if echo "$users_response" | grep -q "users\|\[\]"; then
        echo -e "    ${GREEN}✅ User management access successful${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "    ${RED}❌ User management access failed${NC}"
        ((FAILED_TESTS++))
    fi
    
    # Test system management
    ((TOTAL_TESTS++))
    local health_response=$(curl -s -X GET "/health" \
        -H "Authorization: Bearer ${token}" 2>/dev/null || echo "FAILED")
    
    if echo "$health_response" | grep -q "status\|healthy"; then
        echo -e "    ${GREEN}✅ System management access successful${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "    ${RED}❌ System management access failed${NC}"
        ((FAILED_TESTS++))
    fi
}

echo -e "${BLUE}🔍 Testing User Roles${NC}"

# Test each user role using common test data
test_user_role "TDP" "$TDP_USER_EMAIL" "$TDP_USER_PASSWORD" "dataset_management"
test_user_role "TDC" "$TDC_USER_EMAIL" "$TDC_USER_PASSWORD" "model_management"
test_user_role "CCRP" "$CCRP_USER_EMAIL" "$CCRP_USER_PASSWORD" "environment_management"
test_user_role "Admin" "$ADMIN_USER_EMAIL" "$ADMIN_USER_PASSWORD" "system_management"

echo -e "\n${GREEN}🎉 User Role Testing Completed!${NC}"
echo ""
echo -e "${BLUE}📊 Test Results Summary:${NC}"
echo "  Total Tests: $TOTAL_TESTS"
echo "  Passed: ${GREEN}$PASSED_TESTS${NC}"
echo "  Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✅ All user role tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some user role tests failed.${NC}"
    exit 1
fi
