#!/bin/bash

# Test Contract Creation UI Fixes
# This script tests the three main fixes:
# 1. Template selection indication
# 2. Cloud provider filtering
# 3. Contract datasets & TDPs display

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Contract Creation UI Fixes${NC}"
echo "=============================================="

# Check if backend is running
echo -e "\n${BLUE}🔍 Checking backend status...${NC}"
if ! curl -s http://localhost:5001/api/health > /dev/null; then
    echo -e "${RED}❌ Backend is not running. Please start the backend first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend is running${NC}"

# Check if frontend is running
echo -e "\n${BLUE}🔍 Checking frontend status...${NC}"
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${RED}❌ Frontend is not running. Please start the frontend first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend is running${NC}"

# Get admin token
echo -e "\n${BLUE}🔐 Getting admin token...${NC}"
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
        "email": "admin@contractmanagement.com",
        "password": "admin123"
    }')

if echo "$ADMIN_RESPONSE" | grep -q "accessToken"; then
    ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | jq -r '.accessToken')
    echo -e "${GREEN}✅ Admin token obtained${NC}"
else
    echo -e "${RED}❌ Failed to get admin token${NC}"
    echo "$ADMIN_RESPONSE"
    exit 1
fi

# Test 1: Check contract templates
echo -e "\n${BLUE}📋 Test 1: Checking contract templates...${NC}"
TEMPLATES_RESPONSE=$(curl -s -X GET http://localhost:5001/api/contract-templates \
    -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$TEMPLATES_RESPONSE" | grep -q "success"; then
    TEMPLATE_COUNT=$(echo "$TEMPLATES_RESPONSE" | jq '.data | length')
    echo -e "${GREEN}✅ Contract templates loaded: $TEMPLATE_COUNT templates${NC}"
    
    # Show template details
    echo "$TEMPLATES_RESPONSE" | jq -r '.data[] | "  - \(.name): \(.description)"'
else
    echo -e "${RED}❌ Failed to load contract templates${NC}"
    echo "$TEMPLATES_RESPONSE"
fi

# Test 2: Check CCRP users with cloud providers
echo -e "\n${BLUE}☁️ Test 2: Checking CCRP users with cloud providers...${NC}"
CCRP_RESPONSE=$(curl -s -X GET "http://localhost:5001/api/users?partyType=CCRP" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$CCRP_RESPONSE" | grep -q "users"; then
    CCRP_COUNT=$(echo "$CCRP_RESPONSE" | jq '.users | length')
    echo -e "${GREEN}✅ Found $CCRP_COUNT CCRP users${NC}"
    
    # Check each CCRP for cloud providers
    echo "$CCRP_RESPONSE" | jq -r '.users[] | "  - \(.name) (\(.email)): \(.cloudProviders // "No cloud providers")"'
    
    # Check if any have cloud providers
    CCRP_WITH_PROVIDERS=$(echo "$CCRP_RESPONSE" | jq '.users[] | select(.cloudProviders != null and .cloudProviders != []) | .name')
    if [ -n "$CCRP_WITH_PROVIDERS" ]; then
        echo -e "${GREEN}✅ CCRP users with cloud providers:${NC}"
        echo "$CCRP_WITH_PROVIDERS"
    else
        echo -e "${YELLOW}⚠️ No CCRP users have cloud providers set${NC}"
        echo -e "${BLUE}💡 This explains why cloud provider filtering is not working${NC}"
    fi
else
    echo -e "${RED}❌ Failed to load CCRP users${NC}"
    echo "$CCRP_RESPONSE"
fi

# Test 3: Check datasets
echo -e "\n${BLUE}📊 Test 3: Checking datasets...${NC}"
DATASETS_RESPONSE=$(curl -s -X GET http://localhost:5001/api/datasets \
    -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$DATASETS_RESPONSE" | grep -q "datasets"; then
    DATASET_COUNT=$(echo "$DATASETS_RESPONSE" | jq '.datasets | length')
    echo -e "${GREEN}✅ Found $DATASET_COUNT datasets${NC}"
    
    # Show dataset details
    echo "$DATASETS_RESPONSE" | jq -r '.datasets[] | "  - \(.name): \(.category) (\(.size) MB)"'
else
    echo -e "${RED}❌ Failed to load datasets${NC}"
    echo "$DATASETS_RESPONSE"
fi

# Test 4: Check AI models
echo -e "\n${BLUE}🤖 Test 4: Checking AI models...${NC}"
MODELS_RESPONSE=$(curl -s -X GET http://localhost:5001/api/ai-models \
    -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$MODELS_RESPONSE" | grep -q "models"; then
    MODEL_COUNT=$(echo "$MODELS_RESPONSE" | jq '.models | length')
    echo -e "${GREEN}✅ Found $MODEL_COUNT AI models${NC}"
    
    # Show model details
    echo "$MODELS_RESPONSE" | jq -r '.models[] | "  - \(.name): \(.type) (\(.framework))"'
else
    echo -e "${RED}❌ Failed to load AI models${NC}"
    echo "$MODELS_RESPONSE"
fi

# Test 5: Check if a contract exists to test display
echo -e "\n${BLUE}📄 Test 5: Checking existing contracts...${NC}"
CONTRACTS_RESPONSE=$(curl -s -X GET "http://localhost:5001/api/contracts?userId=1" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$CONTRACTS_RESPONSE" | grep -q "success"; then
    CONTRACT_COUNT=$(echo "$CONTRACTS_RESPONSE" | jq '.data | length')
    echo -e "${GREEN}✅ Found $CONTRACT_COUNT contracts${NC}"
    
    if [ "$CONTRACT_COUNT" -gt 0 ]; then
        # Show first contract structure
        FIRST_CONTRACT=$(echo "$CONTRACTS_RESPONSE" | jq '.data[0]')
        echo -e "${BLUE}📋 First contract structure:${NC}"
        echo "$FIRST_CONTRACT" | jq -r 'keys[]' | head -10
        
        # Check for dataset structure
        if echo "$FIRST_CONTRACT" | jq -e '.datasets' > /dev/null; then
            echo -e "${GREEN}✅ Contract has 'datasets' field${NC}"
        elif echo "$FIRST_CONTRACT" | jq -e '.datasetSelections' > /dev/null; then
            echo -e "${GREEN}✅ Contract has 'datasetSelections' field (Ricardian format)${NC}"
        else
            echo -e "${YELLOW}⚠️ Contract has no dataset fields${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️ No contracts found or failed to load${NC}"
fi

echo -e "\n${BLUE}🎯 Manual Testing Required:${NC}"
echo "=================================="
echo "1. Open browser and go to: http://localhost:3000"
echo "2. Login as TDC user (e.g., tdc1@dataconsumer.com / tdc123)"
echo "3. Navigate to Create Contract"
echo "4. Check template selection indication (should show 'Selected' chip)"
echo "5. Check cloud provider filtering in CCRP selection"
echo "6. Create a contract and verify datasets & TDPs display correctly"

echo -e "\n${GREEN}✅ Contract Creation UI Fixes Test Complete!${NC}"
echo -e "${BLUE}💡 If any issues persist, check browser console for errors${NC}"
