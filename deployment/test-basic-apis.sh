#!/bin/bash

# Basic API Test Script
# Tests the core APIs to ensure they're working before creating test data

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing Basic APIs${NC}"
echo "========================"

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

# Test admin authentication
echo -e "\n${BLUE}🔐 Testing Admin Authentication${NC}"
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@contractmanagement.com","password":"***REMOVED-KEYCLOAK_ADMIN_PASSWORD***"}')

if echo "$ADMIN_RESPONSE" | grep -q "accessToken"; then
    ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | jq -r '.accessToken')
    echo -e "${GREEN}✅ Admin authentication successful${NC}"
else
    echo -e "${RED}❌ Admin authentication failed${NC}"
    echo "Response: $ADMIN_RESPONSE"
    exit 1
fi

# Test user creation
echo -e "\n${BLUE}👤 Testing User Creation${NC}"
TEST_USER_DATA='{
    "email": "test-user@example.com",
    "password": "test123",
    "name": "Test User",
    "partyType": "TDP",
    "organization": "Test Organization"
}'

USER_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/register \
    -H "Content-Type: application/json" \
    -d "$TEST_USER_DATA")

if echo "$USER_RESPONSE" | grep -q "id"; then
    USER_ID=$(echo "$USER_RESPONSE" | jq -r '.id')
    echo -e "${GREEN}✅ User creation successful (ID: $USER_ID)${NC}"
else
    echo -e "${YELLOW}⚠️ User creation response:${NC}"
    echo "$USER_RESPONSE"
fi

# Test dataset creation
echo -e "\n${BLUE}📊 Testing Dataset Creation${NC}"
TEST_DATASET_DATA='{
    "datasetId": "test-dataset-v1",
    "name": "Test Dataset",
    "description": "Test dataset for API validation",
    "category": "Tabular",
    "size": 1024,
    "recordCount": 1000,
    "price": "100.00",
    "license": "Academic",
    "tags": ["test", "api", "validation"],
    "metadata": {
        "quality": "test",
        "coverage": "test",
        "dataQuality": "test"
    },
    "isPublic": true,
    "confidentialComputingRequired": false,
    "ownerId": 1
}'

DATASET_RESPONSE=$(curl -s -X POST http://localhost:5001/api/datasets \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "$TEST_DATASET_DATA")

if echo "$DATASET_RESPONSE" | grep -q "id"; then
    DATASET_ID=$(echo "$DATASET_RESPONSE" | jq -r '.dataset.id')
    echo -e "${GREEN}✅ Dataset creation successful (ID: $DATASET_ID)${NC}"
else
    echo -e "${YELLOW}⚠️ Dataset creation response:${NC}"
    echo "$DATASET_RESPONSE"
fi

# Test AI model creation
echo -e "\n${BLUE}🤖 Testing AI Model Creation${NC}"
TEST_MODEL_DATA='{
    "modelId": "test-model-v1",
    "name": "Test AI Model",
    "description": "Test AI model for API validation",
    "type": "cnn",
    "architecture": "ResNet-18",
    "parameters": "100M",
    "framework": "PyTorch",
    "privacyTechnique": "differential-privacy",
    "validationMetrics": {
        "accuracy": "85%",
        "precision": "0.85"
    },
    "maxEpochs": 100,
    "batchSize": 32,
    "learningRate": "0.001",
    "metadata": {
        "modelSize": "100MB",
        "inputShape": [224, 224, 3],
        "trainingData": "Test Dataset",
        "outputClasses": 5
    }
}'

MODEL_RESPONSE=$(curl -s -X POST http://localhost:5001/api/ai-models \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "$TEST_MODEL_DATA")

if echo "$MODEL_RESPONSE" | grep -q "id"; then
    MODEL_ID=$(echo "$MODEL_RESPONSE" | jq -r '.model.id')
    echo -e "${GREEN}✅ AI model creation successful (ID: $MODEL_ID)${NC}"
else
    echo -e "${YELLOW}⚠️ AI model creation response:${NC}"
    echo "$MODEL_RESPONSE"
fi

# Test training environment creation
echo -e "\n${BLUE}🏗️ Testing Training Environment Creation${NC}"
TEST_ENV_DATA='{
    "name": "Test Training Environment",
    "description": "Test training environment for API validation",
    "ownerId": 1,
    "environmentType": "CLOUD",
    "computeResources": {"cpuCores": 4, "gpuCount": 1, "ramGB": 16, "storageTB": 1},
    "securityLevel": "MEDIUM",
    "dataIsolation": true,
    "networkAccess": "RESTRICTED",
    "monitoringEnabled": true,
    "backupFrequency": "DAILY",
    "complianceCertifications": ["SOC2"],
    "supportedFrameworks": ["TensorFlow", "PyTorch"],
    "maxUsers": 5,
    "maxConcurrentJobs": 2
}'

ENV_RESPONSE=$(curl -s -X POST http://localhost:5001/api/training-environments \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "$TEST_ENV_DATA")

if echo "$ENV_RESPONSE" | grep -q "id"; then
    ENV_ID=$(echo "$ENV_RESPONSE" | jq -r '.id')
    echo -e "${GREEN}✅ Training environment creation successful (ID: $ENV_ID)${NC}"
else
    echo -e "${YELLOW}⚠️ Training environment creation response:${NC}"
    echo "$ENV_RESPONSE"
fi

# Test cloud credentials creation
echo -e "\n${BLUE}☁️ Testing Cloud Credentials Creation${NC}"
TEST_CREDS_DATA='{
    "name": "Test Cloud Credentials",
    "ownerId": 1,
    "cloudProvider": "AWS",
    "region": "us-east-1",
    "credentials": {
        "accessKeyId": "AKIATEST123",
        "secretAccessKey": "secret_test_key",
        "sessionToken": "test_session_token"
    },
    "permissions": ["S3_READ", "S3_WRITE"],
    "encryptionEnabled": true,
    "mfaEnabled": false
}'

CREDS_RESPONSE=$(curl -s -X POST http://localhost:5001/api/cloud-credentials \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "$TEST_CREDS_DATA")

if echo "$CREDS_RESPONSE" | grep -q "id"; then
    CREDS_ID=$(echo "$CREDS_RESPONSE" | jq -r '.id')
    echo -e "${GREEN}✅ Cloud credentials creation successful (ID: $CREDS_ID)${NC}"
else
    echo -e "${YELLOW}⚠️ Cloud credentials creation response:${NC}"
    echo "$CREDS_RESPONSE"
fi

# Test data retrieval
echo -e "\n${BLUE}📋 Testing Data Retrieval APIs${NC}"

# Test users API
USERS_RESPONSE=$(curl -s -X GET http://localhost:5001/api/users \
    -H "Authorization: Bearer $ADMIN_TOKEN")
if echo "$USERS_RESPONSE" | grep -q "id"; then
    USER_COUNT=$(echo "$USERS_RESPONSE" | jq 'length')
    echo -e "${GREEN}✅ Users API working (${USER_COUNT} users)${NC}"
else
    echo -e "${RED}❌ Users API failed${NC}"
fi

# Test datasets API
DATASETS_RESPONSE=$(curl -s -X GET http://localhost:5001/api/datasets \
    -H "Authorization: Bearer $ADMIN_TOKEN")
if echo "$DATASETS_RESPONSE" | grep -q "id"; then
    DATASET_COUNT=$(echo "$DATASETS_RESPONSE" | jq 'length')
    echo -e "${GREEN}✅ Datasets API working (${DATASET_COUNT} datasets)${NC}"
else
    echo -e "${RED}❌ Datasets API failed${NC}"
fi

# Test AI models API
MODELS_RESPONSE=$(curl -s -X GET http://localhost:5001/api/ai-models \
    -H "Authorization: Bearer $ADMIN_TOKEN")
if echo "$MODELS_RESPONSE" | grep -q "id"; then
    MODEL_COUNT=$(echo "$MODELS_RESPONSE" | jq 'length')
    echo -e "${GREEN}✅ AI Models API working (${MODEL_COUNT} models)${NC}"
else
    echo -e "${RED}❌ AI Models API failed${NC}"
fi

# Test training environments API
ENVS_RESPONSE=$(curl -s -X GET http://localhost:5001/api/training-environments \
    -H "Authorization: Bearer $ADMIN_TOKEN")
if echo "$ENVS_RESPONSE" | grep -q "id"; then
    ENV_COUNT=$(echo "$ENVS_RESPONSE" | jq 'length')
    echo -e "${GREEN}✅ Training Environments API working (${ENV_COUNT} environments)${NC}"
else
    echo -e "${RED}❌ Training Environments API failed${NC}"
fi

# Test cloud credentials API
CREDS_LIST_RESPONSE=$(curl -s -X GET http://localhost:5001/api/cloud-credentials \
    -H "Authorization: Bearer $ADMIN_TOKEN")
if echo "$CREDS_LIST_RESPONSE" | grep -q "id"; then
    CREDS_COUNT=$(echo "$CREDS_LIST_RESPONSE" | jq 'length')
    echo -e "${GREEN}✅ Cloud Credentials API working (${CREDS_COUNT} credentials)${NC}"
else
    echo -e "${RED}❌ Cloud Credentials API failed${NC}"
fi

echo -e "\n${GREEN}🎉 Basic API Testing Completed!${NC}"
echo "======================================"
echo -e "${BLUE}📊 Summary:${NC}"
echo "  ✅ Backend Health: Working"
echo "  ✅ Admin Authentication: Working"
echo "  ✅ User Creation: Tested"
echo "  ✅ Dataset Creation: Tested"
echo "  ✅ AI Model Creation: Tested"
echo "  ✅ Training Environment Creation: Tested"
echo "  ✅ Cloud Credentials Creation: Tested"
echo "  ✅ Data Retrieval APIs: Tested"
echo ""
echo -e "${BLUE}🧪 Next Steps:${NC}"
echo "  1. Run full test data creation: ./deployment/create-test-data.sh"
echo "  2. Test contract creation with the test data"
echo "  3. Test SCITT CCF integration"
echo ""
echo -e "${YELLOW}⚠️  Note: All tests use backend APIs - no direct database access${NC}"
