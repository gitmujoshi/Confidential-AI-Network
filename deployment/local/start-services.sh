#!/bin/bash

# Contract Management System - Complete Service Startup Script
# This script starts all services: Keycloak, SCITT CCF, Backend, and Frontend

set -e  # Exit on any error

echo "🚀 Starting Contract Management System with all services..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within $((max_attempts * 2)) seconds"
    return 1
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
            rm -f "$pid_file"
        fi
    fi
}

# Store the script directory for later use
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Stop any existing services
print_status "Stopping any existing services..."
./stop-services.sh 2>/dev/null || true

# Step 1: Start Keycloak
print_status "Step 1: Starting Keycloak IAM..."
if check_port 8080; then
    print_warning "Port 8080 is already in use. Skipping Keycloak startup."
else
    print_status "Starting Keycloak on port 8080..."
    
    # Check if Docker is available
    if command -v docker &> /dev/null; then
        # Create persistent directories for Keycloak
        mkdir -p "$PROJECT_ROOT/keycloak-data"
        
        # Stop and remove existing container if it exists
        docker stop keycloak-cms 2>/dev/null || true
        docker rm keycloak-cms 2>/dev/null || true
        
        docker run -d \
            --name keycloak-cms \
            -p 8080:8080 \
            -e KEYCLOAK_ADMIN=admin \
            -e KEYCLOAK_ADMIN_PASSWORD=admin123 \
            -e KC_HEALTH_ENABLED=true \
            -v "$PROJECT_ROOT/keycloak-data:/opt/keycloak/data" \
            -v "$PROJECT_ROOT/keycloak-data/logs:/opt/keycloak/logs" \
            quay.io/keycloak/keycloak:latest start-dev > "$PROJECT_ROOT/logs/keycloak.log" 2>&1 &
        
        echo $! > "$PROJECT_ROOT/.keycloak.pid"
        print_success "Keycloak started with Docker (PID: $(cat "$PROJECT_ROOT/.keycloak.pid"))"
        print_status "Keycloak data will be persisted in: $PROJECT_ROOT/keycloak-data"
    else
        print_error "Docker not found. Please install Docker to run Keycloak."
        print_warning "Continuing without Keycloak..."
    fi
fi

# Wait for Keycloak to be ready
if [ -f "$PROJECT_ROOT/.keycloak.pid" ]; then
    wait_for_service "http://localhost:8080/health" "Keycloak"
    
    # Setup Keycloak configuration if it doesn't exist
    print_status "Setting up Keycloak configuration..."
    cd "$PROJECT_ROOT"
    ./deployment/local/setup-keycloak-persistent.sh
    cd "$SCRIPT_DIR"
fi

# Step 1.5: Start Main Database and SCITT CCF Services
print_status "Step 1.5: Starting Main Database and SCITT CCF Services..."
if command -v docker &> /dev/null; then
    # Start main database and SCITT CCF services
    cd "$PROJECT_ROOT"
    
    # Start main services (database only - Keycloak already started in Step 1)
    if docker-compose -f docker-compose.main.yml up -d postgres-app postgres-keycloak --remove-orphans; then
        print_success "Main database services started successfully"
        
        # Wait for main database to be ready
        print_status "Waiting for main database to be ready..."
        
        # Wait for PostgreSQL to be ready (check if it accepts connections)
        max_attempts=30
        attempt=1
        while [ $attempt -le $max_attempts ]; do
            if docker exec postgres-app pg_isready -U postgres >/dev/null 2>&1; then
                print_success "Main Database is ready!"
                break
            fi
            
            echo -n "."
            sleep 2
            attempt=$((attempt + 1))
        done
        
        if [ $attempt -gt $max_attempts ]; then
            print_error "Main Database failed to start within $((max_attempts * 2)) seconds"
            print_warning "Continuing without main database..."
        fi
    else
        print_error "Failed to start main database services"
        print_warning "Continuing without main database..."
    fi
    
    # Start SCITT CCF services
    print_status "Starting SCITT CCF services..."
    if docker-compose -f docker-compose.scitt-ccf-dev.yml up -d --remove-orphans; then
        print_success "SCITT CCF services started successfully"
        
        # Wait for SCITT CCF node to be ready
        print_status "Waiting for SCITT CCF node to be ready..."
        
        # Wait for SCITT CCF to be ready (check if port is responding)
        max_attempts=30
        attempt=1
        while [ $attempt -le $max_attempts ]; do
            if curl -s "http://localhost:8000" >/dev/null 2>&1; then
                print_success "SCITT CCF Node is ready!"
                break
            fi
            
            echo -n "."
            sleep 2
            attempt=$((attempt + 1))
        done
        
        if [ $attempt -gt $max_attempts ]; then
            print_warning "SCITT CCF Node health check failed, but continuing..."
        fi
    else
        print_error "Failed to start SCITT CCF services"
        print_warning "Continuing without SCITT CCF..."
    fi
    
    cd "$SCRIPT_DIR"
else
    print_error "Docker not found. Please install Docker to run database and SCITT CCF services."
    print_warning "Continuing without database and SCITT CCF..."
fi

# Step 2: Start SCITT CCF Ledger (replacing Blockchain)
print_status "Step 2: Starting SCITT CCF Ledger..."
if check_port 8000; then
    print_warning "Port 8000 is already in use. SCITT CCF Ledger may already be running."
else
    print_status "Starting SCITT CCF Ledger on port 8000..."
    cd "$PROJECT_ROOT"
    
    # Use the manage-scitt-ccf.sh script to start SCITT CCF services
    if [ -f "./manage-scitt-ccf.sh" ]; then
        ./manage-scitt-ccf.sh start > "$PROJECT_ROOT/logs/scitt-ccf.log" 2>&1 &
        echo $! > "$PROJECT_ROOT/.scitt-ccf.pid"
        print_success "SCITT CCF Ledger started (PID: $(cat "$PROJECT_ROOT/.scitt-ccf.pid"))"
    else
        print_error "manage-scitt-ccf.sh script not found. Please ensure SCITT CCF is properly configured."
    fi
    
    cd "$SCRIPT_DIR"
fi

# Wait for SCITT CCF to be ready
if [ -f "$PROJECT_ROOT/.scitt-ccf.pid" ]; then
    wait_for_service "http://localhost:8000/app/health" "SCITT CCF Ledger"
fi

# Step 3: Start Backend
print_status "Step 3: Starting Backend API..."
if check_port 5001; then
    print_warning "Port 5001 is already in use. Skipping backend startup."
else
    print_status "Starting backend on port 5001..."
    cd "$PROJECT_ROOT/backend"
    
    # Enable SCITT CCF in config (disable blockchain)
    sed -i '' 's/BLOCKCHAIN_ENABLED=true/BLOCKCHAIN_ENABLED=false/' config.env
    sed -i '' 's/SCITT_CCF_ENABLED=false/SCITT_CCF_ENABLED=true/' config.env
    
    node server.js > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
    echo $! > "$PROJECT_ROOT/.backend.pid"
    cd "$SCRIPT_DIR"
    print_success "Backend started (PID: $(cat "$PROJECT_ROOT/.backend.pid"))"
fi

# Wait for backend to be ready
if [ -f "$PROJECT_ROOT/.backend.pid" ]; then
    wait_for_service "http://localhost:5001/health" "Backend"
fi

# Step 4: Start Frontend
print_status "Step 4: Starting Frontend..."
if check_port 3000; then
    print_warning "Port 3000 is already in use. Trying port 3001..."
    if check_port 3001; then
        print_error "Both ports 3000 and 3001 are in use. Please free up a port."
        exit 1
    else
        export PORT=3001
        print_status "Starting frontend on port 3001..."
    fi
else
    print_status "Starting frontend on port 3000..."
fi

cd "$PROJECT_ROOT/frontend"
npm start > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
echo $! > "$PROJECT_ROOT/.frontend.pid"
cd "$SCRIPT_DIR"
print_success "Frontend started (PID: $(cat "$PROJECT_ROOT/.frontend.pid"))"

# Wait for frontend to be ready
if [ -f "$PROJECT_ROOT/.frontend.pid" ]; then
    frontend_port=${PORT:-3000}
    wait_for_service "http://localhost:$frontend_port" "Frontend"
fi

# Final status check
echo ""
print_success "🎉 All services started successfully!"
echo ""
echo "📊 Service Status:"
echo "=================="

# Check each service
services=(
    "Keycloak:8080"
    "SCITT CCF Ledger:8000"
    "SCITT CCF Dashboard:8082"
    "Backend:5001"
    "Frontend:${PORT:-3000}"
)

for service in "${services[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if check_port $port; then
        echo -e "  ${GREEN}✅${NC} $name (http://localhost:$port)"
    else
        echo -e "  ${RED}❌${NC} $name (http://localhost:$port)"
    fi
done

echo ""
echo "🔗 Access URLs:"
echo "==============="
echo "  Frontend: http://localhost:${PORT:-3000}"
echo "  Backend API: http://localhost:5001/api"
echo "  Keycloak Admin: http://localhost:8080 (admin/admin123)"
echo "  SCITT CCF Ledger: http://localhost:8000"
echo "  SCITT CCF Dashboard: http://localhost:8082"
echo ""
echo "📝 Logs are available in the 'logs/' directory"
echo "🛑 To stop all services, run: ./stop-services.sh"
echo ""
print_success "Contract Management System is ready! 🚀" 
