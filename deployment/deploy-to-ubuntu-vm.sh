#!/bin/bash

# Ubuntu VM Deployment Script for Contract Management System
# This script automates the deployment process to a new Ubuntu VM

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration variables
DOMAIN_NAME=""
KEYCLOAK_ADMIN_PASSWORD=""
POSTGRES_PASSWORD=""
JWT_SECRET=""
GITHUB_REPO=""
GITHUB_USERNAME=""

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

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
        exit 1
    fi
}

# Function to get user input
get_user_input() {
    echo -e "\n${BLUE}🔧 Ubuntu VM Deployment Configuration${NC}"
    echo "=========================================="
    
    read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME
    read -s -p "Enter Keycloak admin password: " KEYCLOAK_ADMIN_PASSWORD
    echo
    read -s -p "Enter PostgreSQL password: " POSTGRES_PASSWORD
    echo
    read -s -p "Enter JWT secret (or press Enter to generate): " JWT_SECRET
    echo
    read -p "Enter GitHub username: " GITHUB_USERNAME
    read -p "Enter GitHub repository name (default: ContractManagement): " GITHUB_REPO
    
    # Set defaults
    if [ -z "$GITHUB_REPO" ]; then
        GITHUB_REPO="ContractManagement"
    fi
    
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(openssl rand -hex 64)
        print_success "Generated JWT secret: ${JWT_SECRET:0:20}..."
    fi
    
    echo -e "\n${GREEN}Configuration Summary:${NC}"
    echo "  - Domain: $DOMAIN_NAME"
    echo "  - GitHub: $GITHUB_USERNAME/$GITHUB_REPO"
    echo "  - JWT Secret: ${JWT_SECRET:0:20}..."
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

# Function to install Nginx and Certbot
install_nginx_certbot() {
    print_status "Installing Nginx and Certbot..."
    sudo apt install -y nginx certbot python3-certbot-nginx
    print_success "Nginx and Certbot installed successfully"
}

# Function to configure Nginx
configure_nginx() {
    print_status "Configuring Nginx..."
    
    # Create nginx configuration
    sudo tee /etc/nginx/sites-available/contract-management <<EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # Enable site
    sudo ln -s /etc/nginx/sites-available/contract-management /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl restart nginx
    print_success "Nginx configured successfully"
}

# Function to get SSL certificate
get_ssl_certificate() {
    print_status "Getting SSL certificate from Let's Encrypt..."
    print_warning "Make sure your domain $DOMAIN_NAME points to this server's IP address"
    read -p "Press Enter when DNS is configured..."
    
    sudo certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos --email admin@$DOMAIN_NAME
    
    # Test auto-renewal
    sudo certbot renew --dry-run
    print_success "SSL certificate obtained successfully"
}

# Function to clone repository
clone_repository() {
    print_status "Cloning repository..."
    cd /opt
    sudo git clone https://github.com/$GITHUB_USERNAME/$GITHUB_REPO.git
    sudo chown -R $USER:$USER $GITHUB_REPO
    cd $GITHUB_REPO
    print_success "Repository cloned successfully"
}

# Function to configure environment
configure_environment() {
    print_status "Configuring environment..."
    
    # Copy and edit environment file
    cp env.example config.env
    
    # Update config.env with production values
    sed -i "s|KEYCLOAK_URL=.*|KEYCLOAK_URL=https://$DOMAIN_NAME:8443|g" config.env
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN_NAME|g" config.env
    sed -i "s|BACKEND_URL=.*|BACKEND_URL=https://$DOMAIN_NAME|g" config.env
    sed -i "s|KEYCLOAK_ADMIN_PASSWORD=.*|KEYCLOAK_ADMIN_PASSWORD=$KEYCLOAK_ADMIN_PASSWORD|g" config.env
    sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|g" config.env
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" config.env
    
    print_success "Environment configured successfully"
}

# Function to create production docker-compose
create_production_compose() {
    print_status "Creating production Docker Compose file..."
    
    # Create production docker-compose
    cp docker-compose.main.yml docker-compose.prod.yml
    
    # Update for production settings
    sed -i "s|KC_HOSTNAME:.*|KC_HOSTNAME: $DOMAIN_NAME|g" docker-compose.prod.yml
    sed -i "s|restart:.*|restart: unless-stopped|g" docker-compose.prod.yml
    
    print_success "Production Docker Compose created successfully"
}

# Function to generate Keycloak certificates
generate_***REMOVED-KEYCLOAK_DB_PASSWORD***_certs() {
    print_status "Generating SSL certificates for Keycloak..."
    
    # Create directory for Keycloak certificates
    mkdir -p deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-certs
    
    # Generate self-signed certificate for Keycloak
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-certs/***REMOVED-KEYCLOAK_DB_PASSWORD***.key \
      -out deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-certs/***REMOVED-KEYCLOAK_DB_PASSWORD***.crt \
      -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN_NAME"
    
    # Set permissions
    sudo chown -R $USER:$USER deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-certs
    chmod 600 deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-certs/***REMOVED-KEYCLOAK_DB_PASSWORD***.key
    chmod 644 deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-certs/***REMOVED-KEYCLOAK_DB_PASSWORD***.crt
    
    print_success "Keycloak certificates generated successfully"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing application dependencies..."
    
    # Backend dependencies
    cd backend
    npm install --production
    
    # Frontend dependencies
    cd ../frontend
    npm install --production
    npm run build
    
    cd ..
    print_success "Dependencies installed successfully"
}

# Function to start services
start_services() {
    print_status "Starting services..."
    
    # Start all services
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to start
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check service status
    docker-compose -f docker-compose.prod.yml ps
    print_success "Services started successfully"
}

# Function to configure Keycloak
configure_***REMOVED-KEYCLOAK_DB_PASSWORD***() {
    print_status "Configuring Keycloak..."
    
    # Wait for Keycloak to start
    print_status "Waiting for Keycloak to be ready..."
    while ! curl -k -s https://localhost:8443/health > /dev/null; do
        sleep 10
        print_status "Waiting for Keycloak..."
    done
    
    # Run Keycloak configuration
    cd deployment
    if [ -f "configure-***REMOVED-KEYCLOAK_DB_PASSWORD***-https.js" ]; then
        # Update the script with production values
        sed -i "s|https://localhost:8443|https://$DOMAIN_NAME:8443|g" configure-***REMOVED-KEYCLOAK_DB_PASSWORD***-https.js
        sed -i "s|***REMOVED-KEYCLOAK_ADMIN_PASSWORD***|$KEYCLOAK_ADMIN_PASSWORD|g" configure-***REMOVED-KEYCLOAK_DB_PASSWORD***-https.js
        
        node configure-***REMOVED-KEYCLOAK_DB_PASSWORD***-https.js
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
    if curl -k -s https://$DOMAIN_NAME/api/health > /dev/null; then
        print_success "Backend is responding"
    else
        print_error "Backend is not responding"
    fi
    
    # Test frontend
    if curl -k -s https://$DOMAIN_NAME > /dev/null; then
        print_success "Frontend is responding"
    else
        print_error "Frontend is not responding"
    fi
    
    # Test Keycloak
    if curl -k -s https://$DOMAIN_NAME:8443/health > /dev/null; then
        print_success "Keycloak is responding"
    else
        print_error "Keycloak is not responding"
    fi
}

# Function to setup firewall
setup_firewall() {
    print_status "Setting up firewall..."
    
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw allow 8443/tcp
    sudo ufw --force enable
    
    print_success "Firewall configured successfully"
}

# Function to create backup script
create_backup_script() {
    print_status "Creating backup script..."
    
    sudo tee /opt/backup-contract-management.sh <<EOF
#!/bin/bash
BACKUP_DIR="/opt/backups/\$(date +%Y%m%d_%H%M%S)"
mkdir -p \$BACKUP_DIR

# Backup databases
docker exec ***REMOVED-DB_PASSWORD***-app pg_dump -U ***REMOVED-DB_PASSWORD*** contract_management > \$BACKUP_DIR/app_db.sql
docker exec ***REMOVED-DB_PASSWORD***-***REMOVED-KEYCLOAK_DB_PASSWORD*** pg_dump -U ***REMOVED-DB_PASSWORD*** ***REMOVED-KEYCLOAK_DB_PASSWORD*** > \$BACKUP_DIR/***REMOVED-KEYCLOAK_DB_PASSWORD***_db.sql

# Backup Keycloak data
docker cp ***REMOVED-KEYCLOAK_DB_PASSWORD***:/opt/***REMOVED-KEYCLOAK_DB_PASSWORD***/data \$BACKUP_DIR/***REMOVED-KEYCLOAK_DB_PASSWORD***_data

# Compress backup
tar -czf \$BACKUP_DIR.tar.gz \$BACKUP_DIR
rm -rf \$BACKUP_DIR

echo "Backup completed: \$BACKUP_DIR.tar.gz"
EOF

    sudo chmod +x /opt/backup-contract-management.sh
    print_success "Backup script created successfully"
}

# Function to display final instructions
display_final_instructions() {
    echo -e "\n${GREEN}🎉 Deployment Completed Successfully!${NC}"
    echo "=========================================="
    echo -e "${BLUE}Access URLs:${NC}"
    echo "  - Frontend: https://$DOMAIN_NAME"
    echo "  - Backend API: https://$DOMAIN_NAME/api"
    echo "  - Keycloak: https://$DOMAIN_NAME:8443"
    echo ""
    echo -e "${BLUE}Default Credentials:${NC}"
    echo "  - Keycloak Admin: admin / $KEYCLOAK_ADMIN_PASSWORD"
    echo "  - Test Users: See deployment/test-data-creation.log"
    echo ""
    echo -e "${BLUE}Useful Commands:${NC}"
    echo "  - Check services: docker-compose -f docker-compose.prod.yml ps"
    echo "  - View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  - Backup: sudo /opt/backup-contract-management.sh"
    echo "  - Restart: docker-compose -f docker-compose.prod.yml restart"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "  1. Test user login at https://$DOMAIN_NAME"
    echo "  2. Create your first contract"
    echo "  3. Set up monitoring and alerting"
    echo "  4. Configure automated backups"
    echo "  5. Document operational procedures"
}

# Main deployment function
main() {
    echo -e "${BLUE}🚀 Ubuntu VM Deployment Script for Contract Management System${NC}"
    echo "=================================================================="
    
    # Check if running as root
    check_root
    
    # Get user input
    get_user_input
    
    # Confirm deployment
    echo -e "\n${YELLOW}Ready to deploy? This will:${NC}"
    echo "  - Update system packages"
    echo "  - Install Docker, Node.js, Nginx, Certbot"
    echo "  - Configure SSL certificates"
    echo "  - Deploy the application"
    echo "  - Configure Keycloak IAM"
    echo "  - Create test data"
    echo "  - Set up firewall and backup"
    
    read -p "Continue with deployment? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled."
        exit 0
    fi
    
    # Start deployment
    print_status "Starting deployment process..."
    
    update_system
    install_docker
    install_nodejs
    install_nginx_certbot
    configure_nginx
    get_ssl_certificate
    clone_repository
    configure_environment
    create_production_compose
    generate_***REMOVED-KEYCLOAK_DB_PASSWORD***_certs
    install_dependencies
    start_services
    configure_***REMOVED-KEYCLOAK_DB_PASSWORD***
    create_test_data
    test_deployment
    setup_firewall
    create_backup_script
    
    # Display final instructions
    display_final_instructions
}

# Run main function
main "$@"
