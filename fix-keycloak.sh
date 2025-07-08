#!/bin/bash

# Keycloak Fix Script
# This script provides easy access to Keycloak diagnostic and fix tools

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to show usage
show_usage() {
    echo "Keycloak Fix Script"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  diagnose    Run comprehensive Keycloak diagnostics"
    echo "  quick-fix   Apply quick fixes for common issues"
    echo "  setup       Run Keycloak setup script"
    echo "  status      Check Keycloak server status"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 diagnose    # Run diagnostics to identify issues"
    echo "  $0 quick-fix   # Apply automatic fixes"
    echo "  $0 setup       # Run setup script only"
}

# Function to check if Node.js is available
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed or not in PATH"
        exit 1
    fi
}

# Function to check if we're in the right directory
check_directory() {
    if [ ! -f "config.env" ] || [ ! -d "backend" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
}

# Function to run diagnostics
run_diagnose() {
    print_status "Running Keycloak diagnostics..."
    cd backend/scripts
    node fix-keycloak-integration.js
    cd ../..
}

# Function to run quick fix
run_quick_fix() {
    print_status "Running quick Keycloak fix..."
    cd backend/scripts
    node quick-keycloak-fix.js
    cd ../..
}

# Function to run setup
run_setup() {
    print_status "Running Keycloak setup..."
    cd backend
    node setup-keycloak.js
    cd ..
}

# Function to check status
check_status() {
    print_status "Checking Keycloak server status..."
    
    if curl -s http://localhost:8080/realms/master > /dev/null 2>&1; then
        print_success "Keycloak server is running and accessible"
    else
        print_warning "Keycloak server is not accessible"
        echo ""
        print_status "To start Keycloak with Docker:"
        echo "docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev"
    fi
}

# Main script logic
main() {
    # Check prerequisites
    check_node
    check_directory
    
    # Parse command line arguments
    case "${1:-help}" in
        "diagnose")
            run_diagnose
            ;;
        "quick-fix")
            run_quick_fix
            ;;
        "setup")
            run_setup
            ;;
        "status")
            check_status
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            print_error "Unknown option: $1"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@" 