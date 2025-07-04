#!/bin/bash

# Contract Management System - Emergency Stop Script
# This script immediately kills all processes without graceful shutdown

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}🚨 EMERGENCY STOP - Force killing all processes${NC}"
echo ""

# Function to force kill all project-related processes
emergency_kill() {
    echo -e "${RED}🔪 Force killing all processes...${NC}"
    
    # Kill all Node.js processes
    pkill -9 -f "node" 2>/dev/null || true
    pkill -9 -f "npm" 2>/dev/null || true
    pkill -9 -f "react-scripts" 2>/dev/null || true
    pkill -9 -f "hardhat" 2>/dev/null || true
    
    # Kill processes on specific ports
    for port in 3000 3001 5000 5001 8080 8081 8545; do
        lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || true
    done
    
    # Stop all Docker containers
    docker stop $(docker ps -q) 2>/dev/null || true
    
    # Remove PID files
    rm -f *.pid .*.pid frontend.pid backend.pid blockchain.pid keycloak.pid
    rm -f .frontend.pid .backend.pid .hardhat.pid .keycloak.pid
    
    # Remove port files
    rm -f frontend.port
    
    echo -e "${GREEN}✅ Emergency stop completed${NC}"
}

# Execute emergency stop
emergency_kill

echo ""
echo -e "${YELLOW}⚠️  All processes have been force killed${NC}"
echo -e "${BLUE}💡 To restart services, use: ./start-servers.sh${NC}" 