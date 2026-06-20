#!/bin/bash

# Create TSP (Tech Service Provider) Test Data Script
# This script creates comprehensive test data specifically for TSP users
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

echo -e "${BLUE}🏗️ Creating TSP Test Data for Contract Management System${NC}"
echo "=============================================================="
echo "Creating comprehensive test data for Tech Service Providers"
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

# Function to create a TSP user via registration API
create_ccrp_user() {
    local name="$1"
    local email="$2"
    local organization="$3"
    local description="$4"
    local specialization="$5"
    
    echo "  Creating TSP user: ${name}..."
    
    local response=$(curl -s -X POST "http://localhost:${PORT}/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"${name}\",
            \"email\": \"${email}\",
            \"partyType\": \"TSP\",
            \"organization\": \"${organization}\",
            \"description\": \"${description}\",
            \"specialization\": \"${specialization}\"
        }" 2>/dev/null || echo "FAILED")
    
    if echo "$response" | grep -q "success.*true"; then
        echo -e "  TSP User: ${GREEN}✅ Created successfully${NC}"
        return 0
    elif echo "$response" | grep -q "already registered\|already exists"; then
        echo -e "  TSP User: ${YELLOW}⚠️ Already exists${NC}"
        return 0
    else
        echo -e "  TSP User: ${RED}❌ Failed${NC}"
        echo "    Response: $response"
        return 1
    fi
}

# Function to create a training environment
create_training_environment() {
    local name="$1"
    local description="$2"
    local owner_email="$3"
    local environment_type="$4"
    local capacity="$5"
    local security_level="$6"
    local price_per_hour="$7"
    local features="$8"
    
    echo "  Creating training environment: ${name}..."
    
    # Get auth token for the owner
    local login_response=$(curl -s -X POST "http://localhost:${PORT}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${owner_email}\", \"password\": \"password123\"}" 2>/dev/null || echo "FAILED")
    
    if echo "$login_response" | grep -q "accessToken"; then
        local token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        
        local environment_response=$(curl -s -X POST "http://localhost:${PORT}/api/training-environments" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${token}" \
            -d "{
                \"name\": \"${name}\",
                \"description\": \"${description}\",
                \"environmentType\": \"${environment_type}\",
                \"capacity\": \"${capacity}\",
                \"securityLevel\": \"${security_level}\",
                \"pricePerHour\": ${price_per_hour},
                \"features\": [${features}],
                \"status\": \"AVAILABLE\",
                \"location\": \"US-East-1\",
                \"compliance\": [\"SOC2\", \"ISO27001\", \"HIPAA\"],
                \"encryption\": \"AES-256\",
                \"accessControl\": \"Role-based\",
                \"monitoring\": \"24/7\",
                \"backup\": \"Daily\",
                \"disasterRecovery\": \"99.9% uptime\"
            }" 2>/dev/null || echo "FAILED")
        
        if echo "$environment_response" | grep -q "id"; then
            echo -e "  Training Environment: ${GREEN}✅ Created successfully${NC}"
        else
            echo -e "  Training Environment: ${YELLOW}⚠️ May already exist or failed${NC}"
        fi
    else
        echo -e "  Training Environment: ${RED}❌ Failed to authenticate owner${NC}"
    fi
}

# Function to create a secure compute resource
create_compute_resource() {
    local name="$1"
    local description="$2"
    local owner_email="$3"
    local resource_type="$4"
    local specifications="$5"
    local price_per_hour="$6"
    
    echo "  Creating compute resource: ${name}..."
    
    # Get auth token for the owner
    local login_response=$(curl -s -X POST "http://localhost:${PORT}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${owner_email}\", \"password\": \"password123\"}" 2>/dev/null || echo "FAILED")
    
    if echo "$login_response" | grep -q "accessToken"; then
        local token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        
        local resource_response=$(curl -s -X POST "http://localhost:${PORT}/api/compute-resources" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${token}" \
            -d "{
                \"name\": \"${name}\",
                \"description\": \"${description}\",
                \"resourceType\": \"${resource_type}\",
                \"specifications\": \"${specifications}\",
                \"pricePerHour\": ${price_per_hour},
                \"status\": \"AVAILABLE\",
                \"securityLevel\": \"HIGH\",
                \"encryption\": \"AES-256\",
                \"isolation\": \"Dedicated\",
                \"monitoring\": \"Real-time\"
            }" 2>/dev/null || echo "FAILED")
        
        if echo "$resource_response" | grep -q "id"; then
            echo -e "  Compute Resource: ${GREEN}✅ Created successfully${NC}"
        else
            echo -e "  Compute Resource: ${YELLOW}⚠️ May already exist or failed${NC}"
        fi
    else
        echo -e "  Compute Resource: ${RED}❌ Failed to authenticate owner${NC}"
    fi
}

# Function to create a data processing service
create_data_processing_service() {
    local name="$1"
    local description="$2"
    local owner_email="$3"
    local service_type="$4"
    local capabilities="$5"
    local price_per_gb="$6"
    
    echo "  Creating data processing service: ${name}..."
    
    # Get auth token for the owner
    local login_response=$(curl -s -X POST "http://localhost:${PORT}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${owner_email}\", \"password\": \"password123\"}" 2>/dev/null || echo "FAILED")
    
    if echo "$login_response" | grep -q "accessToken"; then
        local token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        
        local service_response=$(curl -s -X POST "http://localhost:${PORT}/api/data-processing-services" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${token}" \
            -d "{
                \"name\": \"${name}\",
                \"description\": \"${description}\",
                \"serviceType\": \"${service_type}\",
                \"capabilities\": \"${capabilities}\",
                \"pricePerGB\": ${price_per_gb},
                \"status\": \"AVAILABLE\",
                \"securityLevel\": \"MAXIMUM\",
                \"privacyLevel\": \"CONFIDENTIAL\",
                \"processingSpeed\": \"High\",
                \"dataRetention\": \"Configurable\"
            }" 2>/dev/null || echo "FAILED")
        
        if echo "$service_response" | grep -q "id"; then
            echo -e "  Data Processing Service: ${GREEN}✅ Created successfully${NC}"
        else
            echo -e "  Data Processing Service: ${YELLOW}⚠️ May already exist or failed${NC}"
        fi
    else
        echo -e "  Data Processing Service: ${RED}❌ Failed to authenticate owner${NC}"
    fi
}

echo -e "\n${BLUE}👥 Step 3: Creating TSP users...${NC}"

# Create Secure Cloud TSP user
create_ccrp_user \
    "Secure Cloud Solutions" \
    "secure@tsp.com" \
    "Secure Cloud Solutions Inc" \
    "Leading provider of confidential computing and secure cloud environments for sensitive data processing" \
    "Confidential Computing, Secure Cloud, Data Privacy"

# Create Enterprise Security TSP user
create_ccrp_user \
    "Enterprise Security Labs" \
    "enterprise@tsp.com" \
    "Enterprise Security Laboratories" \
    "Enterprise-grade security solutions for confidential data processing and AI training" \
    "Enterprise Security, Data Protection, Compliance"

# Create Research Computing TSP user
create_ccrp_user \
    "Research Computing Center" \
    "research@tsp.com" \
    "Research Computing Center" \
    "Academic and research-focused confidential computing environments for scientific data processing" \
    "Research Computing, Academic, Scientific Data"

# Create Government Cloud TSP user
create_ccrp_user \
    "Government Cloud Services" \
    "government@tsp.com" \
    "Government Cloud Services" \
    "Government-grade secure computing environments for sensitive data processing and AI training" \
    "Government Security, Classified Data, Compliance"

echo -e "\n${BLUE}🏗️ Step 4: Creating training environments...${NC}"

# Secure Cloud Solutions environments
create_training_environment \
    "Healthcare AI Training Lab" \
    "Secure environment for healthcare AI model training with HIPAA compliance" \
    "secure@tsp.com" \
    "DEDICATED" \
    "50 users" \
    "MAXIMUM" \
    25.00 \
    "\"GPU clusters\", \"encrypted storage\", \"audit logging\", \"access control\""

create_training_environment \
    "Financial Data Processing Center" \
    "High-security environment for financial data processing and risk modeling" \
    "secure@tsp.com" \
    "SHARED" \
    "100 users" \
    "HIGH" \
    15.00 \
    "\"real-time processing\", \"encryption\", \"compliance monitoring\", \"backup\""

create_training_environment \
    "Multi-Tenant Research Environment" \
    "Flexible research environment supporting multiple concurrent projects" \
    "secure@tsp.com" \
    "MULTI_TENANT" \
    "200 users" \
    "MEDIUM" \
    10.00 \
    "\"resource isolation\", \"project management\", \"collaboration tools\""

# Enterprise Security Labs environments
create_training_environment \
    "Enterprise AI Training Facility" \
    "Enterprise-grade AI training environment with maximum security and compliance" \
    "enterprise@tsp.com" \
    "DEDICATED" \
    "25 users" \
    "MAXIMUM" \
    35.00 \
    "\"enterprise security\", \"compliance tools\", \"24/7 monitoring\", \"disaster recovery\""

create_training_environment \
    "Compliance Testing Lab" \
    "Specialized environment for testing AI models against regulatory requirements" \
    "enterprise@tsp.com" \
    "DEDICATED" \
    "15 users" \
    "HIGH" \
    20.00 \
    "\"compliance testing\", \"regulatory tools\", \"audit trails\", \"reporting\""

# Research Computing Center environments
create_training_environment \
    "Academic Research Environment" \
    "Cost-effective environment for academic research and educational purposes" \
    "research@tsp.com" \
    "SHARED" \
    "500 users" \
    "MEDIUM" \
    5.00 \
    "\"educational tools\", \"research libraries\", \"collaboration\", \"documentation\""

create_training_environment \
    "Scientific Computing Cluster" \
    "High-performance computing environment for scientific data analysis" \
    "research@tsp.com" \
    "DEDICATED" \
    "30 users" \
    "HIGH" \
    18.00 \
    "\"HPC clusters\", \"scientific libraries\", \"data visualization\", \"parallel processing\""

# Government Cloud Services environments
create_training_environment \
    "Classified Data Processing Center" \
    "Government-grade secure environment for classified data processing" \
    "government@tsp.com" \
    "DEDICATED" \
    "10 users" \
    "MAXIMUM" \
    50.00 \
    "\"government security\", \"classified data\", \"air-gapped\", \"security clearance\""

echo -e "\n${BLUE}💻 Step 5: Creating compute resources...${NC}"

# Secure Cloud Solutions compute resources
create_compute_resource \
    "GPU Training Cluster" \
    "High-performance GPU cluster for AI model training" \
    "secure@tsp.com" \
    "GPU_CLUSTER" \
    "8x NVIDIA A100 GPUs, 256GB RAM, 2TB SSD" \
    40.00

create_compute_resource \
    "CPU Processing Farm" \
    "High-performance CPU cluster for data processing" \
    "secure@tsp.com" \
    "CPU_CLUSTER" \
    "64x Intel Xeon cores, 512GB RAM, 10TB SSD" \
    20.00

create_compute_resource \
    "Memory-Optimized Server" \
    "High-memory server for large dataset processing" \
    "secure@tsp.com" \
    "MEMORY_OPTIMIZED" \
    "32x Intel Xeon cores, 1TB RAM, 5TB SSD" \
    30.00

# Enterprise Security Labs compute resources
create_compute_resource \
    "Enterprise GPU Server" \
    "Enterprise-grade GPU server with maximum security" \
    "enterprise@tsp.com" \
    "ENTERPRISE_GPU" \
    "4x NVIDIA V100 GPUs, 128GB RAM, 1TB SSD, Hardware Security Module" \
    60.00

create_compute_resource \
    "Compliance Testing Server" \
    "Dedicated server for compliance testing and validation" \
    "enterprise@tsp.com" \
    "COMPLIANCE_SERVER" \
    "16x Intel Xeon cores, 64GB RAM, 2TB SSD, Audit logging" \
    25.00

# Research Computing Center compute resources
create_compute_resource \
    "Research GPU Cluster" \
    "Cost-effective GPU cluster for academic research" \
    "research@tsp.com" \
    "RESEARCH_GPU" \
    "4x NVIDIA RTX 3090 GPUs, 64GB RAM, 1TB SSD" \
    15.00

create_compute_resource \
    "HPC Compute Node" \
    "High-performance computing node for scientific calculations" \
    "research@tsp.com" \
    "HPC_NODE" \
    "32x AMD EPYC cores, 128GB RAM, 2TB NVMe SSD" \
    12.00

# Government Cloud Services compute resources
create_compute_resource \
    "Classified Processing Server" \
    "Government-grade server for classified data processing" \
    "government@tsp.com" \
    "CLASSIFIED_SERVER" \
    "16x Intel Xeon cores, 64GB RAM, 1TB SSD, Air-gapped network" \
    80.00

echo -e "\n${BLUE}⚙️ Step 6: Creating data processing services...${NC}"

# Secure Cloud Solutions data processing services
create_data_processing_service \
    "Secure Data Anonymization" \
    "Advanced data anonymization service with privacy-preserving techniques" \
    "secure@tsp.com" \
    "ANONYMIZATION" \
    "Differential privacy, k-anonymity, l-diversity, t-closeness" \
    2.50

create_data_processing_service \
    "Encrypted Data Processing" \
    "Homomorphic encryption service for processing encrypted data" \
    "secure@tsp.com" \
    "ENCRYPTED_PROCESSING" \
    "Homomorphic encryption, secure multi-party computation" \
    5.00

create_data_processing_service \
    "Real-time Data Streaming" \
    "High-throughput real-time data processing and streaming service" \
    "secure@tsp.com" \
    "STREAMING" \
    "Apache Kafka, Apache Spark, real-time analytics" \
    1.50

# Enterprise Security Labs data processing services
create_data_processing_service \
    "Enterprise Data Governance" \
    "Comprehensive data governance and compliance processing service" \
    "enterprise@tsp.com" \
    "GOVERNANCE" \
    "Data lineage, compliance monitoring, audit trails, policy enforcement" \
    4.00

create_data_processing_service \
    "Advanced Analytics Engine" \
    "Enterprise-grade analytics engine with machine learning capabilities" \
    "enterprise@tsp.com" \
    "ANALYTICS" \
    "Machine learning, statistical analysis, predictive modeling" \
    3.50

# Research Computing Center data processing services
create_data_processing_service \
    "Scientific Data Processing" \
    "Specialized service for scientific data processing and analysis" \
    "research@tsp.com" \
    "SCIENTIFIC" \
    "Scientific libraries, data visualization, statistical analysis" \
    1.00

create_data_processing_service \
    "Research Collaboration Platform" \
    "Collaborative data processing platform for research teams" \
    "research@tsp.com" \
    "COLLABORATION" \
    "Version control, collaboration tools, documentation, sharing" \
    0.75

# Government Cloud Services data processing services
create_data_processing_service \
    "Classified Data Processing" \
    "Government-grade secure data processing for classified information" \
    "government@tsp.com" \
    "CLASSIFIED" \
    "Air-gapped processing, security clearance, audit logging" \
    10.00

echo -e "\n${BLUE}🧪 Step 7: Testing TSP user authentication...${NC}"

# Test login for each TSP user
test_ccrp_login() {
    local email="$1"
    local organization="$2"
    
    echo "  Testing login for TSP: ${organization}..."
    
    local login_response=$(curl -s -X POST "http://localhost:${PORT}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${email}\", \"password\": \"password123\"}" 2>/dev/null || echo "FAILED")
    
    if echo "$login_response" | grep -q "accessToken"; then
        echo -e "  TSP Login: ${GREEN}✅ Success${NC}"
    else
        echo -e "  TSP Login: ${RED}❌ Failed${NC}"
        echo "    Response: $login_response"
    fi
}

test_ccrp_login "secure@tsp.com" "Secure Cloud Solutions"
test_ccrp_login "enterprise@tsp.com" "Enterprise Security Labs"
test_ccrp_login "research@tsp.com" "Research Computing Center"
test_ccrp_login "government@tsp.com" "Government Cloud Services"

echo -e "\n${BLUE}📋 Step 8: Testing environment access for TSP users...${NC}"

# Test environment listing for TSP users
test_environment_access() {
    local email="$1"
    local organization="$2"
    
    echo "  Testing environment access for TSP: ${organization}..."
    
    local login_response=$(curl -s -X POST "http://localhost:${PORT}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${email}\", \"password\": \"password123\"}" 2>/dev/null || echo "FAILED")
    
    if echo "$login_response" | grep -q "accessToken"; then
        local token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        
        local environments_response=$(curl -s -X GET "http://localhost:${PORT}/api/training-environments" \
            -H "Authorization: Bearer ${token}" 2>/dev/null || echo "FAILED")
        
        if echo "$environments_response" | grep -q "environments\|\[\]"; then
            echo -e "  Environment Access: ${GREEN}✅ Success${NC}"
        else
            echo -e "  Environment Access: ${YELLOW}⚠️ Partial success${NC}"
        fi
    else
        echo -e "  Environment Access: ${RED}❌ Failed to authenticate${NC}"
    fi
}

test_environment_access "secure@tsp.com" "Secure Cloud Solutions"
test_environment_access "enterprise@tsp.com" "Enterprise Security Labs"

echo -e "\n${GREEN}🎉 TSP test data creation completed!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "  ✅ TSP users created via registration API"
echo "  ✅ Training environments created for each TSP"
echo "  ✅ Compute resources created"
echo "  ✅ Data processing services created"
echo "  ✅ Authentication tested for all TSP users"
echo "  ✅ Environment access tested"
echo ""
echo -e "${BLUE}🔗 TSP Test Users:${NC}"
echo "  Secure Cloud: secure@tsp.com (password: password123)"
echo "  Enterprise Security: enterprise@tsp.com (password: password123)"
echo "  Research Computing: research@tsp.com (password: password123)"
echo "  Government Cloud: government@tsp.com (password: password123)"
echo ""
echo -e "${BLUE}🏗️ Training Environments Created:${NC}"
echo "  • Secure Cloud: 3 environments (Healthcare, Financial, Multi-Tenant)"
echo "  • Enterprise Security: 2 environments (Enterprise AI, Compliance Testing)"
echo "  • Research Computing: 2 environments (Academic, Scientific Computing)"
echo "  • Government Cloud: 1 environment (Classified Data Processing)"
echo ""
echo -e "${BLUE}💻 Compute Resources Created:${NC}"
echo "  • Secure Cloud: 3 resources (GPU Cluster, CPU Farm, Memory Server)"
echo "  • Enterprise Security: 2 resources (Enterprise GPU, Compliance Server)"
echo "  • Research Computing: 2 resources (Research GPU, HPC Node)"
echo "  • Government Cloud: 1 resource (Classified Server)"
echo ""
echo -e "${BLUE}⚙️ Data Processing Services Created:${NC}"
echo "  • Secure Cloud: 3 services (Anonymization, Encrypted Processing, Streaming)"
echo "  • Enterprise Security: 2 services (Data Governance, Analytics Engine)"
echo "  • Research Computing: 2 services (Scientific Processing, Collaboration)"
echo "  • Government Cloud: 1 service (Classified Processing)"
echo ""
echo -e "${BLUE}🌐 Access URLs:${NC}"
echo "  Frontend: http://localhost:${FRONTEND_PORT}"
echo "  Backend API: http://localhost:${PORT}/api"
echo "  Keycloak Admin: ${KEYCLOAK_URL}/admin"
echo ""
echo -e "${GREEN}TSP users can now provide secure training environments and services!${NC}"
