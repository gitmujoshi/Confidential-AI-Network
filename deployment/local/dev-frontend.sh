#!/bin/bash

# Frontend Development Setup Script
# Installs frontend node_modules and starts development server

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🎨 Frontend Development Setup${NC}"
echo ""

# Check if frontend node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${BLUE}Installing frontend dependencies...${NC}"
    ./scripts/manage-node-modules.sh install frontend
    echo ""
else
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
    echo ""
fi

# Check if backend is running
if ! pgrep -f "node.*server.js" > /dev/null; then
    echo -e "${YELLOW}⚠️  Backend is not running. You may need to start it:${NC}"
    echo "  ./start-services.sh"
    echo ""
fi

# Start frontend development server
echo -e "${BLUE}Starting frontend development server...${NC}"
cd frontend

# Set higher memory limit for Node.js
export NODE_OPTIONS="--max-old-space-size=2048"

# Start with error handling
echo -e "${BLUE}Using Node.js with 2GB memory allocation${NC}"
npm start 