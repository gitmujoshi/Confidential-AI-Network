#!/bin/bash

# Quick Memory Optimization Script
# Removes all node_modules to free up memory

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Quick Memory Optimization${NC}"
echo ""

# Show current memory usage
echo -e "${BLUE}Current node_modules memory usage:${NC}"
./scripts/manage-node-modules.sh memory

# Remove all node_modules
echo -e "${BLUE}Removing all node_modules to free memory...${NC}"
./scripts/manage-node-modules.sh remove all

echo ""
echo -e "${GREEN}✅ Memory optimization complete!${NC}"
echo ""
echo -e "${YELLOW}💡 When you need to develop:${NC}"
echo "  Frontend:  ./scripts/manage-node-modules.sh install frontend"
echo "  Backend:   ./scripts/manage-node-modules.sh install backend"
echo "  Blockchain: ./scripts/manage-node-modules.sh install blockchain"
echo "  All:       ./scripts/manage-node-modules.sh install all"
echo ""
echo -e "${YELLOW}📊 Check memory status:${NC}"
echo "  ./scripts/manage-node-modules.sh status" 