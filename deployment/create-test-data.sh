#!/bin/bash

# Create Test Data Script for Contract Management System
# Creates users, datasets, AI models, and training environments for testing

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Creating Test Data for Contract Management System${NC}"
echo "=============================================================="

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

# Check if we have admin access
echo -e "${BLUE}🔐 Testing admin authentication...${NC}"
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@contractmanagement.com","password":"admin123"}')

if echo "$ADMIN_RESPONSE" | grep -q "accessToken"; then
    ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | jq -r '.accessToken')
    echo -e "${GREEN}✅ Admin authentication successful${NC}"
else
    echo -e "${RED}❌ Admin authentication failed${NC}"
    echo "Response: $ADMIN_RESPONSE"
    exit 1
fi

# Function to create user
create_user() {
    local email=$1
    local password=$2
    local name=$3
    local party_type=$4
    local organization=$5
    
    echo -e "${BLUE}👤 Creating user: $email ($party_type)${NC}"
    
    local user_data=$(cat <<EOF
{
    "email": "$email",
    "password": "$password",
    "name": "$name",
    "partyType": "$party_type",
    "organization": "$organization",
    "phoneNumber": "+1-555-0123",
    "website": "https://example.com",
    "location": "San Francisco, CA"
}
EOF
)
    
    local response=$(curl -s -X POST http://localhost:5001/api/auth/register \
        -H "Content-Type: application/json" \
        -d "$user_data")
    
    if echo "$response" | grep -q "id"; then
        echo -e "${GREEN}✅ User created: $email${NC}"
        echo "$response" | jq -r '.id'
    else
        echo -e "${YELLOW}⚠️ User may already exist: $email${NC}"
        echo "$response"
        # Try to get existing user ID
        local existing_response=$(curl -s -X GET "http://localhost:5001/api/users?email=$email" \
            -H "Authorization: Bearer $ADMIN_TOKEN")
        echo "$existing_response" | jq -r '.[0].id' 2>/dev/null || echo "0"
    fi
}

# Function to create dataset
create_dataset() {
    local name=$1
    local description=$2
    local owner_id=$3
    local data_type=$4
    local size_gb=$5
    local record_count=$6
    local tags=$7
    
    echo -e "${BLUE}📊 Creating dataset: $name${NC}"
    
    local dataset_data=$(cat <<EOF
{
    "name": "$name",
    "description": "$description",
    "category": "$data_type",
    "size": $((size_gb * 1024)),
    "recordCount": $record_count,
    "price": "1000.00",
    "license": "Commercial",
    "tags": [$tags],
    "metadata": {
        "quality": "high",
        "coverage": "comprehensive",
        "dataQuality": "verified"
    },
    "isPublic": true,
    "isActive": true,
    "confidentialComputingRequired": false,
    "ownerId": $owner_id
}
EOF
)
    
    local response=$(curl -s -X POST http://localhost:5001/api/datasets \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "$dataset_data")
    
    if echo "$response" | grep -q "id"; then
        echo -e "${GREEN}✅ Dataset created: $name${NC}"
        echo "$response" | jq -r '.id'
    else
        echo -e "${RED}❌ Failed to create dataset: $name${NC}"
        echo "$response"
        echo "0"
    fi
}

# Function to create AI model
create_ai_model() {
    local name=$1
    local description=$2
    local owner_id=$3
    local model_type=$4
    local framework=$5
    local version=$6
    
    echo -e "${BLUE}🤖 Creating AI model: $name${NC}"
    
    local model_data=$(cat <<EOF
{
    "name": "$name",
    "description": "$description",
    "type": "$model_type",
    "architecture": "ResNet-50",
    "parameters": "100M",
    "framework": "$framework",
    "privacyTechnique": "differential-privacy",
    "validationMetrics": {
        "accuracy": "95%",
        "precision": "0.95"
    },
    "maxEpochs": 100,
    "batchSize": 32,
    "learningRate": "0.001",
    "isActive": true,
    "metadata": {
        "modelSize": "100MB",
        "inputShape": [224, 224, 3],
        "trainingData": "Test Dataset",
        "outputClasses": 10
    },
    "ownerId": $owner_id
}
EOF
)
    
    local response=$(curl -s -X POST http://localhost:5001/api/ai-models \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "$model_data")
    
    if echo "$response" | grep -q "id"; then
        echo -e "${GREEN}✅ AI model created: $name${NC}"
        echo "$response" | jq -r '.id'
    else
        echo -e "${RED}❌ Failed to create AI model: $name${NC}"
        echo "$response"
        echo "0"
    fi
}

# Function to create training environment
create_training_environment() {
    local name=$1
    local description=$2
    local owner_id=$3
    local environment_type=$4
    local compute_resources=$5
    
    echo -e "${BLUE}🏗️ Creating training environment: $name${NC}"
    
    local env_data=$(cat <<EOF
{
    "name": "$name",
    "description": "$description",
    "environmentType": "$environment_type",
    "computeResources": $compute_resources,
    "securityLevel": "HIGH",
    "dataIsolation": true,
    "networkAccess": "RESTRICTED",
    "monitoringEnabled": true,
    "backupFrequency": "DAILY",
    "complianceCertifications": ["SOC2", "ISO27001"],
    "supportedFrameworks": ["TensorFlow", "PyTorch", "Scikit-learn"],
    "maxUsers": 10,
    "maxConcurrentJobs": 5,
    "ownerId": $owner_id
}
EOF
)
    
    local response=$(curl -s -X POST http://localhost:5001/api/infrastructure/training-environments \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "$env_data")
    
    if echo "$response" | grep -q "id"; then
        echo -e "${GREEN}✅ Training environment created: $name${NC}"
        echo "$response" | jq -r '.id'
    else
        echo -e "${RED}❌ Failed to create training environment: $name${NC}"
        echo "$response"
        echo "0"
    fi
}

# Function to create cloud credentials
create_cloud_credentials() {
    local name=$1
    local owner_id=$2
    local provider=$3
    local region=$4
    
    echo -e "${BLUE}☁️ Creating cloud credentials: $name${NC}"
    
    local creds_data=$(cat <<EOF
{
    "name": "$name",
    "cloudProvider": "$provider",
    "region": "$region",
    "credentials": {
        "accessKeyId": "AKIA${RANDOM}${RANDOM}",
        "secretAccessKey": "secret_${RANDOM}_${RANDOM}",
        "sessionToken": "token_${RANDOM}"
    },
    "permissions": ["S3_READ", "S3_WRITE", "EC2_LAUNCH", "LAMBDA_INVOKE"],
    "encryptionEnabled": true,
    "mfaEnabled": true,
    "ownerId": $owner_id
}
EOF
)
    
    local response=$(curl -s -X POST http://localhost:5001/api/ccrp/cloud-credentials \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "$creds_data")
    
    if echo "$response" | grep -q "id"; then
        echo -e "${GREEN}✅ Cloud credentials created: $name${NC}"
        echo "$response" | jq -r '.id'
    else
        echo -e "${RED}❌ Failed to create cloud credentials: $name${NC}"
        echo "$response"
        echo "0"
    fi
}

# Create TDP Users (Training Data Providers)
echo -e "\n${BLUE}🏭 Creating TDP Users (Training Data Providers)${NC}"
echo "=================================================="

TDP1_ID=$(create_user "tdp1@dataprovider.com" "tdp123" "DataCorp Inc." "TDP" "DataCorp Inc.")
TDP2_ID=$(create_user "tdp2@dataprovider.com" "tdp123" "InfoSource Ltd." "TDP" "InfoSource Ltd.")
TDP3_ID=$(create_user "tdp3@dataprovider.com" "tdp123" "DataFlow Systems" "TDP" "DataFlow Systems")

# Create TDC Users (Training Data Consumers)
echo -e "\n${BLUE}🛒 Creating TDC Users (Training Data Consumers)${NC}"
echo "======================================================"

TDC1_ID=$(create_user "tdc1@dataconsumer.com" "tdc123" "AI Solutions Corp." "TDC" "AI Solutions Corp.")
TDC2_ID=$(create_user "tdc2@dataconsumer.com" "tdc123" "ML Innovations Ltd." "TDC" "ML Innovations Ltd.")
TDC3_ID=$(create_user "tdc3@dataconsumer.com" "tdc123" "SmartTech Industries" "TDC" "SmartTech Industries")

# Create CCRP Users (Confidential Clean Room Providers)
echo -e "\n${BLUE}🔒 Creating CCRP Users (Confidential Clean Room Providers)${NC}"
echo "================================================================"

CCRP1_ID=$(create_user "ccrp1@cleanroom.com" "ccrp123" "SecureCompute Inc." "CCRP" "SecureCompute Inc.")
CCRP2_ID=$(create_user "ccrp2@cleanroom.com" "ccrp123" "ConfidentialCloud Ltd." "CCRP" "ConfidentialCloud Ltd.")
CCRP3_ID=$(create_user "ccrp3@cleanroom.com" "ccrp123" "TrustedCompute Corp." "CCRP" "TrustedCompute Corp.")

# Update CCRP users with cloud providers
echo -e "\n${BLUE}☁️ Updating CCRP users with cloud providers${NC}"
echo "=================================================="

update_ccrp_cloud_providers() {
    local ccrp_id=$1
    local providers=$2
    
    echo -e "${BLUE}☁️ Updating CCRP $ccrp_id with providers: $providers${NC}"
    
    local update_data=$(cat <<EOF
{
    "cloudProviders": [$providers]
}
EOF
)
    
    local response=$(curl -s -X PUT "http://localhost:5001/api/users/$ccrp_id" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "$update_data")
    
    if echo "$response" | grep -q "id"; then
        echo -e "${GREEN}✅ CCRP $ccrp_id updated with providers: $providers${NC}"
    else
        echo -e "${RED}❌ Failed to update CCRP $ccrp_id${NC}"
        echo "$response"
    fi
}

# Update each CCRP with different cloud providers
update_ccrp_cloud_providers $CCRP1_ID '"AWS", "Azure"'
update_ccrp_cloud_providers $CCRP2_ID '"Azure", "GCP"'
update_ccrp_cloud_providers $CCRP3_ID '"GCP", "OCI"'

# Create Datasets for TDP Users
echo -e "\n${BLUE}📊 Creating Datasets for TDP Users${NC}"
echo "=========================================="

# TDP1 Datasets
TDP1_DS1_ID=$(create_dataset "Customer Behavior Analytics" "Comprehensive customer interaction data for retail analytics" "$TDP1_ID" "STRUCTURED" 25 5000000 '"retail", "customer", "behavior", "analytics"')
TDP1_DS2_ID=$(create_dataset "Financial Transaction Records" "Secure financial transaction data for fraud detection" "$TDP1_ID" "STRUCTURED" 15 2000000 '"financial", "transactions", "fraud", "detection"')
TDP1_DS3_ID=$(create_dataset "Healthcare Patient Data" "Anonymized patient health records for medical research" "$TDP1_ID" "STRUCTURED" 40 1000000 '"healthcare", "patient", "medical", "research"')

# TDP2 Datasets
TDP2_DS1_ID=$(create_dataset "IoT Sensor Data" "Real-time sensor data from industrial IoT devices" "$TDP2_ID" "TIME_SERIES" 30 10000000 '"iot", "sensor", "industrial", "real-time"')
TDP2_DS2_ID=$(create_dataset "Social Media Sentiment" "Social media posts and sentiment analysis data" "$TDP2_ID" "UNSTRUCTURED" 20 8000000 '"social", "media", "sentiment", "analysis"')
TDP2_DS3_ID=$(create_dataset "E-commerce Purchase History" "Online shopping behavior and purchase patterns" "$TDP2_ID" "STRUCTURED" 18 3000000 '"e-commerce", "purchase", "behavior", "patterns"')

# TDP3 Datasets
TDP3_DS1_ID=$(create_dataset "Satellite Imagery" "High-resolution satellite images for environmental monitoring" "$TDP3_ID" "IMAGE" 50 50000 '"satellite", "imagery", "environmental", "monitoring"')
TDP3_DS2_ID=$(create_dataset "Genomic Sequences" "DNA sequence data for genetic research" "$TDP3_ID" "SEQUENCE" 35 100000 '"genomic", "dna", "genetic", "research"')
TDP3_DS3_ID=$(create_dataset "Traffic Flow Data" "Urban traffic patterns and congestion analysis" "$TDP3_ID" "TIME_SERIES" 22 1500000 '"traffic", "flow", "urban", "congestion"')

# Create AI Models for TDC Users
echo -e "\n${BLUE}🤖 Creating AI Models for TDC Users${NC}"
echo "============================================="

# TDC1 AI Models
TDC1_AM1_ID=$(create_ai_model "Fraud Detection Model" "Advanced fraud detection using machine learning" "$TDC1_ID" "CLASSIFICATION" "TensorFlow" "2.8.0")
TDC1_AM2_ID=$(create_ai_model "Customer Segmentation Model" "Customer clustering and segmentation analysis" "$TDC1_ID" "CLUSTERING" "Scikit-learn" "1.1.2")
TDC1_AM3_ID=$(create_ai_model "Predictive Analytics Engine" "Sales forecasting and trend prediction" "$TDC1_ID" "REGRESSION" "PyTorch" "1.12.0")

# TDC2 AI Models
TDC2_AM1_ID=$(create_ai_model "Image Recognition Model" "Computer vision model for object detection" "$TDC2_ID" "COMPUTER_VISION" "TensorFlow" "2.8.0")
TDC2_AM2_ID=$(create_ai_model "Natural Language Processor" "Text analysis and sentiment classification" "$TDC2_ID" "NLP" "Transformers" "4.21.0")
TDC2_AM3_ID=$(create_ai_model "Recommendation System" "Personalized content recommendation engine" "$TDC2_ID" "RECOMMENDATION" "Surprise" "1.1.1")

# TDC3 AI Models
TDC3_AM1_ID=$(create_ai_model "Anomaly Detection Model" "Real-time anomaly detection in time series data" "$TDC3_ID" "ANOMALY_DETECTION" "PyTorch" "1.12.0")
TDC3_AM2_ID=$(create_ai_model "Optimization Engine" "Resource optimization and scheduling algorithms" "$TDC3_ID" "OPTIMIZATION" "OR-Tools" "9.5.0")
TDC3_AM3_ID=$(create_ai_model "Risk Assessment Model" "Financial risk evaluation and scoring" "$TDC3_ID" "CLASSIFICATION" "Scikit-learn" "1.1.2")

# Create Training Environments for CCRP Users
echo -e "\n${BLUE}🏗️ Creating Training Environments for CCRP Users${NC}"
echo "========================================================="

# CCRP1 Training Environments
CCRP1_TE1_ID=$(create_training_environment "High-Security Compute Cluster" "Isolated high-performance computing environment with maximum security" "$CCRP1_ID" "ON_PREMISES" '{"cpuCores": 64, "gpuCount": 8, "ramGB": 256, "storageTB": 10}')
CCRP1_TE2_ID=$(create_training_environment "Confidential Data Lab" "Secure environment for sensitive data processing" "$CCRP1_ID" "HYBRID" '{"cpuCores": 32, "gpuCount": 4, "ramGB": 128, "storageTB": 5}')
CCRP1_TE3_ID=$(create_training_environment "Federated Learning Hub" "Distributed learning environment with privacy preservation" "$CCRP1_ID" "DISTRIBUTED" '{"cpuCores": 16, "gpuCount": 2, "ramGB": 64, "storageTB": 2}')

# CCRP2 Training Environments
CCRP2_TE1_ID=$(create_training_environment "Privacy-First Compute Grid" "Privacy-preserving computing infrastructure" "$CCRP2_ID" "CLOUD" '{"cpuCores": 48, "gpuCount": 6, "ramGB": 192, "storageTB": 8}')
CCRP2_TE2_ID=$(create_training_environment "Secure Multi-Tenant Platform" "Isolated environments for multiple organizations" "$CCRP2_ID" "MULTI_TENANT" '{"cpuCores": 24, "gpuCount": 3, "ramGB": 96, "storageTB": 4}')
CCRP2_TE3_ID=$(create_training_environment "Confidential AI Workspace" "Secure AI development and training environment" "$CCRP2_ID" "WORKSPACE" '{"cpuCores": 16, "gpuCount": 2, "ramGB": 64, "storageTB": 2}')

# CCRP3 Training Environments
CCRP3_TE1_ID=$(create_training_environment "Zero-Knowledge Compute" "Zero-knowledge proof enabled computing environment" "$CCRP3_ID" "SPECIALIZED" '{"cpuCores": 32, "gpuCount": 4, "ramGB": 128, "storageTB": 5}')
CCRP3_TE2_ID=$(create_training_environment "Homomorphic Encryption Lab" "Environment for encrypted data processing" "$CCRP3_TE3_ID" "RESEARCH" '{"cpuCores": 16, "gpuCount": 2, "ramGB": 64, "storageTB": 2}')
CCRP3_TE3_ID=$(create_training_environment "Secure Model Training" "Secure environment for AI model training" "$CCRP3_ID" "TRAINING" '{"cpuCores": 24, "gpuCount": 3, "ramGB": 96, "storageTB": 4}')

# Create Cloud Credentials for CCRP Users
echo -e "\n${BLUE}☁️ Creating Cloud Credentials for CCRP Users${NC}"
echo "====================================================="

# CCRP1 Cloud Credentials
CCRP1_CC1_ID=$(create_cloud_credentials "AWS Production" "$CCRP1_ID" "AWS" "us-east-1")
CCRP1_CC2_ID=$(create_cloud_credentials "Azure Development" "$CCRP1_ID" "Azure" "eastus")
CCRP1_CC3_ID=$(create_cloud_credentials "GCP Staging" "$CCRP1_ID" "GCP" "us-central1")

# CCRP2 Cloud Credentials
CCRP2_CC1_ID=$(create_cloud_credentials "AWS Secure" "$CCRP2_ID" "AWS" "us-west-2")
CCRP2_CC2_ID=$(create_cloud_credentials "Azure Confidential" "$CCRP2_ID" "Azure" "westus2")
CCRP2_CC3_ID=$(create_cloud_credentials "GCP Private" "$CCRP2_ID" "GCP" "us-east4")

# CCRP3 Cloud Credentials
CCRP3_CC1_ID=$(create_cloud_credentials "AWS Research" "$CCRP3_ID" "AWS" "us-east-1")
CCRP3_CC2_ID=$(create_cloud_credentials "Azure Lab" "$CCRP3_ID" "Azure" "eastus")
CCRP3_CC3_ID=$(create_cloud_credentials "GCP Development" "$CCRP3_ID" "GCP" "us-central1")

# Create Infrastructure Environments
echo -e "\n${BLUE}🏢 Creating Infrastructure Environments${NC}"
echo "============================================="

# Create infrastructure environment for CCRP1
echo -e "${BLUE}🏗️ Creating infrastructure environment for CCRP1${NC}"
INFRA_ENV1_DATA=$(cat <<EOF
{
    "name": "Secure Multi-Cloud Infrastructure",
    "description": "Multi-cloud infrastructure with high security and compliance",
    "ownerId": $CCRP1_ID,
    "environmentType": "MULTI_CLOUD",
    "computeResources": {
        "cpuCores": 128,
        "gpuCount": 16,
        "ramGB": 512,
        "storageTB": 50
    },
    "securityLevel": "MAXIMUM",
    "complianceCertifications": ["SOC2", "ISO27001", "HIPAA", "GDPR"],
    "dataIsolation": true,
    "networkAccess": "RESTRICTED",
    "monitoringEnabled": true,
    "backupFrequency": "HOURLY",
    "disasterRecovery": true,
    "geoRedundancy": true
}
EOF
)

INFRA_ENV1_RESPONSE=$(curl -s -X POST http://localhost:5001/api/infrastructure/environments \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "$INFRA_ENV1_DATA")

if echo "$INFRA_ENV1_RESPONSE" | grep -q "id"; then
    echo -e "${GREEN}✅ Infrastructure environment created for CCRP1${NC}"
else
    echo -e "${YELLOW}⚠️ Infrastructure environment creation failed${NC}"
fi

# Summary
echo -e "\n${GREEN}🎉 Test Data Creation Completed!${NC}"
echo "=========================================="
echo -e "${BLUE}📊 Summary:${NC}"
echo "  👥 Users Created:"
echo "    - TDP Users: 3 (Training Data Providers)"
echo "    - TDC Users: 3 (Training Data Consumers)"
echo "    - CCRP Users: 3 (Confidential Clean Room Providers)"
echo ""
echo "  📊 Datasets Created: 9 (3 per TDP user)"
echo "  🤖 AI Models Created: 9 (3 per TDC user)"
echo "  🏗️ Training Environments Created: 9 (3 per CCRP user)"
echo "  ☁️ Cloud Credentials Created: 9 (3 per CCRP user)"
echo "  🏢 Infrastructure Environments Created: 1"
echo ""
echo -e "${BLUE}🔑 Test User Credentials:${NC}"
echo "  TDP Users:"
echo "    - tdp1@dataprovider.com / tdp123"
echo "    - tdp2@dataprovider.com / tdp123"
echo "    - tdp3@dataprovider.com / tdp123"
echo ""
echo "  TDC Users:"
echo "    - tdc1@dataconsumer.com / tdc123"
echo "    - tdc2@dataconsumer.com / tdc123"
echo "    - tdc3@dataconsumer.com / tdc123"
echo ""
echo "  CCRP Users:"
echo "    - ccrp1@cleanroom.com / ccrp123"
echo "    - ccrp2@cleanroom.com / ccrp123"
echo "    - ccrp3@cleanroom.com / ccrp123"
echo ""
echo -e "${BLUE}🧪 Next Steps:${NC}"
echo "  1. Test user login for each user type"
echo "  2. Create contracts using the test data"
echo "  3. Test SCITT CCF integration with contracts"
echo "  4. Test training environment provisioning"
echo ""
echo -e "${YELLOW}⚠️  Note: All test data was created using backend APIs${NC}"
echo "   - No direct database modifications"
echo "   - Proper IAM integration maintained"
echo "   - Ready for contract creation testing"
