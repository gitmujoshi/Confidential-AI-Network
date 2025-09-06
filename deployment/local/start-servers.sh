#!/bin/bash

# Start All Servers Script
# This script starts all development servers for the Contract Management System
# Now uses centralized configuration from config/system.env

echo "🚀 Starting Contract Management servers using centralized configuration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load centralized configuration
if [ -f "config/system.env" ]; then
    echo -e "${GREEN}✅ Loading centralized configuration from config/system.env${NC}"
    source config/system.env
else
    echo -e "${RED}❌ Centralized configuration file not found: config/system.env${NC}"
    echo -e "${YELLOW}⚠️ Please ensure config/system.env exists${NC}"
    exit 1
fi

# Function to check if a port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1  # Port is in use
    else
        return 0  # Port is free
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${BLUE}⏳ Waiting for $service_name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready!${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service_name failed to start within $((max_attempts * 2)) seconds${NC}"
    return 1
}

# Function to start backend
start_backend() {
    echo -e "${BLUE}🔧 Starting backend server...${NC}"
    
    # Check if backend directory exists
    if [ ! -d "backend" ]; then
        echo -e "${RED}❌ Backend directory not found${NC}"
        return 1
    fi
    
    # Check if backend port is available
    if ! check_port ${BACKEND_PORT:-5001}; then
        echo -e "${YELLOW}⚠️  Port ${BACKEND_PORT:-5001} is already in use${NC}"
        return 1
    fi
    
    # Start backend in background
    cd backend
    echo -e "${BLUE}📁 Starting from: $(pwd)${NC}"
    
    # Start the server and capture the PID
    npm start > ../backend.log 2>&1 &
    BACKEND_PID=$!
    
    # Save PID to file for later cleanup
    echo $BACKEND_PID > ../backend.pid
    
    cd ..
    
    echo -e "${GREEN}✅ Backend started with PID: $BACKEND_PID${NC}"
    
    # Wait for backend to be ready
    if wait_for_service "http://localhost:${BACKEND_PORT:-5001}/health" "Backend"; then
        return 0
    else
        echo -e "${RED}❌ Backend failed to start properly${NC}"
        return 1
    fi
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE}🎨 Starting frontend server...${NC}"
    
    # Check if frontend directory exists
    if [ ! -d "frontend" ]; then
        echo -e "${RED}❌ Frontend directory not found${NC}"
        return 1
    fi
    
    # Check if frontend port is available, if not try alternative
    local frontend_port=${FRONTEND_PORT:-3000}
    if ! check_port $frontend_port; then
        echo -e "${YELLOW}⚠️  Port $frontend_port is in use, trying port 3001...${NC}"
        frontend_port=3001
        if ! check_port 3001; then
            echo -e "${RED}❌ Both ports $frontend_port and 3001 are in use${NC}"
            return 1
        fi
    fi
    
    # Start frontend in background
    cd frontend
    echo -e "${BLUE}📁 Starting from: $(pwd)${NC}"
    
    # Set port and start the server
    PORT=$frontend_port npm start > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    # Save PID to file for later cleanup
    echo $FRONTEND_PID > ../frontend.pid
    echo $frontend_port > ../frontend.port
    
    cd ..
    
    echo -e "${GREEN}✅ Frontend started with PID: $FRONTEND_PID on port $frontend_port${NC}"
    
    # Wait for frontend to be ready
    if wait_for_service "http://localhost:$frontend_port" "Frontend"; then
        return 0
    else
        echo -e "${RED}❌ Frontend failed to start properly${NC}"
        return 1
    fi
}

# Function to start blockchain
start_blockchain() {
    echo -e "${BLUE}⛓️  Starting blockchain service...${NC}"
    if [ ! -d "blockchain" ]; then
        echo -e "${YELLOW}ℹ️  Blockchain directory not found, skipping blockchain startup${NC}"
        return 0
    fi
    if ! check_port 8545; then
        echo -e "${YELLOW}⚠️  Port 8545 is already in use (blockchain)${NC}"
        return 1
    fi
    cd blockchain
    echo -e "${BLUE}📁 Starting from: $(pwd)${NC}"
    if [ -f package.json ]; then
        npm start > ../blockchain.log 2>&1 &
        BLOCKCHAIN_PID=$!
        echo $BLOCKCHAIN_PID > ../blockchain.pid
        cd ..
        echo -e "${GREEN}✅ Blockchain started with PID: $BLOCKCHAIN_PID${NC}"
        # Wait for blockchain to be ready (simple port check)
        if wait_for_service "http://localhost:8545" "Blockchain"; then
            return 0
        else
            echo -e "${RED}❌ Blockchain failed to start properly${NC}"
            return 1
        fi
    else
        cd ..
        echo -e "${YELLOW}ℹ️  No package.json in blockchain directory, skipping blockchain startup${NC}"
        return 0
    fi
}

# Function to start Keycloak (via docker-compose)
start_***REMOVED-KEYCLOAK_DB_PASSWORD***() {
    echo -e "${BLUE}🗝️  Starting Keycloak (IAM) service...${NC}"
    if [ ! -f "docker-compose.iam.yml" ]; then
        echo -e "${YELLOW}ℹ️  docker-compose.iam.yml not found, skipping Keycloak startup${NC}"
        return 0
    fi
    docker-compose -f docker-compose.iam.yml up -d ***REMOVED-KEYCLOAK_DB_PASSWORD***
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Keycloak started via Docker Compose${NC}"
        # Wait for Keycloak to be ready (port 8080)
        if wait_for_service "${KEYCLOAK_URL:-https://localhost:8443}/realms/master" "Keycloak"; then
            return 0
        else
            echo -e "${RED}❌ Keycloak failed to start properly${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Failed to start Keycloak via Docker Compose${NC}"
        return 1
    fi
}

# Function to show status
show_status() {
    echo -e "\n${BLUE}📊 Service Status:${NC}"
    
    # Check backend
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
    
    # Check frontend
    if [ -f "frontend.pid" ] && ps -p $(cat frontend.pid) > /dev/null 2>&1; then
        local port=$(cat frontend.port 2>/dev/null || echo "3000")
        echo -e "${GREEN}✅ Frontend: Running (PID: $(cat frontend.pid)) on port $port${NC}"
        if curl -s "http://localhost:$port" >/dev/null 2>&1; then
            echo -e "   🌐 URL: http://localhost:$port"
        else
            echo -e "   ⚠️  Frontend not responding"
        fi
    else
        echo -e "${RED}❌ Frontend: Not running${NC}"
    fi
}

# Function to show logs
show_logs() {
    echo -e "\n${BLUE}📋 Recent logs:${NC}"
    
    if [ -f "backend.log" ]; then
        echo -e "${YELLOW}Backend logs (last 5 lines):${NC}"
        tail -5 backend.log
    fi
    
    if [ -f "frontend.log" ]; then
        echo -e "${YELLOW}Frontend logs (last 5 lines):${NC}"
        tail -5 frontend.log
    fi
}

# Main execution
main() {
    echo -e "${BLUE}🔍 Checking current directory...${NC}"
    echo "Current directory: $(pwd)"
    
    # Check if we're in the right directory
    if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        echo -e "${RED}❌ Please run this script from the ContractManagement root directory${NC}"
        exit 1
    fi
    
    # Clean up any existing PID files
    rm -f backend.pid frontend.pid frontend.port blockchain.pid blockchain.log
    
    # Start blockchain if requested or by default
    if [[ "$WITH_BLOCKCHAIN" == "1" ]]; then
        start_blockchain
    fi
    # Start Keycloak if requested or by default
    if [[ "$WITH_KEYCLOAK" == "1" ]]; then
        start_***REMOVED-KEYCLOAK_DB_PASSWORD***
    fi
    
    # Start backend first
    if start_backend; then
        echo -e "${GREEN}🎉 Backend started successfully!${NC}"
    else
        echo -e "${RED}💥 Failed to start backend${NC}"
        exit 1
    fi
    
    # Wait a moment for backend to fully initialize
    sleep 3
    
    # Start frontend
    if start_frontend; then
        echo -e "${GREEN}🎉 Frontend started successfully!${NC}"
    else
        echo -e "${RED}💥 Failed to start frontend${NC}"
        echo -e "${YELLOW}⚠️  Backend is still running. You can stop it with: kill \$(cat backend.pid)${NC}"
        exit 1
    fi
    
    # Show final status
    show_status
    
    echo -e "\n${GREEN}🎉 All services started successfully!${NC}"
    echo -e "${BLUE}📝 Useful commands:${NC}"
    echo -e "   View logs: tail -f backend.log"
    echo -e "   View logs: tail -f frontend.log"
    echo -e "   View logs: tail -f blockchain.log"
    echo -e "   Stop all: ./stop-servers.sh"
    echo -e "   Status: ./start-servers.sh --status"
    echo -e "   Logs: ./start-servers.sh --logs"
}

# Parse options
WITH_BLOCKCHAIN=0
WITH_KEYCLOAK=0
for arg in "$@"; do
    case $arg in
        --with-blockchain)
            WITH_BLOCKCHAIN=1
            ;;
        --with-***REMOVED-KEYCLOAK_DB_PASSWORD***)
            WITH_KEYCLOAK=1
            ;;
        --status)
            show_status
            exit 0
            ;;
        --logs)
            show_logs
            exit 0
            ;;
        --help|-h)
            echo "Usage: $0 [OPTION]"
            echo "Options:"
            echo "  --with-blockchain   Start blockchain service"
            echo "  --with-***REMOVED-KEYCLOAK_DB_PASSWORD***     Start Keycloak (IAM) service"
            echo "  --status           Show service status"
            echo "  --logs             Show recent logs"
            echo "  --help, -h         Show this help message"
            echo ""
            echo "Without options, starts backend and frontend only"
            exit 0
            ;;
    esac
done
main 