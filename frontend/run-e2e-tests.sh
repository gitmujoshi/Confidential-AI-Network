#!/bin/bash

# E2E Test Runner Script
# This script helps you run E2E tests with different configurations

set -e

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

# Function to check if backend is running
check_backend() {
    if curl -s http://localhost:5001/health > /dev/null 2>&1; then
        print_success "Backend server is running on port 5001"
        return 0
    else
        print_warning "Backend server is not running on port 5001"
        print_status "Please start the backend server first:"
        print_status "cd ../backend && npm start"
        return 1
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  all              Run all E2E tests"
    echo "  auth             Run authentication tests only"
    echo "  contracts        Run contract management tests only"
    echo "  dashboard        Run dashboard tests only"
    echo "  training         Run training parameters tests only"
    echo "  ui               Run tests with Playwright UI"
    echo "  debug            Run tests in debug mode"
    echo "  headed           Run tests in headed mode (see browser)"
    echo "  report           Show test reports"
    echo "  install          Install Playwright browsers"
    echo "  help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 all           # Run all tests"
    echo "  $0 auth          # Run only auth tests"
    echo "  $0 ui            # Run tests with UI"
    echo "  $0 debug         # Run tests in debug mode"
}

# Function to run tests
run_tests() {
    local test_pattern="$1"
    local extra_args="$2"
    
    print_status "Running E2E tests..."
    
    if [ -n "$test_pattern" ]; then
        print_status "Test pattern: $test_pattern"
        npm run test:e2e -- --grep "$test_pattern" $extra_args
    else
        npm run test:e2e $extra_args
    fi
}

# Main script logic
case "${1:-all}" in
    "all")
        check_backend
        run_tests ""
        ;;
    "auth")
        check_backend
        run_tests "Authentication"
        ;;
    "contracts")
        check_backend
        run_tests "Contract Management"
        ;;
    "dashboard")
        check_backend
        run_tests "Dashboard"
        ;;
    "training")
        check_backend
        run_tests "Training Parameters"
        ;;
    "ui")
        check_backend
        print_status "Starting Playwright UI..."
        npm run test:e2e:ui
        ;;
    "debug")
        check_backend
        print_status "Starting tests in debug mode..."
        npm run test:e2e:debug
        ;;
    "headed")
        check_backend
        print_status "Starting tests in headed mode..."
        npm run test:e2e:headed
        ;;
    "report")
        print_status "Opening test reports..."
        npm run test:e2e:report
        ;;
    "install")
        print_status "Installing Playwright browsers..."
        npm run test:e2e:install
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        print_error "Unknown option: $1"
        show_usage
        exit 1
        ;;
esac

print_success "E2E test execution completed!" 