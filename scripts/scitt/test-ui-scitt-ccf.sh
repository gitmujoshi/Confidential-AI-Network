#!/bin/bash


source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../lib/common.sh"
resolve_repo_root
# SCITT CCF UI Testing Script
# This script tests the user interface components of the SCITT CCF integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_header() { echo -e "${BLUE}================================${NC}"; echo -e "${BLUE} $1${NC}"; echo -e "${BLUE}================================${NC}"; }

# Function to check if a service is running
check_service() {
    local service_name="$1"
    local port="$2"
    local url="$3"
    
    if curl -s "$url" > /dev/null 2>&1; then
        print_success "$service_name is accessible on port $port"
        return 0
    else
        print_error "$service_name is not accessible on port $port"
        return 1
    fi
}

# Function to test dashboard functionality
test_dashboard() {
    print_header "Testing SCITT CCF Dashboard UI"
    
    local dashboard_url="http://localhost:8082"
    
    # Test dashboard accessibility
    print_status "Testing dashboard accessibility..."
    if check_service "SCITT CCF Dashboard" "8082" "$dashboard_url"; then
        print_success "Dashboard is accessible"
        
        # Test dashboard content
        print_status "Testing dashboard content..."
        local content=$(curl -s "$dashboard_url")
        
        # Check for key UI elements
        if echo "$content" | grep -q "SCITT CCF Dashboard"; then
            print_success "Dashboard title is present"
        else
            print_error "Dashboard title is missing"
        fi
        
        if echo "$content" | grep -q "Test Node Health"; then
            print_success "Node health test button is present"
        else
            print_error "Node health test button is missing"
        fi
        
        if echo "$content" | grep -q "Test Governance Health"; then
            print_success "Governance health test button is present"
        else
            print_error "Governance health test button is missing"
        fi
        
        if echo "$content" | grep -q "Service Information"; then
            print_success "Service information section is present"
        else
            print_error "Service information section is missing"
        fi
        
        # Test dashboard styling
        if echo "$content" | grep -q "background-color: #f5f5f5"; then
            print_success "Dashboard styling is applied"
        else
            print_error "Dashboard styling is missing"
        fi
        
    else
        print_error "Dashboard testing failed"
        return 1
    fi
}

# Function to test SCITT CCF endpoints
test_endpoints() {
    print_header "Testing SCITT CCF Endpoints"
    
    # Test Node endpoint
    print_status "Testing Node endpoint..."
    local node_response=$(curl -s "http://localhost:8000/app/health")
    if echo "$node_response" | grep -q '"status": "healthy"'; then
        print_success "Node endpoint is healthy: $node_response"
    else
        print_error "Node endpoint is not healthy: $node_response"
        return 1
    fi
    
    # Test Governance endpoint
    print_status "Testing Governance endpoint..."
    local gov_response=$(curl -s "http://localhost:8000/governance/health")
    if echo "$gov_response" | grep -q '"status": "healthy"'; then
        print_success "Governance endpoint is healthy: $gov_response"
    else
        print_error "Governance endpoint is not healthy: $gov_response"
        return 1
    fi
    
    # Test root endpoint
    print_status "Testing root endpoint..."
    local root_response=$(curl -s "http://localhost:8000/")
    if echo "$root_response" | grep -q "SCITT CCF Unified Service"; then
        print_success "Root endpoint is working: $root_response"
    else
        print_error "Root endpoint is not working: $root_response"
        return 1
    fi
}

# Function to test interactive features
test_interactive_features() {
    print_header "Testing Interactive Features"
    
    # Test if dashboard can make API calls
    print_status "Testing dashboard API integration..."
    
    # Simulate dashboard API calls
    local node_test=$(curl -s "http://localhost:8000/app/health" -H "Accept: application/json")
    local gov_test=$(curl -s "http://localhost:8000/governance/health" -H "Accept: application/json")
    
    if [ "$node_test" != "" ] && [ "$gov_test" != "" ]; then
        print_success "Dashboard API endpoints are accessible"
    else
        print_error "Dashboard API endpoints are not accessible"
        return 1
    fi
}

# Function to test service integration
test_service_integration() {
    print_header "Testing Service Integration"
    
    # Check if all SCITT CCF services are running
    print_status "Checking SCITT CCF services..."
    
    local services=("scitt-ccf-node-dev" "scitt-ccf-dashboard-dev" "scitt-ccf-monitor-dev" "scitt-ccf-redis-dev" "scitt-ccf-postgres-dev")
    
    for service in "${services[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "$service"; then
            print_success "$service is running"
        else
            print_error "$service is not running"
            return 1
        fi
    done
}

# Function to test user experience
test_user_experience() {
    print_header "Testing User Experience"
    
    print_status "Testing dashboard responsiveness..."
    
    # Test dashboard load time
    local start_time=$(date +%s%N)
    curl -s "http://localhost:8082" > /dev/null
    local end_time=$(date +%s%N)
    local load_time=$(( (end_time - start_time) / 1000000 ))
    
    if [ $load_time -lt 1000 ]; then
        print_success "Dashboard loads quickly: ${load_time}ms"
    else
        print_warning "Dashboard load time: ${load_time}ms (could be optimized)"
    fi
    
    # Test endpoint response times
    print_status "Testing endpoint response times..."
    
    local node_start=$(date +%s%N)
    curl -s "http://localhost:8000/app/health" > /dev/null
    local node_end=$(date +%s%N)
    local node_time=$(( (node_end - node_start) / 1000000 ))
    
    local gov_start=$(date +%s%N)
    curl -s "http://localhost:8000/governance/health" > /dev/null
    local gov_end=$(date +%s%N)
    local gov_time=$(( (gov_end - gov_start) / 1000000 ))
    
    print_success "Node endpoint response time: ${node_time}ms"
    print_success "Governance endpoint response time: ${gov_time}ms"
}

# Function to run all UI tests
run_all_tests() {
    print_header "SCITT CCF UI Testing Suite"
    echo "Timestamp: $(date)"
    echo ""
    
    local all_passed=true
    
    # Run all test categories
    if test_dashboard; then
        print_success "Dashboard tests passed"
    else
        print_error "Dashboard tests failed"
        all_passed=false
    fi
    
    echo ""
    
    if test_endpoints; then
        print_success "Endpoint tests passed"
    else
        print_error "Endpoint tests failed"
        all_passed=false
    fi
    
    echo ""
    
    if test_interactive_features; then
        print_success "Interactive feature tests passed"
    else
        print_error "Interactive feature tests failed"
        all_passed=false
    fi
    
    echo ""
    
    if test_service_integration; then
        print_success "Service integration tests passed"
    else
        print_error "Service integration tests failed"
        all_passed=false
    fi
    
    echo ""
    
    if test_user_experience; then
        print_success "User experience tests passed"
    else
        print_error "User experience tests failed"
        all_passed=false
    fi
    
    echo ""
    print_header "Test Results Summary"
    
    if [ "$all_passed" = true ]; then
        print_success "🎉 All UI tests passed! SCITT CCF integration is working perfectly."
        echo ""
        echo "🌐 Access your SCITT CCF Dashboard at: http://localhost:8081"
        echo "🔗 Test endpoints at: http://localhost:8000"
        echo "📊 Monitor services in real-time"
    else
        print_error "❌ Some UI tests failed. Please check the errors above."
        return 1
    fi
}

# Function to show help
show_help() {
    echo "SCITT CCF UI Testing Script"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  --all              Run all UI tests (default)"
    echo "  --dashboard        Test dashboard functionality only"
    echo "  --endpoints        Test SCITT CCF endpoints only"
    echo "  --interactive      Test interactive features only"
    echo "  --integration      Test service integration only"
    echo "  --ux               Test user experience only"
    echo "  --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                 # Run all tests"
    echo "  $0 --dashboard     # Test dashboard only"
    echo "  $0 --endpoints     # Test endpoints only"
}

# Main function
main() {
    case "${1:---all}" in
        --all)
            run_all_tests
            ;;
        --dashboard)
            test_dashboard
            ;;
        --endpoints)
            test_endpoints
            ;;
        --interactive)
            test_interactive_features
            ;;
        --integration)
            test_service_integration
            ;;
        --ux)
            test_user_experience
            ;;
        --help)
            show_help
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
