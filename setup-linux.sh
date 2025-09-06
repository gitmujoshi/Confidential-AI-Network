#!/bin/bash

# Contract Management System - Complete Linux Setup Script
# This script sets up the entire system from scratch on a fresh Linux environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="ContractManagement"
PROJECT_DIR="/opt/contract-management"
USER_NAME="cms"
SERVICE_USER="cms"

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

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

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
        exit 1
    fi
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install system dependencies
install_system_dependencies() {
    print_header "Installing System Dependencies"
    
    print_step "Updating package lists..."
    sudo apt-get update -y
    
    print_step "Installing essential packages..."
    sudo apt-get install -y \
        curl \
        wget \
        git \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        build-essential \
        python3 \
        python3-pip \
        jq \
        vim \
        htop \
        tree \
        net-tools \
        dnsutils \
        telnet \
        openssl \
        uuid-runtime
    
    print_success "System dependencies installed"
}

# Function to install Node.js
install_nodejs() {
    print_header "Installing Node.js"
    
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_warning "Node.js already installed: $NODE_VERSION"
        return
    fi
    
    print_step "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    print_step "Installing global npm packages..."
    sudo npm install -g npm@latest
    sudo npm install -g pm2
    
    print_success "Node.js installed: $(node --version)"
    print_success "npm installed: $(npm --version)"
}

# Function to install Docker
install_docker() {
    print_header "Installing Docker"
    
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version)
        print_warning "Docker already installed: $DOCKER_VERSION"
        return
    fi
    
    print_step "Installing Docker..."
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    print_step "Adding user to docker group..."
    sudo usermod -aG docker $USER
    
    print_step "Starting Docker service..."
    sudo systemctl enable docker
    sudo systemctl start docker
    
    print_success "Docker installed: $(docker --version)"
    print_warning "Please log out and log back in for Docker group changes to take effect"
}

# Function to install PostgreSQL (if not using Docker)
install_postgresql() {
    print_header "Installing PostgreSQL (Optional - Docker recommended)"
    
    if command_exists psql; then
        print_warning "PostgreSQL already installed"
        return
    fi
    
    print_step "Installing PostgreSQL..."
    sudo apt-get install -y postgresql postgresql-contrib
    
    print_step "Starting PostgreSQL service..."
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
    
    print_success "PostgreSQL installed"
}

# Function to create project directory and user
setup_project_environment() {
    print_header "Setting Up Project Environment"
    
    print_step "Creating project directory..."
    sudo mkdir -p $PROJECT_DIR
    sudo chown $USER:$USER $PROJECT_DIR
    
    print_step "Creating service user (if needed)..."
    if ! id "$SERVICE_USER" &>/dev/null; then
        sudo useradd -r -s /bin/false -d $PROJECT_DIR $SERVICE_USER
        sudo chown -R $SERVICE_USER:$SERVICE_USER $PROJECT_DIR
    fi
    
    print_success "Project environment set up"
}

# Function to clone and setup the project
setup_project() {
    print_header "Setting Up Contract Management System"
    
    print_step "Cloning project repository..."
    cd $PROJECT_DIR
    if [ ! -d ".git" ]; then
        git clone https://github.com/your-username/ContractManagement.git .
    else
        print_warning "Project already cloned, updating..."
        git pull origin main
    fi
    
    print_step "Installing Node.js dependencies..."
    cd backend
    npm install
    cd ../frontend
    npm install
    cd ..
    
    print_step "Setting up environment files..."
    if [ ! -f "backend/.env" ]; then
        cp config.env backend/.env
        print_warning "Created backend/.env from config.env - please review and update as needed"
    fi
    
    if [ ! -f "frontend/.env" ]; then
        cp frontend/.env.example frontend/.env 2>/dev/null || echo "No frontend .env.example found"
    fi
    
    print_success "Project setup completed"
}

# Function to setup systemd services
setup_systemd_services() {
    print_header "Setting Up Systemd Services"
    
    print_step "Creating systemd service files..."
    
    # Backend service
    sudo tee /etc/systemd/system/contract-management-backend.service > /dev/null <<EOF
[Unit]
Description=Contract Management System Backend
After=network.target postgresql.service docker.service
Requires=docker.service

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$PROJECT_DIR/backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5001

[Install]
WantedBy=multi-user.target
EOF

    # Frontend service
    sudo tee /etc/systemd/system/contract-management-frontend.service > /dev/null <<EOF
[Unit]
Description=Contract Management System Frontend
After=network.target contract-management-backend.service
Requires=contract-management-backend.service

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$PROJECT_DIR/frontend
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

    print_step "Reloading systemd daemon..."
    sudo systemctl daemon-reload
    
    print_success "Systemd services created"
}

# Function to setup Docker services
setup_docker_services() {
    print_header "Setting Up Docker Services"
    
    print_step "Creating Docker Compose configuration..."
    
    # Create a production docker-compose.yml
    tee docker-compose.prod.yml > /dev/null <<EOF
version: '3.8'

services:
  postgres-app:
    image: postgres:15
    container_name: postgres-app
    environment:
      POSTGRES_DB: contract_management
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_app_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres-keycloak:
    image: postgres:15
    container_name: postgres-keycloak
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: keycloak
    ports:
      - "5433:5432"
    volumes:
      - postgres_keycloak_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U keycloak"]
      interval: 30s
      timeout: 10s
      retries: 3

  keycloak:
    image: quay.io/keycloak/keycloak:23.0
    container_name: keycloak
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin123
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres-keycloak:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: keycloak
      KC_HOSTNAME_STRICT: false
      KC_HOSTNAME_STRICT_HTTPS: false
      KC_HTTP_ENABLED: true
    ports:
      - "8080:8080"
    depends_on:
      postgres-keycloak:
        condition: service_healthy
    restart: unless-stopped
    command: start-dev
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8080/health/ready || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5

volumes:
  postgres_app_data:
  postgres_keycloak_data:
EOF

    print_success "Docker services configured"
}

# Function to setup firewall
setup_firewall() {
    print_header "Setting Up Firewall"
    
    if command_exists ufw; then
        print_step "Configuring UFW firewall..."
        sudo ufw --force enable
        sudo ufw allow ssh
        sudo ufw allow 3000/tcp  # Frontend
        sudo ufw allow 5001/tcp  # Backend API
        sudo ufw allow 8080/tcp  # Keycloak
        sudo ufw allow 5432/tcp  # PostgreSQL (if needed externally)
        print_success "Firewall configured"
    else
        print_warning "UFW not available, skipping firewall setup"
    fi
}

# Function to setup monitoring and logging
setup_monitoring() {
    print_header "Setting Up Monitoring and Logging"
    
    print_step "Creating log directories..."
    sudo mkdir -p /var/log/contract-management
    sudo chown $SERVICE_USER:$SERVICE_USER /var/log/contract-management
    
    print_step "Installing logrotate configuration..."
    sudo tee /etc/logrotate.d/contract-management > /dev/null <<EOF
/var/log/contract-management/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $SERVICE_USER $SERVICE_USER
    postrotate
        systemctl reload contract-management-backend
        systemctl reload contract-management-frontend
    endscript
}
EOF
    
    print_success "Monitoring and logging configured"
}

# Function to create management scripts
create_management_scripts() {
    print_header "Creating Management Scripts"
    
    # Start script
    tee start-system.sh > /dev/null <<'EOF'
#!/bin/bash
# Start Contract Management System

echo "🚀 Starting Contract Management System..."

# Start Docker services
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Start application services
sudo systemctl start contract-management-backend
sudo systemctl start contract-management-frontend

echo "✅ System started successfully!"
echo "📊 Check status with: ./status.sh"
EOF

    # Stop script
    tee stop-system.sh > /dev/null <<'EOF'
#!/bin/bash
# Stop Contract Management System

echo "🛑 Stopping Contract Management System..."

# Stop application services
sudo systemctl stop contract-management-frontend
sudo systemctl stop contract-management-backend

# Stop Docker services
docker-compose -f docker-compose.prod.yml down

echo "✅ System stopped successfully!"
EOF

    # Status script
    tee status.sh > /dev/null <<'EOF'
#!/bin/bash
# Check Contract Management System Status

echo "📊 Contract Management System Status"
echo "=================================="

echo "🐳 Docker Services:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🔧 System Services:"
sudo systemctl status contract-management-backend --no-pager -l
sudo systemctl status contract-management-frontend --no-pager -l

echo ""
echo "🌐 Service Health:"
curl -s http://localhost:5001/health | jq . 2>/dev/null || echo "Backend not responding"
curl -s http://localhost:3000 | head -1 || echo "Frontend not responding"
curl -s http://localhost:8080/health/ready | jq . 2>/dev/null || echo "Keycloak not responding"
EOF

    # Make scripts executable
    chmod +x start-system.sh stop-system.sh status.sh
    
    print_success "Management scripts created"
}

# Function to setup SSL/TLS (optional)
setup_ssl() {
    print_header "Setting Up SSL/TLS (Optional)"
    
    print_step "Installing Certbot for Let's Encrypt..."
    sudo apt-get install -y certbot python3-certbot-nginx
    
    print_warning "SSL setup requires domain name and nginx configuration"
    print_warning "Run 'sudo certbot --nginx' after configuring nginx"
    
    print_success "SSL tools installed"
}

# Function to run initial setup
run_initial_setup() {
    print_header "Running Initial System Setup"
    
    print_step "Starting Docker services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    print_step "Waiting for services to be ready..."
    sleep 60
    
    print_step "Setting up Keycloak..."
    cd backend
    node setup-keycloak-simple.js
    cd ..
    
    print_step "Running database migrations..."
    cd backend
    node run-migrations.js
    cd ..
    
    print_success "Initial setup completed"
}

# Function to display final instructions
display_final_instructions() {
    print_header "Setup Complete!"
    
    echo -e "${GREEN}🎉 Contract Management System has been successfully installed!${NC}"
    echo ""
    echo -e "${CYAN}📋 Next Steps:${NC}"
    echo "1. Review and update configuration files:"
    echo "   - backend/.env"
    echo "   - frontend/.env"
    echo ""
    echo "2. Start the system:"
    echo "   ./start-system.sh"
    echo ""
    echo "3. Check system status:"
    echo "   ./status.sh"
    echo ""
    echo "4. Access the application:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - Backend API: http://localhost:5001"
    echo "   - Keycloak: http://localhost:8080"
    echo ""
    echo -e "${YELLOW}⚠️  Important Notes:${NC}"
    echo "- Docker group changes require logout/login to take effect"
    echo "- Review firewall settings if accessing from external networks"
    echo "- Configure SSL/TLS for production deployments"
    echo "- Set up proper backup procedures for databases"
    echo ""
    echo -e "${GREEN}📚 Documentation:${NC}"
    echo "- Check README.md for detailed usage instructions"
    echo "- Review API documentation at /api/docs"
    echo ""
}

# Main execution
main() {
    print_header "Contract Management System - Linux Setup"
    
    check_root
    
    print_status "Starting installation on $(lsb_release -d | cut -f2)"
    print_status "Installing for user: $USER"
    print_status "Project directory: $PROJECT_DIR"
    
    # Install dependencies
    install_system_dependencies
    install_nodejs
    install_docker
    install_postgresql
    
    # Setup environment
    setup_project_environment
    setup_project
    setup_docker_services
    setup_systemd_services
    setup_firewall
    setup_monitoring
    create_management_scripts
    setup_ssl
    
    # Run initial setup
    run_initial_setup
    
    # Display final instructions
    display_final_instructions
}

# Run main function
main "$@"
