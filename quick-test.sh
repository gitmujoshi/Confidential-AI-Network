#!/bin/bash

# Quick Test Runner for SCITT CCF Integration
# This script provides easy access to common testing scenarios

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo ""
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_test() {
    echo -e "${PURPLE}🧪 $1${NC}"
}

# Function to show menu
show_menu() {
    echo ""
    print_header "Quick Test Runner"
    echo ""
    echo "Choose a testing scenario:"
    echo ""
    echo "1️⃣  🚀 Start System with Quick Tests"
    echo "2️⃣  🚀 Start System with Full Tests"
    echo "3️⃣  🚀 Start System without Tests"
    echo "4️⃣  🧪 Run Quick Test Suite"
    echo "5️⃣  🧪 Run Full Test Suite"
    echo "6️⃣  🧪 Run Performance Tests"
    echo "7️⃣  🔍 Check System Status"
    echo "8️⃣  🛑 Stop All Services"
    echo "9️⃣  🛑 Stop SCITT CCF Only"
    echo "🔟  🧹 Clean Up Everything"
    echo "0️⃣  ❌ Exit"
    echo ""
    read -p "Enter your choice (0-10): " choice
}

# Function to run quick start
run_quick_start() {
    print_header "Starting System with Quick Tests"
    
    # Ensure SCITT CCF is configured
    if [ ! -f ".env.scitt-ccf" ]; then
        print_info "SCITT CCF not configured, setting up automatically..."
        if [ -f "manage-scitt-ccf.sh" ]; then
            chmod +x manage-scitt-ccf.sh
            ./manage-scitt-ccf.sh setup
        fi
    fi
    
    # Build components if needed
    print_info "Building system components..."
    ./start-system.sh --test-mode quick
}

# Function to run full start
run_full_start() {
    print_header "Starting System with Full Tests"
    
    # Ensure SCITT CCF is configured
    if [ ! -f ".env.scitt-ccf" ]; then
        print_info "SCITT CCF not configured, setting up automatically..."
        if [ -f "manage-scitt-ccf.sh" ]; then
            chmod +x manage-scitt-ccf.sh
            ./manage-scitt-ccf.sh setup
        fi
    fi
    
    ./start-system.sh --test-mode full
}

# Function to run start without tests
run_start_no_tests() {
    print_header "Starting System without Tests"
    
    # Ensure SCITT CCF is configured
    if [ ! -f ".env.scitt-ccf" ]; then
        print_info "SCITT CCF not configured, setting up automatically..."
        if [ -f "manage-scitt-ccf.sh" ]; then
            chmod +x manage-scitt-ccf.sh
            ./manage-scitt-ccf.sh setup
        fi
    fi
    
    ./start-system.sh --no-tests
}

# Function to run quick tests
run_quick_tests() {
    print_header "Running Quick Test Suite"
    ./test-scitt-ccf-suite.sh --quick
}

# Function to run full tests
run_full_tests() {
    print_header "Running Full Test Suite"
    ./test-scitt-ccf-suite.sh --all
}

# Function to run performance tests
run_performance_tests() {
    print_header "Running Performance Tests"
    ./test-scitt-ccf-suite.sh --performance
}

# Function to check system status
check_system_status() {
    print_header "System Status"
    
    echo "🔍 Checking services..."
    
    # Check frontend
    if curl -s "http://localhost:3000" > /dev/null 2>&1; then
        print_success "Frontend: Running on port 3000"
    else
        print_warning "Frontend: Not running"
    fi
    
    # Check backend
    if curl -s "http://localhost:5001/health" > /dev/null 2>&1; then
        print_success "Backend: Running on port 5001"
        
        # Check SCITT CCF integration
        if curl -s "http://localhost:5001/api/system/health" > /dev/null 2>&1; then
            local migration_mode
            migration_mode=$(curl -s "http://localhost:5001/api/system/health" | jq -r '.migrationMode // "unknown"' 2>/dev/null || echo "unknown")
            echo "   Migration Mode: $migration_mode"
            
            local scitt_health
            scitt_health=$(curl -s "http://localhost:5001/api/system/health" | jq -r '.scittCcf.isHealthy // "unknown"' 2>/dev/null || echo "unknown")
            echo "   SCITT CCF Health: $scitt_health"
        fi
    else
        print_warning "Backend: Not running"
    fi
    
    # Check Keycloak
    if curl -k -s "https://localhost:8443/realms/master" > /dev/null 2>&1; then
        print_success "Keycloak: Running on port 8443 (HTTPS)"
    else
        print_warning "Keycloak: Not running"
    fi
    
    # Check SCITT CCF
    if curl -s "http://localhost:8000/app/health" > /dev/null 2>&1; then
        print_success "SCITT CCF Node: Running on port 8000"
    else
        print_warning "SCITT CCF Node: Not running"
    fi
    
    if curl -s "http://localhost:8001" > /dev/null 2>&1; then
        print_success "SCITT CCF Governance: Running on port 8001"
    else
        print_warning "SCITT CCF Governance: Not running"
    fi
    
    # Check blockchain
    if lsof -i :8545 > /dev/null 2>&1; then
        print_success "Blockchain: Running on port 8545"
    else
        print_warning "Blockchain: Not running"
    fi
}

# Function to stop all services
stop_all_services() {
    print_header "Stopping All Services"
    ./stop-system.sh
}

# Function to stop SCITT CCF only
stop_scitt_ccf_only() {
    print_header "Stopping SCITT CCF Services Only"
    ./stop-scitt-ccf.sh
}

# Function to clean up everything
cleanup_everything() {
    print_header "Cleaning Up Everything"
    
    print_warning "This will remove all data and stop all services!"
    read -p "Are you sure? (y/N): " confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        ./stop-system.sh --cleanup
        ./stop-scitt-ccf.sh --cleanup
        
        print_success "Cleanup completed"
        print_warning "You will need to run setup again to use the system"
    else
        print_info "Cleanup cancelled"
    fi
}

# Function to show help
show_help() {
    echo "Quick Test Runner for SCITT CCF Integration"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  --start-quick       Start system with quick tests"
    echo "  --start-full        Start system with full tests"
    echo "  --start-no-tests    Start system without tests"
    echo "  --test-quick        Run quick test suite"
    echo "  --test-full         Run full test suite"
    echo "  --test-performance  Run performance tests"
    echo "  --status            Check system status"
    echo "  --stop-all          Stop all services"
    echo "  --stop-scitt-ccf    Stop SCITT CCF services only"
    echo "  --cleanup           Clean up everything"
    echo "  --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --start-quick    # Start with quick tests"
    echo "  $0 --test-quick     # Run quick tests"
    echo "  $0 --status         # Check status"
    echo "  $0 --stop-all       # Stop everything"
}

# Main script logic
main() {
    # Check if command line arguments are provided
    if [ $# -gt 0 ]; then
        case $1 in
            --start-quick)
                run_quick_start
                exit 0
                ;;
            --start-full)
                run_full_start
                exit 0
                ;;
            --start-no-tests)
                run_start_no_tests
                exit 0
                ;;
            --test-quick)
                run_quick_tests
                exit 0
                ;;
            --test-full)
                run_full_tests
                exit 0
                ;;
            --test-performance)
                run_performance_tests
                exit 0
                ;;
            --status)
                check_system_status
                exit 0
                ;;
            --stop-all)
                stop_all_services
                exit 0
                ;;
            --stop-scitt-ccf)
                stop_scitt_ccf_only
                exit 0
                ;;
            --cleanup)
                cleanup_everything
                exit 0
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    fi
    
    # Interactive menu mode
    while true; do
        show_menu
        
        case $choice in
            1)
                run_quick_start
                ;;
            2)
                run_full_start
                ;;
            3)
                run_start_no_tests
                ;;
            4)
                run_quick_tests
                ;;
            5)
                run_full_tests
                ;;
            6)
                run_performance_tests
                ;;
            7)
                check_system_status
                ;;
            8)
                stop_all_services
                ;;
            9)
                stop_scitt_ccf_only
                ;;
            10)
                cleanup_everything
                ;;
            0)
                print_info "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid choice. Please try again."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function with all arguments
main "$@"
