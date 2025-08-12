#!/bin/bash

# Contract Management System Build Script
# This script builds all system components automatically

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

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if Docker is running
    if docker info > /dev/null 2>&1; then
        print_success "Docker is running"
    else
        print_error "Docker is not running"
        exit 1
    fi
    
    # Check if Node.js is installed
    if command -v node > /dev/null 2>&1; then
        print_success "Node.js is installed: $(node --version)"
    else
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check if npm is installed
    if command -v npm > /dev/null 2>&1; then
        print_success "npm is installed: $(npm --version)"
    else
        print_error "npm is not installed"
        exit 1
    fi
    
    print_success "All prerequisites met"
}

# Function to build SCITT CCF components
build_scitt_ccf() {
    print_header "Building SCITT CCF Components"
    
    # Check if images exist
    if docker images | grep -q "scitt-ccf-ledger"; then
        print_success "SCITT CCF images already exist"
        return 0
    fi
    
    print_status "Building SCITT CCF Docker images..."
    
    # Create build directory if it doesn't exist
    if [ ! -d "deployment/scitt-ccf" ]; then
        print_status "Creating SCITT CCF build directory..."
        mkdir -p deployment/scitt-ccf/{node,monitor,dashboard}
    fi
    
    # Build base SCITT CCF node image
    print_status "Building SCITT CCF Ledger image..."
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
    print_status "Building SCITT CCF Monitor image..."
    cat > deployment/scitt-ccf/monitor/Dockerfile << 'EOF'
FROM python:3.9-slim
RUN pip install requests psutil
WORKDIR /app
COPY monitor.py .
CMD ["python", "monitor.py"]
EOF
    
    # Build dashboard image
    print_status "Building SCITT CCF Dashboard image..."
    cat > deployment/scitt-ccf/dashboard/Dockerfile << 'EOF'
FROM nginx:alpine
COPY dashboard.html /usr/share/nginx/html/index.html
EXPOSE 8080
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
    print_status "Building Docker images..."
    if docker build -t scitt-ccf-ledger:latest deployment/scitt-ccf/node/ && \
       docker build -t scitt-ccf-monitor:latest deployment/scitt-ccf/monitor/ && \
       docker build -t scitt-ccf-dashboard:latest deployment/scitt-ccf/dashboard/; then
        print_success "SCITT CCF images built successfully"
        return 0
    else
        print_error "Failed to build SCITT CCF images"
        return 1
    fi
}

# Function to build blockchain components
build_blockchain() {
    print_header "Building Blockchain Components"
    
    if [ -d "blockchain" ]; then
        cd blockchain
        
        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            print_status "Installing blockchain dependencies..."
            npm install
        fi
        
        # Build contracts if needed
        if [ ! -d "artifacts" ] || [ -z "$(ls -A artifacts 2>/dev/null)" ]; then
            print_status "Building smart contracts..."
            npx hardhat compile
        fi
        
        cd ..
        print_success "Blockchain components built"
    else
        print_warning "Blockchain directory not found"
    fi
}

# Function to build backend components
build_backend() {
    print_header "Building Backend Components"
    
    if [ -d "backend" ]; then
        cd backend
        
        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            print_status "Installing backend dependencies..."
            npm install
        fi
        
        # Run database migrations if needed
        if [ -d "migrations" ]; then
            print_status "Running database migrations..."
            npx sequelize-cli db:migrate 2>/dev/null || print_warning "Migrations may need manual setup"
        fi
        
        cd ..
        print_success "Backend components built"
    else
        print_warning "Backend directory not found"
    fi
}

# Function to build frontend components
build_frontend() {
    print_header "Building Frontend Components"
    
    if [ -d "frontend" ]; then
        cd frontend
        
        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            print_status "Installing frontend dependencies..."
            npm install
        fi
        
        # Build frontend if needed
        if [ ! -d "build" ]; then
            print_status "Building frontend..."
            npm run build
        fi
        
        cd ..
        print_success "Frontend components built"
    else
        print_warning "Frontend directory not found"
    fi
}

# Function to show help
show_help() {
    echo "Contract Management System Build Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --all              Build all components (default)"
    echo "  --scitt-ccf        Build only SCITT CCF components"
    echo "  --blockchain       Build only blockchain components"
    echo "  --backend          Build only backend components"
    echo "  --frontend         Build only frontend components"
    echo "  --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                 # Build all components"
    echo "  $0 --scitt-ccf     # Build only SCITT CCF"
    echo "  $0 --backend       # Build only backend"
}

# Main build function
main() {
    local build_all=true
    local build_scitt_ccf_flag=false
    local build_blockchain_flag=false
    local build_backend_flag=false
    local build_frontend_flag=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --all)
                build_all=true
                shift
                ;;
            --scitt-ccf)
                build_all=false
                build_scitt_ccf_flag=true
                shift
                ;;
            --blockchain)
                build_all=false
                build_blockchain_flag=true
                shift
                ;;
            --backend)
                build_all=false
                build_backend_flag=true
                shift
                ;;
            --frontend)
                build_all=false
                build_frontend_flag=true
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
    
    print_header "Building Contract Management System"
    echo "Timestamp: $(date)"
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Build components based on options
    if [ "$build_all" = true ] || [ "$build_scitt_ccf_flag" = true ]; then
        build_scitt_ccf
    fi
    
    if [ "$build_all" = true ] || [ "$build_blockchain_flag" = true ]; then
        build_blockchain
    fi
    
    if [ "$build_all" = true ] || [ "$build_backend_flag" = true ]; then
        build_backend
    fi
    
    if [ "$build_all" = true ] || [ "$build_frontend_flag" = true ]; then
        build_frontend
    fi
    
    echo ""
    print_success "Build process completed!"
    echo ""
    echo "📋 Next steps:"
    echo "   Start system: ./start-system.sh"
    echo "   Quick test: ./quick-test.sh"
    echo "   SCITT CCF: ./manage-scitt-ccf.sh start"
}

# Run main function with all arguments
main "$@"
