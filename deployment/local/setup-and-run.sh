#!/bin/bash

# Contract Management System - Setup and Run Script
# Installs dependencies and starts all servers for quick testing

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

print_status "Installing backend dependencies..."
cd ../../backend
npm ci || { print_error "Backend dependency install failed"; exit 1; }
print_success "Backend dependencies installed."

print_status "Installing frontend dependencies..."
cd ../frontend
npm ci || { print_error "Frontend dependency install failed"; exit 1; }
print_success "Frontend dependencies installed."

# Optional: Install blockchain dependencies if needed
if [ -f "../blockchain/package.json" ]; then
  print_status "Installing blockchain dependencies..."
  cd ../blockchain
  npm ci || { print_error "Blockchain dependency install failed"; exit 1; }
  print_success "Blockchain dependencies installed."
  cd ..
else
  print_warning "No blockchain/package.json found, skipping blockchain dependency install."
  cd ..
fi

cd deployment/local

print_status "Starting all servers..."
./start-servers.sh 