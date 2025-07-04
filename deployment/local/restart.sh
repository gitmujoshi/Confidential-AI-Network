#!/bin/bash

# Contract Management System - Restart Script
# This script restarts services with proper shutdown and startup sequence

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

print_header() {
    echo -e "${PURPLE}=== $1 ===${NC}"
}

# Function to show help
show_help() {
    echo "Contract Management System - Restart Script"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  --all, -a           Restart all services (default)"
    echo "  --servers, -s       Restart only application servers"
    echo "  --services, -i      Restart only IAM services"
    echo "  --frontend, -f      Restart only frontend"
    echo "  --backend, -b       Restart only backend"
    echo "  --blockchain, -c    Restart only blockchain"
    echo "  --keycloak, -k      Restart only Keycloak"
    echo "  --force             Force restart (kill and start)"
    echo "  --clean             Clean restart (clean files and restart)"
    echo "  --help, -h          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                  # Restart all services gracefully"
    echo "  $0 --force          # Force restart all services"
    echo "  $0 --frontend       # Restart only frontend"
    echo "  $0 --clean          # Clean restart all services"
}

# Function to restart services
restart_services() {
    local service_type=$1
    local force=${2:-false}
    local clean=${3:-false}
    
    print_header "Restarting $service_type"
    
    # Stop services
    print_status "Stopping $service_type..."
    if [ "$force" = true ]; then
        ./shutdown.sh --$service_type --force
    else
        ./shutdown.sh --$service_type
    fi
    
    # Wait a moment
    sleep 2
    
    # Clean if requested
    if [ "$clean" = true ]; then
        print_status "Cleaning up files..."
        ./shutdown.sh --clean
        sleep 1
    fi
    
    # Start services
    print_status "Starting $service_type..."
    case $service_type in
        "all")
            ./start-servers.sh
            ;;
        "servers")
            ./start-servers.sh
            ;;
        "services")
            ./start-services.sh
            ;;
        "frontend")
            cd frontend && npm start &
            cd ..
            ;;
        "backend")
            cd backend && npm start &
            cd ..
            ;;
        "blockchain")
            cd blockchain && npx hardhat node &
            cd ..
            ;;
        "keycloak")
            docker-compose -f ../utilities/docker-compose.iam.yml up -d keycloak
            ;;
    esac
    
    print_success "$service_type restarted successfully"
}

# Main restart function
main() {
    print_header "Contract Management System Restart"
    
    # Check if we're in the right directory
    if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        echo -e "${RED}❌ Please run this script from the ContractManagement root directory${NC}"
        exit 1
    fi
    
    # Parse command line arguments
    local restart_type="all"
    local force_mode=false
    local clean_mode=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --all|-a)
                restart_type="all"
                shift
                ;;
            --servers|-s)
                restart_type="servers"
                shift
                ;;
            --services|-i)
                restart_type="services"
                shift
                ;;
            --frontend|-f)
                restart_type="frontend"
                shift
                ;;
            --backend|-b)
                restart_type="backend"
                shift
                ;;
            --blockchain|-c)
                restart_type="blockchain"
                shift
                ;;
            --keycloak|-k)
                restart_type="keycloak"
                shift
                ;;
            --force)
                force_mode=true
                shift
                ;;
            --clean)
                clean_mode=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Unknown option: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Execute restart
    restart_services "$restart_type" "$force_mode" "$clean_mode"
    
    # Wait for services to start
    print_status "Waiting for services to start..."
    sleep 5
    
    # Check status
    print_status "Checking service status..."
    ./status.sh
    
    echo ""
    print_success "🎉 Restart completed!"
    echo ""
    echo "📝 Service URLs:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:5000"
    echo "  Keycloak: http://localhost:8080"
    echo "  Blockchain: http://localhost:8545"
}

# Run main function
main "$@" 