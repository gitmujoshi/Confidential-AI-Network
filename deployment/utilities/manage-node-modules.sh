#!/bin/bash

# Node Modules Management Script for Contract Management System
# Provides easy commands to remove and reinstall node_modules for memory optimization

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to get node_modules sizes
get_node_modules_sizes() {
    echo "Current node_modules sizes:"
    if [ -d "frontend/node_modules" ]; then
        local frontend_size=$(du -sh frontend/node_modules | cut -f1)
        echo "  Frontend: $frontend_size"
    else
        echo "  Frontend: Not installed"
    fi
    
    if [ -d "backend/node_modules" ]; then
        local backend_size=$(du -sh backend/node_modules | cut -f1)
        echo "  Backend: $backend_size"
    else
        echo "  Backend: Not installed"
    fi
    
    if [ -d "blockchain/node_modules" ]; then
        local blockchain_size=$(du -sh blockchain/node_modules | cut -f1)
        echo "  Blockchain: $blockchain_size"
    else
        echo "  Blockchain: Not installed"
    fi
    echo ""
}

# Function to remove node_modules
remove_node_modules() {
    local component=$1
    
    case $component in
        "frontend")
            if [ -d "frontend/node_modules" ]; then
                print_status "Removing frontend node_modules..."
                rm -rf frontend/node_modules
                print_success "Frontend node_modules removed"
            else
                print_warning "Frontend node_modules not found"
            fi
            ;;
        "backend")
            if [ -d "backend/node_modules" ]; then
                print_status "Removing backend node_modules..."
                rm -rf backend/node_modules
                print_success "Backend node_modules removed"
            else
                print_warning "Backend node_modules not found"
            fi
            ;;
        "blockchain")
            if [ -d "blockchain/node_modules" ]; then
                print_status "Removing blockchain node_modules..."
                rm -rf blockchain/node_modules
                print_success "Blockchain node_modules removed"
            else
                print_warning "Blockchain node_modules not found"
            fi
            ;;
        "all")
            print_status "Removing all node_modules..."
            rm -rf frontend/node_modules backend/node_modules blockchain/node_modules 2>/dev/null || true
            print_success "All node_modules removed"
            ;;
        *)
            print_error "Invalid component: $component"
            exit 1
            ;;
    esac
}

# Function to install node_modules
install_node_modules() {
    local component=$1
    
    case $component in
        "frontend")
            if [ ! -d "frontend/node_modules" ]; then
                print_status "Installing frontend node_modules..."
                cd frontend
                npm ci
                cd ..
                print_success "Frontend node_modules installed"
            else
                print_warning "Frontend node_modules already exists"
            fi
            ;;
        "backend")
            if [ ! -d "backend/node_modules" ]; then
                print_status "Installing backend node_modules..."
                cd backend
                npm ci
                cd ..
                print_success "Backend node_modules installed"
            else
                print_warning "Backend node_modules already exists"
            fi
            ;;
        "blockchain")
            if [ ! -d "blockchain/node_modules" ]; then
                print_status "Installing blockchain node_modules..."
                cd blockchain
                npm ci
                cd ..
                print_success "Blockchain node_modules installed"
            else
                print_warning "Blockchain node_modules already exists"
            fi
            ;;
        "all")
            print_status "Installing all node_modules..."
            
            # Install frontend
            if [ ! -d "frontend/node_modules" ]; then
                print_status "Installing frontend..."
                cd frontend && npm ci && cd ..
            fi
            
            # Install backend
            if [ ! -d "backend/node_modules" ]; then
                print_status "Installing backend..."
                cd backend && npm ci && cd ..
            fi
            
            # Install blockchain
            if [ ! -d "blockchain/node_modules" ]; then
                print_status "Installing blockchain..."
                cd blockchain && npm ci && cd ..
            fi
            
            print_success "All node_modules installed"
            ;;
        *)
            print_error "Invalid component: $component"
            exit 1
            ;;
    esac
}

# Function to show memory impact
show_memory_impact() {
    print_header "Memory Impact Analysis"
    
    local total_size=0
    local components=()
    
    if [ -d "frontend/node_modules" ]; then
        local frontend_size=$(du -sm frontend/node_modules | cut -f1)
        total_size=$((total_size + frontend_size))
        components+=("Frontend: ${frontend_size}MB")
    fi
    
    if [ -d "backend/node_modules" ]; then
        local backend_size=$(du -sm backend/node_modules | cut -f1)
        total_size=$((total_size + backend_size))
        components+=("Backend: ${backend_size}MB")
    fi
    
    if [ -d "blockchain/node_modules" ]; then
        local blockchain_size=$(du -sm blockchain/node_modules | cut -f1)
        total_size=$((total_size + blockchain_size))
        components+=("Blockchain: ${blockchain_size}MB")
    fi
    
    echo "Current node_modules memory usage:"
    for component in "${components[@]}"; do
        echo "  $component"
    done
    echo ""
    echo "Total memory used by node_modules: ${total_size}MB"
    echo ""
    
    if [ $total_size -gt 1000 ]; then
        print_warning "High memory usage! Consider removing unused components."
    elif [ $total_size -gt 500 ]; then
        print_status "Moderate memory usage."
    else
        print_success "Low memory usage."
    fi
}

# Function to show development scenarios
show_development_scenarios() {
    print_header "Development Scenarios"
    
    echo "1. Frontend Development Only:"
    echo "   ./scripts/manage-node-modules.sh remove backend blockchain"
    echo "   ./scripts/manage-node-modules.sh install frontend"
    echo ""
    
    echo "2. Backend Development Only:"
    echo "   ./scripts/manage-node-modules.sh remove frontend blockchain"
    echo "   ./scripts/manage-node-modules.sh install backend"
    echo ""
    
    echo "3. Blockchain Development Only:"
    echo "   ./scripts/manage-node-modules.sh remove frontend backend"
    echo "   ./scripts/manage-node-modules.sh install blockchain"
    echo ""
    
    echo "4. Full Stack Development:"
    echo "   ./scripts/manage-node-modules.sh install all"
    echo ""
    
    echo "5. Memory Optimization (Remove All):"
    echo "   ./scripts/manage-node-modules.sh remove all"
    echo ""
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND] [COMPONENT]"
    echo ""
    echo "Commands:"
    echo "  remove [component]    Remove node_modules for specified component"
    echo "  install [component]   Install node_modules for specified component"
    echo "  status               Show current node_modules status and sizes"
    echo "  memory               Show memory impact analysis"
    echo "  scenarios            Show development scenarios"
    echo "  help                 Show this help message"
    echo ""
    echo "Components:"
    echo "  frontend             Frontend React application"
    echo "  backend              Backend Express.js API"
    echo "  blockchain           Blockchain Hardhat project"
    echo "  all                  All components"
    echo ""
    echo "Examples:"
    echo "  $0 remove all                    # Remove all node_modules"
    echo "  $0 install frontend              # Install frontend only"
    echo "  $0 remove backend blockchain     # Remove backend and blockchain"
    echo "  $0 status                        # Show current status"
    echo "  $0 memory                        # Show memory impact"
    echo ""
}

# Main script logic
case "${1:-}" in
    "remove")
        if [ -z "${2:-}" ]; then
            print_error "Please specify a component to remove"
            echo "Use: $0 remove [frontend|backend|blockchain|all]"
            exit 1
        fi
        remove_node_modules "$2"
        ;;
    "install")
        if [ -z "${2:-}" ]; then
            print_error "Please specify a component to install"
            echo "Use: $0 install [frontend|backend|blockchain|all]"
            exit 1
        fi
        install_node_modules "$2"
        ;;
    "status")
        print_header "Node Modules Status"
        get_node_modules_sizes
        ;;
    "memory")
        show_memory_impact
        ;;
    "scenarios")
        show_development_scenarios
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: ${1:-}"
        echo ""
        show_help
        exit 1
        ;;
esac 