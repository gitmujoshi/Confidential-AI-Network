#!/bin/bash

# Integration Test Environment Stop Script
# This script stops all services used for integration testing

set -e

echo "🛑 Stopping Integration Test Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed."
    exit 1
fi

# Stop all services
print_status "Stopping all services..."
docker-compose -f docker-compose.test.yml down --volumes --remove-orphans

# Remove any dangling containers
print_status "Cleaning up containers..."
docker container prune -f > /dev/null 2>&1 || true

# Remove any dangling networks
print_status "Cleaning up networks..."
docker network prune -f > /dev/null 2>&1 || true

# Remove test volumes (optional - uncomment if you want to remove data)
# print_status "Removing test volumes..."
# docker volume rm contract-management_postgres_test_data 2>/dev/null || true

print_success "Integration Test Environment stopped successfully!"
echo ""
echo "All services have been stopped and cleaned up."
echo ""
echo "To start the environment again:"
echo "  ./scripts/start-integration-test-env.sh" 