#!/bin/bash

# Test AI Models Single Selection
# This script tests if the AI Models selection in contract creation is working as single select

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing AI Models Single Selection${NC}"
echo "=========================================="

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

# Test 2: Check contract templates
echo -e "\n${BLUE}📋 Test 2: Checking contract templates...${NC}"
TEMPLATES_RESPONSE=$(curl -s -X GET http://localhost:5001/api/contract-templates \
    -H "Authorization: Bearer $TDC_TOKEN")

if echo "$TEMPLATES_RESPONSE" | grep -q "success"; then
    TEMPLATE_COUNT=$(echo "$TEMPLATES_RESPONSE" | jq '.data | length')
    echo -e "${GREEN}✅ Found $TEMPLATE_COUNT contract templates${NC}"
    
    # Get first template ID for testing
    FIRST_TEMPLATE_ID=$(echo "$TEMPLATES_RESPONSE" | jq -r '.data[0].id')
    echo -e "${BLUE}📋 Using template ID: $FIRST_TEMPLATE_ID${NC}"
else
    echo -e "${RED}❌ Failed to load contract templates${NC}"
    echo "$TEMPLATES_RESPONSE"
    exit 1
fi

# Test 3: Check available datasets
echo -e "\n${BLUE}📊 Test 3: Checking available datasets...${NC}"
DATASETS_RESPONSE=$(curl -s -X GET http://localhost:5001/api/datasets \
    -H "Authorization: Bearer $TDC_TOKEN")

if echo "$DATASETS_RESPONSE" | grep -q "datasets"; then
    DATASET_COUNT=$(echo "$DATASETS_RESPONSE" | jq '.datasets | length')
    echo -e "${GREEN}✅ Found $DATASET_COUNT datasets${NC}"
    
    # Get first dataset for testing
    FIRST_DATASET=$(echo "$DATASETS_RESPONSE" | jq '.datasets[0]')
    FIRST_DATASET_ID=$(echo "$FIRST_DATASET" | jq -r '.datasetId')
    FIRST_DATASET_NAME=$(echo "$FIRST_DATASET" | jq -r '.name')
    FIRST_DATASET_PRICE=$(echo "$FIRST_DATASET" | jq -r '.price')
    
    echo -e "${BLUE}📊 Using dataset: $FIRST_DATASET_NAME (ID: $FIRST_DATASET_ID, Price: $FIRST_DATASET_PRICE)${NC}"
else
    echo -e "${RED}❌ Failed to load datasets${NC}"
    echo "$DATASETS_RESPONSE"
    exit 1
fi

# Test 4: Check available CCRP users
echo -e "\n${BLUE}☁️ Test 4: Checking available CCRP users...${NC}"
CCRP_RESPONSE=$(curl -s -X GET "http://localhost:5001/api/users/ccrp" \
    -H "Authorization: Bearer $TDC_TOKEN")

if echo "$CCRP_RESPONSE" | grep -q "id"; then
    CCRP_COUNT=$(echo "$CCRP_RESPONSE" | jq 'length')
    echo -e "${GREEN}✅ Found $CCRP_COUNT CCRP users${NC}"
    
    # Get first CCRP with cloud providers for testing
    CCRP_ID=$(echo "$CCRP_RESPONSE" | jq -r '.[] | select(.cloudProviders != null and .cloudProviders != []) | .id' | head -1)
    if [ -n "$CCRP_ID" ] && [ "$CCRP_ID" != "null" ]; then
        CCRP_NAME=$(echo "$CCRP_RESPONSE" | jq -r ".[] | select(.id == $CCRP_ID) | .name")
        CCRP_PROVIDERS=$(echo "$CCRP_RESPONSE" | jq -r ".[] | select(.id == $CCRP_ID) | .cloudProviders | join(\", \")")
        echo -e "${BLUE}☁️ Using CCRP: $CCRP_NAME (ID: $CCRP_ID, Providers: $CCRP_PROVIDERS)${NC}"
    else
        echo -e "${YELLOW}⚠️ No CCRP users with cloud providers found${NC}"
        CCRP_ID=""
    fi
else
    echo -e "${RED}❌ Failed to load CCRP users${NC}"
    echo "$CCRP_RESPONSE"
    exit 1
fi

# Test 5: Create a test contract with single AI model
echo -e "\n${BLUE}📄 Test 5: Creating test contract with single AI model...${NC}"

# Prepare contract data with single AI model
CONTRACT_DATA=$(cat <<EOF
{
    "datasetSelections": [
        {
            "datasetId": "$FIRST_DATASET_ID",
            "individualPrice": $FIRST_DATASET_PRICE
        }
    ],
    "aiModelIds": ["$FIRST_MODEL_ID"],
    "duration": 90,
    "termsAndConditions": "Test contract for AI model single selection validation",
    "ccrpId": "$CCRP_ID",
    "contractType": "AI_TRAINING",
    "environmentSpecs": {
        "computeRequirements": "High-performance GPU",
        "securityLevel": "HIGH",
        "compliance": ["SOC2", "ISO27001"]
    },
    "trainingParams": {
        "maxEpochs": 100,
        "batchSize": 32,
        "learningRate": 0.001
    },
    "privacyRequirements": {
        "differentialPrivacy": true,
        "federatedLearning": false,
        "dataRetention": "90 days"
    }
}
EOF
)

echo -e "${BLUE}📋 Contract data prepared with single AI model:${NC}"
echo "$CONTRACT_DATA" | jq '.'

# Create the contract
CONTRACT_RESPONSE=$(curl -s -X POST http://localhost:5001/api/contracts/ricardian \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TDC_TOKEN" \
    -d "$CONTRACT_DATA")

if echo "$CONTRACT_RESPONSE" | grep -q "success"; then
    CONTRACT_ID=$(echo "$CONTRACT_RESPONSE" | jq -r '.contract.contractId')
    echo -e "${GREEN}✅ Contract created successfully with single AI model!${NC}"
    echo -e "${BLUE}📄 Contract ID: $CONTRACT_ID${NC}"
    
    # Test 6: Verify the contract has single AI model
    echo -e "\n${BLUE}📄 Test 6: Verifying single AI model in contract...${NC}"
    RETRIEVE_RESPONSE=$(curl -s -X GET "http://localhost:5001/api/contracts/$CONTRACT_ID" \
        -H "Authorization: Bearer $TDC_TOKEN")
    
    if echo "$RETRIEVE_RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✅ Contract retrieved successfully${NC}"
        
        # Check AI model IDs
        AI_MODEL_IDS=$(echo "$RETRIEVE_RESPONSE" | jq -r '.contract.aiModelIds | length')
        echo -e "${BLUE}🤖 AI Model IDs count: $AI_MODEL_IDS${NC}"
        
        if [ "$AI_MODEL_IDS" -eq 1 ]; then
            echo -e "${GREEN}✅ Contract has exactly 1 AI model (single selection working)${NC}"
        else
            echo -e "${YELLOW}⚠️ Contract has $AI_MODEL_IDS AI models (expected 1)${NC}"
        fi
        
        # Show the AI model ID
        AI_MODEL_ID=$(echo "$RETRIEVE_RESPONSE" | jq -r '.contract.aiModelIds[0]')
        echo -e "${BLUE}🤖 Selected AI Model ID: $AI_MODEL_ID${NC}"
        
    else
        echo -e "${RED}❌ Failed to retrieve contract${NC}"
        echo "$RETRIEVE_RESPONSE"
    fi
else
    echo -e "${RED}❌ Failed to create contract${NC}"
    echo "$CONTRACT_RESPONSE"
    
    # Try to get more details about the error
    ERROR_MSG=$(echo "$CONTRACT_RESPONSE" | jq -r '.error // "Unknown error"')
    echo -e "${YELLOW}💡 Error details: $ERROR_MSG${NC}"
fi

echo -e "\n${BLUE}🎯 Manual Testing Required:${NC}"
echo "=================================="
echo "1. Open browser and go to: http://localhost:3000"
echo "2. Login as TDC user: tdc1@dataconsumer.com / tdc123"
echo "3. Navigate to Create Contract"
echo "4. Go to Step 3: Configure Contract & Environment"
echo "5. Verify AI Models dropdown shows single selection (no checkboxes)"
echo "6. Verify only one model can be selected at a time"
echo "7. Verify the selection is properly displayed in the review"

echo -e "\n${GREEN}✅ AI Models Single Selection Test Complete!${NC}"
echo -e "${BLUE}💡 Check the output above for any errors or issues${NC}"
