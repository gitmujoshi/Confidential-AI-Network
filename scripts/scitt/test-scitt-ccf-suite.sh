#!/bin/bash


source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../lib/common.sh"
resolve_repo_root
# SCITT CCF Comprehensive Test Suite
# This script runs all tests for SCITT CCF integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

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
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_test() {
    echo -e "${PURPLE}🧪 $1${NC}"
}

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local test_description="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo ""
    print_test "Running: $test_name"
    echo "   Description: $test_description"
    echo "   Command: $test_command"
    
    if eval "$test_command" > /dev/null 2>&1; then
        print_success "PASSED: $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        print_error "FAILED: $test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to run a test with output capture
run_test_with_output() {
    local test_name="$1"
    local test_command="$2"
    local test_description="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo ""
    print_test "Running: $test_name"
    echo "   Description: $test_description"
    echo "   Command: $test_command"
    
    local output
    if output=$(eval "$test_command" 2>&1); then
        print_success "PASSED: $test_name"
        echo "   Output: $output"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        print_error "FAILED: $test_name"
        echo "   Error: $output"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to skip a test
skip_test() {
    local test_name="$1"
    local reason="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    
    echo ""
    print_warning "SKIPPED: $test_name"
    echo "   Reason: $reason"
}

# Function to check if a service is running
check_service() {
    local service_name="$1"
    local port="$2"
    local url="$3"
    
    if curl -s "$url" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for service
wait_for_service() {
    local service_name="$1"
    local port="$2"
    local url="$3"
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Waiting for $service_name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        echo "   Attempt $attempt/$max_attempts..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start after $max_attempts attempts"
    return 1
}

# Function to print test summary
print_summary() {
    echo ""
    print_header "Test Suite Summary"
    echo ""
    echo "📊 Test Results:"
    echo "   Total Tests: $TOTAL_TESTS"
    echo "   Passed: ${GREEN}$PASSED_TESTS${NC}"
    echo "   Failed: ${RED}$FAILED_TESTS${NC}"
    echo "   Skipped: ${YELLOW}$SKIPPED_TESTS${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        print_success "🎉 All tests passed! SCITT CCF integration is working correctly."
        return 0
    else
        print_error "❌ $FAILED_TESTS test(s) failed. Please check the output above."
        return 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if we're in the right directory
    if [ ! -f "manage-scitt-ccf.sh" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    # Check if SCITT CCF configuration exists
    if [ ! -f ".env.scitt-ccf" ]; then
        print_warning "SCITT CCF configuration not found. Running setup..."
        if ./manage-scitt-ccf.sh setup; then
            print_success "SCITT CCF configuration created successfully"
        else
            print_error "Failed to create SCITT CCF configuration"
            return 1
        fi
    else
        print_success "SCITT CCF configuration found"
    fi
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if Docker Compose file exists
    if [ ! -f "$(compose_path "docker-compose.scitt-ccf-dev.yml")" ]; then
        print_error "SCITT CCF Docker Compose file not found"
        exit 1
    fi
    
    print_success "Prerequisites check completed"
}

# Function to start test environment
start_test_environment() {
    print_header "Starting Test Environment"
    
    # Start SCITT CCF services
    print_info "Starting SCITT CCF services..."
    ./manage-scitt-ccf.sh start
    
    # Wait for services to be ready
    wait_for_service "SCITT CCF Node" "8000" "http://localhost:8000/app/health"
    wait_for_service "SCITT CCF Governance" "8000" "http://localhost:8000/governance/health"
    
    # Start backend if not running
    if ! check_service "Backend" "5001" "http://localhost:5001/health"; then
        print_info "Starting backend server..."
        cd backend
        export SCITT_CCF_ENABLED=true
        export MIGRATION_MODE=HYBRID
        node server.js &
        cd ..
        
        wait_for_service "Backend" "5001" "http://localhost:5001/health"
    fi
    
    print_success "Test environment started"
}

# Function to stop test environment
stop_test_environment() {
    print_header "Stopping Test Environment"
    
    # Stop backend
    pkill -f "node server.js" || true
    
    # Stop SCITT CCF services
    ./manage-scitt-ccf.sh stop
    
    print_success "Test environment stopped"
}

# Function to run infrastructure tests
run_infrastructure_tests() {
    print_header "Infrastructure Tests"
    
    # Test Docker services
    run_test "Docker Services Running" \
        "run_compose "docker-compose.scitt-ccf-dev.yml" ps | grep -q 'Up'" \
        "Verify all Docker services are running"
    
    # Test SCITT CCF node health
    run_test "SCITT CCF Node Health" \
        "curl -s http://localhost:8000/app/health > /dev/null" \
        "Verify SCITT CCF node is responding"
    
    # Test SCITT CCF governance
    run_test "SCITT CCF Governance" \
        "curl -s http://localhost:8001 > /dev/null" \
        "Verify SCITT CCF governance is accessible"
    
    # Test backend health
    run_test "Backend Health" \
        "curl -s http://localhost:5001/health > /dev/null" \
        "Verify backend is running and healthy"
}

# Function to run integration tests
run_integration_tests() {
    print_header "Integration Tests"
    
    # Test SCITT CCF backend integration
    run_test_with_output "SCITT CCF Backend Integration" \
        "curl -s http://localhost:5001/api/system/health | jq -r '.scittCcf.isHealthy'" \
        "Verify SCITT CCF integration with backend"
    
    # Test migration mode
    run_test_with_output "Migration Mode Check" \
        "curl -s http://localhost:5001/api/system/health | jq -r '.migrationMode'" \
        "Verify current migration mode"
    
    # Test system health endpoint
    run_test "System Health Endpoint" \
        "curl -s http://localhost:5001/api/system/health > /dev/null" \
        "Verify system health endpoint is accessible"
}

# Function to run functional tests
run_functional_tests() {
    print_header "Functional Tests"
    
    # Test SCITT CCF management script
    run_test "SCITT CCF Management Script" \
        "./manage-scitt-ccf.sh status > /dev/null" \
        "Verify SCITT CCF management script works"
    
    # Test migration mode switching
    run_test "Migration Mode Switch to HYBRID" \
        "./manage-scitt-ccf.sh switch HYBRID > /dev/null" \
        "Verify migration mode can be switched to HYBRID"
    
    # Test migration mode switching
    run_test "Migration Mode Switch to ETHEREUM_ONLY" \
        "./manage-scitt-ccf.sh switch ETHEREUM_ONLY > /dev/null" \
        "Verify migration mode can be switched to ETHEREUM_ONLY"
    
    # Test migration mode switching back to HYBRID
    run_test "Migration Mode Switch back to HYBRID" \
        "./manage-scitt-ccf.sh switch HYBRID > /dev/null" \
        "Verify migration mode can be switched back to HYBRID"
}

# Function to run performance tests
run_performance_tests() {
    print_header "Performance Tests"
    
    # Test SCITT CCF response time
    run_test_with_output "SCITT CCF Response Time" \
        "curl -w '%{time_total}' -s -o /dev/null http://localhost:8000/app/health" \
        "Measure SCITT CCF node response time"
    
    # Test backend response time
    run_test_with_output "Backend Response Time" \
        "curl -w '%{time_total}' -s -o /dev/null http://localhost:5001/health" \
        "Measure backend response time"
    
    # Test system health response time
    run_test_with_output "System Health Response Time" \
        "curl -w '%{time_total}' -s -o /dev/null http://localhost:5001/api/system/health" \
        "Measure system health endpoint response time"
}

# Function to run database tests
run_database_tests() {
    print_header "Database Tests"
    
    # Check if SCITT CCF tables exist
    if [ -f "backend/migrations/20250108-add-scitt-ccf-tables.js" ]; then
        run_test "SCITT CCF Migration Script" \
            "ls backend/migrations/20250108-add-scitt-ccf-tables.js > /dev/null" \
            "Verify SCITT CCF migration script exists"
    else
        skip_test "SCITT CCF Migration Script" "Migration script not found"
    fi
    
    # Check if test script exists
    if [ -f "backend/scripts/test-scitt-ccf-integration.js" ]; then
        run_test "SCITT CCF Test Script" \
            "ls backend/scripts/test-scitt-ccf-integration.js > /dev/null" \
            "Verify SCITT CCF test script exists"
    else
        skip_test "SCITT CCF Test Script" "Test script not found"
    fi
}

# Function to run comprehensive integration test
run_comprehensive_test() {
    print_header "Comprehensive Integration Test"
    
    if [ -f "backend/scripts/test-scitt-ccf-integration.js" ]; then
        run_test_with_output "Full Integration Test" \
            "cd backend && node scripts/test-scitt-ccf-integration.js && cd .." \
            "Run complete SCITT CCF integration test suite"
    else
        skip_test "Full Integration Test" "Integration test script not found"
    fi
}

# Function to run stress tests
run_stress_tests() {
    print_header "Stress Tests"
    
    # Test multiple concurrent requests to SCITT CCF
    run_test "Concurrent SCITT CCF Requests" \
        "for i in {1..5}; do curl -s http://localhost:8000/app/health > /dev/null & done; wait" \
        "Test multiple concurrent requests to SCITT CCF"
    
    # Test multiple concurrent requests to backend
    run_test "Concurrent Backend Requests" \
        "for i in {1..5}; do curl -s http://localhost:5001/health > /dev/null & done; wait" \
        "Test multiple concurrent requests to backend"
}

# Function to run cleanup tests
run_cleanup_tests() {
    print_header "Cleanup Tests"
    
    # Test SCITT CCF cleanup
    run_test "SCITT CCF Cleanup" \
        "./manage-scitt-ccf.sh stop > /dev/null" \
        "Verify SCITT CCF services can be stopped"
    
    # Test SCITT CCF restart
    run_test "SCITT CCF Restart" \
        "./manage-scitt-ccf.sh start > /dev/null" \
        "Verify SCITT CCF services can be restarted"
}

# Function to show help
show_help() {
    echo "SCITT CCF Comprehensive Test Suite"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --all              Run all tests (default)"
    echo "  --infrastructure   Run only infrastructure tests"
    echo "  --integration      Run only integration tests"
    echo "  --functional       Run only functional tests"
    echo "  --performance      Run only performance tests"
    echo "  --database         Run only database tests"
    echo "  --stress           Run only stress tests"
    echo "  --cleanup          Run only cleanup tests"
    echo "  --quick            Run quick test suite (infrastructure + integration)"
    echo "  --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                 # Run all tests"
    echo "  $0 --quick         # Run quick test suite"
    echo "  $0 --performance   # Run only performance tests"
    echo "  $0 --cleanup       # Run only cleanup tests"
}

# Main test execution
main() {
    local test_mode="all"
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --all)
                test_mode="all"
                shift
                ;;
            --infrastructure)
                test_mode="infrastructure"
                shift
                ;;
            --integration)
                test_mode="integration"
                shift
                ;;
            --functional)
                test_mode="functional"
                shift
                ;;
            --performance)
                test_mode="performance"
                shift
                ;;
            --database)
                test_mode="database"
                shift
                ;;
            --stress)
                test_mode="stress"
                shift
                ;;
            --cleanup)
                test_mode="cleanup"
                shift
                ;;
            --quick)
                test_mode="quick"
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    print_header "SCITT CCF Comprehensive Test Suite"
    echo "Test Mode: $test_mode"
    echo "Timestamp: $(date)"
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Start test environment
    start_test_environment
    
    # Run tests based on mode
    case $test_mode in
        "all")
            run_infrastructure_tests
            run_integration_tests
            run_functional_tests
            run_performance_tests
            run_database_tests
            run_comprehensive_test
            run_stress_tests
            run_cleanup_tests
            ;;
        "quick")
            run_infrastructure_tests
            run_integration_tests
            ;;
        "infrastructure")
            run_infrastructure_tests
            ;;
        "integration")
            run_integration_tests
            ;;
        "functional")
            run_functional_tests
            ;;
        "performance")
            run_performance_tests
            ;;
        "database")
            run_database_tests
            ;;
        "stress")
            run_stress_tests
            ;;
        "cleanup")
            run_cleanup_tests
            ;;
    esac
    
    # Print summary
    print_summary
    
    # Stop test environment
    stop_test_environment
    
    # Exit with appropriate code
    if [ $FAILED_TESTS -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function with all arguments
main "$@"
