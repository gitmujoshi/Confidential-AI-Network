#!/bin/bash

# Local Services Start Script
# This script starts local services using centralized configuration

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Local Services using Centralized Configuration${NC}"
echo "=============================================================="

# Load centralized configuration
if [ -f "config.env" ]; then
    echo -e "${GREEN}✅ Loading centralized configuration from config.env${NC}"
    source config.env
else
    echo -e "${RED}❌ Centralized configuration file not found: config.env${NC}"
    echo -e "${YELLOW}⚠️ Please ensure config.env exists${NC}"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "docker-compose.keycloak-dev.yml" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory${NC}"
    exit 1
fi

# Step 1: Start Keycloak with persistent storage
echo -e "${BLUE}🔐 Step 1: Starting Keycloak with persistent storage...${NC}"
echo -e "${BLUE}   Using: ${KEYCLOAK_URL} (realm: ${KEYCLOAK_REALM})${NC}"
docker-compose -f docker-compose.keycloak-dev.yml up -d

# Wait for Keycloak to be ready
echo -e "${BLUE}⏳ Waiting for Keycloak to be ready...${NC}"
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -k -s "${KEYCLOAK_URL}/health" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Keycloak is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo -e "${RED}❌ Keycloak failed to start within $((max_attempts * 2)) seconds${NC}"
    exit 1
fi

# Step 2: Start SCITT CCF services
echo -e "${BLUE}⛓️ Step 2: Starting SCITT CCF services...${NC}"
docker-compose -f docker-compose.scitt-ccf-dev.yml up -d

# Wait for SCITT CCF services to be ready
echo -e "${BLUE}⏳ Waiting for SCITT CCF services to be ready...${NC}"
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -s "${SCITT_CCF_URL}/app/health" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ SCITT CCF Node is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo -e "${YELLOW}⚠️ SCITT CCF Node not ready, but continuing...${NC}"
fi

# Check service status
echo -e "${BLUE}📊 Checking service status...${NC}"

# Check Keycloak
if curl -k -s "${KEYCLOAK_URL}/health" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Keycloak is running at ${KEYCLOAK_URL}${NC}"
else
    echo -e "${RED}❌ Keycloak not accessible at ${KEYCLOAK_URL}${NC}"
fi

# Check SCITT CCF
if curl -s "${SCITT_CCF_URL}/app/health" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ SCITT CCF Node is running at ${SCITT_CCF_URL}${NC}"
else
    echo -e "${RED}❌ SCITT CCF Node not accessible at ${SCITT_CCF_URL}${NC}"
fi

# Check SCITT CCF Dashboard
if curl -s "http://localhost:8082" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ SCITT CCF Dashboard is running${NC}"
else
    echo -e "${RED}❌ SCITT CCF Dashboard not accessible${NC}"
fi

# Check Database
if docker exec postgres-cms pg_isready -U keycloak >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL Database is running${NC}"
else
    echo -e "${RED}❌ PostgreSQL Database not accessible${NC}"
fi

# Step 3: Start Backend
echo -e "${BLUE}🔧 Step 3: Starting Backend...${NC}"
echo -e "${BLUE}   Using port: ${BACKEND_PORT:-5001}${NC}"

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Backend directory not found${NC}"
    exit 1
fi

# Check if backend port is available
if lsof -Pi :${BACKEND_PORT:-5001} -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port ${BACKEND_PORT:-5001} is already in use${NC}"
    echo -e "${YELLOW}   Backend might already be running${NC}"
else
    # Start backend in background
    cd backend
    echo -e "${BLUE}📁 Starting backend from: $(pwd)${NC}"
    
    # Start the server and capture the PID
    npm start > ../backend.log 2>&1 &
    BACKEND_PID=$!
    
    # Save PID to file for later cleanup
    echo $BACKEND_PID > ../backend.pid
    
    cd ..
    
    echo -e "${GREEN}✅ Backend started with PID: $BACKEND_PID${NC}"
    
    # Wait for backend to be ready
    echo -e "${BLUE}⏳ Waiting for backend to be ready...${NC}"
    max_attempts=30
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:${BACKEND_PORT:-5001}/health" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend is ready!${NC}"
            break
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        echo -e "${YELLOW}⚠️ Backend not ready, but continuing...${NC}"
        echo -e "${YELLOW}   Check backend.log for details${NC}"
    fi
fi

# Step 4: Start Frontend
echo -e "${BLUE}🎨 Step 4: Starting Frontend...${NC}"
echo -e "${BLUE}   Using port: ${FRONTEND_PORT:-3000}${NC}"

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo -e "${YELLOW}⚠️ Frontend directory not found, skipping frontend startup${NC}"
else
    # Check if frontend port is available
    frontend_port=${FRONTEND_PORT:-3000}
    if lsof -Pi :$frontend_port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $frontend_port is already in use${NC}"
        echo -e "${YELLOW}   Frontend might already be running${NC}"
    else
        # Start frontend in background
        cd frontend
        echo -e "${BLUE}📁 Starting frontend from: $(pwd)${NC}"
        
        # Set port and start the server
        PORT=$frontend_port npm start > ../frontend.log 2>&1 &
        FRONTEND_PID=$!
        
        # Save PID to file for later cleanup
        echo $FRONTEND_PID > ../frontend.pid
        echo $frontend_port > ../frontend.port
        
        cd ..
        
        echo -e "${GREEN}✅ Frontend started with PID: $FRONTEND_PID on port $frontend_port${NC}"
        
        # Wait for frontend to be ready
        echo -e "${BLUE}⏳ Waiting for frontend to be ready...${NC}"
        max_attempts=30
        attempt=1
        while [ $attempt -le $max_attempts ]; do
            if curl -s "http://localhost:$frontend_port" >/dev/null 2>&1; then
                echo -e "${GREEN}✅ Frontend is ready!${NC}"
                break
            fi
            echo -n "."
            sleep 2
            attempt=$((attempt + 1))
        done
        
        if [ $attempt -gt $max_attempts ]; then
            echo -e "${YELLOW}⚠️ Frontend not ready, but continuing...${NC}"
            echo -e "${YELLOW}   Check frontend.log for details${NC}"
        fi
    fi
fi

# Final Status Check
echo -e "\n${BLUE}📊 Final Service Status:${NC}"

# Check Backend
if [ -f "backend.pid" ] && ps -p $(cat backend.pid) > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend: Running (PID: $(cat backend.pid))${NC}"
    if curl -s "http://localhost:${BACKEND_PORT:-5001}/health" >/dev/null 2>&1; then
        echo -e "   🌐 Health: http://localhost:${BACKEND_PORT:-5001}/health"
    else
        echo -e "   ⚠️  Health check failed"
    fi
else
    echo -e "${RED}❌ Backend: Not running${NC}"
fi

# Check Frontend
if [ -f "frontend.pid" ] && ps -p $(cat frontend.pid) > /dev/null 2>&1; then
    port=$(cat frontend.port 2>/dev/null || echo "3000")
    echo -e "${GREEN}✅ Frontend: Running (PID: $(cat frontend.pid)) on port $port${NC}"
    if curl -s "http://localhost:$port" >/dev/null 2>&1; then
        echo -e "   🌐 URL: http://localhost:$port"
    else
        echo -e "   ⚠️  Frontend not responding"
    fi
else
    echo -e "${RED}❌ Frontend: Not running${NC}"
fi

echo -e "\n${GREEN}🎉 All services started successfully!${NC}"
echo "=============================================================="
echo -e "${BLUE}🔗 Service URLs (from centralized config):${NC}"
echo "Frontend: http://localhost:${FRONTEND_PORT:-3000}"
echo "Backend: http://localhost:${BACKEND_PORT:-5001}"
echo "Keycloak Admin: ${KEYCLOAK_URL}/admin (${KEYCLOAK_ADMIN_USER}/${KEYCLOAK_ADMIN_PASSWORD})"
echo "SCITT CCF Node: ${SCITT_CCF_URL}"
echo "SCITT CCF Dashboard: http://localhost:8082"
echo "Database: localhost:${DB_PORT} (${DB_NAME})"
echo ""
echo -e "${BLUE}📋 Management Commands:${NC}"
echo "Status: ./manage-scitt-ccf.sh status"
echo "Stop: ./stop-system.sh"
echo "Fix Auth: ./scripts/fix-auth-unified.sh"
echo "Config: ./scripts/config-loader.js"
echo "Logs: tail -f backend.log frontend.log"
echo ""
echo -e "${YELLOW}⚠️  Using centralized configuration from config/system.env${NC}" 
