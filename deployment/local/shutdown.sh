#!/bin/bash

# Contract Management System - Comprehensive Shutdown Script
# This script provides multiple shutdown options for different scenarios

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

print_header() {
    echo -e "${PURPLE}=== $1 ===${NC}"
}

# Function to show help
show_help() {
    echo "Contract Management System - Shutdown Script"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  --all, -a           Stop all services (default)"
    echo "  --servers, -s       Stop only application servers (frontend, backend, blockchain)"
    echo "  --services, -i      Stop only IAM services (Keycloak, database)"
    echo "  --frontend, -f      Stop only frontend"
    echo "  --backend, -b       Stop only backend"
    echo "  --blockchain, -c    Stop only blockchain"
    echo "  --keycloak, -k      Stop only Keycloak"
    echo "  --force, --kill     Force kill all processes"
    echo "  --clean             Clean up all files and processes"
    echo "  --help, -h          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                  # Stop all services gracefully"
    echo "  $0 --force          # Force kill all processes"
    echo "  $0 --frontend       # Stop only frontend"
    echo "  $0 --clean          # Complete cleanup"
}

# Function to kill process by PID file
kill_by_pid_file() {
    local pid_file=$1
    local service_name=$2
    local force=${3:-false}
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            print_status "Stopping $service_name (PID: $pid)..."
            
            if [ "$force" = true ]; then
                kill -9 "$pid" 2>/dev/null
            else
                kill -TERM "$pid" 2>/dev/null
                
                # Wait for graceful shutdown
                local count=0
                while ps -p "$pid" > /dev/null 2>&1 && [ $count -lt 10 ]; do
                    sleep 1
                    count=$((count + 1))
                done
                
                # Force kill if still running
                if ps -p "$pid" > /dev/null 2>&1; then
                    print_warning "Force killing $service_name..."
                    kill -9 "$pid" 2>/dev/null
                fi
            fi
            
            print_success "$service_name stopped"
        else
            print_warning "$service_name process not found (PID: $pid)"
        fi
        
        # Remove PID file
        rm -f "$pid_file"
    else
        print_warning "No PID file found for $service_name"
    fi
}

# Function to kill processes by name pattern
kill_processes() {
    local pattern=$1
    local description=$2
    local force=${3:-false}
    
    print_status "Looking for $description..."
    
    # Find processes matching the pattern
    local pids=$(ps aux | grep "$pattern" | grep -v grep | awk '{print $2}')
    
    if [ -n "$pids" ]; then
        print_warning "Found processes: $pids"
        
        if [ "$force" = true ]; then
            echo "$pids" | xargs kill -9 2>/dev/null
        else
            echo "$pids" | xargs kill -TERM 2>/dev/null
            sleep 3
            # Force kill remaining processes
            local remaining=$(ps aux | grep "$pattern" | grep -v grep | awk '{print $2}')
            if [ -n "$remaining" ]; then
                print_warning "Force killing remaining processes..."
                echo "$remaining" | xargs kill -9 2>/dev/null
            fi
        fi
        
        print_success "Killed $description processes"
    else
        print_warning "No $description processes found"
    fi
}

# Function to kill processes by port
kill_port() {
    local port=$1
    local description=$2
    local force=${3:-false}
    
    print_status "Looking for processes on port $port ($description)..."
    
    # Find processes using the port
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        print_warning "Found processes on port $port: $pids"
        
        if [ "$force" = true ]; then
            echo "$pids" | xargs kill -9 2>/dev/null
        else
            echo "$pids" | xargs kill -TERM 2>/dev/null
            sleep 3
            # Force kill remaining processes
            local remaining=$(lsof -ti:$port 2>/dev/null)
            if [ -n "$remaining" ]; then
                print_warning "Force killing remaining processes on port $port..."
                echo "$remaining" | xargs kill -9 2>/dev/null
            fi
        fi
        
        print_success "Killed processes on port $port"
    else
        print_warning "No processes found on port $port"
    fi
}

# Function to stop Docker containers
stop_docker_containers() {
    print_status "Stopping Docker containers..."
    
    # Stop Keycloak container
    if docker ps | grep -q "keycloak"; then
        docker stop $(docker ps -q --filter "name=keycloak") 2>/dev/null || true
        docker rm $(docker ps -aq --filter "name=keycloak") 2>/dev/null || true
        print_success "Keycloak Docker container stopped"
    fi
    
    # Stop any other project containers
    if docker ps | grep -q "contract-management"; then
        docker stop $(docker ps -q --filter "name=contract-management") 2>/dev/null || true
        docker rm $(docker ps -aq --filter "name=contract-management") 2>/dev/null || true
        print_success "Contract management Docker containers stopped"
    fi
    
    # Stop all containers if force mode
    if [ "$FORCE_MODE" = true ]; then
        print_warning "Stopping all running containers..."
        docker stop $(docker ps -q) 2>/dev/null || true
        print_success "All Docker containers stopped"
    fi
}

# Function to stop frontend
stop_frontend() {
    print_header "Stopping Frontend"
    
    # Stop by PID file
    kill_by_pid_file "frontend.pid" "Frontend" "$FORCE_MODE"
    kill_by_pid_file ".frontend.pid" "Frontend" "$FORCE_MODE"
    
    # Stop by process name
    kill_processes "react-scripts" "React development server" "$FORCE_MODE"
    kill_processes "npm.*start" "npm start processes" "$FORCE_MODE"
    
    # Stop by port
    kill_port 3000 "Frontend (React)" "$FORCE_MODE"
    kill_port 3001 "Frontend (Alternative)" "$FORCE_MODE"
    
    # Clean up frontend files
    rm -f frontend.port
}

# Function to stop backend
stop_backend() {
    print_header "Stopping Backend"
    
    # Stop by PID file
    kill_by_pid_file "backend.pid" "Backend" "$FORCE_MODE"
    kill_by_pid_file ".backend.pid" "Backend" "$FORCE_MODE"
    
    # Stop by process name
    kill_processes "node.*server.js" "Node.js backend server" "$FORCE_MODE"
    kill_processes "npm.*start" "npm start processes" "$FORCE_MODE"
    
    # Stop by port
    kill_port 5000 "Backend (Express)" "$FORCE_MODE"
    kill_port 5001 "Backend (Alternative)" "$FORCE_MODE"
}

# Function to stop blockchain
stop_blockchain() {
    print_header "Stopping Blockchain"
    
    # Stop by PID file
    kill_by_pid_file "blockchain.pid" "Blockchain" "$FORCE_MODE"
    kill_by_pid_file ".hardhat.pid" "Hardhat" "$FORCE_MODE"
    
    # Stop by process name
    kill_processes "hardhat" "Hardhat blockchain" "$FORCE_MODE"
    kill_processes "npx.*hardhat" "Hardhat processes" "$FORCE_MODE"
    
    # Stop by port
    kill_port 8545 "Blockchain (Hardhat)" "$FORCE_MODE"
    
    # Clean up blockchain files
    rm -f blockchain.log
}

# Function to stop Keycloak
stop_keycloak() {
    print_header "Stopping Keycloak"
    
    # Stop by PID file
    kill_by_pid_file "keycloak.pid" "Keycloak" "$FORCE_MODE"
    kill_by_pid_file ".keycloak.pid" "Keycloak" "$FORCE_MODE"
    
    # Stop by process name
    kill_processes "keycloak" "Keycloak server" "$FORCE_MODE"
    kill_processes "java.*keycloak" "Keycloak Java process" "$FORCE_MODE"
    
    # Stop by port
    kill_port 8080 "Keycloak" "$FORCE_MODE"
    kill_port 8081 "Keycloak API" "$FORCE_MODE"
    
    # Stop Docker containers
    stop_docker_containers
}

# Function to clean up files
cleanup_files() {
    print_header "Cleaning Up Files"
    
    # Remove PID files
    rm -f *.pid .*.pid
    rm -f frontend.pid backend.pid blockchain.pid keycloak.pid
    rm -f .frontend.pid .backend.pid .hardhat.pid .keycloak.pid
    
    # Remove log files
    rm -f *.log
    rm -f backend.log frontend.log blockchain.log keycloak.log
    
    # Remove port files
    rm -f frontend.port
    
    # Remove temporary files
    rm -f .env.local .env.development.local .env.test.local .env.production.local
    
    # Clean npm cache if requested
    if [ "$CLEAN_MODE" = true ]; then
        print_status "Cleaning npm cache..."
        npm cache clean --force 2>/dev/null || true
        
        # Remove node_modules if requested
        if [ "$REMOVE_NODE_MODULES" = true ]; then
            print_status "Removing node_modules..."
            rm -rf frontend/node_modules backend/node_modules blockchain/node_modules 2>/dev/null || true
        fi
    fi
    
    print_success "File cleanup completed"
}

# Function to check remaining processes
check_remaining_processes() {
    print_header "Checking Remaining Processes"
    
    local all_stopped=true
    
    # Check for remaining processes
    local services=(
        "Frontend:react-scripts:3000"
        "Backend:node.*server:5000"
        "Blockchain:hardhat:8545"
        "Keycloak:keycloak:8080"
    )
    
    for service in "${services[@]}"; do
        IFS=':' read -r name process port <<< "$service"
        
        if pgrep -f "$process" >/dev/null; then
            echo -e "  ${RED}❌${NC} $name is still running"
            all_stopped=false
        else
            echo -e "  ${GREEN}✅${NC} $name stopped"
        fi
        
        # Check port
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "  ${RED}❌${NC} Port $port is still in use"
            all_stopped=false
        else
            echo -e "  ${GREEN}✅${NC} Port $port is free"
        fi
    done
    
    echo ""
    if [ "$all_stopped" = true ]; then
        print_success "🎉 All services stopped successfully!"
    else
        print_warning "⚠️  Some services may still be running"
        if [ "$FORCE_MODE" = false ]; then
            echo "   Try running with --force to kill all processes"
        fi
    fi
}

# Function to show port status
show_port_status() {
    print_header "Port Status"
    
    local ports=(3000 3001 5000 5001 8080 8081 8545 5432 6379)
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            local process=$(lsof -Pi :$port -sTCP:LISTEN | tail -n +2 | awk '{print $1}' | head -1)
            echo -e "  ${RED}❌${NC} Port $port: IN USE by $process"
        else
            echo -e "  ${GREEN}✅${NC} Port $port: FREE"
        fi
    done
}

# Main shutdown function
main() {
    print_header "Contract Management System Shutdown"
    
    # Check if we're in the right directory
    if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        print_error "Please run this script from the ContractManagement root directory"
        exit 1
    fi
    
    # Determine what to stop based on arguments
    local stop_frontend_flag=false
    local stop_backend_flag=false
    local stop_blockchain_flag=false
    local stop_keycloak_flag=false
    local stop_servers_flag=false
    local stop_services_flag=false
    local stop_all_flag=true
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --all|-a)
                stop_all_flag=true
                shift
                ;;
            --servers|-s)
                stop_servers_flag=true
                stop_all_flag=false
                shift
                ;;
            --services|-i)
                stop_services_flag=true
                stop_all_flag=false
                shift
                ;;
            --frontend|-f)
                stop_frontend_flag=true
                stop_all_flag=false
                shift
                ;;
            --backend|-b)
                stop_backend_flag=true
                stop_all_flag=false
                shift
                ;;
            --blockchain|-c)
                stop_blockchain_flag=true
                stop_all_flag=false
                shift
                ;;
            --keycloak|-k)
                stop_keycloak_flag=true
                stop_all_flag=false
                shift
                ;;
            --force|--kill)
                FORCE_MODE=true
                shift
                ;;
            --clean)
                CLEAN_MODE=true
                shift
                ;;
            --remove-node-modules)
                REMOVE_NODE_MODULES=true
                shift
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
    done
    
    # Set default behavior
    if [ "$stop_all_flag" = true ]; then
        stop_frontend_flag=true
        stop_backend_flag=true
        stop_blockchain_flag=true
        stop_keycloak_flag=true
    elif [ "$stop_servers_flag" = true ]; then
        stop_frontend_flag=true
        stop_backend_flag=true
        stop_blockchain_flag=true
    elif [ "$stop_services_flag" = true ]; then
        stop_keycloak_flag=true
    fi
    
    # Execute shutdown based on flags
    if [ "$stop_frontend_flag" = true ]; then
        stop_frontend
    fi
    
    if [ "$stop_backend_flag" = true ]; then
        stop_backend
    fi
    
    if [ "$stop_blockchain_flag" = true ]; then
        stop_blockchain
    fi
    
    if [ "$stop_keycloak_flag" = true ]; then
        stop_keycloak
    fi
    
    # Cleanup if requested
    if [ "$CLEAN_MODE" = true ]; then
        cleanup_files
    fi
    
    # Check remaining processes
    check_remaining_processes
    
    # Show port status
    show_port_status
    
    echo ""
    print_success "Shutdown completed!"
    echo ""
    echo "📝 To restart services:"
    echo "  All services: ./start-servers.sh"
    echo "  Frontend only: cd frontend && npm start"
    echo "  Backend only:  cd backend && npm start"
    echo "  Blockchain:    cd blockchain && npx hardhat node"
}

# Initialize variables
FORCE_MODE=false
CLEAN_MODE=false
REMOVE_NODE_MODULES=false

# Run main function
main "$@" 