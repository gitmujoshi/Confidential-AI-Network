#!/bin/bash

# Memory Cleanup Script
# Helps resolve memory issues by cleaning up Node.js processes and cache

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🧹 Memory Cleanup Script${NC}"
echo ""

# Function to check if a process is running
is_process_running() {
    pgrep -f "$1" > /dev/null
}

# Stop any running Node.js processes
echo -e "${BLUE}🛑 Stopping Node.js processes...${NC}"

# Stop frontend
if is_process_running "react-scripts start"; then
    echo "  • Stopping React development server..."
    pkill -f "react-scripts start" || true
fi

# Stop backend
if is_process_running "node.*server.js"; then
    echo "  • Stopping backend server..."
    pkill -f "node.*server.js" || true
fi

# Stop any other Node.js processes
if is_process_running "node"; then
    echo "  • Stopping other Node.js processes..."
    pkill -f "node" || true
fi

echo -e "${GREEN}✅ Node.js processes stopped${NC}"
echo ""

# Clean npm cache
echo -e "${BLUE}🗑️  Cleaning npm cache...${NC}"
npm cache clean --force
echo -e "${GREEN}✅ npm cache cleaned${NC}"
echo ""

# Clean frontend build cache
if [ -d "frontend/build" ]; then
    echo -e "${BLUE}🗑️  Removing frontend build directory...${NC}"
    rm -rf frontend/build
    echo -e "${GREEN}✅ Frontend build directory removed${NC}"
    echo ""
fi

# Clean node_modules if requested
if [ "$1" = "--clean-deps" ]; then
    echo -e "${BLUE}🗑️  Removing node_modules directories...${NC}"
    
    if [ -d "frontend/node_modules" ]; then
        echo "  • Removing frontend/node_modules..."
        rm -rf frontend/node_modules
    fi
    
    if [ -d "backend/node_modules" ]; then
        echo "  • Removing backend/node_modules..."
        rm -rf backend/node_modules
    fi
    
    echo -e "${GREEN}✅ node_modules directories removed${NC}"
    echo -e "${YELLOW}⚠️  You'll need to run 'npm ci' in frontend and backend directories${NC}"
    echo ""
fi

# Clear system cache (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${BLUE}🗑️  Clearing system cache...${NC}"
    sudo purge
    echo -e "${GREEN}✅ System cache cleared${NC}"
    echo ""
fi

# Show memory usage
echo -e "${BLUE}📊 Current Memory Usage:${NC}"
if command -v free >/dev/null 2>&1; then
    free -h
elif command -v vm_stat >/dev/null 2>&1; then
    vm_stat | head -10
fi

echo ""
echo -e "${GREEN}✅ Memory cleanup completed!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. To start frontend: ./deployment/local/start-frontend.sh"
echo "  2. To start backend: ./deployment/local/start-backend.sh"
echo "  3. To start both: ./deployment/local/start-servers.sh"
echo "" 