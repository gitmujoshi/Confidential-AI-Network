#!/bin/bash

# Contract Management System - Service Stop Script
# This script stops all services and cleans up processes

echo "🛑 Stopping Contract Management System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to kill process by PID file
kill_by_pid_file() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            print_status "Stopping $service_name (PID: $pid)..."
            kill $pid 2>/dev/null || true
            sleep 2
            
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                print_warning "Force killing $service_name..."
                kill -9 $pid 2>/dev/null || true
            fi
            
            rm -f "$pid_file"
            print_success "$service_name stopped"
        else
            print_warning "$service_name was not running"
            rm -f "$pid_file"
        fi
    else
        print_warning "No PID file found for $service_name"
    fi
}

# Function to kill processes by name
kill_process() {
    local process_name=$1
    local service_name=$2
    
    if pgrep -f "$process_name" >/dev/null; then
        print_status "Stopping $service_name processes..."
        pkill -f "$process_name" || true
        sleep 2
        
        # Force kill if still running
        if pgrep -f "$process_name" >/dev/null; then
            print_warning "Force killing $service_name..."
            pkill -9 -f "$process_name" || true
        fi
        
        print_success "$service_name stopped"
    else
        print_warning "$service_name was not running"
    fi
}

# Stop services by PID files
print_status "Stopping services by PID files..."
kill_by_pid_file "../../.frontend.pid" "Frontend"
kill_by_pid_file "../../.backend.pid" "Backend"
kill_by_pid_file "../../.scitt-ccf.pid" "SCITT CCF"

# Stop SCITT CCF Docker containers
print_status "Stopping SCITT CCF Docker containers..."
cd ../..
if [ -f "./manage-scitt-ccf.sh" ]; then
    ./manage-scitt-ccf.sh stop >/dev/null 2>&1 || true
    print_success "SCITT CCF services stopped"
else
    print_warning "manage-scitt-ccf.sh script not found"
fi
cd deployment/local

# Stop Keycloak Docker container
print_status "Stopping Keycloak Docker container..."
if docker ps | grep -q "keycloak-cms"; then
    docker stop keycloak-cms 2>/dev/null || true
    docker rm keycloak-cms 2>/dev/null || true
    print_success "Keycloak Docker container stopped"
else
    print_warning "Keycloak Docker container was not running"
fi

# Stop main database containers
print_status "Stopping main database containers..."
cd ../..
if [ -f "docker-compose.main.yml" ]; then
    docker-compose -f docker-compose.main.yml down 2>/dev/null || true
    print_success "Main database containers stopped"
else
    print_warning "docker-compose.main.yml not found"
fi
cd deployment/local

# Kill by process name as fallback
print_status "Killing any remaining processes..."
kill_process "react-scripts" "Frontend"
kill_process "node server.js" "Backend"
kill_process "manage-scitt-ccf" "SCITT CCF"

# Clean up PID files
rm -f ../../.frontend.pid ../../.backend.pid ../../.scitt-ccf.pid ../../.keycloak.pid

# Check if any services are still running
echo ""
print_status "Checking for any remaining processes..."

services=(
    "Frontend:react-scripts:3000"
    "Backend:node server.js:5001"
    "SCITT CCF:manage-scitt-ccf:8000"
    "Keycloak:keycloak:8080"
)

all_stopped=true

for service in "${services[@]}"; do
    IFS=':' read -r name process port <<< "$service"
    
    if pgrep -f "$process" >/dev/null; then
        echo -e "  ${RED}❌${NC} $name is still running"
        all_stopped=false
    else
        echo -e "  ${GREEN}✅${NC} $name stopped"
    fi
done

echo ""
if [ "$all_stopped" = true ]; then
    print_success "🎉 All services stopped successfully!"
else
    print_warning "⚠️  Some services may still be running. You may need to stop them manually."
fi

echo ""
echo "📝 To start all services again, run: ./start-services.sh"

echo ""
echo "📊 Port Status:"
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "  Port 5001: IN USE"
else
    echo "  Port 5001: FREE"
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "  Port 3000: IN USE"
else
    echo "  Port 3000: FREE"
fi

if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "  Port 8000: IN USE"
else
    echo "  Port 8000: FREE"
fi

if lsof -Pi :8082 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "  Port 8082: IN USE"
else
    echo "  Port 8082: FREE"
fi
echo "" 