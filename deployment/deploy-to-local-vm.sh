#!/bin/bash

# Local Ubuntu VM Deployment Script
# This script deploys the Contract Management System to a local VM

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Local Ubuntu VM Deployment Script${NC}"
echo "=========================================="

# Function to print colored output
print_status() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Function to check if running on Ubuntu
check_ubuntu() {
    if ! grep -q "Ubuntu" /etc/os-release; then
        print_error "This script is designed for Ubuntu. Please run on an Ubuntu system."
        exit 1
    fi
    print_success "Ubuntu system detected"
}

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
        exit 1
    fi
}

# Function to check system resources
check_resources() {
    print_status "Checking system resources..."
    
    # Check RAM
    RAM_GB=$(free -g | awk '/^Mem:/{print $2}')
    if [ "$RAM_GB" -lt 8 ]; then
        print_warning "Low RAM detected: ${RAM_GB}GB (8GB+ recommended)"
    else
        print_success "RAM: ${RAM_GB}GB"
    fi
    
    # Check CPU cores
    CPU_CORES=$(nproc)
    if [ "$CPU_CORES" -lt 4 ]; then
        print_warning "Low CPU cores: ${CPU_CORES} (4+ recommended)"
    else
        print_success "CPU cores: ${CPU_CORES}"
    fi
    
    # Check disk space
    DISK_GB=$(df -BG / | awk 'NR==2{print $4}' | sed 's/G//')
    if [ "$DISK_GB" -lt 50 ]; then
        print_warning "Low disk space: ${DISK_GB}GB (50GB+ recommended)"
    else
        print_success "Disk space: ${DISK_GB}GB available"
    fi
}

# Function to update system
update_system() {
    print_status "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y curl wget git jq software-properties-common unzip
    print_success "System updated successfully"
}

# Function to install Docker
install_docker() {
    print_status "Installing Docker and Docker Compose..."
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    
    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Verify installation
    docker --version
    docker-compose --version
    print_success "Docker installed successfully"
}

# Function to install Node.js
install_nodejs() {
    print_status "Installing Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    node --version
    npm --version
    print_success "Node.js installed successfully"
}

# Function to setup local environment
setup_local_environment() {
    print_status "Setting up local environment..."
    
    # Check if we're in the right directory
    if [ ! -f "docker-compose.main.yml" ]; then
        print_error "Please run this script from the ContractManagement project root directory"
        exit 1
    fi
    
    # Generate local passwords
    KEYCLOAK_PASS="admin123"
    POSTGRES_PASS="postgres123"
    JWT_SECRET=$(openssl rand -hex 64)
    
    # Copy and configure environment file
    if [ ! -f "config.env" ]; then
        cp env.example config.env
    fi
    
    # Update config.env for local development
    sed -i "s|KEYCLOAK_URL=.*|KEYCLOAK_URL=https://localhost:8443|g" config.env
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=http://localhost:3000|g" config.env
    sed -i "s|BACKEND_URL=.*|BACKEND_URL=http://localhost:5001|g" config.env
    sed -i "s|KEYCLOAK_ADMIN_PASSWORD=.*|KEYCLOAK_ADMIN_PASSWORD=$KEYCLOAK_PASS|g" config.env
    sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASS|g" config.env
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" config.env
    
    print_success "Local environment configured"
    echo "  - Keycloak Admin: admin / $KEYCLOAK_PASS"
    echo "  - PostgreSQL: postgres / $POSTGRES_PASS"
}

# Function to create local docker-compose
create_local_compose() {
    print_status "Creating local Docker Compose file..."
    
    # Create local docker-compose
    cp docker-compose.main.yml docker-compose.local.yml
    
    # Update for local settings
    sed -i "s|KC_HOSTNAME:.*|KC_HOSTNAME: localhost|g" docker-compose.local.yml
    sed -i "s|restart:.*|restart: unless-stopped|g" docker-compose.local.yml
    
    # Add port mappings for local development
    sed -i 's|ports:|ports:\n      - "5432:5432"|g' docker-compose.local.yml
    sed -i 's|ports:|ports:\n      - "5433:5432"|g' docker-compose.local.yml
    sed -i 's|ports:|ports:\n      - "8443:8443"|g' docker-compose.local.yml
    sed -i 's|ports:|ports:\n      - "5001:5001"|g' docker-compose.local.yml
    sed -i 's|ports:|ports:\n      - "3000:3000"|g' docker-compose.local.yml
    
    print_success "Local Docker Compose created successfully"
}

# Function to generate Keycloak certificates
generate_keycloak_certs() {
    print_status "Generating SSL certificates for Keycloak..."
    
    # Create directory for Keycloak certificates
    mkdir -p deployment/keycloak-certs
    
    # Generate self-signed certificate for localhost
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout deployment/keycloak-certs/keycloak.key \
      -out deployment/keycloak-certs/keycloak.crt \
      -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    
    # Set permissions
    sudo chown -R $USER:$USER deployment/keycloak-certs
    chmod 600 deployment/keycloak-certs/keycloak.key
    chmod 644 deployment/keycloak-certs/keycloak.crt
    
    print_success "Keycloak certificates generated successfully"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing application dependencies..."
    
    # Backend dependencies
    cd backend
    npm install
    
    # Frontend dependencies
    cd ../frontend
    npm install
    npm run build
    
    cd ..
    print_success "Dependencies installed successfully"
}

# Function to start services
start_services() {
    print_status "Starting services..."
    
    # Start all services
    docker-compose -f docker-compose.local.yml up -d
    
    # Wait for services to start
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check service status
    docker-compose -f docker-compose.local.yml ps
    print_success "Services started successfully"
}

# Function to configure Keycloak
configure_keycloak() {
    print_status "Configuring Keycloak..."
    
    # Wait for Keycloak to start
    print_status "Waiting for Keycloak to be ready..."
    while ! curl -k -s https://localhost:8443/health > /dev/null; do
        sleep 10
        print_status "Waiting for Keycloak..."
    done
    
    # Run Keycloak configuration
    cd deployment
    if [ -f "configure-keycloak-https.js" ]; then
        # Update the script with local values
        sed -i "s|https://localhost:8443|https://localhost:8443|g" configure-keycloak-https.js
        sed -i "s|admin123|admin123|g" configure-keycloak-https.js
        
        node configure-keycloak-https.js
        print_success "Keycloak configured successfully"
    else
        print_warning "Keycloak configuration script not found. Please configure manually."
    fi
    
    cd ..
}

# Function to create test data
create_test_data() {
    print_status "Creating test data..."
    
    if [ -f "deployment/create-test-data.sh" ]; then
        chmod +x deployment/create-test-data.sh
        ./deployment/create-test-data.sh
        print_success "Test data created successfully"
    else
        print_warning "Test data creation script not found."
    fi
}

# Function to test deployment
test_deployment() {
    print_status "Testing deployment..."
    
    # Test backend
    if curl -s http://localhost:5001/api/health > /dev/null; then
        print_success "Backend is responding"
    else
        print_error "Backend is not responding"
    fi
    
    # Test frontend
    if curl -s http://localhost:3000 > /dev/null; then
        print_success "Frontend is responding"
    else
        print_error "Frontend is not responding"
    fi
    
    # Test Keycloak
    if curl -k -s https://localhost:8443/health > /dev/null; then
        print_success "Keycloak is responding"
    else
        print_error "Keycloak is not responding"
    fi
}

# Function to display final instructions
display_final_instructions() {
    echo -e "\n${GREEN}🎉 Local VM Deployment Completed Successfully!${NC}"
    echo "=================================================="
    echo -e "${BLUE}Access URLs:${NC}"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:5001/api"
    echo "  - Keycloak: https://localhost:8443"
    echo "  - PostgreSQL (App): localhost:5432"
    echo "  - PostgreSQL (Keycloak): localhost:5433"
    echo ""
    echo -e "${BLUE}Default Credentials:${NC}"
    echo "  - Keycloak Admin: admin / admin123"
    echo "  - PostgreSQL: postgres / postgres123"
    echo ""
    echo -e "${BLUE}Useful Commands:${NC}"
    echo "  - Check services: docker-compose -f docker-compose.local.yml ps"
    echo "  - View logs: docker-compose -f docker-compose.local.yml logs -f"
    echo "  - Restart: docker-compose -f docker-compose.local.yml restart"
    echo "  - Stop: docker-compose -f docker-compose.local.yml down"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "  1. Open browser and go to: http://localhost:3000"
    echo "  2. Login with test users (see deployment/create-test-data.sh)"
    echo "  3. Test contract creation workflow"
    echo "  4. Make code changes and test in local environment"
    echo ""
    echo -e "${BLUE}Development Workflow:${NC}"
    echo "  1. Make code changes in your local project"
    echo "  2. Test changes in the local VM"
    echo "  3. When ready, deploy to production using Ubuntu deployment scripts"
}

# Main deployment function
main() {
    echo -e "${BLUE}🚀 Local Ubuntu VM Deployment Script${NC}"
    echo "=========================================="
    
    # Check prerequisites
    check_ubuntu
    check_root
    check_resources
    
    # Confirm deployment
    echo -e "\n${YELLOW}Ready to deploy to local VM? This will:${NC}"
    echo "  - Update system packages"
    echo "  - Install Docker, Node.js"
    echo "  - Configure local environment"
    echo "  - Deploy the application"
    echo "  - Configure Keycloak IAM"
    echo "  - Create test data"
    
    read -p "Continue with deployment? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled."
        exit 0
    fi
    
    # Start deployment
    print_status "Starting local VM deployment process..."
    
    update_system
    install_docker
    install_nodejs
    setup_local_environment
    create_local_compose
    generate_keycloak_certs
    install_dependencies
    start_services
    configure_keycloak
    create_test_data
    test_deployment
    
    # Display final instructions
    display_final_instructions
}

# Run main function
main "$@"
