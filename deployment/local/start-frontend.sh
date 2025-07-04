#!/bin/bash

# Frontend Startup Script with Memory Optimization
# Handles memory issues and provides better error reporting

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🎨 Starting Frontend with Memory Optimization${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    echo -e "${RED}❌ Error: frontend/package.json not found${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Check if frontend node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Frontend dependencies not found. Installing...${NC}"
    cd frontend
    npm ci
    cd ..
    echo ""
fi

# Set memory optimization
export NODE_OPTIONS="--max-old-space-size=2048"
export GENERATE_SOURCEMAP=false

echo -e "${BLUE}📊 Memory Configuration:${NC}"
echo "  • Node.js heap size: 2GB"
echo "  • Source maps: Disabled (faster startup)"
echo ""

# Check available system memory
if command -v free >/dev/null 2>&1; then
    AVAILABLE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    echo -e "${BLUE}💾 Available system memory: ${AVAILABLE_MEM}MB${NC}"
    
    if [ "$AVAILABLE_MEM" -lt 2048 ]; then
        echo -e "${YELLOW}⚠️  Warning: Low system memory detected${NC}"
        echo "  Consider closing other applications or reducing memory allocation"
        echo ""
    fi
fi

# Start frontend with error handling
echo -e "${BLUE}🚀 Starting React development server...${NC}"
echo "  • Port: 3000 (default)"
echo "  • Proxy: http://localhost:5000 (backend)"
echo ""

cd frontend

# Trap to handle cleanup on exit
trap 'echo -e "\n${YELLOW}🛑 Frontend stopped${NC}"; exit 0' INT TERM

# Start the development server
npm start 