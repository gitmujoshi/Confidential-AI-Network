#!/bin/bash

# Test TDC Dashboard Data Loading
# This script tests if the TDC Dashboard can load the required data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing TDC Dashboard Data Loading${NC}"
echo "=========================================="

# Check if backend is running
echo -e "\n${BLUE}🔍 Checking backend status...${NC}"
if ! curl -s http://localhost:5001 > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend is not running. Please start the backend first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend is responding${NC}"

# Get TDC user token
echo -e "\n${BLUE}🔐 Getting TDC user token...${NC}"
TDC_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
        "email": "tdc1@dataconsumer.com",
        "password": "tdc123"
    }')

if echo "$TDC_RESPONSE" | grep -q "accessToken"; then
    TDC_TOKEN=$(echo "$TDC_RESPONSE" | jq -r '.accessToken')
    TDC_USER_ID=$(echo "$TDC_RESPONSE" | jq -r '.user.id')
    echo -e "${GREEN}✅ TDC user authenticated: ID $TDC_USER_ID${NC}"
else
    echo -e "${RED}❌ Failed to authenticate TDC user${NC}"
    echo "$TDC_RESPONSE"
    exit 1
fi

# Test 1: Check datasets endpoint
echo -e "\n${BLUE}📊 Test 1: Checking datasets endpoint...${NC}"
DATASETS_RESPONSE=$(curl -s -X GET http://localhost:5001/api/datasets \
    -H "Authorization: Bearer $TDC_TOKEN")

if echo "$DATASETS_RESPONSE" | grep -q "datasets"; then
    DATASET_COUNT=$(echo "$DATASETS_RESPONSE" | jq '.datasets | length')
    echo -e "${GREEN}✅ Datasets endpoint working: $DATASET_COUNT datasets found${NC}"
else
    echo -e "${RED}❌ Datasets endpoint failed${NC}"
    echo "$DATASETS_RESPONSE"
fi

# Test 2: Check contracts endpoint
echo -e "\n${BLUE}📄 Test 2: Checking contracts endpoint...${NC}"
CONTRACTS_RESPONSE=$(curl -s -X GET http://localhost:5001/api/contracts \
    -H "Authorization: Bearer $TDC_TOKEN")

if echo "$CONTRACTS_RESPONSE" | grep -q "contracts"; then
    CONTRACT_COUNT=$(echo "$CONTRACTS_RESPONSE" | jq '.contracts | length')
    echo -e "${GREEN}✅ Contracts endpoint working: $CONTRACT_COUNT contracts found${NC}"
else
    echo -e "${RED}❌ Contracts endpoint failed${NC}"
    echo "$CONTRACTS_RESPONSE"
fi

# Test 3: Check if TDC Dashboard can render
echo -e "\n${BLUE}🖥️ Test 3: Checking TDC Dashboard rendering...${NC}"
if curl -s http://localhost:3000/tdc/dashboard > /dev/null; then
    echo -e "${GREEN}✅ TDC Dashboard route accessible${NC}"
else
    echo -e "${YELLOW}⚠️ TDC Dashboard route not accessible (may require authentication)${NC}"
fi

echo -e "\n${BLUE}🎯 Manual Testing Required:${NC}"
echo "=================================="
echo "1. Open browser and go to: http://localhost:3000"
echo "2. Login as TDC user: tdc1@dataconsumer.com / tdc123"
echo "3. Navigate to TDC Dashboard"
echo "4. Verify the dashboard loads with data"
echo "5. Check that there's no header overlap"

echo -e "\n${GREEN}✅ TDC Dashboard Test Complete!${NC}"
echo -e "${BLUE}💡 Check the output above for any errors or issues${NC}"
