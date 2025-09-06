#!/bin/bash

# Create TDP (Training Data Provider) Test Data Script
# This script creates comprehensive test data specifically for TDP users
# Uses APIs only, following project best practices

set -e

# Load centralized configuration
if [ -f "config.env" ]; then
    source config.env
    echo -e "${BLUE}✅ Loading centralized configuration from config.env${NC}"
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

echo -e "${BLUE}📊 Creating TDP Test Data for Contract Management System${NC}"
echo "=============================================================="
echo "Creating comprehensive test data for Training Data Providers"
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

# Function to create a TDP user via registration API
create_tdp_user() {
    local name="$1"
    local email="$2"
    local organization="$3"
    local description="$4"
    local specialization="$5"
    
    echo "  Creating TDP user: ${name}..."
    
    local response=$(curl -s -X POST "http://localhost:${PORT}/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"${name}\",
            \"email\": \"${email}\",
            \"partyType\": \"TDP\",
            \"organization\": \"${organization}\",
            \"description\": \"${description}\",
            \"specialization\": \"${specialization}\"
        }" 2>/dev/null || echo "FAILED")
    
    if echo "$response" | grep -q "success.*true"; then
        echo -e "  TDP User: ${GREEN}✅ Created successfully${NC}"
        return 0
    elif echo "$response" | grep -q "already registered\|already exists"; then
        echo -e "  TDP User: ${YELLOW}⚠️ Already exists${NC}"
        return 0
    else
        echo -e "  TDP User: ${RED}❌ Failed${NC}"
        echo "    Response: $response"
        return 1
    fi
}

# Function to create a dataset
create_dataset() {
    local name="$1"
    local description="$2"
    local category="$3"
    local owner_email="$4"
    local size="$5"
    local record_count="$6"
    local price="$7"
    local license="$8"
    local tags="$9"
    
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
                \"size\": \"${size}\",
                \"recordCount\": ${record_count},
                \"price\": ${price},
                \"license\": \"${license}\",
                \"tags\": [${tags}],
                \"privacyLevel\": \"confidential\",
                \"retentionPeriod\": 365,
                \"geographicScope\": \"US\",
                \"dataQuality\": \"high\",
                \"anonymizationLevel\": \"high\",
                \"compliance\": [\"HIPAA\", \"GDPR\"]
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

echo -e "\n${BLUE}👥 Step 3: Creating TDP users...${NC}"

# Create Healthcare TDP user
create_tdp_user \
    "Healthcare Data Corp" \
    "healthcare@tdp.com" \
    "Healthcare Data Corporation" \
    "Leading provider of anonymized healthcare datasets for AI research and development" \
    "Healthcare, Medical Records, Patient Data"

# Create Financial TDP user
create_tdp_user \
    "Financial Analytics Inc" \
    "finance@tdp.com" \
    "Financial Analytics Incorporated" \
    "Specialized in financial market data and trading datasets for quantitative analysis" \
    "Finance, Trading, Market Data"

# Create Retail TDP user
create_tdp_user \
    "Retail Insights Ltd" \
    "retail@tdp.com" \
    "Retail Insights Limited" \
    "Customer behavior and retail analytics data provider" \
    "Retail, Customer Behavior, E-commerce"

# Create Research TDP user
create_tdp_user \
    "Research Data Solutions" \
    "research@tdp.com" \
    "Research Data Solutions" \
    "Academic and research datasets for scientific and educational purposes" \
    "Research, Academic, Scientific Data"

echo -e "\n${BLUE}📊 Step 4: Creating comprehensive datasets...${NC}"

# Healthcare datasets
create_dataset \
    "Patient Health Records" \
    "Anonymized patient health records including demographics, diagnoses, treatments, and outcomes" \
    "Healthcare" \
    "healthcare@tdp.com" \
    "2.5GB" \
    50000 \
    5000.00 \
    "Academic" \
    "\"healthcare\", \"medical\", \"patient\", \"anonymized\", \"clinical\""

create_dataset \
    "Medical Imaging Dataset" \
    "DICOM medical images with annotations for radiology AI training" \
    "Healthcare" \
    "healthcare@tdp.com" \
    "15GB" \
    10000 \
    8000.00 \
    "Commercial" \
    "\"medical-imaging\", \"radiology\", \"DICOM\", \"annotations\""

create_dataset \
    "Pharmaceutical Research Data" \
    "Drug trial data and pharmaceutical research datasets" \
    "Healthcare" \
    "healthcare@tdp.com" \
    "1.2GB" \
    25000 \
    3000.00 \
    "Research" \
    "\"pharmaceutical\", \"drug-trials\", \"research\", \"clinical-trials\""

# Financial datasets
create_dataset \
    "Stock Market Trading Data" \
    "Historical stock market data with OHLCV, volume, and technical indicators" \
    "Finance" \
    "finance@tdp.com" \
    "3.8GB" \
    100000 \
    6000.00 \
    "Commercial" \
    "\"finance\", \"trading\", \"stocks\", \"market-data\", \"OHLCV\""

create_dataset \
    "Cryptocurrency Market Data" \
    "Real-time and historical cryptocurrency trading data" \
    "Finance" \
    "finance@tdp.com" \
    "2.1GB" \
    75000 \
    4000.00 \
    "Commercial" \
    "\"cryptocurrency\", \"crypto\", \"trading\", \"blockchain\""

create_dataset \
    "Credit Risk Assessment Data" \
    "Credit scoring and risk assessment datasets for financial institutions" \
    "Finance" \
    "finance@tdp.com" \
    "1.5GB" \
    40000 \
    3500.00 \
    "Academic" \
    "\"credit-risk\", \"scoring\", \"financial-risk\", \"assessment\""

# Retail datasets
create_dataset \
    "Customer Purchase History" \
    "Customer transaction data and purchase behavior patterns" \
    "Retail" \
    "retail@tdp.com" \
    "4.2GB" \
    200000 \
    2500.00 \
    "Academic" \
    "\"retail\", \"customer\", \"purchases\", \"behavior\", \"transactions\""

create_dataset \
    "E-commerce Product Catalog" \
    "Product information, reviews, and sales performance data" \
    "Retail" \
    "retail@tdp.com" \
    "800MB" \
    50000 \
    1500.00 \
    "Commercial" \
    "\"e-commerce\", \"products\", \"catalog\", \"reviews\", \"sales\""

create_dataset \
    "Supply Chain Analytics" \
    "Supply chain data including inventory, logistics, and vendor information" \
    "Retail" \
    "retail@tdp.com" \
    "1.8GB" \
    30000 \
    2000.00 \
    "Commercial" \
    "\"supply-chain\", \"inventory\", \"logistics\", \"vendor-data\""

# Research datasets
create_dataset \
    "Scientific Research Papers" \
    "Metadata and abstracts from scientific research papers across multiple disciplines" \
    "Research" \
    "research@tdp.com" \
    "2.3GB" \
    100000 \
    1000.00 \
    "Academic" \
    "\"research\", \"papers\", \"scientific\", \"academic\", \"publications\""

create_dataset \
    "Climate Data Collection" \
    "Environmental and climate data from various monitoring stations" \
    "Research" \
    "research@tdp.com" \
    "5.1GB" \
    150000 \
    2000.00 \
    "Academic" \
    "\"climate\", \"environmental\", \"weather\", \"monitoring\""

echo -e "\n${BLUE}🧪 Step 5: Testing TDP user authentication...${NC}"

# Test login for each TDP user
test_tdp_login() {
    local email="$1"
    local organization="$2"
    
    echo "  Testing login for TDP: ${organization}..."
    
    local login_response=$(curl -s -X POST "http://localhost:${PORT}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${email}\", \"password\": \"password123\"}" 2>/dev/null || echo "FAILED")
    
    if echo "$login_response" | grep -q "accessToken"; then
        echo -e "  TDP Login: ${GREEN}✅ Success${NC}"
    else
        echo -e "  TDP Login: ${RED}❌ Failed${NC}"
        echo "    Response: $login_response"
    fi
}

test_tdp_login "healthcare@tdp.com" "Healthcare Data Corp"
test_tdp_login "finance@tdp.com" "Financial Analytics Inc"
test_tdp_login "retail@tdp.com" "Retail Insights Ltd"
test_tdp_login "research@tdp.com" "Research Data Solutions"

echo -e "\n${BLUE}📋 Step 6: Testing dataset access for TDP users...${NC}"

# Test dataset listing for TDP users
test_dataset_access() {
    local email="$1"
    local organization="$2"
    
    echo "  Testing dataset access for TDP: ${organization}..."
    
    local login_response=$(curl -s -X POST "http://localhost:${PORT}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${email}\", \"password\": \"password123\"}" 2>/dev/null || echo "FAILED")
    
    if echo "$login_response" | grep -q "accessToken"; then
        local token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        
        local datasets_response=$(curl -s -X GET "http://localhost:${PORT}/api/datasets" \
            -H "Authorization: Bearer ${token}" 2>/dev/null || echo "FAILED")
        
        if echo "$datasets_response" | grep -q "datasets\|\[\]"; then
            echo -e "  Dataset Access: ${GREEN}✅ Success${NC}"
        else
            echo -e "  Dataset Access: ${YELLOW}⚠️ Partial success${NC}"
        fi
    else
        echo -e "  Dataset Access: ${RED}❌ Failed to authenticate${NC}"
    fi
}

test_dataset_access "healthcare@tdp.com" "Healthcare Data Corp"
test_dataset_access "finance@tdp.com" "Financial Analytics Inc"

echo -e "\n${GREEN}🎉 TDP test data creation completed!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "  ✅ TDP users created via registration API"
echo "  ✅ Comprehensive datasets created for each TDP"
echo "  ✅ Authentication tested for all TDP users"
echo "  ✅ Dataset access tested"
echo ""
echo -e "${BLUE}🔗 TDP Test Users:${NC}"
echo "  Healthcare: healthcare@tdp.com (password: password123)"
echo "  Finance: finance@tdp.com (password: password123)"
echo "  Retail: retail@tdp.com (password: password123)"
echo "  Research: research@tdp.com (password: password123)"
echo ""
echo -e "${BLUE}📊 Datasets Created:${NC}"
echo "  • Healthcare: 3 datasets (Patient Records, Medical Imaging, Pharmaceutical)"
echo "  • Finance: 3 datasets (Stock Market, Cryptocurrency, Credit Risk)"
echo "  • Retail: 3 datasets (Customer History, E-commerce, Supply Chain)"
echo "  • Research: 2 datasets (Scientific Papers, Climate Data)"
echo ""
echo -e "${BLUE}🌐 Access URLs:${NC}"
echo "  Frontend: http://localhost:${FRONTEND_PORT}"
echo "  Backend API: http://localhost:${PORT}/api"
echo "  Keycloak Admin: ${KEYCLOAK_URL}/admin"
echo ""
echo -e "${GREEN}TDP users can now create and manage datasets!${NC}"
