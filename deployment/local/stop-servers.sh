#!/bin/bash

# Stop All Servers Script
# This script stops all running development servers for the Contract Management System

echo "🛑 Stopping all Contract Management servers..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to kill process by PID file
kill_by_pid_file() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${BLUE}🔍 Stopping $service_name (PID: $pid)...${NC}"
            kill -TERM "$pid" 2>/dev/null
            
            # Wait for graceful shutdown
            local count=0
            while ps -p "$pid" > /dev/null 2>&1 && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
            done
            
            # Force kill if still running
            if ps -p "$pid" > /dev/null 2>&1; then
                echo -e "${YELLOW}⚠️  Force killing $service_name...${NC}"
                kill -9 "$pid" 2>/dev/null
            fi
            
            echo -e "${GREEN}✅ $service_name stopped${NC}"
        else
            echo -e "${YELLOW}ℹ️  $service_name process not found (PID: $pid)${NC}"
        fi
        
        # Remove PID file
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}ℹ️  No PID file found for $service_name${NC}"
    fi
}

# Function to kill processes by name pattern
kill_processes() {
    local pattern=$1
    local description=$2
    
    echo -e "${BLUE}🔍 Looking for $description...${NC}"
    
    # Find processes matching the pattern
    local pids=$(ps aux | grep "$pattern" | grep -v grep | awk '{print $2}')
    
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}📋 Found processes: $pids${NC}"
        echo "$pids" | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✅ Killed $description processes${NC}"
    else
        echo -e "${YELLOW}ℹ️  No $description processes found${NC}"
    fi
}

# Function to kill processes by port
kill_port() {
    local port=$1
    local description=$2
    
    echo -e "${BLUE}🔍 Looking for processes on port $port ($description)...${NC}"
    
    # Find processes using the port
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}📋 Found processes on port $port: $pids${NC}"
        echo "$pids" | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✅ Killed processes on port $port${NC}"
    else
        echo -e "${YELLOW}ℹ️  No processes found on port $port${NC}"
    fi
}

# Function to stop blockchain
kill_blockchain() {
    kill_by_pid_file "blockchain.pid" "Blockchain"
    kill_port 8545 "Blockchain"
    rm -f blockchain.log
}

# Function to stop Keycloak (via docker-compose)
kill_keycloak() {
    if [ -f "docker-compose.iam.yml" ]; then
        echo -e "${BLUE}🛑 Stopping Keycloak (IAM) service via Docker Compose...${NC}"
        docker-compose -f docker-compose.iam.yml stop keycloak
        docker-compose -f docker-compose.iam.yml rm -f keycloak
        echo -e "${GREEN}✅ Keycloak stopped${NC}"
    else
        echo -e "${YELLOW}ℹ️  docker-compose.iam.yml not found, skipping Keycloak stop${NC}"
    fi
}

# Main execution
main() {
    echo -e "${BLUE}🔍 Checking current directory...${NC}"
    echo "Current directory: $(pwd)"
    
    # Check if we're in the right directory
    if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        echo -e "${RED}❌ Please run this script from the ContractManagement root directory${NC}"
        exit 1
    fi
    
    # Stop services using PID files (preferred method)
    echo -e "${BLUE}🛑 Stopping services using PID files...${NC}"
    kill_by_pid_file "backend.pid" "Backend"
    kill_by_pid_file "frontend.pid" "Frontend"
    kill_blockchain
    kill_keycloak
    
    # Remove port file
    rm -f frontend.port
    
    # Fallback: Stop processes by name and port
    echo -e "${BLUE}🛑 Fallback cleanup...${NC}"
    
    # Stop React development server
    kill_processes "react-scripts" "React development server"
    kill_processes "npm start" "npm start processes"
    
    # Stop Node.js backend server
    kill_processes "node server.js" "Node.js backend server"
    kill_processes "node.*server" "Node.js server processes"
    
    # Stop processes on specific ports
    kill_port 3000 "Frontend (React)"
    kill_port 3001 "Frontend (Alternative)"
    kill_port 5000 "Backend (Alternative)"
    kill_port 5001 "Backend (Node.js)"
    
    # Stop any remaining npm processes related to this project
    echo -e "${BLUE}🔍 Looking for npm processes in project directories...${NC}"
    
    # Kill npm processes in frontend and backend directories
    for dir in frontend backend; do
        if [ -d "$dir" ]; then
            echo -e "${BLUE}🔍 Checking $dir directory...${NC}"
            cd "$dir" 2>/dev/null || continue
            
            # Kill any npm processes started from this directory
            pids=$(ps aux | grep "npm.*start" | grep "$(pwd)" | grep -v grep | awk '{print $2}')
            if [ -n "$pids" ]; then
                echo -e "${YELLOW}📋 Found npm processes in $dir: $pids${NC}"
                echo "$pids" | xargs kill -9 2>/dev/null
                echo -e "${GREEN}✅ Killed npm processes in $dir${NC}"
            fi
            
            cd .. 2>/dev/null || continue
        fi
    done
    
    # Final cleanup - kill any remaining node processes that might be related
    echo -e "${BLUE}🔍 Final cleanup - checking for any remaining Node.js processes...${NC}"
    sleep 2
    
    # Check if any processes are still running
    remaining=$(ps aux | grep -E "(react-scripts|npm start|node server)" | grep -v grep)
    if [ -n "$remaining" ]; then
        echo -e "${YELLOW}⚠️  Some processes may still be running:${NC}"
        echo "$remaining"
        echo -e "${YELLOW}💡 You may need to manually kill them or restart your terminal${NC}"
    else
        echo -e "${GREEN}✅ All servers stopped successfully!${NC}"
    fi
    
    # Clean up log files
    echo -e "${BLUE}🧹 Cleaning up log files...${NC}"
    rm -f backend.log frontend.log blockchain.log
    
    echo -e "\n${GREEN}🎉 Server cleanup complete!${NC}"
    echo -e "${BLUE}📝 To restart servers:${NC}"
    echo -e "   All services: ./start-servers.sh"
    echo -e "   Frontend only: cd frontend && npm start"
    echo -e "   Backend only:  cd backend && npm start"
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTION]"
        echo "Options:"
        echo "  --help, -h  Show this help message"
        echo ""
        echo "Without options, stops all services"
        ;;
    *)
        main
        ;;
esac 