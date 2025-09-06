#!/bin/bash

# Local Services Stop Script
# This script stops all local services using centralized configuration

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🛑 Stopping All Local Services${NC}"
echo "=============================================="

# Load centralized configuration
if [ -f "config/system.env" ]; then
    echo -e "${GREEN}✅ Loading centralized configuration from config/system.env${NC}"
    source config/system.env
else
    echo -e "${RED}❌ Centralized configuration file not found: config/system.env${NC}"
    echo -e "${YELLOW}⚠️ Using default values${NC}"
    BACKEND_PORT=5001
    FRONTEND_PORT=3000
    KEYCLOAK_URL=https://localhost:8443
    SCITT_CCF_URL=http://localhost:8000
fi

# Check if we're in the right directory
if [ ! -f "docker-compose.keycloak-dev.yml" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory${NC}"
    exit 1
fi

# Step 1: Stop Frontend
echo -e "${BLUE}🎨 Step 1: Stopping Frontend...${NC}"
if [ -f "frontend.pid" ] && ps -p $(cat frontend.pid) > /dev/null 2>&1; then
    echo -e "${YELLOW}   Stopping frontend (PID: $(cat frontend.pid))${NC}"
    kill $(cat frontend.pid) 2>/dev/null || true
    rm -f frontend.pid frontend.port
    echo -e "${GREEN}✅ Frontend stopped${NC}"
else
    echo -e "${YELLOW}   Frontend not running${NC}"
fi

# Step 2: Stop Backend
echo -e "${BLUE}🔧 Step 2: Stopping Backend...${NC}"
if [ -f "backend.pid" ] && ps -p $(cat backend.pid) > /dev/null 2>&1; then
    echo -e "${YELLOW}   Stopping backend (PID: $(cat backend.pid))${NC}"
    kill $(cat backend.pid) 2>/dev/null || true
    rm -f backend.pid
    echo -e "${GREEN}✅ Backend stopped${NC}"
else
    echo -e "${YELLOW}   Backend not running${NC}"
fi

# Step 3: Stop SCITT CCF services
echo -e "${BLUE}⛓️ Step 3: Stopping SCITT CCF services...${NC}"
docker-compose -f docker-compose.scitt-ccf-dev.yml down 2>/dev/null || true
echo -e "${GREEN}✅ SCITT CCF services stopped${NC}"

# Step 4: Stop Keycloak and Database
echo -e "${BLUE}🔐 Step 4: Stopping Keycloak and Database...${NC}"
docker-compose -f docker-compose.keycloak-dev.yml down 2>/dev/null || true
echo -e "${GREEN}✅ Keycloak and Database stopped${NC}"

# Step 5: Clean up any remaining processes
echo -e "${BLUE}🧹 Step 5: Cleaning up remaining processes...${NC}"
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "npm.*start" 2>/dev/null || true
echo -e "${GREEN}✅ Cleanup completed${NC}"

# Step 6: Free up ports (if needed)
echo -e "${BLUE}🔌 Step 6: Checking ports...${NC}"
for port in ${FRONTEND_PORT:-3000} ${BACKEND_PORT:-5001} 5433 8000 8082 8443; do
    if lsof -i :$port >/dev/null 2>&1; then
        echo -e "${YELLOW}   Port $port still in use${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    fi
done

echo -e "\n${GREEN}✅ All local services stopped successfully!${NC}"
echo "=============================================="
echo -e "${BLUE}📋 Management Commands:${NC}"
echo "Start: ./deployment/local/start-services.sh"
echo "Status: ./manage-scitt-ccf.sh status"
echo "Config: ./scripts/config-loader.js"
echo ""
echo -e "${YELLOW}⚠️  Using centralized configuration from config/system.env${NC}" 