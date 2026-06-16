#!/bin/bash


source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../lib/common.sh"
resolve_repo_root
# SCITT CCF Stop Script
# This script stops all SCITT CCF services and cleans up

set -e

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

# Function to check if SCITT CCF is running
check_scitt_ccf_running() {
    if run_compose "docker-compose.scitt-ccf-dev.yml" ps | grep -q "Up"; then
        return 0
    else
        return 1
    fi
}

# Function to stop SCITT CCF services
stop_scitt_ccf_services() {
    print_header "Stopping SCITT CCF Services"
    
    if [ -f "$(compose_path "docker-compose.scitt-ccf-dev.yml")" ]; then
        if check_scitt_ccf_running; then
            print_status "Stopping SCITT CCF services..."
            run_compose "docker-compose.scitt-ccf-dev.yml" down
            
            # Wait for services to stop
            sleep 5
            
            if check_scitt_ccf_running; then
                print_warning "Some services still running, forcing stop..."
                run_compose "docker-compose.scitt-ccf-dev.yml" down --remove-orphans
            fi
            
            print_success "SCITT CCF services stopped"
        else
            print_warning "SCITT CCF services are not running"
        fi
    else
        print_warning "SCITT CCF Docker Compose file not found"
    fi
}

# Function to stop backend if running with SCITT CCF
stop_backend_if_scitt_ccf() {
    print_header "Checking Backend Status"
    
    # Check if backend is running
    if pgrep -f "node server.js" > /dev/null; then
        print_status "Backend is running, checking if it's using SCITT CCF..."
        
        # Check if backend is using SCITT CCF
        if curl -s "http://localhost:5001/health" > /dev/null 2>&1; then
            local migration_mode
            migration_mode=$(curl -s "http://localhost:5001/api/system/health" 2>/dev/null | jq -r '.migrationMode // "unknown"' 2>/dev/null || echo "unknown")
            
            if [ "$migration_mode" != "ETHEREUM_ONLY" ]; then
                print_status "Backend is using SCITT CCF (mode: $migration_mode), stopping..."
                pkill -f "node server.js"
                sleep 2
                print_success "Backend stopped"
            else
                print_warning "Backend is in ETHEREUM_ONLY mode, leaving it running"
            fi
        else
            print_warning "Cannot check backend status, stopping anyway..."
            pkill -f "node server.js"
            sleep 2
            print_success "Backend stopped"
        fi
    else
        print_warning "Backend is not running"
    fi
}

# Function to clean up SCITT CCF data
cleanup_scitt_ccf_data() {
    print_header "Cleaning Up SCITT CCF Data"
    
    # Check if cleanup is requested
    if [ "$1" = "--cleanup" ]; then
        print_status "Cleaning up SCITT CCF data..."
        
        # Remove Docker volumes
        if docker volume ls | grep -q "scitt_ccf"; then
            print_status "Removing SCITT CCF Docker volumes..."
            docker volume rm $(docker volume ls -q | grep "scitt_ccf") 2>/dev/null || true
        fi
        
        # Remove SCITT CCF data directory
        if [ -d "deployment/scitt-ccf-data" ]; then
            print_status "Removing SCITT CCF data directory..."
            rm -rf deployment/scitt-ccf-data
        fi
        
        # Remove SCITT CCF logs
        if [ -d "logs" ] && [ -n "$(find logs -name '*scitt*' -o -name '*ccf*')" ]; then
            print_status "Removing SCITT CCF logs..."
            find logs -name '*scitt*' -o -name '*ccf*' -delete 2>/dev/null || true
        fi
        
        print_success "SCITT CCF data cleaned up"
    else
        print_warning "Use --cleanup to remove SCITT CCF data and volumes"
    fi
}

# Function to show status
show_status() {
    print_header "SCITT CCF Status"
    
    echo "🔍 Checking SCITT CCF services..."
    
    if [ -f "$(compose_path "docker-compose.scitt-ccf-dev.yml")" ]; then
        if check_scitt_ccf_running; then
            print_warning "SCITT CCF services are still running"
            run_compose "docker-compose.scitt-ccf-dev.yml" ps
        else
            print_success "SCITT CCF services are stopped"
        fi
    else
        print_warning "SCITT CCF Docker Compose file not found"
    fi
    
    echo ""
    echo "🔍 Checking backend status..."
    
    if pgrep -f "node server.js" > /dev/null; then
        print_warning "Backend is still running"
        echo "   PID: $(pgrep -f 'node server.js')"
    else
        print_success "Backend is stopped"
    fi
    
    echo ""
    echo "🔍 Checking ports..."
    
    # Check SCITT CCF ports
    if lsof -i :8000 > /dev/null 2>&1; then
        print_warning "Port 8000 is still in use"
        lsof -i :8000
    else
        print_success "Port 8000 is free"
    fi
    
    if lsof -i :8001 > /dev/null 2>&1; then
        print_warning "Port 8001 is still in use"
        lsof -i :8001
    else
        print_success "Port 8001 is free"
    fi
}

# Function to show help
show_help() {
    echo "SCITT CCF Stop Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --status           Show current status after stopping"
    echo "  --cleanup          Remove SCITT CCF data and volumes"
    echo "  --force            Force stop all services"
    echo "  --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                 # Stop SCITT CCF services"
    echo "  $0 --status        # Stop and show status"
    echo "  $0 --cleanup       # Stop and clean up data"
    echo "  $0 --force         # Force stop all services"
}

# Main script logic
main() {
    local show_status_flag=false
    local cleanup_flag=false
    local force_flag=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --status)
                show_status_flag=true
                shift
                ;;
            --cleanup)
                cleanup_flag=true
                shift
                ;;
            --force)
                force_flag=true
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
    
    print_header "Stopping SCITT CCF Integration"
    echo "Timestamp: $(date)"
    echo ""
    
    # Stop SCITT CCF services
    stop_scitt_ccf_services
    
    # Stop backend if needed
    stop_backend_if_scitt_ccf
    
    # Clean up data if requested
    if [ "$cleanup_flag" = true ]; then
        cleanup_scitt_ccf_data --cleanup
    fi
    
    # Show status if requested
    if [ "$show_status_flag" = true ]; then
        show_status
    fi
    
    echo ""
    print_success "SCITT CCF stop process completed"
    
    if [ "$cleanup_flag" = true ]; then
        echo ""
        print_warning "Note: SCITT CCF data has been cleaned up"
        print_warning "You will need to run setup again to use SCITT CCF"
    fi
}

# Run main function with all arguments
main "$@"
