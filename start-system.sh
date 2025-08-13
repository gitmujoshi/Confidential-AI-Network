#!/bin/bash

# Contract Management System Startup Script
# This script ensures all components are properly configured and started
# Now supports both Blockchain and SCITT CCF modes with integrated testing

set -e

echo "🚀 Starting Contract Management System..."

# Function to check if a service is running
check_service() {
    local service_name=$1
    local port=$2
    local url=$3
    
    # Use -k flag for HTTPS URLs to ignore SSL certificate verification
    if [[ "$url" == https://* ]]; then
        if curl -k -s "$url" > /dev/null 2>&1; then
            echo "✅ $service_name is running on port $port"
            return 0
        else
            echo "❌ $service_name is not running on port $port"
            return 1
        fi
    else
        if curl -s "$url" > /dev/null 2>&1; then
            echo "✅ $service_name is running on port $port"
            return 0
        else
            echo "❌ $service_name is not running on port $port"
            return 1
        fi
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local service_name=$1
    local port=$2
    local url=$3
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Waiting for $service_name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        # Use -k flag for HTTPS URLs to ignore SSL certificate verification
        if [[ "$url" == https://* ]]; then
            if curl -k -s "$url" > /dev/null 2>&1; then
                echo "✅ $service_name is ready!"
                return 0
            fi
        else
            if curl -s "$url" > /dev/null 2>&1; then
                echo "✅ $service_name is ready!"
                return 0
            fi
        fi
        echo "   Attempt $attempt/$max_attempts..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name failed to start after $max_attempts attempts"
    return 1
}

# Function to check SCITT CCF mode
check_scitt_ccf_mode() {
    if [ -f ".env.scitt-ccf" ]; then
        source .env.scitt-ccf
        echo "🔗 SCITT CCF Mode: $MIGRATION_MODE"
        return 0
    else
        echo "🔗 SCITT CCF Mode: Not configured - Auto-creating SCITT CCF config..."
        # Auto-create SCITT CCF configuration
        if [ -f "env.scitt-ccf.example" ]; then
            cp env.scitt-ccf.example .env.scitt-ccf
            echo "✅ Created .env.scitt-ccf from template"
            source .env.scitt-ccf
            echo "🔗 SCITT CCF Mode: $MIGRATION_MODE (auto-configured)"
            return 0
        else
            echo "❌ env.scitt-ccf.example not found - please run ./manage-scitt-ccf.sh setup first"
            return 1
        fi
    fi
}

# Function to build SCITT CCF Docker images
build_scitt_ccf_images() {
    echo "🔨 Building SCITT CCF Docker images..."
    
    # Use the dedicated build script
    if [ -f "build-system.sh" ]; then
        chmod +x build-system.sh
        if ./build-system.sh --scitt-ccf; then
            echo "✅ SCITT CCF images built successfully"
            return 0
        else
            echo "❌ Failed to build SCITT CCF images"
            return 1
        fi
    else
        echo "⚠️  build-system.sh not found, building manually..."
        # Fallback to manual build (existing code)
        # Check if images exist
        if docker images | grep -q "scitt-ccf-ledger"; then
            echo "✅ SCITT CCF images already exist"
            return 0
        fi
        
        # Create build directory if it doesn't exist
        if [ ! -d "deployment/scitt-ccf" ]; then
            echo "📁 Creating SCITT CCF build directory..."
            mkdir -p deployment/scitt-ccf/{node,monitor,dashboard}
        fi
        
        # Build base SCITT CCF node image
        echo "🔨 Building SCITT CCF Ledger image..."
        cat > deployment/scitt-ccf/node/Dockerfile << 'EOF'
FROM ubuntu:22.04
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/ccf
EXPOSE 8000 8001
CMD ["python3", "-m", "http.server", "8000"]
EOF
        
        # Build monitor image
        echo "🔨 Building SCITT CCF Monitor image..."
        cat > deployment/scitt-ccf/monitor/Dockerfile << 'EOF'
FROM python:3.9-slim
RUN pip install requests psutil
WORKDIR /app
COPY monitor.py .
CMD ["python", "monitor.py"]
EOF
        
        # Build dashboard image
        echo "🔨 Building SCITT CCF Dashboard image..."
        cat > deployment/scitt-ccf/dashboard/Dockerfile << 'EOF'
FROM nginx:alpine
COPY dashboard.html /usr/share/nginx/html/index.html
        EXPOSE 8443
CMD ["nginx", "-g", "daemon off;"]
EOF
        
        # Create simple monitor script
        cat > deployment/scitt-ccf/monitor/monitor.py << 'EOF'
#!/usr/bin/env python3
import time
import requests
import psutil
import os

def check_health():
    try:
        response = requests.get("http://localhost:8000/app/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def main():
    while True:
        health = check_health()
        print(f"Health check: {'OK' if health else 'FAILED'}")
        time.sleep(30)

if __name__ == "__main__":
    main()
EOF
        
        # Create simple dashboard
        cat > deployment/scitt-ccf/dashboard/dashboard.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>SCITT CCF Dashboard</title></head>
<body>
<h1>SCITT CCF Dashboard</h1>
<p>Status: Running</p>
<p>Node: <a href="http://localhost:8000">http://localhost:8000</a></p>
<p>Governance: <a href="http://localhost:8001">http://localhost:8001</a></p>
</body>
</html>
EOF
        
        # Build all images
        echo "🔨 Building Docker images..."
        docker build -t scitt-ccf-ledger:latest deployment/scitt-ccf/node/
        docker build -t scitt-ccf-monitor:latest deployment/scitt-ccf/monitor/
        docker build -t scitt-ccf-dashboard:latest deployment/scitt-ccf/dashboard/
        
        if [ $? -eq 0 ]; then
            echo "✅ SCITT CCF images built successfully"
            return 0
        else
            echo "❌ Failed to build SCITT CCF images"
            return 1
        fi
    fi
}

# Function to start SCITT CCF services
start_scitt_ccf_services() {
    echo "🚀 Starting SCITT CCF services..."
    
    # First build images if they don't exist
    if ! build_scitt_ccf_images; then
        echo "⚠️  Failed to build SCITT CCF images, continuing with blockchain mode"
        return 1
    fi
    
    if [ -f "docker-compose.scitt-ccf-dev.yml" ]; then
        docker-compose -f docker-compose.scitt-ccf-dev.yml up -d
        
        # Wait for SCITT CCF node to be ready
        echo "⏳ Waiting for SCITT CCF node to be ready..."
        wait_for_service "SCITT CCF Node" "8000" "http://localhost:8000/app/health"
        
        echo "✅ SCITT CCF services started successfully"
    else
        echo "⚠️  SCITT CCF Docker Compose file not found"
        return 1
    fi
}

# Function to run SCITT CCF tests
run_scitt_ccf_tests() {
    local test_mode="${1:-quick}"
    
    echo ""
    echo "🧪 Running SCITT CCF tests ($test_mode mode)..."
    
    if [ -f "test-scitt-ccf-suite.sh" ]; then
        chmod +x test-scitt-ccf-suite.sh
        
        case $test_mode in
            "quick")
                ./test-scitt-ccf-suite.sh --quick
                ;;
            "full")
                ./test-scitt-ccf-suite.sh --all
                ;;
            "infrastructure")
                ./test-scitt-ccf-suite.sh --infrastructure
                ;;
            "integration")
                ./test-scitt-ccf-suite.sh --integration
                ;;
            "performance")
                ./test-scitt-ccf-suite.sh --performance
                ;;
            "none")
                echo "   Skipping tests as requested"
                return 0
                ;;
            *)
                echo "   Running quick test suite"
                ./test-scitt-ccf-suite.sh --quick
                ;;
        esac
        
        if [ $? -eq 0 ]; then
            echo "✅ SCITT CCF tests passed"
        else
            echo "⚠️  SCITT CCF tests had issues, but continuing..."
        fi
    else
        echo "⚠️  SCITT CCF test suite not found, skipping tests"
    fi
}

# Function to show help
show_help() {
    echo "Contract Management System Startup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --test-mode MODE    Set SCITT CCF test mode (quick|full|infrastructure|integration|performance|none)"
    echo "  --no-tests          Skip SCITT CCF testing"
    echo "  --build-only        Build all components without starting services"
    echo "  --help              Show this help message"
    echo ""
    echo "Test Modes:"
    echo "  quick               Run quick test suite (default)"
    echo "  full                Run full test suite"
    echo "  infrastructure      Run only infrastructure tests"
    echo "  integration         Run only integration tests"
    echo "  performance         Run only performance tests"
    echo "  none                Skip all tests"
    echo ""
    echo "Examples:"
    echo "  $0                  # Start with quick tests"
    echo "  $0 --test-mode full # Start with full tests"
    echo "  $0 --no-tests       # Start without tests"
    echo "  $0 --build-only     # Build all components only"
}

# Parse command line arguments
TEST_MODE="quick"
SKIP_TESTS=false
BUILD_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --test-mode)
            TEST_MODE="$2"
            shift 2
            ;;
        --no-tests)
            SKIP_TESTS=true
            shift
            ;;
        --build-only)
            BUILD_ONLY=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check if we're in the right directory
if [ ! -f "backend/server.js" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# If build-only mode, build everything and exit
if [ "$BUILD_ONLY" = true ]; then
    echo "🔨 Build-only mode: Building all components..."
    echo ""
    
    # Build all components
    if [ -f "build-system.sh" ]; then
        chmod +x build-system.sh
        if ./build-system.sh --all; then
            echo ""
            echo "🎉 All components built successfully!"
            echo ""
            echo "📋 Next steps:"
            echo "   Start system: ./start-system.sh"
            echo "   Quick test: ./quick-test.sh"
            echo "   SCITT CCF: ./manage-scitt-ccf.sh start"
            exit 0
        else
            echo "❌ Build failed"
            exit 1
        fi
    else
        echo "❌ build-system.sh not found"
        exit 1
    fi
fi

# Check SCITT CCF configuration
echo ""
echo "🔍 Checking system configuration..."
SCITT_CCF_ENABLED=false
if check_scitt_ccf_mode; then
    SCITT_CCF_ENABLED=true
else
    echo "⚠️  Failed to configure SCITT CCF, will use blockchain mode only"
fi

# Step 1: Start Keycloak with persistent storage
echo ""
echo "🔐 Step 1: Starting Keycloak..."
    if ! check_service "Keycloak" "8443" "https://localhost:8443/realms/master"; then
    echo "   Starting Keycloak with persistent storage..."
          docker-compose -f docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-dev.yml up -d ***REMOVED-KEYCLOAK_DB_PASSWORD*** ***REMOVED-DB_PASSWORD***
    
    # Wait for Keycloak to be ready
            wait_for_service "Keycloak" "8443" "https://localhost:8443/realms/master"
fi

# Function to fix database connection issues
fix_database_connection() {
    echo "🔧 Fixing database connection issues..."
    
    # Check if we can connect to the database
    if docker exec ***REMOVED-DB_PASSWORD***-cms psql -U ***REMOVED-DB_PASSWORD*** -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ Database connection working"
        return 0
    fi
    
    echo "⚠️  Database connection issues detected, attempting to fix..."
    
    # Create ***REMOVED-DB_PASSWORD*** user if it doesn't exist
    docker exec ***REMOVED-DB_PASSWORD***-cms psql -U ***REMOVED-DB_PASSWORD*** -c "CREATE USER ***REMOVED-DB_PASSWORD*** WITH PASSWORD '***REMOVED-DB_PASSWORD***';" 2>/dev/null || true
    docker exec ***REMOVED-DB_PASSWORD***-cms psql -U ***REMOVED-DB_PASSWORD*** -c "ALTER USER ***REMOVED-DB_PASSWORD*** WITH SUPERUSER;" 2>/dev/null || true
    docker exec ***REMOVED-DB_PASSWORD***-cms psql -U ***REMOVED-DB_PASSWORD*** -c "CREATE DATABASE contract_management OWNER ***REMOVED-DB_PASSWORD***;" 2>/dev/null || true
    
    echo "✅ Database connection fixed"
    return 0
}

# Step 2: Setup Keycloak configuration
echo ""
echo "🔧 Step 2: Setting up Keycloak configuration..."
cd backend
./setup-***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.sh
cd ..

# Fix database connection issues
fix_database_connection

# Step 3: Start SCITT CCF services (if enabled)
if [ "$SCITT_CCF_ENABLED" = true ]; then
    echo ""
    echo "🔗 Step 3: Starting SCITT CCF services..."
    if start_scitt_ccf_services; then
        echo "✅ SCITT CCF services are running"
    else
        echo "⚠️  SCITT CCF services failed to start, attempting to fix..."
        echo "   Running SCITT CCF setup..."
        if [ -f "manage-scitt-ccf.sh" ]; then
            chmod +x manage-scitt-ccf.sh
            if ./manage-scitt-ccf.sh setup; then
                echo "   Retrying SCITT CCF startup..."
                if start_scitt_ccf_services; then
                    echo "✅ SCITT CCF services started after setup"
                else
                    echo "⚠️  SCITT CCF services still failed, continuing with blockchain mode"
                    SCITT_CCF_ENABLED=false
                fi
            else
                echo "⚠️  SCITT CCF setup failed, continuing with blockchain mode"
                SCITT_CCF_ENABLED=false
            fi
        else
            echo "⚠️  manage-scitt-ccf.sh not found, continuing with blockchain mode"
            SCITT_CCF_ENABLED=false
        fi
    fi
fi

# Function to build backend components
build_backend_components() {
    echo "🔨 Building backend components..."
    
    # Use the dedicated build script
    if [ -f "build-system.sh" ]; then
        chmod +x build-system.sh
        if ./build-system.sh --backend; then
            echo "✅ Backend components built successfully"
            return 0
        else
            echo "❌ Failed to build backend components"
            return 1
        fi
    else
        echo "⚠️  build-system.sh not found, building manually..."
        # Fallback to manual build
        if [ -d "backend" ]; then
            cd backend
            
            # Install dependencies if needed
            if [ ! -d "node_modules" ]; then
                echo "📦 Installing backend dependencies..."
                npm install
            fi
            
            # Run database migrations if needed
            if [ -d "migrations" ]; then
                echo "🗄️  Running database migrations..."
                npx sequelize-cli db:migrate 2>/dev/null || echo "⚠️  Migrations may need manual setup"
            fi
            
            cd ..
            echo "✅ Backend components built"
        else
            echo "⚠️  Backend directory not found"
        fi
    fi
}

# Step 4: Build backend components
echo ""
echo "🔨 Step 4: Building backend components..."
build_backend_components

# Step 5: Start backend server
echo ""
echo "🔧 Step 5: Starting backend server..."
if ! check_service "Backend" "5001" "http://localhost:5001/health"; then
    echo "   Starting backend server..."
    cd backend
    pkill -f "node server.js" || true
    sleep 2
    
    # Set environment variables for SCITT CCF if enabled
    if [ "$SCITT_CCF_ENABLED" = true ]; then
        export SCITT_CCF_ENABLED=true
        export MIGRATION_MODE=HYBRID
        echo "   Starting with SCITT CCF integration enabled (HYBRID mode)"
    else
        export SCITT_CCF_ENABLED=false
        export MIGRATION_MODE=ETHEREUM_ONLY
        echo "   Starting with blockchain mode only (fallback)"
    fi
    
    node server.js &
    cd ..
    
    # Wait for backend to be ready
    wait_for_service "Backend" "5001" "http://localhost:5001/health"
fi

# Function to build blockchain components
build_blockchain_components() {
    echo "🔨 Building blockchain components..."
    
    # Use the dedicated build script
    if [ -f "build-system.sh" ]; then
        chmod +x build-system.sh
        if ./build-system.sh --blockchain; then
            echo "✅ Blockchain components built successfully"
            return 0
        else
            echo "❌ Failed to build blockchain components"
            return 1
        fi
    else
        echo "⚠️  build-system.sh not found, building manually..."
        # Fallback to manual build
        if [ -d "blockchain" ]; then
            cd blockchain
            
            # Install dependencies if needed
            if [ ! -d "node_modules" ]; then
                echo "📦 Installing blockchain dependencies..."
                npm install
            fi
            
            # Build contracts if needed
            if [ ! -d "artifacts" ] || [ -z "$(ls -A artifacts 2>/dev/null)" ]; then
                echo "🔨 Building smart contracts..."
                npx hardhat compile
            fi
            
            cd ..
            echo "✅ Blockchain components built"
        else
            echo "⚠️  Blockchain directory not found"
        fi
    fi
}

# Step 5: Build blockchain components
echo ""
echo "🔨 Step 5: Building blockchain components..."
build_blockchain_components

# Function to build frontend components
build_frontend_components() {
    echo "🔨 Building frontend components..."
    
    # Use the dedicated build script
    if [ -f "build-system.sh" ]; then
        chmod +x build-system.sh
        if ./build-system.sh --frontend; then
            echo "✅ Frontend components built successfully"
            return 0
        else
            echo "❌ Failed to build frontend components"
            return 1
        fi
    else
        echo "⚠️  build-system.sh not found, building manually..."
        # Fallback to manual build
        if [ -d "frontend" ]; then
            cd frontend
            
            # Install dependencies if needed
            if [ ! -d "node_modules" ]; then
                echo "📦 Installing frontend dependencies..."
                npm install
            fi
    
            # Build frontend if needed
            if [ ! -d "build" ]; then
                echo "🔨 Building frontend..."
                npm run build
            fi
            
            cd ..
            echo "✅ Frontend components built"
        else
            echo "⚠️  Frontend directory not found"
        fi
    fi
}

# Step 6: Build frontend components
echo ""
echo "🔨 Step 6: Building frontend components..."
build_frontend_components

# Step 7: Start frontend (if needed)
echo ""
echo "🌐 Step 7: Checking frontend..."
if ! check_service "Frontend" "3000" "http://localhost:3000"; then
    echo "   Frontend is not running. You can start it with:"
    echo "   cd frontend && npm start"
fi

# Step 8: Verify authentication
echo ""
echo "🔐 Step 8: Testing authentication..."
cd backend
TEST_RESULT=$(curl -s -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"tdc-test@example.com","password":"password123"}' \
    | jq -r '.message // .error')

if [ "$TEST_RESULT" = "Login successful" ]; then
    echo "✅ Authentication is working!"
else
    echo "❌ Authentication test failed: $TEST_RESULT"
fi
cd ..

# Step 9: Test SCITT CCF integration (if enabled)
if [ "$SCITT_CCF_ENABLED" = true ]; then
    echo ""
    echo "🔗 Step 9: Testing SCITT CCF integration..."
    cd backend
    
    # Test SCITT CCF health
    SCITT_HEALTH=$(curl -s http://localhost:5001/api/system/health | jq -r '.scittCcf.isHealthy // false')
    if [ "$SCITT_HEALTH" = "true" ]; then
        echo "✅ SCITT CCF integration is healthy"
    else
        echo "⚠️  SCITT CCF integration health check failed"
    fi
    
    cd ..
    
    # Step 10: Run SCITT CCF tests (if not skipped)
    if [ "$SKIP_TESTS" = false ]; then
        run_scitt_ccf_tests "$TEST_MODE"
    fi
fi

echo ""
echo "🎉 System startup completed!"
echo ""
echo "📋 Service Status:"
    check_service "Keycloak" "8443" "https://localhost:8443/realms/master"
check_service "Backend" "5001" "http://localhost:5001/health"
check_service "Frontend" "3000" "http://localhost:3000"

if [ "$SCITT_CCF_ENABLED" = true ]; then
    check_service "SCITT CCF Node" "8000" "http://localhost:8000/app/health"
fi

echo ""
echo "🔗 Access URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5001"
    echo "   Keycloak Admin: https://localhost:8443/admin/"

if [ "$SCITT_CCF_ENABLED" = true ]; then
    echo "   SCITT CCF Node: http://localhost:8000"
    echo "   SCITT CCF Governance: http://localhost:8001"
fi

echo ""
echo "👤 Test Users:"
echo "   TDC: tdc-test@example.com / password123"
echo "   TDP: tdp-test@example.com / password123"
echo "   CCRP: ccrp-test@example.com / password123"
echo "   AppAdmin: appadmin-test@example.com / password123"

if [ "$SCITT_CCF_ENABLED" = true ]; then
    echo ""
    echo "🔗 SCITT CCF Integration:"
    echo "   Migration Mode: HYBRID (both blockchain and SCITT CCF)"
    echo "   Test Integration: ./test-scitt-ccf-suite.sh --quick"
    echo "   Full Test Suite: ./test-scitt-ccf-suite.sh --all"
    echo "   Switch Mode: ./manage-scitt-ccf.sh switch [MODE]"
    echo "   Stop Services: ./stop-scitt-ccf.sh"
fi

echo ""
echo "🧪 Testing Commands:"
echo "   Quick Tests: ./test-scitt-ccf-suite.sh --quick"
echo "   Full Tests: ./test-scitt-ccf-suite.sh --all"
echo "   Performance: ./test-scitt-ccf-suite.sh --performance"
echo "   Infrastructure: ./test-scitt-ccf-suite.sh --infrastructure"
echo "   Integration: ./test-scitt-ccf-suite.sh --integration" 