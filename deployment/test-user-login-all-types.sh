#!/bin/bash

# Test User Login for All User Types
# Tests authentication for TDP, TDC, CCRP, and AppAdmin users

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}🔐 Testing User Login for All User Types${NC}"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "docker-compose.scitt-ccf-dev.yml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check if backend is running
if ! curl -s http://localhost:5001/health >/dev/null 2>&1; then
    echo -e "${RED}❌ Backend is not running. Please start it first.${NC}"
    echo "Use: ./deployment/setup-complete-environment.sh"
    exit 1
fi

echo -e "${GREEN}✅ Backend is running${NC}"

# Test admin authentication first to get admin token
echo -e "\n${BLUE}🔐 Testing Admin Authentication${NC}"
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@contractmanagement.com","password":"admin123"}')

if echo "$ADMIN_RESPONSE" | grep -q "accessToken"; then
    ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | jq -r '.accessToken')
    echo -e "${GREEN}✅ Admin authentication successful${NC}"
else
    echo -e "${RED}❌ Admin authentication failed${NC}"
    echo "Response: $ADMIN_RESPONSE"
    exit 1
fi

# Function to test user login
test_user_login() {
    local email=$1
    local password=$2
    local user_type=$3
    local description=$4
    
    echo -e "\n${CYAN}🧪 Testing $user_type Login: $description${NC}"
    echo "Email: $email"
    
    local response=$(curl -s -X POST http://localhost:5001/api/auth/login \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    if echo "$response" | grep -q "accessToken"; then
        local access_token=$(echo "$response" | jq -r '.accessToken')
        local refresh_token=$(echo "$response" | jq -r '.refreshToken')
        local user_id=$(echo "$response" | jq -r '.user.id')
        local user_name=$(echo "$response" | jq -r '.user.name')
        local user_party_type=$(echo "$response" | jq -r '.user.partyType')
        
        echo -e "${GREEN}✅ Login successful!${NC}"
        echo "  User ID: $user_id"
        echo "  Name: $user_name"
        echo "  Party Type: $user_party_type"
        echo "  Access Token: ${access_token:0:20}..."
        echo "  Refresh Token: ${refresh_token:0:20}..."
        
        # Test token validation by making an API call
        echo -e "${BLUE}🔍 Testing token validation...${NC}"
        local user_info_response=$(curl -s -X GET http://localhost:5001/api/users \
            -H "Authorization: Bearer $access_token")
        
        if echo "$user_info_response" | grep -q "id"; then
            echo -e "${GREEN}✅ Token validation successful - API access working${NC}"
        else
            echo -e "${YELLOW}⚠️ Token validation failed - API access issue${NC}"
            echo "Response: $user_info_response"
        fi
        
        return 0
    else
        echo -e "${RED}❌ Login failed${NC}"
        echo "Response: $response"
        return 1
    fi
}

# Test results tracking
TDP_SUCCESS=0
TDC_SUCCESS=0
CCRP_SUCCESS=0
APPADMIN_SUCCESS=0

# Test TDP (Training Data Provider) users
echo -e "\n${PURPLE}📊 Testing TDP (Training Data Provider) Users${NC}"
echo "=================================================="

# Test TDP User 1
if test_user_login "tdp1@dataprovider.com" "tdp123" "TDP" "DataCorp Inc."; then
    TDP_SUCCESS=$((TDP_SUCCESS + 1))
fi

# Test TDP User 2
if test_user_login "tdp2@dataprovider.com" "tdp123" "TDP" "InfoSource Ltd."; then
    TDP_SUCCESS=$((TDP_SUCCESS + 1))
fi

# Test TDP User 3
if test_user_login "tdp3@dataprovider.com" "tdp123" "TDP" "DataFlow Systems"; then
    TDP_SUCCESS=$((TDP_SUCCESS + 1))
fi

# Test TDC (Training Data Consumer) users
echo -e "\n${PURPLE}🤖 Testing TDC (Training Data Consumer) Users${NC}"
echo "======================================================"

# Test TDC User 1
if test_user_login "tdc1@dataconsumer.com" "tdc123" "TDC" "AI Solutions Corp."; then
    TDC_SUCCESS=$((TDC_SUCCESS + 1))
fi

# Test TDC User 2
if test_user_login "tdc2@dataconsumer.com" "tdc123" "TDC" "ML Innovations Ltd."; then
    TDC_SUCCESS=$((TDC_SUCCESS + 1))
fi

# Test TDC User 3
if test_user_login "tdc3@dataconsumer.com" "tdc123" "TDC" "SmartTech Industries"; then
    TDC_SUCCESS=$((TDC_SUCCESS + 1))
fi

# Test CCRP (Confidential Clean Room Provider) users
echo -e "\n${PURPLE}🏗️ Testing CCRP (Confidential Clean Room Provider) Users${NC}"
echo "================================================================"

# Test CCRP User 1
if test_user_login "ccrp1@cleanroom.com" "ccrp123" "CCRP" "SecureCompute Inc."; then
    CCRP_SUCCESS=$((CCRP_SUCCESS + 1))
fi

# Test CCRP User 2
if test_user_login "ccrp2@cleanroom.com" "ccrp123" "CCRP" "PrivacyFirst Computing"; then
    CCRP_SUCCESS=$((CCRP_SUCCESS + 1))
fi

# Test CCRP User 3
if test_user_login "ccrp3@cleanroom.com" "ccrp123" "CCRP" "ConfidentialAI Labs"; then
    CCRP_SUCCESS=$((CCRP_SUCCESS + 1))
fi

# Test AppAdmin user
echo -e "\n${PURPLE}👑 Testing AppAdmin User${NC}"
echo "================================"

# Test AppAdmin User
if test_user_login "admin@contractmanagement.com" "admin123" "AppAdmin" "Admin User"; then
    APPADMIN_SUCCESS=$((APPADMIN_SUCCESS + 1))
fi

# Test additional legacy users for completeness
echo -e "\n${PURPLE}🔍 Testing Additional Legacy Users${NC}"
echo "=========================================="

# Test legacy TDP users
if test_user_login "tdp.medical@example.com" "password123" "TDP" "MedData Solutions Inc."; then
    TDP_SUCCESS=$((TDP_SUCCESS + 1))
fi

if test_user_login "tdp.nlp@example.com" "password123" "TDP" "NLP Research Foundation"; then
    TDP_SUCCESS=$((TDP_SUCCESS + 1))
fi

if test_user_login "tdp.autodrive@example.com" "password123" "TDP" "AutoDrive Technologies"; then
    TDP_SUCCESS=$((TDP_SUCCESS + 1))
fi

# Test legacy TDC users
if test_user_login "tdc.healthcare@example.com" "password123" "TDC" "AI Healthcare Innovations"; then
    TDC_SUCCESS=$((TDC_SUCCESS + 1))
fi

if test_user_login "tdc.fintech@example.com" "password123" "TDC" "FinTech Analytics Corp"; then
    TDC_SUCCESS=$((TDC_SUCCESS + 1))
fi

if test_user_login "tdc.language@example.com" "password123" "TDC" "Language AI Labs"; then
    TDC_SUCCESS=$((TDC_SUCCESS + 1))
fi

# Test legacy CCRP users
if test_user_login "ccrp.securecloud@example.com" "password123" "CCRP" "SecureCloud Confidential Computing"; then
    CCRP_SUCCESS=$((CCRP_SUCCESS + 1))
fi

if test_user_login "ccrp.trustedai@example.com" "password123" "CCRP" "TrustedAI Environment Provider"; then
    CCRP_SUCCESS=$((CCRP_SUCCESS + 1))
fi

if test_user_login "ccrp.privacyfirst@example.com" "password123" "CCRP" "PrivacyFirst Computing Solutions"; then
    CCRP_SUCCESS=$((CCRP_SUCCESS + 1))
fi

# Summary
echo -e "\n${GREEN}🎉 User Login Testing Completed!${NC}"
echo "======================================"
echo -e "${BLUE}📊 Test Results Summary:${NC}"
echo ""
echo -e "${PURPLE}📊 TDP (Training Data Provider):${NC}"
echo "  ✅ Successful: $TDP_SUCCESS/6 users"
echo "  📧 Tested Users:"
echo "    - tdp1@dataprovider.com (tdp123)"
echo "    - tdp2@dataprovider.com (tdp123)"
echo "    - tdp3@dataprovider.com (tdp123)"
echo "    - tdp.medical@example.com (password123)"
echo "    - tdp.nlp@example.com (password123)"
echo "    - tdp.autodrive@example.com (password123)"
echo ""
echo -e "${PURPLE}🤖 TDC (Training Data Consumer):${NC}"
echo "  ✅ Successful: $TDC_SUCCESS/6 users"
echo "  📧 Tested Users:"
echo "    - tdc1@dataconsumer.com (tdc123)"
echo "    - tdc2@dataconsumer.com (tdc123)"
echo "    - tdc3@dataconsumer.com (tdc123)"
echo "    - tdc.healthcare@example.com (password123)"
echo "    - tdc.fintech@example.com (password123)"
echo "    - tdc.language@example.com (password123)"
echo ""
echo -e "${PURPLE}🏗️ CCRP (Confidential Clean Room Provider):${NC}"
echo "  ✅ Successful: $CCRP_SUCCESS/6 users"
echo "  📧 Tested Users:"
echo "    - ccrp1@cleanroom.com (ccrp123)"
echo "    - ccrp2@cleanroom.com (ccrp123)"
echo "    - ccrp3@cleanroom.com (ccrp123)"
echo "    - ccrp.securecloud@example.com (password123)"
echo "    - ccrp.trustedai@example.com (password123)"
echo "    - ccrp.privacyfirst@example.com (password123)"
echo ""
echo -e "${PURPLE}👑 AppAdmin:${NC}"
echo "  ✅ Successful: $APPADMIN_SUCCESS/1 users"
echo "  📧 Tested Users:"
echo "    - admin@contractmanagement.com (admin123)"
echo ""

# Overall success rate
total_tests=$((TDP_SUCCESS + TDC_SUCCESS + CCRP_SUCCESS + APPADMIN_SUCCESS))
total_possible=19

if [ $total_tests -eq $total_possible ]; then
    echo -e "${GREEN}🎯 All user types tested successfully!${NC}"
    echo -e "${GREEN}✅ Overall Success Rate: 100% ($total_tests/$total_possible)${NC}"
else
    echo -e "${YELLOW}⚠️ Some user types had issues${NC}"
    echo -e "${YELLOW}📊 Overall Success Rate: ${total_tests}% ($total_tests/$total_possible)${NC}"
fi

echo ""
echo -e "${BLUE}🧪 Next Steps:${NC}"
echo "  1. Review any failed login attempts above"
echo "  2. Check user credentials in the database if needed"
echo "  3. Test role-based access control for each user type"
echo "  4. Test contract creation with different user types"
echo "  5. Test SCITT CCF integration with authenticated users"
echo ""
echo -e "${GREEN}🚀 IAM Integration Status: ${NC}"
if [ $total_tests -eq $total_possible ]; then
    echo -e "${GREEN}✅ FULLY FUNCTIONAL - All user types can authenticate${NC}"
else
    echo -e "${YELLOW}⚠️ PARTIALLY FUNCTIONAL - Some authentication issues detected${NC}"
fi

echo ""
echo -e "${YELLOW}⚠️  Note: All tests use backend APIs - no direct database access${NC}"
echo -e "${YELLOW}⚠️  Passwords are hardcoded for testing - change in production${NC}"
