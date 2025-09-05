#!/bin/bash

# Test Admin User Functionality
# Tests System Administrator user capabilities

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

echo -e "${BLUE}👑 Testing Admin User Functionality${NC}"
echo "====================================="
echo "Testing System Administrator capabilities"
echo ""

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test Admin functionality
test_admin_function() {
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

# Test Admin user login
echo -e "${BLUE}🔍 Testing Admin User Authentication${NC}"

test_admin_function "Admin User Login" "curl -s -X POST '/api/auth/login' \
    -H 'Content-Type: application/json' \
    -d '{\"email\": \"admin@contractmanagement.com\", \"password\": \"password123\"}' \
    | grep -q 'accessToken'"

# Get auth token for further tests
echo -e "\n${BLUE}🔍 Getting Admin Auth Token${NC}"
login_response=$(curl -s -X POST "/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"admin@contractmanagement.com\", \"password\": \"password123\"}" 2>/dev/null || echo "FAILED")

if echo "$login_response" | grep -q "accessToken"; then
    token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    echo -e "  ${GREEN}✅ Auth token obtained${NC}"
else
    echo -e "  ${RED}❌ Failed to get auth token${NC}"
    echo "  Response: $login_response"
    exit 1
fi

echo -e "\n${BLUE}🔍 Testing Admin User Management${NC}"

# Test user listing
test_admin_function "List All Users" "curl -s -X GET '/api/users' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'users'"

# Test user creation
test_admin_function "Create New User" "curl -s -X POST '/api/users' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer ${token}' \
    -d '{\"name\": \"Admin Test User\", \"email\": \"admin-test@example.com\", \"partyType\": \"TDP\"}' \
    | grep -q 'id'"

# Test user update
test_admin_function "Update User" "curl -s -X PUT '/api/users/admin-test@example.com' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer ${token}' \
    -d '{\"name\": \"Updated Admin Test User\"}' \
    | grep -q 'success'"

# Test user deletion
test_admin_function "Delete User" "curl -s -X DELETE '/api/users/admin-test@example.com' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'success'"

echo -e "\n${BLUE}🔍 Testing Admin System Management${NC}"

# Test system health monitoring
test_admin_function "Access System Health" "curl -s -X GET '/health' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'status'"

# Test system metrics
test_admin_function "Access System Metrics" "curl -s -X GET '/api/metrics' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'metrics'"

# Test system configuration
test_admin_function "Access System Configuration" "curl -s -X GET '/api/config' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'config'"

echo -e "\n${BLUE}🔍 Testing Admin Data Management${NC}"

# Test dataset management
test_admin_function "Manage All Datasets" "curl -s -X GET '/api/datasets' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'datasets'"

# Test AI model management
test_admin_function "Manage All AI Models" "curl -s -X GET '/api/ai-models' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'models'"

# Test contract management
test_admin_function "Manage All Contracts" "curl -s -X GET '/api/contracts' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'contracts'"

echo -e "\n${BLUE}🔍 Testing Admin Security Management${NC}"

# Test security dashboard
test_admin_function "Access Security Dashboard" "curl -s -X GET '/api/security' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'security'"

# Test audit logs
test_admin_function "Access Audit Logs" "curl -s -X GET '/api/audit' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'audit'"

# Test compliance monitoring
test_admin_function "Access Compliance Monitoring" "curl -s -X GET '/api/compliance' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'compliance'"

echo -e "\n${BLUE}🔍 Testing Admin System Administration${NC}"

# Test system backup
test_admin_function "Initiate System Backup" "curl -s -X POST '/api/admin/backup' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'backup'"

# Test system maintenance
test_admin_function "Access System Maintenance" "curl -s -X GET '/api/admin/maintenance' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'maintenance'"

# Test system logs
test_admin_function "Access System Logs" "curl -s -X GET '/api/admin/logs' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'logs'"

echo -e "\n${BLUE}🔍 Testing Admin Role Management${NC}"

# Test role assignment
test_admin_function "Assign User Roles" "curl -s -X POST '/api/admin/roles' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer ${token}' \
    -d '{\"userId\": \"test-user\", \"role\": \"TDP\"}' \
    | grep -q 'role'"

# Test permission management
test_admin_function "Manage Permissions" "curl -s -X GET '/api/admin/permissions' \
    -H 'Authorization: Bearer ${token}' \
    | grep -q 'permissions'"

echo -e "\n${GREEN}🎉 Admin User Testing Completed!${NC}"
echo ""
echo -e "${BLUE}📊 Admin Test Results:${NC}"
echo "  Total Tests: $TOTAL_TESTS"
echo "  Passed: ${GREEN}$PASSED_TESTS${NC}"
echo "  Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✅ All Admin user tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some Admin user tests failed.${NC}"
    exit 1
fi
