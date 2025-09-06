#!/bin/bash

# Update all test scripts to use centralized configuration
# This ensures all test suites use the same environment configuration as services

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔄 Updating test scripts to use centralized configuration${NC}"
echo "=============================================================="

# List of test scripts to update
test_scripts=(
    "test-integration-quick.sh"
    "test-integration-full.sh"
    "test-tdp-user.sh"
    "test-tdc-user.sh"
    "test-ccrp-user.sh"
    "test-admin-user.sh"
    "test-user-roles-all.sh"
    "test-datasets-comprehensive.sh"
)

# Function to update a test script
update_test_script() {
    local script="$1"
    local script_path="scripts/$script"
    
    if [ ! -f "$script_path" ]; then
        echo -e "${YELLOW}⚠️ Script not found: $script_path${NC}"
        return 1
    fi
    
    echo -e "${BLUE}📝 Updating $script${NC}"
    
    # Update configuration loading
    sed -i.bak 's/# Load centralized configuration/# Load centralized configuration/' "$script_path"
    sed -i.bak '/if \[ -f "config\.env" \]; then/,/fi/c\
# Load centralized configuration\
source scripts/load-config.sh' "$script_path"
    
    # Update URLs to use environment variables
    sed -i.bak "s|http://localhost:\${PORT}|${BACKEND_URL}|g" "$script_path"
    sed -i.bak "s|http://localhost:\${FRONTEND_PORT}|${FRONTEND_URL}|g" "$script_path"
    sed -i.bak "s|https://localhost:\${KEYCLOAK_PORT}|${KEYCLOAK_URL}|g" "$script_path"
    sed -i.bak "s|${SCITT_CCF_URL:-http://localhost:8000}|${SCITT_CCF_URL}|g" "$script_path"
    sed -i.bak "s|${SCITT_CCF_DASHBOARD_URL:-http://localhost:8082}|${SCITT_CCF_DASHBOARD_URL}|g" "$script_path"
    
    # Remove backup files
    rm -f "${script_path}.bak"
    
    echo -e "${GREEN}✅ Updated $script${NC}"
}

# Load configuration first
source scripts/load-config.sh

# Update each test script
for script in "${test_scripts[@]}"; do
    update_test_script "$script"
done

echo -e "\n${GREEN}🎉 All test scripts updated successfully!${NC}"
echo -e "${BLUE}📋 Updated scripts now use:${NC}"
echo "  - Centralized configuration loading (config.env + secrets.env)"
echo "  - Environment variables for all URLs and ports"
echo "  - Consistent configuration across all test suites"
echo ""
echo -e "${YELLOW}💡 Test your updated scripts with:${NC}"
echo "  ./scripts/script-manager.sh test integration --quick"
echo "  ./scripts/script-manager.sh test users --tdp"
