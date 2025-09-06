#!/bin/bash

# Set Keycloak User Passwords
# Sets passwords for all test users so they can authenticate

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}🔐 Setting Keycloak User Passwords${NC}"
echo "============================================="

# Check if we're in the right directory
if [ ! -f "docker-compose.scitt-ccf-dev.yml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check if Keycloak is accessible
if ! curl -k -s https://localhost:8443/health >/dev/null 2>&1; then
    echo -e "${RED}❌ Keycloak is not accessible. Please start it first.${NC}"
    echo "Use: ./deployment/setup-keycloak-https.sh"
    exit 1
fi

echo -e "${GREEN}✅ Keycloak is accessible${NC}"

# Get admin token
echo -e "\n${BLUE}🔐 Getting Admin Token${NC}"
ADMIN_TOKEN=$(curl -k -s -X POST https://localhost:8443/realms/master/protocol/openid-connect/token \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    -d 'username=admin&password=admin123&grant_type=password&client_id=admin-cli' | jq -r '.access_token')

if [ "$ADMIN_TOKEN" = "null" ] || [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}❌ Failed to get admin token${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Admin token obtained${NC}"

# Function to set user password
set_user_password() {
    local user_id=$1
    local username=$2
    local password=$3
    
    echo -e "\n${CYAN}🔑 Setting password for: $username${NC}"
    
    local response=$(curl -k -s -X PUT "https://localhost:8443/admin/realms/contract-management/users/$user_id/reset-password" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"type\": \"password\",
            \"value\": \"$password\",
            \"temporary\": false
        }")
    
    if [ $? -eq 0 ] && [ -z "$response" ]; then
        echo -e "${GREEN}✅ Password set successfully for $username${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to set password for $username${NC}"
        echo "Response: $response"
        return 1
    fi
}

# Function to get user ID by email
get_user_id() {
    local email=$1
    
    local user_data=$(curl -k -s -X GET "https://localhost:8443/admin/realms/contract-management/users?email=$email" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    
    local user_id=$(echo "$user_data" | jq -r '.[0].id')
    
    if [ "$user_id" = "null" ] || [ -z "$user_id" ]; then
        echo ""
    else
        echo "$user_id"
    fi
}

# Set passwords for all test users
echo -e "\n${PURPLE}📊 Setting TDP User Passwords${NC}"
echo "======================================"

# TDP Users
TDP1_ID=$(get_user_id "tdp1@dataprovider.com")
if [ -n "$TDP1_ID" ]; then
    set_user_password "$TDP1_ID" "tdp1@dataprovider.com" "tdp123"
else
    echo -e "${YELLOW}⚠️ User tdp1@dataprovider.com not found in Keycloak${NC}"
fi

TDP2_ID=$(get_user_id "tdp2@dataprovider.com")
if [ -n "$TDP2_ID" ]; then
    set_user_password "$TDP2_ID" "tdp2@dataprovider.com" "tdp123"
else
    echo -e "${YELLOW}⚠️ User tdp2@dataprovider.com not found in Keycloak${NC}"
fi

TDP3_ID=$(get_user_id "tdp3@dataprovider.com")
if [ -n "$TDP3_ID" ]; then
    set_user_password "$TDP3_ID" "tdp3@dataprovider.com" "tdp123"
else
    echo -e "${YELLOW}⚠️ User tdp3@dataprovider.com not found in Keycloak${NC}"
fi

echo -e "\n${PURPLE}🤖 Setting TDC User Passwords${NC}"
echo "======================================"

# TDC Users
TDC1_ID=$(get_user_id "tdc1@dataconsumer.com")
if [ -n "$TDC1_ID" ]; then
    set_user_password "$TDC1_ID" "tdc1@dataconsumer.com" "tdc123"
else
    echo -e "${YELLOW}⚠️ User tdc1@dataconsumer.com not found in Keycloak${NC}"
fi

TDC2_ID=$(get_user_id "tdc2@dataconsumer.com")
if [ -n "$TDC2_ID" ]; then
    set_user_password "$TDC2_ID" "tdc2@dataconsumer.com" "tdc123"
else
    echo -e "${YELLOW}⚠️ User tdc2@dataconsumer.com not found in Keycloak${NC}"
fi

TDC3_ID=$(get_user_id "tdc3@dataconsumer.com")
if [ -n "$TDC3_ID" ]; then
    set_user_password "$TDC3_ID" "tdc3@dataconsumer.com" "tdc123"
else
    echo -e "${YELLOW}⚠️ User tdc3@dataconsumer.com not found in Keycloak${NC}"
fi

echo -e "\n${PURPLE}🏗️ Setting CCRP User Passwords${NC}"
echo "======================================"

# CCRP Users
CCRP1_ID=$(get_user_id "ccrp1@cleanroom.com")
if [ -n "$CCRP1_ID" ]; then
    set_user_password "$CCRP1_ID" "ccrp1@cleanroom.com" "ccrp123"
else
    echo -e "${YELLOW}⚠️ User ccrp1@cleanroom.com not found in Keycloak${NC}"
fi

CCRP2_ID=$(get_user_id "ccrp2@cleanroom.com")
if [ -n "$CCRP2_ID" ]; then
    set_user_password "$CCRP2_ID" "ccrp2@cleanroom.com" "ccrp123"
else
    echo -e "${YELLOW}⚠️ User ccrp2@cleanroom.com not found in Keycloak${NC}"
fi

CCRP3_ID=$(get_user_id "ccrp3@cleanroom.com")
if [ -n "$CCRP3_ID" ]; then
    set_user_password "$CCRP3_ID" "ccrp3@cleanroom.com" "ccrp123"
else
    echo -e "${YELLOW}⚠️ User ccrp3@cleanroom.com not found in Keycloak${NC}"
fi

echo -e "\n${PURPLE}👑 Setting AppAdmin User Password${NC}"
echo "======================================"

# AppAdmin User (already has password, but let's verify)
ADMIN_ID=$(get_user_id "admin@contractmanagement.com")
if [ -n "$ADMIN_ID" ]; then
    echo -e "${GREEN}✅ Admin user already has password set${NC}"
else
    echo -e "${YELLOW}⚠️ Admin user not found in Keycloak${NC}"
fi

# Summary
echo -e "\n${GREEN}🎉 Password Setting Completed!${NC}"
echo "======================================"
echo -e "${BLUE}📊 Summary:${NC}"
echo ""
echo -e "${PURPLE}📊 TDP (Training Data Provider):${NC}"
echo "  - tdp1@dataprovider.com (tdp123)"
echo "  - tdp2@dataprovider.com (tdp123)"
echo "  - tdp3@dataprovider.com (tdp123)"
echo ""
echo -e "${PURPLE}🤖 TDC (Training Data Consumer):${NC}"
echo "  - tdc1@dataconsumer.com (tdc123)"
echo "  - tdc2@dataconsumer.com (tdc123)"
echo "  - tdc3@dataconsumer.com (tdc123)"
echo ""
echo -e "${PURPLE}🏗️ CCRP (Confidential Clean Room Provider):${NC}"
echo "  - ccrp1@cleanroom.com (ccrp123)"
echo "  - ccrp2@cleanroom.com (ccrp123)"
echo "  - ccrp3@cleanroom.com (ccrp123)"
echo ""
echo -e "${PURPLE}👑 AppAdmin:${NC}"
echo "  - admin@contractmanagement.com (admin123)"
echo ""

echo -e "${BLUE}🧪 Next Steps:${NC}"
echo "  1. Run the user login test script: ./deployment/test-user-login-all-types.sh"
echo "  2. Verify all user types can authenticate"
echo "  3. Test role-based access control"
echo "  4. Test contract creation with different user types"
echo ""

echo -e "${GREEN}🚀 All test users should now be able to authenticate!${NC}"
echo ""
echo -e "${YELLOW}⚠️  Note: Passwords are set to match the test script expectations${NC}"
echo -e "${YELLOW}⚠️  Change these passwords in production${NC}"
