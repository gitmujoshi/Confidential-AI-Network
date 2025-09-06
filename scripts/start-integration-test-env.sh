#!/bin/bash

# Integration Test Environment Startup Script
# This script starts all required services for integration testing

set -e

echo "🚀 Starting Integration Test Environment..."

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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker compose is available
if ! docker compose version &> /dev/null; then
    print_error "docker compose is not available. Please install Docker Desktop with Compose support."
    exit 1
fi

# Stop any existing containers
print_status "Stopping existing containers..."
docker compose -f docker-compose.test.yml down --volumes --remove-orphans 2>/dev/null || true

# Start the services
print_status "Starting PostgreSQL database..."
docker compose -f docker-compose.test.yml up -d postgres-test

# Wait for PostgreSQL to be ready
print_status "Waiting for PostgreSQL to be ready..."
until docker compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U testuser -d contract_management_test > /dev/null 2>&1; do
    sleep 2
done
print_success "PostgreSQL is ready!"

# Start Keycloak
print_status "Starting Keycloak..."
docker compose -f docker-compose.test.yml up -d keycloak-test

# Wait for Keycloak to be ready
print_status "Waiting for Keycloak to be ready..."
until curl -f http://localhost:8081/health/ready > /dev/null 2>&1; do
    sleep 5
done
print_success "Keycloak is ready!"

# Start blockchain services
print_status "Starting Ganache blockchain..."
docker compose -f docker-compose.test.yml up -d ganache-test

# Wait for Ganache to be ready
print_status "Waiting for Ganache to be ready..."
until curl -f -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    http://localhost:8546 > /dev/null 2>&1; do
    sleep 2
done
print_success "Ganache is ready!"

# Optional: Start Hardhat node
print_status "Starting Hardhat node..."
docker compose -f docker-compose.test.yml up -d hardhat-test

# Wait for Hardhat to be ready
print_status "Waiting for Hardhat to be ready..."
until curl -f -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    http://localhost:8547 > /dev/null 2>&1; do
    sleep 5
done
print_success "Hardhat is ready!"

# Show service status
print_status "Checking service status..."
docker compose -f docker-compose.test.yml ps

# Show service URLs
echo ""
print_success "Integration Test Environment is ready!"
echo ""
echo "Service URLs:"
echo "  PostgreSQL: ${DB_HOST:-localhost}:5433"
echo "  Keycloak:   http://localhost:8081"
echo "  Ganache:    http://localhost:8546"
echo "  Hardhat:    http://localhost:8547"
echo ""
echo "Environment Variables:"
echo "  DATABASE_URL=postgresql://testuser:testpass@${DB_HOST:-localhost}:5433/contract_management_test"
echo "  KEYCLOAK_URL=http://localhost:8081"
echo "  BLOCKCHAIN_URL=http://localhost:8546 (Ganache) or http://localhost:8547 (Hardhat)"
echo ""
echo "To run integration tests:"
echo "  npm run test:integration"
echo ""
echo "To stop the environment:"
echo "  ./scripts/stop-integration-test-env.sh" 