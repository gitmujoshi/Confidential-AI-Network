#!/bin/bash

# Local Services Status Script
# This script shows status of local services using centralized configuration

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📊 Contract Management System - Local Status${NC}"
echo "=================================================="

# Function to validate required environment variables
validate_required_vars() {
    local missing_vars=()
    
    for var in "$@"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo -e "${RED}❌ ERROR: Required environment variables are missing:${NC}"
        for var in "${missing_vars[@]}"; do
            echo -e "  - $var"
        done
        echo -e "${YELLOW}💡 Make sure config.env is properly configured and sourced${NC}"
        exit 1
    fi
}

# Load centralized configuration
if [ -f "config.env" ]; then
    echo -e "${GREEN}✅ Loading centralized configuration from config.env${NC}"
    source config.env
else
    echo -e "${RED}❌ Centralized configuration file not found: config.env${NC}"
    exit 1
fi

# Validate required environment variables
validate_required_vars "BACKEND_PORT" "FRONTEND_PORT" "KEYCLOAK_URL" "KEYCLOAK_REALM" "DB_PORT"

# Load secrets (if available)
if [ -f "secrets.env" ]; then
    echo -e "${GREEN}✅ Loading secrets from secrets.env${NC}"
    source secrets.env
fi

# Check if we're in the right directory
if [ ! -f "docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-dev.yml" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory${NC}"
    exit 1
fi

# Check Docker services
echo -e "${BLUE}🐳 Docker Services:${NC}"
if docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(***REMOVED-DB_PASSWORD***|***REMOVED-KEYCLOAK_DB_PASSWORD***|scitt)" >/dev/null; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(***REMOVED-DB_PASSWORD***|***REMOVED-KEYCLOAK_DB_PASSWORD***|scitt)"
else
    echo -e "${RED}❌ No Docker services running${NC}"
fi

# Check ports (using centralized config)
echo -e "\n${BLUE}🔌 Port Status (from centralized config):${NC}"
for port in ${FRONTEND_PORT} ${BACKEND_PORT} ${DB_PORT} 8000 8082 8443; do
    if lsof -i :$port >/dev/null 2>&1; then
        echo -e "  Port $port: ${GREEN}✅ In Use${NC}"
    else
        echo -e "  Port $port: ${RED}❌ Available${NC}"
    fi
done

# Check HTTPS Keycloak (using centralized config)
echo -e "\n${BLUE}🔐 Keycloak IAM (from centralized config):${NC}"
if curl -k -s "${KEYCLOAK_URL}/realms/master" >/dev/null 2>&1; then
    echo -e "  Keycloak: ${GREEN}✅ Running${NC}"
    echo -e "  URL: ${KEYCLOAK_URL}"
    echo -e "  Admin Console: ${KEYCLOAK_URL}/admin"
    echo -e "  Realm: ${KEYCLOAK_REALM}"
else
    echo -e "  Keycloak: ${RED}❌ Not accessible${NC}"
    echo -e "  Expected URL: ${KEYCLOAK_URL}"
fi

# Check SCITT CCF services (using centralized config)
echo -e "\n${BLUE}⛓️ SCITT CCF Services (from centralized config):${NC}"
if curl -s "${SCITT_CCF_URL}/app/health" >/dev/null 2>&1; then
    echo -e "  SCITT CCF Node: ${GREEN}✅ Running${NC}"
    echo -e "  URL: ${SCITT_CCF_URL}"
else
    echo -e "  SCITT CCF Node: ${RED}❌ Not accessible${NC}"
    echo -e "  Expected URL: ${SCITT_CCF_URL}"
fi

if curl -s "${SCITT_CCF_DASHBOARD_URL}" >/dev/null 2>&1; then
    echo -e "  SCITT CCF Dashboard: ${GREEN}✅ Running${NC}"
    echo -e "  URL: ${SCITT_CCF_DASHBOARD_URL}"
else
    echo -e "  SCITT CCF Dashboard: ${RED}❌ Not accessible${NC}"
fi

# Check application services (using centralized config)
echo -e "\n${BLUE}🚀 Application Services (from centralized config):${NC}"
if curl -s "http://localhost:${BACKEND_PORT}/health" >/dev/null 2>&1; then
    echo -e "  Backend: ${GREEN}✅ Running${NC}"
    echo -e "  URL: http://localhost:${BACKEND_PORT}"
else
    echo -e "  Backend: ${RED}❌ Not accessible${NC}"
    echo -e "  Expected URL: http://localhost:${BACKEND_PORT}"
fi

if curl -s "http://localhost:${FRONTEND_PORT}" >/dev/null 2>&1; then
    echo -e "  Frontend: ${GREEN}✅ Running${NC}"
    echo -e "  URL: http://localhost:${FRONTEND_PORT}"
else
    echo -e "  Frontend: ${RED}❌ Not accessible${NC}"
    echo -e "  Expected URL: http://localhost:${FRONTEND_PORT}"
fi

# Test IAM integration (using centralized config)
echo -e "\n${BLUE}🧪 IAM Integration Test (using centralized config):${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:${BACKEND_PORT}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@contractmanagement.com","password":"***REMOVED-KEYCLOAK_ADMIN_PASSWORD***"}' 2>/dev/null || echo "FAILED")

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
    echo -e "  Login Test: ${GREEN}✅ Success${NC}"
else
    echo -e "  Login Test: ${RED}❌ Failed${NC}"
    echo "  Response: $LOGIN_RESPONSE"
fi

# Check running processes (improved detection)
echo -e "\n${BLUE}📁 Service Process Status:${NC}"

# Check backend process
BACKEND_PID=$(ps aux | grep -E "node.*server\.js" | grep -v grep | awk '{print $2}' | head -1)
if [ -n "$BACKEND_PID" ]; then
    echo -e "  Backend Process: ${GREEN}✅ Running (PID: $BACKEND_PID)${NC}"
else
    echo -e "  Backend Process: ${RED}❌ Not running${NC}"
fi

# Check frontend process
FRONTEND_PID=$(ps aux | grep -E "npm.*start|react-scripts" | grep -v grep | awk '{print $2}' | head -1)
if [ -n "$FRONTEND_PID" ]; then
    echo -e "  Frontend Process: ${GREEN}✅ Running (PID: $FRONTEND_PID)${NC}"
else
    echo -e "  Frontend Process: ${RED}❌ Not running${NC}"
fi

echo -e "\n${BLUE}🔗 Quick Access (from centralized config):${NC}"
echo "  Frontend: http://localhost:${FRONTEND_PORT}"
echo "  Backend API: http://localhost:${BACKEND_PORT}/api"
echo "  Keycloak Admin: ${KEYCLOAK_URL}/admin (${KEYCLOAK_ADMIN_USER}/${KEYCLOAK_ADMIN_PASSWORD})"
echo "  SCITT CCF Node: ${SCITT_CCF_URL}"
echo "  SCITT CCF Dashboard: ${SCITT_CCF_DASHBOARD_URL}"
echo "  Database: localhost:${DB_PORT}"

echo -e "\n${BLUE}📋 Commands:${NC}"
echo "  Start: ./scripts/script-manager.sh system start"
echo "  Stop: ./scripts/script-manager.sh system stop"
echo "  Status: ./scripts/script-manager.sh system status"
echo "  Config: ./scripts/config-loader.js"

echo -e "\n${YELLOW}⚠️  Using centralized configuration from config.env${NC}" 