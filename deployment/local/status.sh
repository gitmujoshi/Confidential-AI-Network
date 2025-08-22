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
    
    # Special handling for Keycloak (Docker container)
    if [ "$name" = "Keycloak IAM" ]; then
        if command -v docker &> /dev/null && docker ps | grep -q "keycloak-cms"; then
            echo -e "${GREEN}✅ RUNNING${NC}"
        else
            echo -e "${RED}❌ NOT RUNNING${NC}"
        fi
    else
        # Check if process is running
        if pgrep -f "$process_name" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ RUNNING${NC}"
        else
            echo -e "${RED}❌ NOT RUNNING${NC}"
        fi
    fi
    
    echo "  URL: $url"
    echo "  Port: $port"
    echo ""
}

# Function to check Docker container status
check_docker_container() {
    local name=$1
    local container_name=$2
    local url=$3
    local port=$4
    local description=$5
    
    echo -n "$name: "
    if command -v docker &> /dev/null && docker ps | grep -q "$container_name"; then
        echo -e "${GREEN}✅ RUNNING${NC}"
        echo "  Container: $container_name"
        echo "  URL: $url"
        echo "  Port: $port"
        if [ -n "$description" ]; then
            echo "  Description: $description"
        fi
    else
        echo -e "${RED}❌ NOT RUNNING${NC}"
        echo "  Container: $container_name"
        echo "  URL: $url"
        echo "  Port: $port"
    fi
    echo ""
}

# Check each service
check_service "Keycloak IAM" "http://localhost:8080" "8080" "keycloak"
check_service "Backend API" "http://localhost:5001/health" "5001" "node server.js"
check_service "Frontend" "http://localhost:3000" "3000" "react-scripts"

# Check PostgreSQL Databases
echo "🗄️  PostgreSQL Databases:"
echo "=========================="
check_docker_container "Main App Database" "postgres-app" "postgresql://localhost:5432/contract_management" "5432" "Main application database"
check_docker_container "Keycloak Database" "postgres-keycloak" "postgresql://localhost:5433/keycloak" "5433" "Keycloak IAM database"
check_docker_container "SCITT CCF Database" "scitt-ccf-postgres-dev" "postgresql://localhost:5434/scitt_ccf_dev" "5434" "SCITT CCF ledger database"

# Check SCITT CCF Services (Blockchain/Ledger)
echo "⛓️  SCITT CCF Blockchain Services:"
echo "===================================="
check_docker_container "SCITT CCF Node" "scitt-ccf-node-dev" "http://localhost:8000" "8000" "Main blockchain/ledger node"
check_docker_container "SCITT CCF Dashboard" "scitt-ccf-dashboard-dev" "http://localhost:8082" "8082" "Blockchain monitoring dashboard"
check_docker_container "SCITT CCF Monitor" "scitt-ccf-monitor-dev" "N/A" "N/A" "Blockchain monitoring service"
check_docker_container "SCITT CCF Redis" "scitt-ccf-redis-dev" "redis://localhost:6379" "6379" "Blockchain cache and session store"

# Note: Hardhat and Ganache are not needed as SCITT CCF provides blockchain functionality

# Check Docker containers
echo "🐳 Docker Container Status:"
echo "==========================="
if command -v docker &> /dev/null; then
    if docker ps | grep -q "keycloak-cms"; then
        echo -e "  ${GREEN}✅ Keycloak container running${NC}"
    else
        echo -e "  ${RED}❌ Keycloak container not running${NC}"
    fi
    
    # Check PostgreSQL containers
    if docker ps | grep -q "postgres-app"; then
        echo -e "  ${GREEN}✅ Main PostgreSQL container running${NC}"
    else
        echo -e "  ${RED}❌ Main PostgreSQL container not running${NC}"
    fi
    
    if docker ps | grep -q "postgres-keycloak"; then
        echo -e "  ${GREEN}✅ Keycloak PostgreSQL container running${NC}"
    else
        echo -e "  ${RED}❌ Keycloak PostgreSQL container not running${NC}"
    fi
    
    if docker ps | grep -q "scitt-ccf-postgres-dev"; then
        echo -e "  ${GREEN}✅ SCITT CCF PostgreSQL container running${NC}"
    else
        echo -e "  ${RED}❌ SCITT CCF PostgreSQL container not running${NC}"
    fi
    
    # Check SCITT CCF containers
    if docker ps | grep -q "scitt-ccf-node-dev"; then
        echo -e "  ${GREEN}✅ SCITT CCF Node container running${NC}"
    else
        echo -e "  ${RED}❌ SCITT CCF Node container not running${NC}"
    fi
    
    if docker ps | grep -q "scitt-ccf-dashboard-dev"; then
        echo -e "  ${GREEN}✅ SCITT CCF Dashboard container running${NC}"
    else
        echo -e "  ${RED}❌ SCITT CCF Dashboard container not running${NC}"
    fi
else
    echo -e "  ${YELLOW}⚠️  Docker not installed${NC}"
fi

echo ""
echo "📝 PID Files:"
if [ -f "../../.keycloak.pid" ]; then
    echo -e "  ${GREEN}✅ .keycloak.pid${NC}"
else
    echo -e "  ${RED}❌ .keycloak.pid${NC}"
fi

if [ -f "../../.hardhat.pid" ]; then
    echo -e "  ${GREEN}✅ .hardhat.pid${NC}"
else
    echo -e "  ${RED}❌ .hardhat.pid${NC}"
fi

if [ -f "../../.backend.pid" ]; then
    echo -e "  ${GREEN}✅ .backend.pid${NC}"
else
    echo -e "  ${RED}❌ .backend.pid${NC}"
fi

if [ -f "../../.frontend.pid" ]; then
    echo -e "  ${GREEN}✅ .frontend.pid${NC}"
else
    echo -e "  ${RED}❌ .frontend.pid${NC}"
fi

echo ""
echo "🔗 Quick Access:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:5001/api"
echo "  Keycloak Admin: http://localhost:8080 (admin/admin123)"
echo "  SCITT CCF Node: http://localhost:8000 (Blockchain/Ledger)"
echo "  SCITT CCF Dashboard: http://localhost:8082 (Blockchain Monitoring)"
echo ""
echo "🗄️  Database Connections:"
echo "  Main App DB: postgresql://postgres:postgres@localhost:5432/contract_management"
echo "  Keycloak DB: postgresql://keycloak:keycloak@localhost:5433/keycloak"
echo "  SCITT CCF DB: postgresql://scitt_user:scitt_pass@localhost:5434/scitt_ccf_dev"
echo "  Redis Cache: redis://localhost:6379"
echo ""
echo "📋 Commands:"
echo "  Start all: ./start-services.sh"
echo "  Stop all:  ./stop-services.sh"
echo "  Status:    ./status.sh" 