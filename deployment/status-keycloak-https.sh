#!/bin/bash

# Keycloak HTTPS Status Script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📊 Keycloak HTTPS Status${NC}"
echo "=============================="

# Check Docker services
echo -e "${BLUE}🐳 Docker Services:${NC}"
if docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(***REMOVED-DB_PASSWORD***-***REMOVED-KEYCLOAK_DB_PASSWORD***|***REMOVED-KEYCLOAK_DB_PASSWORD***)" >/dev/null; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(***REMOVED-DB_PASSWORD***-***REMOVED-KEYCLOAK_DB_PASSWORD***|***REMOVED-KEYCLOAK_DB_PASSWORD***)"
else
    echo -e "${RED}❌ No Keycloak services running${NC}"
fi

# Check ports
echo -e "\n${BLUE}🔌 Port Status:${NC}"
for port in 5433 8443; do
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

echo -e "\n${BLUE}🔗 Quick Access:${NC}"
echo "  Keycloak Admin: https://localhost:8443/admin (admin/***REMOVED-KEYCLOAK_ADMIN_PASSWORD***)"
echo "  Keycloak Health: https://localhost:8443/health"

echo -e "\n${BLUE}📋 Commands:${NC}"
echo "  Start: ./deployment/start-***REMOVED-KEYCLOAK_DB_PASSWORD***-https.sh"
echo "  Stop: ./deployment/stop-***REMOVED-KEYCLOAK_DB_PASSWORD***-https.sh"
echo "  Status: ./deployment/status-***REMOVED-KEYCLOAK_DB_PASSWORD***-https.sh"
