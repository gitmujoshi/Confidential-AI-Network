#!/bin/bash

# Contract Management System - Status Check Script

echo "📊 Contract Management System Status"
echo "====================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to check service status
check_service() {
    local name=$1
    local url=$2
    local port=$3
    local process_name=$4
    
    echo -n "$name: "
    
    # Check if process is running
    if pgrep -f "$process_name" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ RUNNING${NC}"
    else
        echo -e "${RED}❌ NOT RUNNING${NC}"
    fi
    
    echo "  URL: $url"
    echo "  Port: $port"
    echo ""
}

# Check each service
check_service "Keycloak IAM" "http://localhost:8080" "8080" "***REMOVED-KEYCLOAK_DB_PASSWORD***"
check_service "Blockchain (Hardhat)" "http://127.0.0.1:8545" "8545" "hardhat"
check_service "Backend API" "http://localhost:5001/health" "5001" "node server.js"
check_service "Frontend" "http://localhost:3000" "3000" "react-scripts"

# Check Docker containers
echo "🐳 Docker Containers:"
if command -v docker &> /dev/null; then
    if docker ps | grep -q "***REMOVED-KEYCLOAK_DB_PASSWORD***-cms"; then
        echo -e "  ${GREEN}✅ Keycloak container running${NC}"
    else
        echo -e "  ${RED}❌ Keycloak container not running${NC}"
    fi
else
    echo -e "  ${YELLOW}⚠️  Docker not installed${NC}"
fi

echo ""
echo "📝 PID Files:"
if [ -f ".***REMOVED-KEYCLOAK_DB_PASSWORD***.pid" ]; then
    echo -e "  ${GREEN}✅ .***REMOVED-KEYCLOAK_DB_PASSWORD***.pid${NC}"
else
    echo -e "  ${RED}❌ .***REMOVED-KEYCLOAK_DB_PASSWORD***.pid${NC}"
fi

if [ -f ".hardhat.pid" ]; then
    echo -e "  ${GREEN}✅ .hardhat.pid${NC}"
else
    echo -e "  ${RED}❌ .hardhat.pid${NC}"
fi

if [ -f ".backend.pid" ]; then
    echo -e "  ${GREEN}✅ .backend.pid${NC}"
else
    echo -e "  ${RED}❌ .backend.pid${NC}"
fi

if [ -f ".frontend.pid" ]; then
    echo -e "  ${GREEN}✅ .frontend.pid${NC}"
else
    echo -e "  ${RED}❌ .frontend.pid${NC}"
fi

echo ""
echo "🔗 Quick Access:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:5001/api"
echo "  Keycloak Admin: http://localhost:8080 (admin/***REMOVED-KEYCLOAK_ADMIN_PASSWORD***)"
echo "  Blockchain: http://127.0.0.1:8545"
echo ""
echo "📋 Commands:"
echo "  Start all: ./start-services.sh"
echo "  Stop all:  ./stop-services.sh"
echo "  Status:    ./status.sh" 