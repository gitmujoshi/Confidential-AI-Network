#!/bin/bash

# Comprehensive Test Suite for Contract Management System
# Tests all user roles, workflows, and system functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Load configuration
if [ -f "config.env" ]; then
    source config.env
    echo -e "${BLUE}✅ Loading centralized configuration from config.env${NC}"
else
    echo -e "${RED}❌ config.env not found${NC}"
    exit 1
fi

# Configuration - using centralized config.env
BACKEND_URL="http://localhost:${PORT}"
KEYCLOAK_URL="${KEYCLOAK_URL}"
FRONTEND_URL="http://localhost:${FRONTEND_PORT}"

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print colored output
print_header() {
    echo -e "\n${CYAN}================================${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}================================${NC}"
}

print_step() {
    echo -e "\n${BLUE}🔍 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_TESTS++))
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_TESTS++))
}

print_info() {
    echo -e "${PURPLE}ℹ️ $1${NC}"
}

# Function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    
    local curl_cmd="curl -s -X $method"
    
    if [ -n "$token" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $token'"
    fi
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$BACKEND_URL$endpoint'"
    
    eval $curl_cmd
}

# Function to test API endpoint
test_endpoint() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local expected_status=$4
    local data=$5
    local token=$6
    
    ((TOTAL_TESTS++))
    
    print_step "Testing: $test_name"
    
    local response=$(api_call "$method" "$endpoint" "$data" "$token")
    local status_code=$(echo "$response" | grep -o '"statusCode":[0-9]*' | cut -d':' -f2 || echo "unknown")
    
    if [ "$status_code" = "$expected_status" ] || [ "$expected_status" = "any" ]; then
        print_success "$test_name - Status: $status_code"
        echo "$response" | jq . 2>/dev/null || echo "$response"
        return 0
    else
        print_error "$test_name - Expected: $expected_status, Got: $status_code"
        echo "$response" | jq . 2>/dev/null || echo "$response"
        return 1
    fi
}

# Function to create test user
create_test_user() {
    local name=$1
    local email=$2
    local party_type=$3
    local organization=$4
    local description=$5
    
    print_step "Creating $party_type user: $name"
    
    local user_data=$(cat <<EOF
{
    "name": "$name",
    "email": "$email",
    "password": "password123",
    "partyType": "$party_type",
    "organization": "$organization",
    "description": "$description"
}
EOF
)
    
    local response=$(api_call "POST" "/api/auth/register" "$user_data")
    
    if echo "$response" | grep -q "id"; then
        print_success "$party_type user created: $email"
        echo "$response" | jq . 2>/dev/null || echo "$response"
        return 0
    elif echo "$response" | grep -q "DUPLICATE_EMAIL"; then
        print_warning "$party_type user already exists: $email"
        return 0
    else
        print_error "Failed to create $party_type user: $email"
        echo "$response" | jq . 2>/dev/null || echo "$response"
        return 1
    fi
}

# Function to authenticate user
authenticate_user() {
    local email=$1
    local password=$2
    
    print_step "Authenticating user: $email"
    
    local auth_data=$(cat <<EOF
{
    "email": "$email",
    "password": "$password"
}
EOF
)
    
    local response=$(api_call "POST" "/api/auth/login" "$auth_data")
    
    if echo "$response" | grep -q "accessToken"; then
        local token=$(echo "$response" | jq -r '.accessToken' 2>/dev/null)
        print_success "Authentication successful for: $email"
        echo "$token"
        return 0
    else
        print_error "Authentication failed for: $email"
        echo "$response" | jq . 2>/dev/null || echo "$response"
        return 1
    fi
}

# Function to create dataset
create_dataset() {
    local name=$1
    local description=$2
    local owner_token=$3
    
    print_step "Creating dataset: $name"
    
    local dataset_data=$(cat <<EOF
{
    "name": "$name",
    "description": "$description",
    "dataType": "STRUCTURED",
    "category": "HEALTHCARE",
    "sensitivityLevel": "MEDIUM",
    "retentionPeriod": 365,
    "geographicScope": "US",
    "dataFormat": "CSV",
    "estimatedSize": "1GB",
    "sampleData": "Sample healthcare data for testing",
    "accessRequirements": "HIPAA compliance required",
    "pricingModel": "PER_ACCESS",
    "pricePerAccess": 100.00
}
EOF
)
    
    local response=$(api_call "POST" "/api/datasets" "$dataset_data" "$owner_token")
    
    if echo "$response" | grep -q "id"; then
        local dataset_id=$(echo "$response" | jq -r '.id' 2>/dev/null)
        print_success "Dataset created: $name (ID: $dataset_id)"
        echo "$dataset_id"
        return 0
    else
        print_error "Failed to create dataset: $name"
        echo "$response" | jq . 2>/dev/null || echo "$response"
        return 1
    fi
}

# Function to create AI model
create_ai_model() {
    local name=$1
    local description=$2
    local owner_token=$3
    
    print_step "Creating AI model: $name"
    
    local model_data=$(cat <<EOF
{
    "name": "$name",
    "description": "$description",
    "modelType": "MACHINE_LEARNING",
    "category": "HEALTHCARE",
    "framework": "TENSORFLOW",
    "version": "1.0.0",
    "accuracy": 95.5,
    "trainingDataSize": "10GB",
    "modelSize": "500MB",
    "inferenceTime": "100ms",
    "pricingModel": "PER_INFERENCE",
    "pricePerInference": 0.10
}
EOF
)
    
    local response=$(api_call "POST" "/api/ai-models" "$model_data" "$owner_token")
    
    if echo "$response" | grep -q "id"; then
        local model_id=$(echo "$response" | jq -r '.id' 2>/dev/null)
        print_success "AI model created: $name (ID: $model_id)"
        echo "$model_id"
        return 0
    else
        print_error "Failed to create AI model: $name"
        echo "$response" | jq . 2>/dev/null || echo "$response"
        return 1
    fi
}

# Function to create environment offering
create_environment_offering() {
    local name=$1
    local description=$2
    local owner_token=$3
    
    print_step "Creating environment offering: $name"
    
    local offering_data=$(cat <<EOF
{
    "name": "$name",
    "description": "$description",
    "environmentType": "SECURE_CLOUD",
    "computeResources": {
        "cpu": "8 cores",
        "memory": "32GB",
        "storage": "1TB SSD",
        "gpu": "NVIDIA V100"
    },
    "securityFeatures": [
        "ENCRYPTION_AT_REST",
        "ENCRYPTION_IN_TRANSIT",
        "ACCESS_CONTROL",
        "AUDIT_LOGGING"
    ],
    "complianceStandards": ["HIPAA", "SOC2"],
    "pricingModel": "HOURLY",
    "pricePerHour": 5.00,
    "availability": "99.9%"
}
EOF
)
    
    local response=$(api_call "POST" "/api/environment-offerings" "$offering_data" "$owner_token")
    
    if echo "$response" | grep -q "id"; then
        local offering_id=$(echo "$response" | jq -r '.id' 2>/dev/null)
        print_success "Environment offering created: $name (ID: $offering_id)"
        echo "$offering_id"
        return 0
    else
        print_error "Failed to create environment offering: $name"
        echo "$response" | jq . 2>/dev/null || echo "$response"
        return 1
    fi
}

# Function to create Ricardian contract
create_ricardian_contract() {
    local contract_name=$1
    local tdp_token=$2
    local tdc_token=$3
    local ccrp_token=$4
    local dataset_id=$5
    local model_id=$6
    local environment_id=$7
    
    print_step "Creating Ricardian contract: $contract_name"
    
    local contract_data=$(cat <<EOF
{
    "name": "$contract_name",
    "description": "Comprehensive data sharing agreement for healthcare analytics",
    "contractType": "DATA_SHARING",
    "parties": {
        "dataProvider": "Medical Data Provider",
        "dataConsumer": "Healthcare AI Company",
        "environmentProvider": "Secure Cloud Provider"
    },
    "dataAssets": ["$dataset_id"],
    "aiModels": ["$model_id"],
    "environmentOffering": "$environment_id",
    "terms": {
        "dataUsage": "Healthcare analytics and research",
        "retentionPeriod": 365,
        "accessControl": "Role-based access with audit logging",
        "dataProtection": "HIPAA compliant encryption and access controls",
        "liability": "Standard liability limitations apply",
        "termination": "Either party may terminate with 30 days notice"
    },
    "pricing": {
        "dataAccess": 100.00,
        "modelInference": 0.10,
        "environmentUsage": 5.00
    },
    "duration": 365,
    "autoRenewal": true
}
EOF
)
    
    local response=$(api_call "POST" "/api/contracts" "$contract_data" "$tdp_token")
    
    if echo "$response" | grep -q "id"; then
        local contract_id=$(echo "$response" | jq -r '.id' 2>/dev/null)
        print_success "Ricardian contract created: $contract_name (ID: $contract_id)"
        echo "$contract_id"
        return 0
    else
        print_error "Failed to create Ricardian contract: $contract_name"
        echo "$response" | jq . 2>/dev/null || echo "$response"
        return 1
    fi
}

# Main test execution
main() {
    print_header "Comprehensive Test Suite for Contract Management System"
    echo -e "${BLUE}Testing all user roles, workflows, and system functionality${NC}"
    
    # Step 1: System Health Check
    print_header "System Health Check"
    test_endpoint "Backend Health" "GET" "/health" "any"
    test_endpoint "API Status" "GET" "/api/status" "any"
    
    # Step 2: User Registration and Authentication
    print_header "User Registration and Authentication"
    
    # Create test users
    create_test_user "Medical Data Provider" "tdp.medical@example.com" "TDP" "Medical Data Corp" "Leading provider of healthcare datasets"
    create_test_user "Healthcare AI Company" "tdc.healthcare@example.com" "TDC" "AI Healthcare Solutions" "AI company specializing in healthcare analytics"
    create_test_user "Secure Cloud Provider" "ccrp.secure@example.com" "CCRP" "SecureCloud Inc" "Secure cloud infrastructure provider"
    create_test_user "System Administrator" "admin@contractmanagement.com" "AppAdmin" "Contract Management System" "System administrator"
    
    # Authenticate users
    TDP_TOKEN=$(authenticate_user "tdp.medical@example.com" "password123")
    TDC_TOKEN=$(authenticate_user "tdc.healthcare@example.com" "password123")
    CCRP_TOKEN=$(authenticate_user "ccrp.secure@example.com" "password123")
    ADMIN_TOKEN=$(authenticate_user "admin@contractmanagement.com" "password123")
    
    # Step 3: TDP Workflow - Create Datasets
    print_header "TDP Workflow - Dataset Creation"
    DATASET_ID=$(create_dataset "Medical Records Dataset" "Comprehensive medical records for healthcare analytics" "$TDP_TOKEN")
    DATASET_ID2=$(create_dataset "Patient Demographics" "Patient demographic information for research" "$TDP_TOKEN")
    
    # Step 4: TDC Workflow - Create AI Models
    print_header "TDC Workflow - AI Model Creation"
    MODEL_ID=$(create_ai_model "Healthcare Diagnosis Model" "AI model for healthcare diagnosis assistance" "$TDC_TOKEN")
    MODEL_ID2=$(create_ai_model "Patient Risk Assessment" "Model for assessing patient risk factors" "$TDC_TOKEN")
    
    # Step 5: CCRP Workflow - Create Environment Offerings
    print_header "CCRP Workflow - Environment Offerings"
    ENVIRONMENT_ID=$(create_environment_offering "Secure Healthcare Cloud" "HIPAA-compliant secure cloud environment" "$CCRP_TOKEN")
    ENVIRONMENT_ID2=$(create_environment_offering "Research Computing Environment" "High-performance computing for research" "$CCRP_TOKEN")
    
    # Step 6: Contract Creation
    print_header "Contract Creation - Ricardian Contracts"
    CONTRACT_ID=$(create_ricardian_contract "Healthcare Analytics Partnership" "$TDP_TOKEN" "$TDC_TOKEN" "$CCRP_TOKEN" "$DATASET_ID" "$MODEL_ID" "$ENVIRONMENT_ID")
    
    # Step 7: API Testing
    print_header "API Endpoint Testing"
    test_endpoint "List Datasets" "GET" "/api/datasets" "any" "" "$TDP_TOKEN"
    test_endpoint "List AI Models" "GET" "/api/ai-models" "any" "" "$TDC_TOKEN"
    test_endpoint "List Environment Offerings" "GET" "/api/environment-offerings" "any" "" "$CCRP_TOKEN"
    test_endpoint "List Contracts" "GET" "/api/contracts" "any" "" "$ADMIN_TOKEN"
    
    # Step 8: User Management Testing
    print_header "User Management Testing"
    test_endpoint "List Users" "GET" "/api/users" "any" "" "$ADMIN_TOKEN"
    test_endpoint "Get User Profile" "GET" "/api/users/profile" "any" "" "$TDP_TOKEN"
    
    # Step 9: SCITT CCF Integration Testing
    print_header "SCITT CCF Integration Testing"
    test_endpoint "SCITT CCF Health" "GET" "/api/scitt/health" "any"
    test_endpoint "SCITT CCF Status" "GET" "/api/scitt/status" "any"
    
    # Step 10: Final Results
    print_header "Test Results Summary"
    echo -e "${BLUE}Total Tests: $TOTAL_TESTS${NC}"
    echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All tests passed! System is working correctly.${NC}"
        exit 0
    else
        echo -e "\n${RED}❌ Some tests failed. Please check the output above.${NC}"
        exit 1
    fi
}

# Run the main function
main "$@"
