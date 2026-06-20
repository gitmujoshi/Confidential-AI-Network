#!/bin/bash

# Common Test Data for All Test Suites (Simple Version)
# Provides standardized test data that all test scripts can use
# Uses simple variables instead of associative arrays for compatibility

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Load centralized configuration
source scripts/load-config.sh

# Test User Data (from registration API) - Using new test users with common password
TDP_USER_EMAIL="tdp-test@example.com"
TDC_USER_EMAIL="tdc-test@example.com"
CCRP_USER_EMAIL="tsp-test@example.com"
ADMIN_USER_EMAIL="admin-test@example.com"

TDP_USER_PASSWORD="TestPassword123!"
TDC_USER_PASSWORD="TestPassword123!"
CCRP_USER_PASSWORD="TestPassword123!"
ADMIN_USER_PASSWORD="TestPassword123!"

TDP_USER_TOKEN=""
TDC_USER_TOKEN=""
CCRP_USER_TOKEN=""
ADMIN_USER_TOKEN=""

# Test Dataset Data
MEDICAL_DATASET_ID=""
FINANCIAL_DATASET_ID=""

# Test AI Model Data
MEDICAL_MODEL_ID=""
FRAUD_MODEL_ID=""

# Test Contract Data
MEDICAL_CONTRACT_ID=""

# Test Environment Data
MEDICAL_ENVIRONMENT_ID=""

# Function to initialize test data
init_test_data() {
    echo -e "${BLUE}📋 Initializing Common Test Data${NC}"
    echo "=================================="
    
    # Check if test data already exists
    if [ -f "test-data-cache.json" ]; then
        echo -e "${GREEN}✅ Loading cached test data${NC}"
        load_cached_test_data
        return 0
    fi
    
    echo -e "${YELLOW}⚠️ No cached test data found. Creating fresh test data...${NC}"
    create_fresh_test_data
}

# Function to create fresh test data
create_fresh_test_data() {
    echo -e "${BLUE}🔄 Creating fresh test data via registration API${NC}"
    
    # Create test users using the registration API
    create_test_users_via_api
    
    # Create test datasets for TDP users
    create_test_datasets_via_api
    
    # Create test AI models for TDC users
    create_test_ai_models_via_api
    
    # Create test contracts
    create_test_contracts_via_api
    
    # Create test environments for TSP users
    create_test_environments_via_api
    
    # Cache the test data
    cache_test_data
    
    echo -e "${GREEN}✅ Fresh test data created and cached${NC}"
}

# Function to create test users via registration API
create_test_users_via_api() {
    echo -e "${BLUE}👥 Creating test users...${NC}"
    
    # TDP User
    local tdp_response=$(curl -s -X POST "${BACKEND_URL}/api/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "TDP Test User",
            "email": "tdp.test@example.com",
            "partyType": "TDP",
            "organization": "TDP Test Organization",
            "description": "Test TDP user for all test suites"
        }')
    
    if echo "$tdp_response" | grep -q '"success":true'; then
        TDP_USER_EMAIL="tdp.test@example.com"
        TDP_USER_PASSWORD=$(echo "$tdp_response" | grep -o '"password":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ TDP user created: $TDP_USER_EMAIL${NC}"
    else
        echo -e "${RED}❌ Failed to create TDP user${NC}"
    fi
    
    # TDC User
    local tdc_response=$(curl -s -X POST "${BACKEND_URL}/api/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "TDC Test User",
            "email": "tdc.test@example.com",
            "partyType": "TDC",
            "organization": "TDC Test Organization",
            "description": "Test TDC user for all test suites"
        }')
    
    if echo "$tdc_response" | grep -q '"success":true'; then
        TDC_USER_EMAIL="tdc.test@example.com"
        TDC_USER_PASSWORD=$(echo "$tdc_response" | grep -o '"password":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ TDC user created: $TDC_USER_EMAIL${NC}"
    else
        echo -e "${RED}❌ Failed to create TDC user${NC}"
    fi
    
    # TSP User
    local ccrp_response=$(curl -s -X POST "${BACKEND_URL}/api/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "TSP Test User",
            "email": "tsp.test@example.com",
            "partyType": "TSP",
            "organization": "TSP Test Organization",
            "description": "Test TSP user for all test suites"
        }')
    
    if echo "$ccrp_response" | grep -q '"success":true'; then
        CCRP_USER_EMAIL="tsp.test@example.com"
        CCRP_USER_PASSWORD=$(echo "$ccrp_response" | grep -o '"password":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ TSP user created: $CCRP_USER_EMAIL${NC}"
    else
        echo -e "${RED}❌ Failed to create TSP user${NC}"
    fi
    
    # Admin User
    local admin_response=$(curl -s -X POST "${BACKEND_URL}/api/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Admin Test User",
            "email": "admin.test@example.com",
            "partyType": "AppAdmin",
            "organization": "Admin Test Organization",
            "description": "Test Admin user for all test suites"
        }')
    
    if echo "$admin_response" | grep -q '"success":true'; then
        ADMIN_USER_EMAIL="admin.test@example.com"
        ADMIN_USER_PASSWORD=$(echo "$admin_response" | grep -o '"password":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Admin user created: $ADMIN_USER_EMAIL${NC}"
    else
        echo -e "${RED}❌ Failed to create Admin user${NC}"
    fi
}

# Function to get user access token
get_user_token() {
    local user_type="$1"
    local email=""
    local password=""
    
    case "$user_type" in
        "tdp")
            email="$TDP_USER_EMAIL"
            password="$TDP_USER_PASSWORD"
            ;;
        "tdc")
            email="$TDC_USER_EMAIL"
            password="$TDC_USER_PASSWORD"
            ;;
        "tsp")
            email="$CCRP_USER_EMAIL"
            password="$CCRP_USER_PASSWORD"
            ;;
        "admin")
            email="$ADMIN_USER_EMAIL"
            password="$ADMIN_USER_PASSWORD"
            ;;
        *)
            echo -e "${RED}❌ Unknown user type: $user_type${NC}"
            return 1
            ;;
    esac
    
    if [ -z "$email" ] || [ -z "$password" ]; then
        echo -e "${RED}❌ User $user_type not found in test data${NC}"
        return 1
    fi
    
    # Check if we already have a cached token
    case "$user_type" in
        "tdp")
            if [ -n "$TDP_USER_TOKEN" ]; then
                echo "$TDP_USER_TOKEN"
                return 0
            fi
            ;;
        "tdc")
            if [ -n "$TDC_USER_TOKEN" ]; then
                echo "$TDC_USER_TOKEN"
                return 0
            fi
            ;;
        "tsp")
            if [ -n "$CCRP_USER_TOKEN" ]; then
                echo "$CCRP_USER_TOKEN"
                return 0
            fi
            ;;
        "admin")
            if [ -n "$ADMIN_USER_TOKEN" ]; then
                echo "$ADMIN_USER_TOKEN"
                return 0
            fi
            ;;
    esac
    
    # Get new token
    local login_response=$(curl -s -X POST "${BACKEND_URL}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    if echo "$login_response" | grep -q '"accessToken"'; then
        local token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        
        # Store token
        case "$user_type" in
            "tdp") TDP_USER_TOKEN="$token" ;;
            "tdc") TDC_USER_TOKEN="$token" ;;
            "tsp") CCRP_USER_TOKEN="$token" ;;
            "admin") ADMIN_USER_TOKEN="$token" ;;
        esac
        
        echo "$token"
        return 0
    else
        echo -e "${RED}❌ Failed to get token for $user_type user${NC}"
        return 1
    fi
}

# Function to create test datasets
create_test_datasets_via_api() {
    echo -e "${BLUE}📊 Creating test datasets...${NC}"
    
    local tdp_token=$(get_user_token "tdp")
    if [ -z "$tdp_token" ]; then
        echo -e "${RED}❌ Cannot create datasets without TDP user token${NC}"
        return 1
    fi
    
    # Dataset 1: Medical Data
    local dataset1_response=$(curl -s -X POST "${BACKEND_URL}/api/datasets" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $tdp_token" \
        -d '{
            "name": "Medical Records Dataset",
            "description": "Anonymized medical records for AI training",
            "dataType": "TRAINING_DATA",
            "category": "HEALTHCARE",
            "size": "10000",
            "format": "CSV",
            "location": "AWS S3",
            "accessLevel": "RESTRICTED",
            "compliance": ["HIPAA", "GDPR"],
            "metadata": {
                "source": "Hospital Records",
                "created": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
                "version": "1.0",
                "anonymized": true
            }
        }')
    
    if echo "$dataset1_response" | grep -q '"success":true'; then
        MEDICAL_DATASET_ID=$(echo "$dataset1_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Medical dataset created: $MEDICAL_DATASET_ID${NC}"
    else
        echo -e "${RED}❌ Failed to create medical dataset${NC}"
    fi
    
    # Dataset 2: Financial Data
    local dataset2_response=$(curl -s -X POST "${BACKEND_URL}/api/datasets" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $tdp_token" \
        -d '{
            "name": "Financial Transactions Dataset",
            "description": "Anonymized financial transaction data",
            "dataType": "TRAINING_DATA",
            "category": "FINANCE",
            "size": "50000",
            "format": "JSON",
            "location": "Azure Blob",
            "accessLevel": "CONFIDENTIAL",
            "compliance": ["PCI-DSS", "SOX"],
            "metadata": {
                "source": "Bank Transactions",
                "created": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
                "version": "1.0",
                "anonymized": true
            }
        }')
    
    if echo "$dataset2_response" | grep -q '"success":true'; then
        FINANCIAL_DATASET_ID=$(echo "$dataset2_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Financial dataset created: $FINANCIAL_DATASET_ID${NC}"
    else
        echo -e "${RED}❌ Failed to create financial dataset${NC}"
    fi
}

# Function to create test AI models
create_test_ai_models_via_api() {
    echo -e "${BLUE}🤖 Creating test AI models...${NC}"
    
    local tdc_token=$(get_user_token "tdc")
    if [ -z "$tdc_token" ]; then
        echo -e "${RED}❌ Cannot create AI models without TDC user token${NC}"
        return 1
    fi
    
    # AI Model 1: Medical Diagnosis
    local model1_response=$(curl -s -X POST "${BACKEND_URL}/api/ai-models" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $tdc_token" \
        -d '{
            "name": "Medical Diagnosis Model",
            "description": "AI model for medical diagnosis prediction",
            "modelType": "MACHINE_LEARNING",
            "algorithm": "RANDOM_FOREST",
            "framework": "SCIKIT_LEARN",
            "version": "1.0.0",
            "performance": {
                "accuracy": 0.95,
                "precision": 0.92,
                "recall": 0.88,
                "f1Score": 0.90
            },
            "metadata": {
                "source": "Medical Records Dataset",
                "created": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
                "trainingData": "Medical Records",
                "validationSplit": 0.2
            }
        }')
    
    if echo "$model1_response" | grep -q '"success":true'; then
        MEDICAL_MODEL_ID=$(echo "$model1_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Medical diagnosis model created: $MEDICAL_MODEL_ID${NC}"
    else
        echo -e "${RED}❌ Failed to create medical diagnosis model${NC}"
    fi
    
    # AI Model 2: Fraud Detection
    local model2_response=$(curl -s -X POST "${BACKEND_URL}/api/ai-models" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $tdc_token" \
        -d '{
            "name": "Fraud Detection Model",
            "description": "AI model for detecting fraudulent transactions",
            "modelType": "DEEP_LEARNING",
            "algorithm": "NEURAL_NETWORK",
            "framework": "TENSORFLOW",
            "version": "2.1.0",
            "performance": {
                "accuracy": 0.98,
                "precision": 0.96,
                "recall": 0.94,
                "f1Score": 0.95
            },
            "metadata": {
                "source": "Financial Transactions Dataset",
                "created": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
                "trainingData": "Financial Transactions",
                "validationSplit": 0.15
            }
        }')
    
    if echo "$model2_response" | grep -q '"success":true'; then
        FRAUD_MODEL_ID=$(echo "$model2_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Fraud detection model created: $FRAUD_MODEL_ID${NC}"
    else
        echo -e "${RED}❌ Failed to create fraud detection model${NC}"
    fi
}

# Function to create test contracts
create_test_contracts_via_api() {
    echo -e "${BLUE}📋 Creating test contracts...${NC}"
    
    local tdp_token=$(get_user_token "tdp")
    local tdc_token=$(get_user_token "tdc")
    
    if [ -z "$tdp_token" ] || [ -z "$tdc_token" ]; then
        echo -e "${RED}❌ Cannot create contracts without user tokens${NC}"
        return 1
    fi
    
    # Contract 1: Data Sharing Agreement
    local contract1_response=$(curl -s -X POST "${BACKEND_URL}/api/contracts" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $tdp_token" \
        -d '{
            "title": "Medical Data Sharing Agreement",
            "description": "Contract for sharing medical records dataset for AI training",
            "contractType": "DATA_SHARING",
            "parties": {
                "provider": "TDP Test Organization",
                "consumer": "TDC Test Organization"
            },
            "dataAssets": ["'$MEDICAL_DATASET_ID'"],
            "aiModels": ["'$MEDICAL_MODEL_ID'"],
            "terms": {
                "duration": "12 months",
                "dataUsage": "AI training only",
                "confidentiality": "strict",
                "compliance": ["HIPAA", "GDPR"]
            },
            "status": "DRAFT"
        }')
    
    if echo "$contract1_response" | grep -q '"success":true'; then
        MEDICAL_CONTRACT_ID=$(echo "$contract1_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Medical data sharing contract created: $MEDICAL_CONTRACT_ID${NC}"
    else
        echo -e "${RED}❌ Failed to create medical data sharing contract${NC}"
    fi
}

# Function to create test environments
create_test_environments_via_api() {
    echo -e "${BLUE}🏗️ Creating test environments...${NC}"
    
    local ccrp_token=$(get_user_token "tsp")
    if [ -z "$ccrp_token" ]; then
        echo -e "${RED}❌ Cannot create environments without TSP user token${NC}"
        return 1
    fi
    
    # Environment 1: Medical AI Training Environment
    local env1_response=$(curl -s -X POST "${BACKEND_URL}/api/environments" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ccrp_token" \
        -d '{
            "name": "Medical AI Training Environment",
            "description": "Secure environment for training medical AI models",
            "environmentType": "TRAINING",
            "infrastructure": {
                "cloudProvider": "AWS",
                "region": "us-east-1",
                "instanceType": "ml.m5.xlarge",
                "storage": "100GB SSD"
            },
            "security": {
                "encryption": "AES-256",
                "networkIsolation": true,
                "accessControl": "RBAC",
                "auditLogging": true
            },
            "compliance": ["HIPAA", "SOC2"],
            "status": "ACTIVE"
        }')
    
    if echo "$env1_response" | grep -q '"success":true'; then
        MEDICAL_ENVIRONMENT_ID=$(echo "$env1_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Medical training environment created: $MEDICAL_ENVIRONMENT_ID${NC}"
    else
        echo -e "${RED}❌ Failed to create medical training environment${NC}"
    fi
}

# Function to cache test data
cache_test_data() {
    echo -e "${BLUE}💾 Caching test data...${NC}"
    
    cat > test-data-cache.json << EOF
{
    "users": {
        "tdp": "$TDP_USER_EMAIL",
        "tdc": "$TDC_USER_EMAIL",
        "tsp": "$CCRP_USER_EMAIL",
        "admin": "$ADMIN_USER_EMAIL"
    },
    "credentials": {
        "tdp": "$TDP_USER_PASSWORD",
        "tdc": "$TDC_USER_PASSWORD",
        "tsp": "$CCRP_USER_PASSWORD",
        "admin": "$ADMIN_USER_PASSWORD"
    },
    "datasets": {
        "medical": "$MEDICAL_DATASET_ID",
        "financial": "$FINANCIAL_DATASET_ID"
    },
    "ai_models": {
        "medical_diagnosis": "$MEDICAL_MODEL_ID",
        "fraud_detection": "$FRAUD_MODEL_ID"
    },
    "contracts": {
        "medical_sharing": "$MEDICAL_CONTRACT_ID"
    },
    "environments": {
        "medical_training": "$MEDICAL_ENVIRONMENT_ID"
    },
    "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    
    echo -e "${GREEN}✅ Test data cached to test-data-cache.json${NC}"
}

# Function to load cached test data
load_cached_test_data() {
    if [ ! -f "test-data-cache.json" ]; then
        echo -e "${RED}❌ No cached test data found${NC}"
        return 1
    fi
    
    # Load user data
    TDP_USER_EMAIL=$(jq -r '.users.tdp' test-data-cache.json)
    TDC_USER_EMAIL=$(jq -r '.users.tdc' test-data-cache.json)
    CCRP_USER_EMAIL=$(jq -r '.users.tsp' test-data-cache.json)
    ADMIN_USER_EMAIL=$(jq -r '.users.admin' test-data-cache.json)
    
    # Load credentials
    TDP_USER_PASSWORD=$(jq -r '.credentials.tdp' test-data-cache.json)
    TDC_USER_PASSWORD=$(jq -r '.credentials.tdc' test-data-cache.json)
    CCRP_USER_PASSWORD=$(jq -r '.credentials.tsp' test-data-cache.json)
    ADMIN_USER_PASSWORD=$(jq -r '.credentials.admin' test-data-cache.json)
    
    # Load datasets
    MEDICAL_DATASET_ID=$(jq -r '.datasets.medical' test-data-cache.json)
    FINANCIAL_DATASET_ID=$(jq -r '.datasets.financial' test-data-cache.json)
    
    # Load AI models
    MEDICAL_MODEL_ID=$(jq -r '.ai_models.medical_diagnosis' test-data-cache.json)
    FRAUD_MODEL_ID=$(jq -r '.ai_models.fraud_detection' test-data-cache.json)
    
    # Load contracts
    MEDICAL_CONTRACT_ID=$(jq -r '.contracts.medical_sharing' test-data-cache.json)
    
    # Load environments
    MEDICAL_ENVIRONMENT_ID=$(jq -r '.environments.medical_training' test-data-cache.json)
    
    echo -e "${GREEN}✅ Cached test data loaded${NC}"
}

# Function to get test user email
get_test_user_email() {
    local user_type="$1"
    case "$user_type" in
        "tdp") echo "$TDP_USER_EMAIL" ;;
        "tdc") echo "$TDC_USER_EMAIL" ;;
        "tsp") echo "$CCRP_USER_EMAIL" ;;
        "admin") echo "$ADMIN_USER_EMAIL" ;;
        *) echo "" ;;
    esac
}

# Function to get test user password
get_test_user_password() {
    local user_type="$1"
    case "$user_type" in
        "tdp") echo "$TDP_USER_PASSWORD" ;;
        "tdc") echo "$TDC_USER_PASSWORD" ;;
        "tsp") echo "$CCRP_USER_PASSWORD" ;;
        "admin") echo "$ADMIN_USER_PASSWORD" ;;
        *) echo "" ;;
    esac
}

# Function to get test dataset ID
get_test_dataset_id() {
    local dataset_type="$1"
    case "$dataset_type" in
        "medical") echo "$MEDICAL_DATASET_ID" ;;
        "financial") echo "$FINANCIAL_DATASET_ID" ;;
        *) echo "" ;;
    esac
}

# Function to get test AI model ID
get_test_ai_model_id() {
    local model_type="$1"
    case "$model_type" in
        "medical_diagnosis") echo "$MEDICAL_MODEL_ID" ;;
        "fraud_detection") echo "$FRAUD_MODEL_ID" ;;
        *) echo "" ;;
    esac
}

# Function to get test contract ID
get_test_contract_id() {
    local contract_type="$1"
    case "$contract_type" in
        "medical_sharing") echo "$MEDICAL_CONTRACT_ID" ;;
        *) echo "" ;;
    esac
}

# Function to get test environment ID
get_test_environment_id() {
    local env_type="$1"
    case "$env_type" in
        "medical_training") echo "$MEDICAL_ENVIRONMENT_ID" ;;
        *) echo "" ;;
    esac
}

# Function to show test data summary
show_test_data_summary() {
    echo -e "${BLUE}📋 Test Data Summary${NC}"
    echo "===================="
    echo -e "${GREEN}👥 Users:${NC}"
    echo "  TDP: $TDP_USER_EMAIL"
    echo "  TDC: $TDC_USER_EMAIL"
    echo "  TSP: $CCRP_USER_EMAIL"
    echo "  Admin: $ADMIN_USER_EMAIL"
    echo ""
    echo -e "${GREEN}📊 Datasets:${NC}"
    echo "  Medical: $MEDICAL_DATASET_ID"
    echo "  Financial: $FINANCIAL_DATASET_ID"
    echo ""
    echo -e "${GREEN}🤖 AI Models:${NC}"
    echo "  Medical Diagnosis: $MEDICAL_MODEL_ID"
    echo "  Fraud Detection: $FRAUD_MODEL_ID"
    echo ""
    echo -e "${GREEN}📋 Contracts:${NC}"
    echo "  Medical Sharing: $MEDICAL_CONTRACT_ID"
    echo ""
    echo -e "${GREEN}🏗️ Environments:${NC}"
    echo "  Medical Training: $MEDICAL_ENVIRONMENT_ID"
    echo "===================="
}

# Function to clear test data
clear_test_data() {
    echo -e "${YELLOW}🗑️ Clearing test data...${NC}"
    rm -f test-data-cache.json
    echo -e "${GREEN}✅ Test data cleared${NC}"
}

# Main execution
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    # Handle command line arguments
    case "${1:-}" in
        --clear)
            clear_test_data
            ;;
        --show)
            init_test_data
            show_test_data_summary
            ;;
        --init|"")
            init_test_data
            show_test_data_summary
            ;;
        *)
            echo "Usage: $0 [--init|--show|--clear]"
            echo "  --init   Initialize test data (default)"
            echo "  --show   Show test data summary"
            echo "  --clear  Clear test data cache"
            exit 1
            ;;
    esac
fi
