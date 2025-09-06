#!/bin/bash

# Create Test Data Script
# This script creates comprehensive test data for the Contract Management System
# Uses the same APIs that the frontend would use

set -e

# Load centralized configuration
if [ -f "config.env" ]; then
    source config.env
fi

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📝 Creating Test Data for Contract Management System${NC}"
echo "=============================================================="
echo "Using APIs just like the frontend would use"
echo ""

# Check if backend is running
echo -e "${BLUE}🔍 Step 1: Checking backend status...${NC}"
if curl -s "http://localhost:${PORT}/health" > /dev/null 2>&1; then
    echo -e "  Backend: ${GREEN}✅ Running${NC}"
else
    echo -e "  Backend: ${RED}❌ Not running${NC}"
    echo "Please start the backend first: ./scripts/script-manager.sh system start"
    exit 1
fi

# Check if Keycloak is running
echo -e "\n${BLUE}🔍 Step 2: Checking Keycloak status...${NC}"
if curl -k -s "${KEYCLOAK_URL}/health" > /dev/null 2>&1; then
    echo -e "  Keycloak: ${GREEN}✅ Running${NC}"
else
    echo -e "  Keycloak: ${RED}❌ Not running${NC}"
    echo "Please start Keycloak first: ./scripts/script-manager.sh system start"
    exit 1
fi

# Create test users using the registration API
echo -e "\n${BLUE}👥 Step 3: Creating test users via registration API...${NC}"

# Function to create a user via registration API
create_user() {
    local name="$1"
    local email="$2"
    local party_type="$3"
    local organization="$4"
    local description="$5"
    
    echo "  Creating ${party_type} user: ${name}..."
    
    local response=$(curl -s -X POST "http://localhost:${PORT}/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"${name}\",
            \"email\": \"${email}\",
            \"partyType\": \"${party_type}\",
            \"organization\": \"${organization}\",
            \"description\": \"${description}\"
        }" 2>/dev/null || echo "FAILED")
    
    if echo "$response" | grep -q "success.*true"; then
        echo -e "  ${party_type} User: ${GREEN}✅ Created successfully${NC}"
        return 0
    elif echo "$response" | grep -q "already registered\|already exists"; then
        echo -e "  ${party_type} User: ${YELLOW}⚠️ Already exists${NC}"
        return 0
    else
        echo -e "  ${party_type} User: ${RED}❌ Failed${NC}"
        echo "    Response: $response"
        return 1
    fi
}

# Create TDP (Training Data Provider) user
create_user \
    "Medical Data Provider" \
    "tdp.medical@example.com" \
    "TDP" \
    "MedData Corp" \
    "Medical data provider specializing in healthcare datasets for AI training"

# Create TDC (Training Data Consumer) user  
create_user \
    "Healthcare AI Company" \
    "tdc.healthcare@example.com" \
    "TDC" \
    "HealthAI Inc" \
    "Healthcare AI company looking for medical datasets for model training"

# Create CCRP (Confidential Clean Room Provider) user
create_user \
    "Secure Cloud Provider" \
    "ccrp.secure@example.com" \
    "CCRP" \
    "SecureCloud Ltd" \
    "Confidential clean room provider offering secure environments for data analytics"

# Create AppAdmin user
create_user \
    "System Administrator" \
    "admin@contractmanagement.com" \
    "AppAdmin" \
    "Contract Management System" \
    "System administrator with full access to the platform"

echo -e "\n${BLUE}📊 Step 4: Creating test datasets...${NC}"

# Function to create a dataset
create_dataset() {
    local name="$1"
    local description="$2"
    local category="$3"
    local owner_email="$4"
    
    echo "  Creating dataset: ${name}..."
    
    # First, we need to get an auth token for the owner
    local login_response=$(curl -s -X POST "http://localhost:${PORT}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${owner_email}\", \"password\": \"password123\"}" 2>/dev/null || echo "FAILED")
    
    if echo "$login_response" | grep -q "accessToken"; then
        local token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        
        local dataset_response=$(curl -s -X POST "http://localhost:${PORT}/api/datasets" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${token}" \
            -d "{
                \"name\": \"${name}\",
                \"description\": \"${description}\",
                \"category\": \"${category}\",
                \"dataType\": \"structured\",
                \"size\": \"1.2GB\",
                \"recordCount\": 10000,
                \"privacyLevel\": \"confidential\",
                \"retentionPeriod\": 365,
                \"geographicScope\": \"US\",
                \"dataQuality\": \"high\"
            }" 2>/dev/null || echo "FAILED")
        
        if echo "$dataset_response" | grep -q "id"; then
            echo -e "  Dataset: ${GREEN}✅ Created successfully${NC}"
        else
            echo -e "  Dataset: ${YELLOW}⚠️ May already exist or failed${NC}"
        fi
    else
        echo -e "  Dataset: ${RED}❌ Failed to authenticate owner${NC}"
    fi
}

# Create test datasets
create_dataset \
    "Medical Records Dataset" \
    "Anonymized medical records for healthcare AI training" \
    "Healthcare" \
    "tdp.medical@example.com"

create_dataset \
    "Patient Demographics" \
    "Demographic data for healthcare analytics" \
    "Healthcare" \
    "tdp.medical@example.com"

echo -e "\n${BLUE}🤖 Step 5: Creating test AI models...${NC}"

# Function to create an AI model
create_ai_model() {
    local name="$1"
    local description="$2"
    local category="$3"
    local owner_email="$4"
    
    echo "  Creating AI model: ${name}..."
    
    # Get auth token for the owner
    local login_response=$(curl -s -X POST "http://localhost:${PORT}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${owner_email}\", \"password\": \"password123\"}" 2>/dev/null || echo "FAILED")
    
    if echo "$login_response" | grep -q "accessToken"; then
        local token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        
        local model_response=$(curl -s -X POST "http://localhost:${PORT}/api/ai-models" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${token}" \
            -d "{
                \"name\": \"${name}\",
                \"description\": \"${description}\",
                \"category\": \"${category}\",
                \"modelType\": \"neural_network\",
                \"framework\": \"tensorflow\",
                \"version\": \"1.0.0\",
                \"accuracy\": 0.95,
                \"trainingDataSize\": \"10GB\",
                \"modelSize\": \"500MB\"
            }" 2>/dev/null || echo "FAILED")
        
        if echo "$model_response" | grep -q "id"; then
            echo -e "  AI Model: ${GREEN}✅ Created successfully${NC}"
        else
            echo -e "  AI Model: ${YELLOW}⚠️ May already exist or failed${NC}"
        fi
    else
        echo -e "  AI Model: ${RED}❌ Failed to authenticate owner${NC}"
    fi
}

# Create test AI models
create_ai_model \
    "Healthcare Diagnosis Model" \
    "AI model for medical diagnosis assistance" \
    "Healthcare" \
    "tdc.healthcare@example.com"

create_ai_model \
    "Patient Risk Assessment" \
    "Model for assessing patient health risks" \
    "Healthcare" \
    "tdc.healthcare@example.com"

echo -e "\n${BLUE}📋 Step 6: Creating test contracts...${NC}"

# Function to create a contract
create_contract() {
    local title="$1"
    local description="$2"
    local data_provider="$3"
    local data_consumer="$4"
    local clean_room_provider="$5"
    
    echo "  Creating contract: ${title}..."
    
    # Get auth token for data provider (contract initiator)
    local login_response=$(curl -s -X POST "http://localhost:${PORT}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${data_provider}\", \"password\": \"password123\"}" 2>/dev/null || echo "FAILED")
    
    if echo "$login_response" | grep -q "accessToken"; then
        local token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        
        local contract_response=$(curl -s -X POST "http://localhost:${PORT}/api/contracts" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${token}" \
            -d "{
                \"title\": \"${title}\",
                \"description\": \"${description}\",
                \"dataProviderEmail\": \"${data_provider}\",
                \"dataConsumerEmail\": \"${data_consumer}\",
                \"cleanRoomProviderEmail\": \"${clean_room_provider}\",
                \"contractType\": \"DATA_SHARING\",
                \"status\": \"DRAFT\",
                \"terms\": {
                    \"dataUsage\": \"AI training only\",
                    \"retentionPeriod\": 365,
                    \"confidentiality\": \"strict\",
                    \"auditRequirements\": true
                }
            }" 2>/dev/null || echo "FAILED")
        
        if echo "$contract_response" | grep -q "id"; then
            echo -e "  Contract: ${GREEN}✅ Created successfully${NC}"
        else
            echo -e "  Contract: ${YELLOW}⚠️ May already exist or failed${NC}"
        fi
    else
        echo -e "  Contract: ${RED}❌ Failed to authenticate data provider${NC}"
    fi
}

# Create test contracts
create_contract \
    "Medical Data Sharing Agreement" \
    "Contract for sharing medical datasets for AI training in secure environment" \
    "tdp.medical@example.com" \
    "tdc.healthcare@example.com" \
    "ccrp.secure@example.com"

create_contract \
    "Healthcare Analytics Partnership" \
    "Partnership agreement for healthcare data analytics project" \
    "tdp.medical@example.com" \
    "tdc.healthcare@example.com" \
    "ccrp.secure@example.com"

echo -e "\n${BLUE}🧪 Step 7: Testing authentication...${NC}"

# Test login for each user
test_login() {
    local email="$1"
    local party_type="$2"
    
    echo "  Testing login for ${party_type}: ${email}..."
    
    local login_response=$(curl -s -X POST "http://localhost:${PORT}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${email}\", \"password\": \"password123\"}" 2>/dev/null || echo "FAILED")
    
    if echo "$login_response" | grep -q "accessToken"; then
        echo -e "  ${party_type} Login: ${GREEN}✅ Success${NC}"
    else
        echo -e "  ${party_type} Login: ${RED}❌ Failed${NC}"
        echo "    Response: $login_response"
    fi
}

test_login "tdp.medical@example.com" "TDP"
test_login "tdc.healthcare@example.com" "TDC"
test_login "ccrp.secure@example.com" "CCRP"
test_login "admin@contractmanagement.com" "AppAdmin"

echo -e "\n${GREEN}🎉 Test data creation completed!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "  ✅ Test users created via registration API"
echo "  ✅ Test datasets created"
echo "  ✅ Test AI models created"
echo "  ✅ Test contracts created"
echo "  ✅ Authentication tested"
echo ""
echo -e "${BLUE}🔗 Test Users:${NC}"
echo "  TDP: tdp.medical@example.com (password: password123)"
echo "  TDC: tdc.healthcare@example.com (password: password123)"
echo "  CCRP: ccrp.secure@example.com (password: password123)"
echo "  Admin: admin@contractmanagement.com (password: password123)"
echo ""
echo -e "${BLUE}🌐 Access URLs:${NC}"
echo "  Frontend: http://localhost:${FRONTEND_PORT}"
echo "  Backend API: http://localhost:${PORT}/api"
echo "  Keycloak Admin: ${KEYCLOAK_URL}/admin"
echo ""
echo -e "${GREEN}You can now test the system with these test users!${NC}"