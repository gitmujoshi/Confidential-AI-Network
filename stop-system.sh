#!/bin/bash

# Contract Management System Stop Script
# This script stops all system components including SCITT CCF integration

set -e

# Load centralized configuration
if [ -f "config.env" ]; then
    echo "✅ Loading centralized configuration from config.env"
    source config.env
else
    echo "⚠️  Centralized configuration file not found: config.env"
    echo "⚠️  Using default values"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}🔍 $1${NC}"
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

print_header() {
    echo ""
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to check if a service is running
check_service() {
    local service_name=$1
    local port=$2
    
    if lsof -i ":$port" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to stop frontend
stop_frontend() {
    print_header "Stopping Frontend"
    
    if check_service "Frontend" "3000"; then
        print_status "Stopping frontend development server..."
        
        # Kill React development server
        pkill -f "react-scripts" || true
        pkill -f "webpack-dev-server" || true
        
        # Wait for process to stop
        sleep 2
        
        if check_service "Frontend" "3000"; then
            print_warning "Frontend still running, forcing stop..."
            pkill -9 -f "react-scripts" || true
            pkill -9 -f "webpack-dev-server" || true
        fi
        
        print_success "Frontend stopped"
    else
        print_warning "Frontend is not running"
    fi
}

# Function to stop backend
stop_backend() {
    print_header "Stopping Backend"
    
    if check_service "Backend" "5001"; then
        print_status "Stopping backend server..."
        
        # Kill Node.js server
        pkill -f "node server.js" || true
        
        # Wait for process to stop
        sleep 2
        
        if check_service "Backend" "5001"; then
            print_warning "Backend still running, forcing stop..."
            pkill -9 -f "node server.js" || true
        fi
        
        print_success "Backend stopped"
    else
        print_warning "Backend is not running"
    fi
}

# Function to stop SCITT CCF services
stop_scitt_ccf() {
    print_header "Stopping SCITT CCF Services"
    
    if [ -f "stop-scitt-ccf.sh" ]; then
        chmod +x stop-scitt-ccf.sh
        
        if [ "$1" = "--cleanup" ]; then
            print_status "Stopping SCITT CCF services with cleanup..."
            ./stop-scitt-ccf.sh --cleanup
        else
            print_status "Stopping SCITT CCF services..."
            ./stop-scitt-ccf.sh
        fi
    else
        print_warning "SCITT CCF stop script not found, stopping manually..."
        
        if [ -f "docker-compose.scitt-ccf-dev.yml" ]; then
            docker-compose -f docker-compose.scitt-ccf-dev.yml down --remove-orphans || true
        fi
        
        # Kill any remaining SCITT CCF processes
        pkill -f "scitt-ccf" || true
        pkill -f "ccf" || true
    fi
}

# Function to stop Keycloak and PostgreSQL
stop_***REMOVED-KEYCLOAK_DB_PASSWORD***_***REMOVED-DB_PASSWORD***() {
    print_header "Stopping Keycloak and PostgreSQL"
    
    if [ -f "docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.yml" ]; then
        print_status "Stopping Keycloak and PostgreSQL containers..."
        docker-compose -f docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.yml down
        
        print_success "Keycloak and PostgreSQL stopped"
    else
        print_warning "Keycloak Docker Compose file not found"
        
        # Try to stop manually
        docker stop ***REMOVED-KEYCLOAK_DB_PASSWORD***-cms ***REMOVED-DB_PASSWORD***-***REMOVED-KEYCLOAK_DB_PASSWORD*** 2>/dev/null || true
        docker rm ***REMOVED-KEYCLOAK_DB_PASSWORD***-cms ***REMOVED-DB_PASSWORD***-***REMOVED-KEYCLOAK_DB_PASSWORD*** 2>/dev/null || true
    fi
}

# Function to stop blockchain services
stop_blockchain() {
    print_header "Stopping Blockchain Services"
    
    # Kill Hardhat processes
    pkill -f "hardhat" || true
    pkill -f "ganache" || true
    
    # Kill processes on blockchain ports
    if check_service "Blockchain" "8545"; then
        print_status "Stopping blockchain on port 8545..."
        lsof -ti:8545 | xargs kill -9 2>/dev/null || true
    fi
    
    if check_service "Blockchain" "8546"; then
        print_status "Stopping blockchain on port 8546..."
        lsof -ti:8546 | xargs kill -9 2>/dev/null || true
    fi
    
    print_success "Blockchain services stopped"
}

# Function to clean up temporary files
cleanup_temp_files() {
    print_header "Cleaning Up Temporary Files"
    
    # Remove PID files
    rm -f *.pid backend/*.pid frontend/*.pid 2>/dev/null || true
    
    # Remove log files
    rm -f *.log backend/*.log frontend/*.log 2>/dev/null || true
    
    # Remove node_modules if requested
    if [ "$1" = "--cleanup" ]; then
        print_status "Removing node_modules..."
        rm -rf node_modules backend/node_modules frontend/node_modules 2>/dev/null || true
        print_success "node_modules removed"
    fi
    
    print_success "Temporary files cleaned up"
}

# Function to show system status
show_system_status() {
    print_header "System Status"
    
    echo "🔍 Checking service status..."
    
    # Check frontend
    if check_service "Frontend" "3000"; then
        print_warning "Frontend is still running on port 3000"
    else
        print_success "Frontend is stopped"
    fi
    
    # Check backend
    if check_service "Backend" "5001"; then
        print_warning "Backend is still running on port 5001"
    else
        print_success "Backend is stopped"
    fi
    
    # Check Keycloak
    if check_service "Keycloak" "8080"; then
        print_warning "Keycloak is still running on port 8080"
    else
        print_success "Keycloak is stopped"
    fi
    
    # Check PostgreSQL
    if check_service "PostgreSQL" "5432"; then
        print_warning "PostgreSQL is still running on port 5432"
    else
        print_success "PostgreSQL is stopped"
    fi
    
    # Check SCITT CCF
    if check_service "SCITT CCF Node" "8000"; then
        print_warning "SCITT CCF Node is still running on port 8000"
    else
        print_success "SCITT CCF Node is stopped"
    fi
    
    if check_service "SCITT CCF Governance" "8001"; then
        print_warning "SCITT CCF Governance is still running on port 8001"
    else
        print_success "SCITT CCF Governance is stopped"
    fi
    
    # Check blockchain
    if check_service "Blockchain" "8545"; then
        print_warning "Blockchain is still running on port 8545"
    else
        print_success "Blockchain is stopped"
    fi
    
    if check_service "Blockchain" "8546"; then
        print_warning "Blockchain is still running on port 8546"
    else
        print_success "Blockchain is stopped"
    fi
    
    echo ""
    echo "🔍 Checking Docker containers..."
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(***REMOVED-KEYCLOAK_DB_PASSWORD***|***REMOVED-DB_PASSWORD***|scitt|ccf)" || echo "   No relevant Docker containers running"
}

# Function to show help
show_help() {
    echo "Contract Management System Stop Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --cleanup           Remove all data and node_modules"
    echo "  --status            Show system status after stopping"
    echo "  --frontend-only     Stop only frontend"
    echo "  --backend-only      Stop only backend"
    echo "  --scitt-ccf-only    Stop only SCITT CCF services"
    echo "  --***REMOVED-KEYCLOAK_DB_PASSWORD***-only     Stop only Keycloak and PostgreSQL"
    echo "  --blockchain-only   Stop only blockchain services"
    echo "  --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                  # Stop all services"
    echo "  $0 --cleanup        # Stop all services and clean up data"
    echo "  $0 --status         # Stop all services and show status"
    echo "  $0 --frontend-only  # Stop only frontend"
    echo "  $0 --scitt-ccf-only # Stop only SCITT CCF services"
}

# Main script logic
main() {
    local cleanup_flag=false
    local status_flag=false
    local frontend_only=false
    local backend_only=false
    local scitt_ccf_only=false
    local ***REMOVED-KEYCLOAK_DB_PASSWORD***_only=false
    local blockchain_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --cleanup)
                cleanup_flag=true
                shift
                ;;
            --status)
                status_flag=true
                shift
                ;;
            --frontend-only)
                frontend_only=true
                shift
                ;;
            --backend-only)
                backend_only=true
                shift
                ;;
            --scitt-ccf-only)
                scitt_ccf_only=true
                shift
                ;;
            --***REMOVED-KEYCLOAK_DB_PASSWORD***-only)
                ***REMOVED-KEYCLOAK_DB_PASSWORD***_only=true
                shift
                ;;
            --blockchain-only)
                blockchain_only=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo ""
                show_help
                exit 1
                ;;
        esac
    done
    
    print_header "Stopping Contract Management System"
    echo "Timestamp: $(date)"
    echo ""
    
    # Stop services based on options
    if [ "$frontend_only" = true ]; then
        stop_frontend
    elif [ "$backend_only" = true ]; then
        stop_backend
    elif [ "$scitt_ccf_only" = true ]; then
        stop_scitt_ccf
    elif [ "$***REMOVED-KEYCLOAK_DB_PASSWORD***_only" = true ]; then
        stop_***REMOVED-KEYCLOAK_DB_PASSWORD***_***REMOVED-DB_PASSWORD***
    elif [ "$blockchain_only" = true ]; then
        stop_blockchain
    else
        # Stop all services
        print_status "Stopping all system services..."
        
        # Stop in reverse order of startup
        stop_frontend
        stop_backend
        stop_scitt_ccf
        stop_blockchain
        stop_***REMOVED-KEYCLOAK_DB_PASSWORD***_***REMOVED-DB_PASSWORD***
    fi
    
    # Clean up temporary files
    cleanup_temp_files
    
    # Show status if requested
    if [ "$status_flag" = true ]; then
        show_system_status
    fi
    
    echo ""
    print_success "System stop process completed"
    
    if [ "$cleanup_flag" = true ]; then
        echo ""
        print_warning "Note: All data has been cleaned up"
        print_warning "You will need to run setup again to use the system"
    fi
}

# Run main function with all arguments
main "$@"
