#!/bin/bash

# Comprehensive Deployment Status Script
# Shows status of all services and deployment scripts

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📊 Contract Management System - Deployment Status${NC}"
echo "========================================================"

# Check if we're in the right directory
if [ ! -f "docker-compose.scitt-ccf-dev.yml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check deployment scripts availability
echo -e "${BLUE}📋 Deployment Scripts Status:${NC}"
scripts=(
    "setup-***REMOVED-KEYCLOAK_DB_PASSWORD***-https.sh:Keycloak HTTPS Setup"
    "fix-***REMOVED-KEYCLOAK_DB_PASSWORD***-client-config.sh:Keycloak Client Fix"
    "setup-complete-environment.sh:Complete Environment Setup"
    "start-***REMOVED-KEYCLOAK_DB_PASSWORD***-https.sh:Start Keycloak"
    "stop-***REMOVED-KEYCLOAK_DB_PASSWORD***-https.sh:Stop Keycloak"
    "status-***REMOVED-KEYCLOAK_DB_PASSWORD***-https.sh:Keycloak Status"
    "local/start-services.sh:Start Local Services"
    "local/stop-services.sh:Stop Local Services"
    "local/status.sh:Local Services Status"
)

for script in "${scripts[@]}"; do
    IFS=':' read -r filename description <<< "$script"
    if [ -f "./deployment/$filename" ]; then
        if [ -x "./deployment/$filename" ]; then
            echo -e "  ${GREEN}✅${NC} $description ($filename)"
        else
            echo -e "  ${YELLOW}⚠️${NC} $description ($filename) - Not executable"
        fi
    else
        echo -e "  ${RED}❌${NC} $description ($filename) - Missing"
    fi
done

# Check Docker services
echo -e "\n${BLUE}🐳 Docker Services:${NC}"
if docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(***REMOVED-DB_PASSWORD***|***REMOVED-KEYCLOAK_DB_PASSWORD***|scitt)" >/dev/null; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(***REMOVED-DB_PASSWORD***|***REMOVED-KEYCLOAK_DB_PASSWORD***|scitt)"
else
    echo -e "${RED}❌ No Docker services running${NC}"
fi

# Check ports
echo -e "\n${BLUE}🔌 Port Status:${NC}"
for port in 3000 5001 5432 5433 5434 8000 8080 8082 8443 6380; do
    if lsof -i :$port >/dev/null 2>&1; then
        echo -e "  Port $port: ${GREEN}✅ In Use${NC}"
    else
        echo -e "  Port $port: ${RED}❌ Available${NC}"
    fi
done

# Check HTTPS Keycloak
echo -e "\n${BLUE}🔐 Keycloak IAM (HTTPS):${NC}"
if curl -k -s https://localhost:8443/health >/dev/null 2>&1; then
    echo -e "  Keycloak HTTPS: ${GREEN}✅ Running${NC}"
    echo -e "  URL: https://localhost:8443"
    echo -e "  Admin Console: https://localhost:8443/admin"
else
    echo -e "  Keycloak HTTPS: ${RED}❌ Not accessible${NC}"
fi

# Check SCITT CCF services
echo -e "\n${BLUE}⛓️ SCITT CCF Services:${NC}"
if curl -s http://localhost:8000/app/health >/dev/null 2>&1; then
    echo -e "  SCITT CCF Node: ${GREEN}✅ Running${NC}"
    echo -e "  URL: http://localhost:8000"
else
    echo -e "  SCITT CCF Node: ${RED}❌ Not accessible${NC}"
fi

if curl -s http://localhost:8082 >/dev/null 2>&1; then
    echo -e "  SCITT CCF Dashboard: ${GREEN}✅ Running${NC}"
    echo -e "  URL: http://localhost:8082"
else
    echo -e "  SCITT CCF Dashboard: ${RED}❌ Not accessible${NC}"
fi

# Check application services
echo -e "\n${BLUE}🚀 Application Services:${NC}"
if curl -s http://localhost:5001/health >/dev/null 2>&1; then
    echo -e "  Backend: ${GREEN}✅ Running${NC}"
    echo -e "  URL: http://localhost:5001"
else
    echo -e "  Backend: ${RED}❌ Not accessible${NC}"
fi

if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo -e "  Frontend: ${GREEN}✅ Running${NC}"
    echo -e "  URL: http://localhost:3000"
else
    echo -e "  Frontend: ${RED}❌ Not accessible${NC}"
fi

# Test IAM integration
echo -e "\n${BLUE}🧪 IAM Integration Test:${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"backend-test@contractmanagement.com","password":"test123"}' 2>/dev/null || echo "FAILED")

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
    echo -e "  Login Test: ${GREEN}✅ Success${NC}"
elif echo "$LOGIN_RESPONSE" | grep -q "FAILED"; then
    echo -e "  Login Test: ${RED}❌ Backend not accessible${NC}"
else
    echo -e "  Login Test: ${RED}❌ Failed${NC}"
    echo "  Response: $LOGIN_RESPONSE"
fi

# Check environment configuration
echo -e "\n${BLUE}⚙️ Environment Configuration:${NC}"
if [ -f "config.env" ]; then
    echo -e "  config.env: ${GREEN}✅ Exists${NC}"
    
    # Check key configurations
    if grep -q "KEYCLOAK_ENABLED=true" config.env; then
        echo -e "  Keycloak Enabled: ${GREEN}✅ Yes${NC}"
    else
        echo -e "  Keycloak Enabled: ${RED}❌ No${NC}"
    fi
    
    if grep -q "KEYCLOAK_URL=https://localhost:8443" config.env; then
        echo -e "  Keycloak HTTPS: ${GREEN}✅ Yes${NC}"
    else
        echo -e "  Keycloak HTTPS: ${RED}❌ No${NC}"
    fi
    
    if grep -q "KEYCLOAK_CLIENT_SECRET=" config.env && ! grep -q "KEYCLOAK_CLIENT_SECRET=$" config.env; then
        echo -e "  Client Secret: ${GREEN}✅ Configured${NC}"
    else
        echo -e "  Client Secret: ${RED}❌ Missing${NC}"
    fi
else
    echo -e "  config.env: ${RED}❌ Missing${NC}"
fi

echo -e "\n${BLUE}🔗 Quick Access:${NC}"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:5001/api"
echo "  Keycloak Admin: https://localhost:8443/admin (admin/***REMOVED-KEYCLOAK_ADMIN_PASSWORD***)"
echo "  SCITT CCF Node: http://localhost:8000"
echo "  SCITT CCF Dashboard: http://localhost:8082"

echo -e "\n${BLUE}📋 Deployment Commands:${NC}"
echo "  Complete Setup: ./deployment/setup-complete-environment.sh"
echo "  Keycloak Setup: ./deployment/setup-***REMOVED-KEYCLOAK_DB_PASSWORD***-https.sh"
echo "  Fix Keycloak Client: ./deployment/fix-***REMOVED-KEYCLOAK_DB_PASSWORD***-client-config.sh"
echo "  Start Services: ./deployment/local/start-services.sh"
echo "  Stop Services: ./deployment/local/stop-services.sh"
echo "  Status: ./deployment/deployment-status.sh"

echo -e "\n${BLUE}🔧 Troubleshooting Commands:${NC}"
echo "  Keycloak Status: ./deployment/status-***REMOVED-KEYCLOAK_DB_PASSWORD***-https.sh"
echo "  Local Status: ./deployment/local/status.sh"
echo "  Fix IAM Issues: ./deployment/fix-***REMOVED-KEYCLOAK_DB_PASSWORD***-client-config.sh"

echo -e "\n${YELLOW}⚠️  Remember: Always use deployment scripts to manage services${NC}"
echo "   - Complete Setup: ./deployment/setup-complete-environment.sh"
echo "   - Individual Services: ./deployment/[service-name]/[action].sh"
