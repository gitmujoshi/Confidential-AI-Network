#!/bin/bash

# SCITT CCF Management Script
# This script manages SCITT CCF services, migration, and configuration

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

# Function to check if SCITT CCF is configured
check_scitt_ccf_config() {
    if [ -f ".env.scitt-ccf" ]; then
        source .env.scitt-ccf
        return 0
    else
        return 1
    fi
}

# Function to check service status
check_service() {
    local service_name=$1
    local port=$2
    local url=$3
    
    if curl -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $service_name is running on port $port${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name is not running on port $port${NC}"
        return 1
    fi
}

# Function to wait for service
wait_for_service() {
    local service_name=$1
    local port=$2
    local url=$3
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

# Function to start SCITT CCF services
start_scitt_ccf() {
    print_header "Starting SCITT CCF Services"
    
    if [ ! -f "docker-compose.scitt-ccf-dev.yml" ]; then
        print_error "SCITT CCF Docker Compose file not found"
        return 1
    fi
    
    print_status "Starting SCITT CCF services..."
    docker-compose -f docker-compose.scitt-ccf-dev.yml up -d
    
    print_status "Waiting for SCITT CCF node to be ready..."
    if wait_for_service "SCITT CCF Node" "8000" "http://localhost:8000/app/health"; then
        print_success "SCITT CCF services started successfully"
        return 0
    else
        print_error "Failed to start SCITT CCF services"
        return 1
    fi
}

# Function to stop SCITT CCF services
stop_scitt_ccf() {
    print_header "Stopping SCITT CCF Services"
    
    if [ -f "docker-compose.scitt-ccf-dev.yml" ]; then
        print_status "Stopping SCITT CCF services..."
        docker-compose -f docker-compose.scitt-ccf-dev.yml down
        
        print_success "SCITT CCF services stopped"
    else
        print_warning "SCITT CCF Docker Compose file not found"
    fi
}

# Function to restart SCITT CCF services
restart_scitt_ccf() {
    print_header "Restarting SCITT CCF Services"
    
    stop_scitt_ccf
    sleep 2
    start_scitt_ccf
}

# Function to check SCITT CCF status
status_scitt_ccf() {
    print_header "SCITT CCF Service Status"
    
    # Check if services are running
    echo "🔍 Checking SCITT CCF services..."
    
    if [ -f "docker-compose.scitt-ccf-dev.yml" ]; then
        # Check Docker containers
        echo ""
        echo "📦 Docker Containers:"
        docker-compose -f docker-compose.scitt-ccf-dev.yml ps
        
        echo ""
        echo "🔗 Service Health:"
        check_service "SCITT CCF Node" "8000" "http://localhost:8000/app/health"
        check_service "SCITT CCF Governance" "8001" "http://localhost:8001"
        
        # Check backend integration if running
        if curl -s "http://localhost:5001/health" > /dev/null 2>&1; then
            echo ""
            echo "🔧 Backend Integration:"
            BACKEND_HEALTH=$(curl -s http://localhost:5001/api/system/health 2>/dev/null | jq -r '.scittCcf.isHealthy // "unknown"' 2>/dev/null || echo "unknown")
            if [ "$BACKEND_HEALTH" = "true" ]; then
                print_success "Backend SCITT CCF integration is healthy"
            elif [ "$BACKEND_HEALTH" = "false" ]; then
                print_error "Backend SCITT CCF integration is unhealthy"
            else
                print_warning "Backend SCITT CCF integration status unknown"
            fi
        fi
    else
        print_warning "SCITT CCF Docker Compose file not found"
    fi
}

# Function to test SCITT CCF integration
test_scitt_ccf() {
    print_header "Testing SCITT CCF Integration"
    
    if [ ! -f "backend/scripts/test-scitt-ccf-integration.js" ]; then
        print_error "SCITT CCF test script not found"
        return 1
    fi
    
    print_status "Running SCITT CCF integration tests..."
    cd backend
    node scripts/test-scitt-ccf-integration.js
    cd ..
}

# Function to migrate contracts
migrate_contracts() {
    print_header "Contract Migration to SCITT CCF"
    
    if [ ! -f "backend/scripts/test-scitt-ccf-integration.js" ]; then
        print_error "SCITT CCF test script not found"
        return 1
    fi
    
    print_status "Starting contract migration..."
    cd backend
    
    # Check if backend is running
    if ! curl -s "http://localhost:5001/health" > /dev/null 2>&1; then
        print_error "Backend server is not running. Please start it first."
        cd ..
        return 1
    fi
    
    # Run migration test
    print_status "Testing migration capabilities..."
    node scripts/test-scitt-ccf-integration.js
    
    cd ..
    
    print_success "Contract migration test completed"
}

# Function to switch migration mode
switch_mode() {
    local mode=$1
    
    print_header "Switching Migration Mode to $mode"
    
    if [ ! -f "backend/scripts/test-scitt-ccf-integration.js" ]; then
        print_error "SCITT CCF test script not found"
        return 1
    fi
    
    # Check if backend is running
    if ! curl -s "http://localhost:5001/health" > /dev/null 2>&1; then
        print_error "Backend server is not running. Please start it first."
        return 1
    fi
    
    print_status "Switching to $mode mode..."
    
    # Use the test script to switch modes
    cd backend
    node -e "
        const ContractRouterService = require('./services/contractRouterService');
        const router = new ContractRouterService();
        
        router.initialize()
            .then(() => router.switchMigrationMode('$mode'))
            .then(result => {
                console.log('✅ Mode switched successfully:', result.message);
                process.exit(0);
            })
            .catch(error => {
                console.error('❌ Failed to switch mode:', error.message);
                process.exit(1);
            });
    "
    cd ..
}

# Function to show logs
show_logs() {
    print_header "SCITT CCF Service Logs"
    
    if [ -f "docker-compose.scitt-ccf-dev.yml" ]; then
        print_status "Showing SCITT CCF service logs..."
        docker-compose -f docker-compose.scitt-ccf-dev.yml logs -f
    else
        print_warning "SCITT CCF Docker Compose file not found"
    fi
}

# Function to setup SCITT CCF
setup_scitt_ccf() {
    print_header "Setting Up SCITT CCF Integration"
    
    # Check if configuration exists
    if [ -f ".env.scitt-ccf" ]; then
        print_warning "SCITT CCF configuration already exists"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Setup cancelled"
            return 0
        fi
    fi
    
    # Copy example configuration
    if [ -f "env.scitt-ccf.example" ]; then
        print_status "Creating SCITT CCF configuration..."
        cp env.scitt-ccf.example .env.scitt-ccf
        
        # Set default migration mode to HYBRID
        print_status "Setting default migration mode to HYBRID..."
        sed -i.bak 's/MIGRATION_MODE=.*/MIGRATION_MODE=HYBRID/' .env.scitt-ccf
        sed -i.bak 's/SCITT_CCF_ENABLED=.*/SCITT_CCF_ENABLED=true/' .env.scitt-ccf
        
        print_success "Configuration file created: .env.scitt-ccf (HYBRID mode enabled)"
        print_status "Configuration is ready to use with HYBRID mode (both blockchain and SCITT CCF)"
    else
        print_error "Example configuration file not found"
        return 1
    fi
    
    # Check if Docker Compose file exists
    if [ ! -f "docker-compose.scitt-ccf-dev.yml" ]; then
        print_error "SCITT CCF Docker Compose file not found"
        return 1
    fi
    
    print_success "SCITT CCF setup completed"
    print_status "Next steps:"
    echo "   1. Edit .env.scitt-ccf with your configuration"
    echo "   2. Run: $0 start"
    echo "   3. Test with: $0 test"
}

# Function to show help
show_help() {
    echo "SCITT CCF Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start           Start SCITT CCF services"
    echo "  stop            Stop SCITT CCF services"
    echo "  restart         Restart SCITT CCF services"
    echo "  status          Show SCITT CCF service status"
    echo "  test            Test SCITT CCF integration"
    echo "  migrate         Test contract migration"
    echo "  switch [MODE]   Switch migration mode (ETHEREUM_ONLY|SCITT_CCF_ONLY|HYBRID)"
    echo "  logs            Show SCITT CCF service logs"
    echo "  setup           Setup SCITT CCF integration"
    echo "  help            Show this help message"
    echo ""
    echo "Migration Modes:"
    echo "  ETHEREUM_ONLY   Use only Ethereum blockchain"
    echo "  SCITT_CCF_ONLY  Use only SCITT CCF Ledger"
    echo "  HYBRID          Use both systems (recommended)"
    echo ""
    echo "Examples:"
    echo "  $0 start                    # Start SCITT CCF services"
    echo "  $0 switch HYBRID           # Switch to hybrid mode"
    echo "  $0 test                    # Test integration"
    echo "  $0 status                  # Check service status"
}

# Main script logic
case "${1:-help}" in
    start)
        start_scitt_ccf
        ;;
    stop)
        stop_scitt_ccf
        ;;
    restart)
        restart_scitt_ccf
        ;;
    status)
        status_scitt_ccf
        ;;
    test)
        test_scitt_ccf
        ;;
    migrate)
        migrate_contracts
        ;;
    switch)
        if [ -z "$2" ]; then
            print_error "Please specify migration mode"
            echo "Usage: $0 switch [ETHEREUM_ONLY|SCITT_CCF_ONLY|HYBRID]"
            exit 1
        fi
        switch_mode "$2"
        ;;
    logs)
        show_logs
        ;;
    setup)
        setup_scitt_ccf
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
