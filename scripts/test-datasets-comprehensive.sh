#!/bin/bash

# Comprehensive Dataset Testing Script
# Tests all dataset-related functionality

set -e

# Load centralized configuration
# Load centralized configuration
source scripts/load-config.sh    echo -e "${BLUE}✅ Loading centralized configuration from config.env${NC}"
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

echo -e "${BLUE}📊 Comprehensive Dataset Testing${NC}"
echo "=================================="
echo "Testing all dataset-related functionality"
echo ""

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test dataset functionality
test_dataset_function() {
    local test_name="$1"
    local test_command="$2"
    
    ((TOTAL_TESTS++))
    echo -e "\n${BLUE}🧪 ${test_name}${NC}"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅ PASSED${NC}"
        ((PASSED_TESTS++))
        return 0
    else
        echo -e "  ${RED}❌ FAILED${NC}"
        ((FAILED_TESTS++))
        return 1
    fi
}

echo -e "${BLUE}🔍 Testing Dataset API Endpoints${NC}"

# Test dataset API availability
test_dataset_function "Dataset API Available" "curl -s '/api/datasets' | grep -q 'datasets'"
test_dataset_function "Dataset Search API" "curl -s '/api/datasets/search' | grep -q 'search'"
test_dataset_function "Dataset Categories API" "curl -s '/api/datasets/categories' | grep -q 'categories'"

echo -e "\n${BLUE}🔍 Testing Dataset CRUD Operations${NC}"

# Test dataset creation (without auth for now)
test_dataset_function "Dataset Creation Endpoint" "curl -s -X POST '/api/datasets' \
    -H 'Content-Type: application/json' \
    -d '{\"name\": \"Test Dataset\", \"description\": \"Test dataset\", \"category\": \"Test\"}' \
    | grep -q 'error'"

# Test dataset listing
test_dataset_function "Dataset Listing" "curl -s '/api/datasets' | grep -q 'datasets'"

# Test dataset filtering
test_dataset_function "Dataset Filtering by Category" "curl -s '/api/datasets?category=Healthcare' | grep -q 'datasets'"

# Test dataset search
test_dataset_function "Dataset Search Functionality" "curl -s '/api/datasets/search?q=medical' | grep -q 'datasets'"

echo -e "\n${BLUE}🔍 Testing Dataset Metadata${NC}"

# Test dataset metadata endpoints
test_dataset_function "Dataset Metadata API" "curl -s '/api/datasets/metadata' | grep -q 'metadata'"
test_dataset_function "Dataset Statistics API" "curl -s '/api/datasets/statistics' | grep -q 'statistics'"

echo -e "\n${BLUE}🔍 Testing Dataset Access Control${NC}"

# Test dataset access permissions
test_dataset_function "Dataset Access Control" "curl -s '/api/datasets/access' | grep -q 'access'"
test_dataset_function "Dataset Privacy Settings" "curl -s '/api/datasets/privacy' | grep -q 'privacy'"

echo -e "\n${BLUE}🔍 Testing Dataset Quality Metrics${NC}"

# Test dataset quality endpoints
test_dataset_function "Dataset Quality API" "curl -s '/api/datasets/quality' | grep -q 'quality'"
test_dataset_function "Dataset Validation API" "curl -s '/api/datasets/validate' | grep -q 'validate'"

echo -e "\n${BLUE}🔍 Testing Dataset Compliance${NC}"

# Test dataset compliance endpoints
test_dataset_function "Dataset Compliance API" "curl -s '/api/datasets/compliance' | grep -q 'compliance'"
test_dataset_function "Dataset Audit API" "curl -s '/api/datasets/audit' | grep -q 'audit'"

echo -e "\n${BLUE}🔍 Testing Dataset Performance${NC}"

# Test dataset performance
test_dataset_function "Dataset API Response Time" "timeout 2s curl -s '/api/datasets' > /dev/null"
test_dataset_function "Dataset Search Performance" "timeout 2s curl -s '/api/datasets/search?q=test' > /dev/null"

echo -e "\n${BLUE}🔍 Testing Dataset Error Handling${NC}"

# Test error handling
test_dataset_function "Invalid Dataset ID Handling" "curl -s '/api/datasets/invalid-id' | grep -q 'error'"
test_dataset_function "Invalid Search Parameters" "curl -s '/api/datasets/search?invalid=param' | grep -q 'error'"

echo -e "\n${GREEN}🎉 Comprehensive Dataset Testing Completed!${NC}"
echo ""
echo -e "${BLUE}📊 Dataset Test Results:${NC}"
echo "  Total Tests: $TOTAL_TESTS"
echo "  Passed: ${GREEN}$PASSED_TESTS${NC}"
echo "  Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✅ All dataset tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some dataset tests failed.${NC}"
    exit 1
fi
