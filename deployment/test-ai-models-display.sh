#!/bin/bash

# Test AI Models Display in Review Section
# This script tests if the AI Models are properly displayed in Step 4

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing AI Models Display in Review Section${NC}"
echo "=================================================="

# Check if backend is running
echo -e "\n${BLUE}🔍 Checking backend status...${NC}"
if ! curl -s http://localhost:5001 > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend is not running. Please start the backend first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend is responding${NC}"

# Check if frontend is running
echo -e "\n${BLUE}🔍 Checking frontend status...${NC}"
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${RED}❌ Frontend is not running. Please start the frontend first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend is running${NC}"

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

# Test 1: Check available AI models
echo -e "\n${BLUE}🤖 Test 1: Checking available AI models...${NC}"
MODELS_RESPONSE=$(curl -s -X GET http://localhost:5001/api/ai-models \
    -H "Authorization: Bearer $TDC_TOKEN")

if echo "$MODELS_RESPONSE" | grep -q "models"; then
    MODEL_COUNT=$(echo "$MODELS_RESPONSE" | jq '.models | length')
    echo -e "${GREEN}✅ Found $MODEL_COUNT AI models${NC}"
    
    # Show first few models
    echo -e "${BLUE}📋 Available AI Models:${NC}"
    echo "$MODELS_RESPONSE" | jq -r '.models[] | "  - \(.name) (ID: \(.id), Type: \(.type))"' | head -5
    
    # Get first model for testing
    FIRST_MODEL=$(echo "$MODELS_RESPONSE" | jq '.models[0]')
    FIRST_MODEL_ID=$(echo "$FIRST_MODEL" | jq -r '.id')
    FIRST_MODEL_NAME=$(echo "$FIRST_MODEL" | jq -r '.name')
    FIRST_MODEL_TYPE=$(echo "$FIRST_MODEL" | jq -r '.type')
    
    echo -e "${BLUE}🤖 Sample model: $FIRST_MODEL_NAME (ID: $FIRST_MODEL_ID, Type: $FIRST_MODEL_TYPE)${NC}"
else
    echo -e "${RED}❌ Failed to load AI models${NC}"
    echo "$MODELS_RESPONSE"
    exit 1
fi

# Test 2: Check if models have the required fields
echo -e "\n${BLUE}🔍 Test 2: Checking model field completeness...${NC}"
FIRST_MODEL_JSON=$(echo "$MODELS_RESPONSE" | jq '.models[0]')

echo -e "${BLUE}📊 Model field analysis:${NC}"
echo "  - Name: $(echo "$FIRST_MODEL_JSON" | jq -r '.name // "MISSING"')"
echo "  - Type: $(echo "$FIRST_MODEL_JSON" | jq -r '.type // "MISSING"')"
echo "  - Architecture: $(echo "$FIRST_MODEL_JSON" | jq -r '.architecture // "MISSING"')"
echo "  - Parameters: $(echo "$FIRST_MODEL_JSON" | jq -r '.parameters // "MISSING"')"
echo "  - Framework: $(echo "$FIRST_MODEL_JSON" | jq -r '.framework // "MISSING"')"
echo "  - Privacy Technique: $(echo "$FIRST_MODEL_JSON" | jq -r '.privacyTechnique // "MISSING"')"
echo "  - Max Epochs: $(echo "$FIRST_MODEL_JSON" | jq -r '.maxEpochs // "MISSING"')"
echo "  - Batch Size: $(echo "$FIRST_MODEL_JSON" | jq -r '.batchSize // "MISSING"')"
echo "  - Learning Rate: $(echo "$FIRST_MODEL_JSON" | jq -r '.learningRate // "MISSING"')"

# Test 3: Check contract templates
echo -e "\n${BLUE}📋 Test 3: Checking contract templates...${NC}"
TEMPLATES_RESPONSE=$(curl -s -X GET http://localhost:5001/api/contract-templates \
    -H "Authorization: Bearer $TDC_TOKEN")

if echo "$TEMPLATES_RESPONSE" | grep -q "success"; then
    TEMPLATE_COUNT=$(echo "$TEMPLATES_RESPONSE" | jq '.data | length')
    echo -e "${GREEN}✅ Found $TEMPLATE_COUNT contract templates${NC}"
else
    echo -e "${RED}❌ Failed to load contract templates${NC}"
    echo "$TEMPLATES_RESPONSE"
fi

echo -e "\n${BLUE}🎯 Manual Testing Required:${NC}"
echo "=================================="
echo "1. Open browser and go to: http://localhost:3000"
echo "2. Login as TDC user: tdc1@dataconsumer.com / tdc123"
echo "3. Navigate to Create Contract"
echo "4. Go to Step 3: Configure Contract & Environment"
echo "5. Select an AI model from the dropdown"
echo "6. Go to Step 4: Review Legal Document & Smart Contract"
echo "7. Verify the 'Selected AI Model' section shows:"
echo "   - Debug information (in development mode)"
echo "   - Model details if selected"
echo "   - Appropriate message if no model selected"
echo "8. Check that all model fields are displayed correctly"

echo -e "\n${GREEN}✅ AI Models Display Test Complete!${NC}"
echo -e "${BLUE}💡 Check the output above for any errors or issues${NC}"
echo -e "${YELLOW}⚠️ If models have missing fields, they will show 'Not specified' in the UI${NC}"
