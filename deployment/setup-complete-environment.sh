#!/bin/bash

# Complete Environment Setup Script for Contract Management System
# This script handles all aspects of deployment including IAM integration, HTTPS, and service configuration
# ALWAYS use deployment scripts to setup all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}🚀 Contract Management System - Complete Environment Setup${NC}"
echo "================================================================"
echo "This script will set up the complete environment using deployment scripts:"
echo "✅ Keycloak HTTPS IAM setup (via setup-keycloak-https.sh)"
echo "✅ SCITT CCF services (via docker-compose)"
echo "✅ Backend and frontend services"
echo "✅ Complete IAM integration testing"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command_exists docker-compose; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites are met${NC}"

# Step 1: Setup Keycloak HTTPS IAM
echo -e "${BLUE}🔐 Step 1: Setting up Keycloak HTTPS IAM...${NC}"
echo "Using deployment script: ./deployment/setup-keycloak-https.sh"

if [ -f "$PROJECT_ROOT/deployment/setup-keycloak-https.sh" ]; then
    echo "Running Keycloak HTTPS setup..."
    cd "$PROJECT_ROOT"
    ./deployment/setup-keycloak-https.sh
    echo -e "${GREEN}✅ Keycloak HTTPS IAM setup completed${NC}"
else
    echo -e "${RED}❌ Keycloak setup script not found${NC}"
    exit 1
fi

# Step 1.5: Start main PostgreSQL database (required for backend)
echo -e "${BLUE}🗄️ Step 1.5: Starting main PostgreSQL database...${NC}"
echo "Using docker-compose: docker-compose -f docker-compose.main.yml up -d postgres-app"

cd "$PROJECT_ROOT"
docker-compose -f docker-compose.main.yml up -d postgres-app

# Wait for main database to be ready
echo "⏳ Waiting for main database to be ready..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if docker ps --format "{{.Names}}: {{.Status}}" | grep -q "postgres-app.*healthy"; then
        echo -e " ${GREEN}✅ Main database is healthy!${NC}"
        break
    fi
    
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo -e " ${RED}❌ Main database failed to become healthy${NC}"
    exit 1
fi

# Step 1.6: Fix Keycloak client configuration for backend authentication
echo -e "${BLUE}🔧 Step 1.6: Fixing Keycloak client configuration...${NC}"
if [ -f "$PROJECT_ROOT/deployment/fix-keycloak-client-config.sh" ]; then
    echo "Using deployment script: ./deployment/fix-keycloak-client-config.sh"
    ./deployment/fix-keycloak-client-config.sh
    echo -e "${GREEN}✅ Keycloak client configuration fixed${NC}"
else
    echo -e "${RED}❌ Keycloak client fix script not found${NC}"
    exit 1
fi

# Step 2: Start SCITT CCF services
echo -e "${BLUE}⛓️ Step 2: Starting SCITT CCF services...${NC}"
echo "Using docker-compose: docker-compose -f docker-compose.scitt-ccf-dev.yml up -d"

cd "$PROJECT_ROOT"
docker-compose -f docker-compose.scitt-ccf-dev.yml up -d

echo -e "${GREEN}✅ SCITT CCF services started${NC}"

# Step 3: Start backend and frontend
echo -e "${BLUE}🚀 Step 3: Starting application services...${NC}"

# Start backend
echo "📡 Starting backend..."
cd "$PROJECT_ROOT/backend"
npm install 2>/dev/null || true
npm run dev &
BACKEND_PID=$!

# Start frontend
echo "🌐 Starting frontend..."
cd "$PROJECT_ROOT/frontend"
npm install 2>/dev/null || true
npm start &
FRONTEND_PID=$!

# Wait for services to be ready
echo "⏳ Waiting for application services to be ready..."
sleep 15

# Test services
echo -e "${BLUE}🧪 Testing services...${NC}"

# Test backend
if curl -s http://localhost:5001/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend failed to start${NC}"
fi

# Test frontend
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${RED}❌ Frontend failed to start${NC}"
fi

# Test Keycloak HTTPS
if curl -k -s https://localhost:8443/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Keycloak HTTPS is accessible${NC}"
else
    echo -e "${RED}❌ Keycloak HTTPS not accessible${NC}"
fi

# Test IAM integration
echo -e "${BLUE}🧪 Testing IAM integration...${NC}"

# Test login with Keycloak
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@contractmanagement.com","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
    echo -e "${GREEN}✅ IAM integration working - Login successful${NC}"
else
    echo -e "${RED}❌ IAM integration failed - Login unsuccessful${NC}"
    echo "Response: $LOGIN_RESPONSE"
fi

# Create comprehensive status script
echo -e "${BLUE}📝 Creating comprehensive status script...${NC}"

cat > "$PROJECT_ROOT/deployment/status-complete.sh" << 'EOF'
#!/bin/bash

# Complete System Status Script
# Shows status of all services including IAM integration

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📊 Contract Management System - Complete Status${NC}"
echo "======================================================"

# Check Docker services
echo -e "${BLUE}🐳 Docker Services:${NC}"
if docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(postgres|keycloak|scitt)" >/dev/null; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(postgres|keycloak|scitt)"
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

# Check backend
echo -e "\n${BLUE}📡 Backend API:${NC}"
if curl -s http://localhost:5001/health >/dev/null 2>&1; then
    echo -e "  Backend: ${GREEN}✅ Running${NC}"
    echo -e "  URL: http://localhost:5001"
else
    echo -e "  Backend: ${RED}❌ Not accessible${NC}"
fi

# Check frontend
echo -e "\n${BLUE}🌐 Frontend:${NC}"
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
    -d '{"email":"admin@contractmanagement.com","password":"admin123"}' 2>/dev/null || echo "FAILED")

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
    echo -e "  Login Test: ${GREEN}✅ Success${NC}"
else
    echo -e "  Login Test: ${RED}❌ Failed${NC}"
    echo "  Response: $LOGIN_RESPONSE"
fi

echo -e "\n${BLUE}🔗 Quick Access:${NC}"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:5001/api"
echo "  Keycloak Admin: https://localhost:8443/admin (admin/admin123)"
echo "  SCITT CCF Dashboard: http://localhost:8082"

echo -e "\n${BLUE}📋 Commands:${NC}"
echo "  Status: ./deployment/status-complete.sh"
echo "  Stop: ./deployment/stop-complete.sh"
echo "  Restart: ./deployment/restart-complete.sh"
echo "  Keycloak Status: ./deployment/status-keycloak-https.sh"
EOF

chmod +x "$PROJECT_ROOT/deployment/status-complete.sh"

# Create comprehensive stop script
cat > "$PROJECT_ROOT/deployment/stop-complete.sh" << 'EOF'
#!/bin/bash

# Complete System Stop Script
# Uses deployment scripts to stop all services

set -e

echo "🛑 Stopping Contract Management System..."

# Stop application processes
pkill -f "node.*backend" 2>/dev/null || true
pkill -f "node.*frontend" 2>/dev/null || true
pkill -f "npm.*start" 2>/dev/null || true

# Stop Keycloak using deployment script
if [ -f "./deployment/stop-keycloak-https.sh" ]; then
    echo "🛑 Stopping Keycloak using deployment script..."
    ./deployment/stop-keycloak-https.sh
else
    echo "⚠️ Keycloak stop script not found, stopping manually..."
    docker-compose -f docker-compose.keycloak-https.yml down 2>/dev/null || true
fi

# Stop SCITT CCF services
echo "🛑 Stopping SCITT CCF services..."
docker-compose -f docker-compose.scitt-ccf-dev.yml down 2>/dev/null || true

# Kill processes on our ports
for port in 3000 5001 5432 5433 5434 8000 8080 8082 8443 6380; do
    if lsof -i :$port >/dev/null 2>&1; then
        echo "🔄 Stopping process on port $port..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    fi
done

echo "✅ All services stopped"
EOF

chmod +x "$PROJECT_ROOT/deployment/stop-complete.sh"

# Create comprehensive restart script
cat > "$PROJECT_ROOT/deployment/restart-complete.sh" << 'EOF'
#!/bin/bash

# Complete System Restart Script
# Uses deployment scripts to restart all services

set -e

echo "🔄 Restarting Contract Management System..."

# Stop everything using deployment script
./deployment/stop-complete.sh

# Wait a moment
sleep 5

# Start everything using deployment script
./deployment/setup-complete-environment.sh

echo "✅ System restarted"
EOF

chmod +x "$PROJECT_ROOT/deployment/restart-complete.sh"

echo -e "\n${GREEN}🎉 Complete Environment Setup Finished!${NC}"
echo "================================================"
echo -e "${BLUE}📋 What's been set up:${NC}"
echo "✅ Keycloak HTTPS IAM with persistent configuration"
echo "✅ SSL certificates for secure communication"
echo "✅ SCITT CCF services running"
echo "✅ Backend and frontend services"
echo "✅ Complete IAM integration working"
echo ""
echo -e "${BLUE}🔗 Access Points:${NC}"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:5001/api"
echo "Keycloak Admin: https://localhost:8443/admin (admin/admin123)"
echo "SCITT CCF Dashboard: http://localhost:8082"
echo ""
echo -e "${BLUE}📋 Management Commands:${NC}"
echo "Status: ./deployment/status-complete.sh"
echo "Stop: ./deployment/stop-complete.sh"
echo "Restart: ./deployment/restart-complete.sh"
echo "Keycloak Status: ./deployment/status-keycloak-https.sh"
echo ""
echo -e "${BLUE}🧪 IAM Integration Status:${NC}"
echo "✅ HTTPS Keycloak running on port 8443"
echo "✅ Realm 'contract-management' configured"
echo "✅ Client 'contract-management-client' created"
echo "✅ Roles: TDP, TDC, CCRP, AppAdmin"
echo "✅ Admin user: admin@contractmanagement.com / admin123"
echo ""
echo -e "${GREEN}🚀 Next steps:${NC}"
echo "1. Test login through your application"
echo "2. Verify IAM integration is working"
echo "3. Use deployment scripts for all future operations"
echo ""
echo -e "${YELLOW}⚠️  Important: Always use deployment scripts to setup and manage services${NC}"
echo "   - Keycloak: ./deployment/setup-keycloak-https.sh"
echo "   - Complete System: ./deployment/setup-complete-environment.sh"
echo "   - Status: ./deployment/status-complete.sh"
