#!/bin/bash

# Blockchain Development Setup Script
# Installs blockchain node_modules and starts local blockchain

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}⛓️  Blockchain Development Setup${NC}"
echo ""

# Check if blockchain node_modules exists
if [ ! -d "blockchain/node_modules" ]; then
    echo -e "${BLUE}Installing blockchain dependencies...${NC}"
    ./scripts/manage-node-modules.sh install blockchain
    echo ""
else
    echo -e "${GREEN}✅ Blockchain dependencies already installed${NC}"
    echo ""
fi

# Compile contracts
echo -e "${BLUE}Compiling smart contracts...${NC}"
cd blockchain
npm run compile
echo ""

# Start local blockchain
echo -e "${BLUE}Starting local Hardhat blockchain...${NC}"
echo -e "${YELLOW}This will start a local blockchain on port 8545${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""
npm run node 