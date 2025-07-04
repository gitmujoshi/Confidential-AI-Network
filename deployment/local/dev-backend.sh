#!/bin/bash

# Backend Development Setup Script
# Installs backend node_modules and starts development server

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔧 Backend Development Setup${NC}"
echo ""

# Check if backend node_modules exists
if [ ! -d "backend/node_modules" ]; then
    echo -e "${BLUE}Installing backend dependencies...${NC}"
    ./scripts/manage-node-modules.sh install backend
    echo ""
else
    echo -e "${GREEN}✅ Backend dependencies already installed${NC}"
    echo ""
fi

# Check if database is configured
if [ ! -f "backend/config.env" ]; then
    echo -e "${YELLOW}⚠️  Backend config not found. You may need to:${NC}"
    echo "  cp env.example backend/config.env"
    echo "  Update database configuration"
    echo ""
fi

# Start backend development server
echo -e "${BLUE}Starting backend development server...${NC}"
cd backend
npm run dev 