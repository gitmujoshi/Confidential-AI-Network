#!/bin/bash

# Create TDC (Training Data Consumer) Test Data Script
# This script creates comprehensive test data specifically for TDC users
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

echo -e "${BLUE}🤖 Creating TDC Test Data for Contract Management System${NC}"
echo "=============================================================="
echo "Creating comprehensive test data for Training Data Consumers"
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

# Function to create a TDC user via registration API
create_tdc_user() {
    local name="$1"
    local email="$2"
    local organization="$3"
    local description="$4"
    local specialization="$5"
    
    echo "  Creating TDC user: ${name}..."
    
    local response=$(curl -s -X POST "http://localhost:${PORT}/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"${name}\",
            \"email\": \"${email}\",
            \"partyType\": \"TDC\",
            \"organization\": \"${organization}\",
            \"description\": \"${description}\",
            \"specialization\": \"${specialization}\"
        }" 2>/dev/null || echo "FAILED")
    
    if echo "$response" | grep -q "success.*true"; then
        echo -e "  TDC User: ${GREEN}✅ Created successfully${NC}"
        return 0
    elif echo "$response" | grep -q "already registered\|already exists"; then
        echo -e "  TDC User: ${YELLOW}⚠️ Already exists${NC}"
        return 0
    else
        echo -e "  TDC User: ${RED}❌ Failed${NC}"
        echo "    Response: $response"
        return 1
    fi
}

# Function to create an AI model
create_ai_model() {
    local name="$1"
    local description="$2"
    local category="$3"
    local owner_email="$4"
    local framework="$5"
    local model_type="$6"
    local accuracy="$7"
    local price="$8"
    local tags="$9"
    
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
                \"modelType\": \"${model_type}\",
                \"framework\": \"${framework}\",
                \"version\": \"1.0.0\",
                \"accuracy\": ${accuracy},
                \"price\": ${price},
                \"tags\": [${tags}],
                \"trainingDataSize\": \"10GB\",
                \"modelSize\": \"500MB\",
                \"inputFormat\": \"JSON\",
                \"outputFormat\": \"JSON\",
                \"deploymentReady\": true,
                \"apiEndpoint\": \"https://api.example.com/models/${name,,}\"
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

# Function to create a training request
create_training_request() {
    local title="$1"
    local description="$2"
    local requester_email="$3"
    local dataset_requirements="$4"
    local model_requirements="$5"
    local budget="$6"
    
    echo "  Creating training request: ${title}..."
    
    # Get auth token for the requester
    local login_response=$(curl -s -X POST "http://localhost:${PORT}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${requester_email}\", \"password\": \"password123\"}" 2>/dev/null || echo "FAILED")
    
    if echo "$login_response" | grep -q "accessToken"; then
        local token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        
        local request_response=$(curl -s -X POST "http://localhost:${PORT}/api/training-requests" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${token}" \
            -d "{
                \"title\": \"${title}\",
                \"description\": \"${description}\",
                \"datasetRequirements\": \"${dataset_requirements}\",
                \"modelRequirements\": \"${model_requirements}\",
                \"budget\": ${budget},
                \"status\": \"PENDING\",
                \"priority\": \"HIGH\",
                \"expectedDuration\": \"30 days\",
                \"dataPrivacyLevel\": \"CONFIDENTIAL\",
                \"complianceRequirements\": [\"HIPAA\", \"GDPR\"]
            }" 2>/dev/null || echo "FAILED")
        
        if echo "$request_response" | grep -q "id"; then
            echo -e "  Training Request: ${GREEN}✅ Created successfully${NC}"
        else
            echo -e "  Training Request: ${YELLOW}⚠️ May already exist or failed${NC}"
        fi
    else
        echo -e "  Training Request: ${RED}❌ Failed to authenticate requester${NC}"
    fi
}

echo -e "\n${BLUE}👥 Step 3: Creating TDC users...${NC}"

# Create Healthcare AI TDC user
create_tdc_user \
    "Healthcare AI Solutions" \
    "healthcare@tdc.com" \
    "Healthcare AI Solutions Inc" \
    "AI company specializing in healthcare applications and medical diagnosis systems" \
    "Healthcare AI, Medical Diagnosis, Clinical Decision Support"

# Create Financial AI TDC user
create_tdc_user \
    "FinTech AI Labs" \
    "fintech@tdc.com" \
    "FinTech AI Laboratories" \
    "Financial technology company developing AI solutions for trading and risk management" \
    "Financial AI, Trading Algorithms, Risk Management"

# Create Retail AI TDC user
create_tdc_user \
    "Retail AI Innovations" \
    "retail@tdc.com" \
    "Retail AI Innovations Ltd" \
    "E-commerce and retail AI solutions for customer experience and supply chain optimization" \
    "Retail AI, E-commerce, Customer Analytics"

# Create Research AI TDC user
create_tdc_user \
    "AI Research Institute" \
    "research@tdc.com" \
    "AI Research Institute" \
    "Academic research institution focused on advancing AI technologies and applications" \
    "AI Research, Academic, Machine Learning"

echo -e "\n${BLUE}🤖 Step 4: Creating AI models...${NC}"

# Healthcare AI models
create_ai_model \
    "Medical Image Classifier" \
    "Deep learning model for medical image classification and diagnosis assistance" \
    "Healthcare" \
    "healthcare@tdc.com" \
    "TensorFlow" \
    "neural_network" \
    0.95 \
    10000.00 \
    "\"medical-imaging\", \"classification\", \"diagnosis\", \"deep-learning\""

create_ai_model \
    "Patient Risk Predictor" \
    "Machine learning model for predicting patient health risks and outcomes" \
    "Healthcare" \
    "healthcare@tdc.com" \
    "PyTorch" \
    "gradient_boosting" \
    0.88 \
    8000.00 \
    "\"healthcare\", \"risk-prediction\", \"patient-outcomes\", \"clinical\""

create_ai_model \
    "Drug Discovery Assistant" \
    "AI model for assisting in drug discovery and pharmaceutical research" \
    "Healthcare" \
    "healthcare@tdc.com" \
    "TensorFlow" \
    "transformer" \
    0.82 \
    15000.00 \
    "\"drug-discovery\", \"pharmaceutical\", \"research\", \"molecular\""

# Financial AI models
create_ai_model \
    "Trading Algorithm" \
    "Advanced trading algorithm for automated stock market trading" \
    "Finance" \
    "fintech@tdc.com" \
    "PyTorch" \
    "reinforcement_learning" \
    0.75 \
    12000.00 \
    "\"trading\", \"algorithm\", \"financial-markets\", \"automation\""

create_ai_model \
    "Credit Risk Assessor" \
    "Machine learning model for credit risk assessment and loan approval" \
    "Finance" \
    "fintech@tdc.com" \
    "Scikit-learn" \
    "random_forest" \
    0.92 \
    6000.00 \
    "\"credit-risk\", \"loan-approval\", \"financial-risk\", \"assessment\""

create_ai_model \
    "Fraud Detection System" \
    "Real-time fraud detection system for financial transactions" \
    "Finance" \
    "fintech@tdc.com" \
    "TensorFlow" \
    "anomaly_detection" \
    0.96 \
    9000.00 \
    "\"fraud-detection\", \"security\", \"transactions\", \"anomaly\""

# Retail AI models
create_ai_model \
    "Recommendation Engine" \
    "Personalized product recommendation system for e-commerce" \
    "Retail" \
    "retail@tdc.com" \
    "TensorFlow" \
    "collaborative_filtering" \
    0.85 \
    7000.00 \
    "\"recommendations\", \"e-commerce\", \"personalization\", \"collaborative-filtering\""

create_ai_model \
    "Demand Forecasting" \
    "AI model for predicting product demand and inventory optimization" \
    "Retail" \
    "retail@tdc.com" \
    "PyTorch" \
    "time_series" \
    0.78 \
    5000.00 \
    "\"demand-forecasting\", \"inventory\", \"time-series\", \"optimization\""

create_ai_model \
    "Customer Churn Predictor" \
    "Machine learning model for predicting customer churn and retention" \
    "Retail" \
    "retail@tdc.com" \
    "Scikit-learn" \
    "logistic_regression" \
    0.83 \
    4000.00 \
    "\"customer-churn\", \"retention\", \"analytics\", \"prediction\""

# Research AI models
create_ai_model \
    "Scientific Paper Analyzer" \
    "NLP model for analyzing and extracting insights from scientific papers" \
    "Research" \
    "research@tdc.com" \
    "Transformers" \
    "language_model" \
    0.90 \
    8000.00 \
    "\"nlp\", \"scientific-papers\", \"research\", \"text-analysis\""

create_ai_model \
    "Climate Prediction Model" \
    "Deep learning model for climate and weather prediction" \
    "Research" \
    "research@tdc.com" \
    "TensorFlow" \
    "convolutional_neural_network" \
    0.87 \
    11000.00 \
    "\"climate\", \"weather\", \"prediction\", \"environmental\""

echo -e "\n${BLUE}📋 Step 5: Creating training requests...${NC}"

# Create training requests for different TDC users
create_training_request \
    "Healthcare Diagnosis Model Training" \
    "Training request for developing a comprehensive medical diagnosis AI model using healthcare datasets" \
    "healthcare@tdc.com" \
    "Medical records, imaging data, patient demographics" \
    "High accuracy neural network with explainable AI capabilities" \
    25000.00

create_training_request \
    "Financial Risk Assessment Training" \
    "Training request for developing advanced financial risk assessment models" \
    "fintech@tdc.com" \
    "Market data, credit history, economic indicators" \
    "Ensemble model with real-time prediction capabilities" \
    18000.00

create_training_request \
    "E-commerce Personalization Training" \
    "Training request for developing personalized recommendation systems" \
    "retail@tdc.com" \
    "Customer behavior, purchase history, product catalog" \
    "Deep learning model with real-time inference" \
    15000.00

create_training_request \
    "Scientific Research Analysis Training" \
    "Training request for developing AI models to analyze scientific literature" \
    "research@tdc.com" \
    "Research papers, abstracts, citation networks" \
    "Transformer-based model with multi-language support" \
    20000.00

echo -e "\n${BLUE}🧪 Step 6: Testing TDC user authentication...${NC}"

# Test login for each TDC user
test_tdc_login() {
    local email="$1"
    local organization="$2"
    
    echo "  Testing login for TDC: ${organization}..."
    
    local login_response=$(curl -s -X POST "http://localhost:${PORT}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${email}\", \"password\": \"password123\"}" 2>/dev/null || echo "FAILED")
    
    if echo "$login_response" | grep -q "accessToken"; then
        echo -e "  TDC Login: ${GREEN}✅ Success${NC}"
    else
        echo -e "  TDC Login: ${RED}❌ Failed${NC}"
        echo "    Response: $login_response"
    fi
}

test_tdc_login "healthcare@tdc.com" "Healthcare AI Solutions"
test_tdc_login "fintech@tdc.com" "FinTech AI Labs"
test_tdc_login "retail@tdc.com" "Retail AI Innovations"
test_tdc_login "research@tdc.com" "AI Research Institute"

echo -e "\n${BLUE}📋 Step 7: Testing AI model access for TDC users...${NC}"

# Test AI model listing for TDC users
test_model_access() {
    local email="$1"
    local organization="$2"
    
    echo "  Testing AI model access for TDC: ${organization}..."
    
    local login_response=$(curl -s -X POST "http://localhost:${PORT}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${email}\", \"password\": \"password123\"}" 2>/dev/null || echo "FAILED")
    
    if echo "$login_response" | grep -q "accessToken"; then
        local token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        
        local models_response=$(curl -s -X GET "http://localhost:${PORT}/api/ai-models" \
            -H "Authorization: Bearer ${token}" 2>/dev/null || echo "FAILED")
        
        if echo "$models_response" | grep -q "models\|\[\]"; then
            echo -e "  AI Model Access: ${GREEN}✅ Success${NC}"
        else
            echo -e "  AI Model Access: ${YELLOW}⚠️ Partial success${NC}"
        fi
    else
        echo -e "  AI Model Access: ${RED}❌ Failed to authenticate${NC}"
    fi
}

test_model_access "healthcare@tdc.com" "Healthcare AI Solutions"
test_model_access "fintech@tdc.com" "FinTech AI Labs"

echo -e "\n${GREEN}🎉 TDC test data creation completed!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "  ✅ TDC users created via registration API"
echo "  ✅ Comprehensive AI models created for each TDC"
echo "  ✅ Training requests created"
echo "  ✅ Authentication tested for all TDC users"
echo "  ✅ AI model access tested"
echo ""
echo -e "${BLUE}🔗 TDC Test Users:${NC}"
echo "  Healthcare: healthcare@tdc.com (password: password123)"
echo "  FinTech: fintech@tdc.com (password: password123)"
echo "  Retail: retail@tdc.com (password: password123)"
echo "  Research: research@tdc.com (password: password123)"
echo ""
echo -e "${BLUE}🤖 AI Models Created:${NC}"
echo "  • Healthcare: 3 models (Image Classifier, Risk Predictor, Drug Discovery)"
echo "  • Finance: 3 models (Trading Algorithm, Credit Risk, Fraud Detection)"
echo "  • Retail: 3 models (Recommendation Engine, Demand Forecasting, Churn Predictor)"
echo "  • Research: 2 models (Paper Analyzer, Climate Prediction)"
echo ""
echo -e "${BLUE}📋 Training Requests Created:${NC}"
echo "  • Healthcare Diagnosis Model Training"
echo "  • Financial Risk Assessment Training"
echo "  • E-commerce Personalization Training"
echo "  • Scientific Research Analysis Training"
echo ""
echo -e "${BLUE}🌐 Access URLs:${NC}"
echo "  Frontend: http://localhost:${FRONTEND_PORT}"
echo "  Backend API: http://localhost:${PORT}/api"
echo "  Keycloak Admin: ${KEYCLOAK_URL}/admin"
echo ""
echo -e "${GREEN}TDC users can now create AI models and request training services!${NC}"
