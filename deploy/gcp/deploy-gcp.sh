#!/bin/bash

# Contract Management System - GCP Production Deployment Script
# This script deploys the system to Google Cloud Platform

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
PROJECT_NAME="contract-management"
PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-us-central1}"
ZONE="${GCP_ZONE:-us-central1-a}"
MACHINE_TYPE="${GCP_MACHINE_TYPE:-e2-standard-2}"
IMAGE_FAMILY="ubuntu-2004-lts"
IMAGE_PROJECT="ubuntu-os-cloud"
SSH_KEY_PATH="${SSH_KEY_PATH:-~/.ssh/id_rsa.pub}"
VPC_CIDR="10.0.0.0/16"
SUBNET_CIDR="10.0.1.0/24"

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

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check gcloud CLI
    if ! command -v gcloud >/dev/null 2>&1; then
        print_error "gcloud CLI is not installed. Please install it first:"
        echo "https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    # Check gcloud authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        print_error "Not authenticated with gcloud. Please run 'gcloud auth login' first."
        exit 1
    fi
    
    # Check project ID
    if [ -z "$PROJECT_ID" ]; then
        print_error "GCP_PROJECT_ID environment variable is required."
        echo "Set it with: export GCP_PROJECT_ID=your-project-id"
        exit 1
    fi
    
    # Set project
    gcloud config set project "$PROJECT_ID"
    
    # Check SSH key
    if [ ! -f "$SSH_KEY_PATH" ]; then
        print_error "SSH key not found at $SSH_KEY_PATH"
        echo "Please provide a valid SSH public key path."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to enable required APIs
enable_apis() {
    print_header "Enabling Required APIs"
    
    print_step "Enabling required APIs..."
    gcloud services enable \
        compute.googleapis.com \
        sqladmin.googleapis.com \
        cloudresourcemanager.googleapis.com \
        iam.googleapis.com \
        --project="$PROJECT_ID"
    
    print_success "APIs enabled"
}

# Function to create VPC network
create_vpc_network() {
    print_header "Creating VPC Network"
    
    # Create VPC
    print_step "Creating VPC network..."
    gcloud compute networks create "${PROJECT_NAME}-vpc" \
        --subnet-mode=custom \
        --bgp-routing-mode=regional \
        --project="$PROJECT_ID"
    
    print_success "VPC network created"
    
    # Create subnet
    print_step "Creating subnet..."
    gcloud compute networks subnets create "${PROJECT_NAME}-subnet" \
        --network="${PROJECT_NAME}-vpc" \
        --range="$SUBNET_CIDR" \
        --region="$REGION" \
        --project="$PROJECT_ID"
    
    print_success "Subnet created"
    
    # Create firewall rules
    print_step "Creating firewall rules..."
    
    # Allow SSH
    gcloud compute firewall-rules create "${PROJECT_NAME}-allow-ssh" \
        --network="${PROJECT_NAME}-vpc" \
        --allow=tcp:22 \
        --source-ranges=0.0.0.0/0 \
        --target-tags=ssh \
        --project="$PROJECT_ID"
    
    # Allow HTTP
    gcloud compute firewall-rules create "${PROJECT_NAME}-allow-http" \
        --network="${PROJECT_NAME}-vpc" \
        --allow=tcp:80 \
        --source-ranges=0.0.0.0/0 \
        --target-tags=http-server \
        --project="$PROJECT_ID"
    
    # Allow HTTPS
    gcloud compute firewall-rules create "${PROJECT_NAME}-allow-https" \
        --network="${PROJECT_NAME}-vpc" \
        --allow=tcp:443 \
        --source-ranges=0.0.0.0/0 \
        --target-tags=https-server \
        --project="$PROJECT_ID"
    
    # Allow application ports
    gcloud compute firewall-rules create "${PROJECT_NAME}-allow-app" \
        --network="${PROJECT_NAME}-vpc" \
        --allow=tcp:3000,tcp:5001,tcp:8080 \
        --source-ranges=0.0.0.0/0 \
        --target-tags=app-server \
        --project="$PROJECT_ID"
    
    print_success "Firewall rules created"
}

# Function to create compute instance
create_compute_instance() {
    print_header "Creating Compute Instance"
    
    # Create instance
    print_step "Creating compute instance..."
    gcloud compute instances create "${PROJECT_NAME}-instance" \
        --zone="$ZONE" \
        --machine-type="$MACHINE_TYPE" \
        --network-interface=subnet="${PROJECT_NAME}-subnet",no-address \
        --metadata-from-file=ssh-keys="$SSH_KEY_PATH" \
        --create-disk=auto-delete=yes,boot=yes,device-name="${PROJECT_NAME}-instance",image=projects/$IMAGE_PROJECT/global/images/family/$IMAGE_FAMILY,mode=rw,size=20,type=projects/$PROJECT_ID/zones/$ZONE/diskTypes/pd-standard \
        --tags=ssh,http-server,https-server,app-server \
        --project="$PROJECT_ID"
    
    print_success "Compute instance created"
    
    # Create static IP
    print_step "Creating static IP address..."
    gcloud compute addresses create "${PROJECT_NAME}-ip" \
        --region="$REGION" \
        --project="$PROJECT_ID"
    
    # Get static IP
    STATIC_IP=$(gcloud compute addresses describe "${PROJECT_NAME}-ip" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format="value(address)")
    
    # Assign static IP to instance
    gcloud compute instances add-access-config "${PROJECT_NAME}-instance" \
        --zone="$ZONE" \
        --address="$STATIC_IP" \
        --project="$PROJECT_ID"
    
    print_success "Static IP assigned: $STATIC_IP"
}

# Function to create Cloud SQL database
create_cloud_sql() {
    print_header "Creating Cloud SQL Database"
    
    # Create Cloud SQL instance
    print_step "Creating Cloud SQL instance..."
    gcloud sql instances create "${PROJECT_NAME}-db" \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region="$REGION" \
        --storage-type=SSD \
        --storage-size=10GB \
        --storage-auto-increase \
        --backup \
        --enable-ip-alias \
        --network="projects/$PROJECT_ID/global/networks/${PROJECT_NAME}-vpc" \
        --no-assign-ip \
        --project="$PROJECT_ID"
    
    print_success "Cloud SQL instance created"
    
    # Create database
    print_step "Creating database..."
    gcloud sql databases create contract_management \
        --instance="${PROJECT_NAME}-db" \
        --project="$PROJECT_ID"
    
    # Create user
    print_step "Creating database user..."
    gcloud sql users create cmsadmin \
        --instance="${PROJECT_NAME}-db" \
        --password="ContractManagement123!" \
        --project="$PROJECT_ID"
    
    print_success "Database and user created"
}

# Function to create load balancer
create_load_balancer() {
    print_header "Creating Load Balancer"
    
    # Create health check
    print_step "Creating health check..."
    gcloud compute health-checks create http "${PROJECT_NAME}-health-check" \
        --port=5001 \
        --request-path="/health" \
        --project="$PROJECT_ID"
    
    # Create backend service
    print_step "Creating backend service..."
    gcloud compute backend-services create "${PROJECT_NAME}-backend" \
        --protocol=HTTP \
        --health-checks="${PROJECT_NAME}-health-check" \
        --global \
        --project="$PROJECT_ID"
    
    # Create instance group
    print_step "Creating instance group..."
    gcloud compute instance-groups unmanaged create "${PROJECT_NAME}-group" \
        --zone="$ZONE" \
        --project="$PROJECT_ID"
    
    # Add instance to group
    gcloud compute instance-groups unmanaged add-instances "${PROJECT_NAME}-group" \
        --zone="$ZONE" \
        --instances="${PROJECT_NAME}-instance" \
        --project="$PROJECT_ID"
    
    # Add instance group to backend service
    gcloud compute backend-services add-backend "${PROJECT_NAME}-backend" \
        --instance-group="${PROJECT_NAME}-group" \
        --instance-group-zone="$ZONE" \
        --global \
        --project="$PROJECT_ID"
    
    # Create URL map
    print_step "Creating URL map..."
    gcloud compute url-maps create "${PROJECT_NAME}-url-map" \
        --default-service="${PROJECT_NAME}-backend" \
        --project="$PROJECT_ID"
    
    # Create HTTP proxy
    gcloud compute target-http-proxies create "${PROJECT_NAME}-http-proxy" \
        --url-map="${PROJECT_NAME}-url-map" \
        --project="$PROJECT_ID"
    
    # Create forwarding rule
    gcloud compute forwarding-rules create "${PROJECT_NAME}-forwarding-rule" \
        --global \
        --target-http-proxy="${PROJECT_NAME}-http-proxy" \
        --address="${PROJECT_NAME}-ip" \
        --ports=80 \
        --project="$PROJECT_ID"
    
    print_success "Load balancer created"
}

# Function to deploy application
deploy_application() {
    print_header "Deploying Application"
    
    # Get static IP
    STATIC_IP=$(gcloud compute addresses describe "${PROJECT_NAME}-ip" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format="value(address)")
    
    # Create deployment script
    print_step "Creating deployment script..."
    cat > deploy-app.sh << 'EOF'
#!/bin/bash

# Update system
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt-get install -y git

# Install gcloud CLI
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
sudo apt-get update -y
sudo apt-get install -y google-cloud-cli

# Clone repository
git clone https://github.com/your-username/ContractManagement.git
cd ContractManagement

# Create production environment file
cat > .env << 'ENVEOF'
NODE_ENV=production
COMPOSE_PROJECT_NAME=contract-management-prod

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=contract_management
DB_USER=cmsadmin
DB_PASSWORD=ContractManagement123!

# Keycloak
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=contract-management
KEYCLOAK_CLIENT_ID=contract-management-client
KEYCLOAK_CLIENT_SECRET=your-client-secret

# API
API_PORT=5001
FRONTEND_PORT=3000
KEYCLOAK_PORT=8080

# SSL
SSL_CERT_PATH=/etc/ssl/certs/contract-management.crt
SSL_KEY_PATH=/etc/ssl/private/contract-management.key
ENVEOF

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Setup firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
sudo ufw allow 5001
sudo ufw allow 8080
sudo ufw --force enable

echo "Application deployed successfully!"
EOF

    # Copy deployment script to instance
    print_step "Copying deployment script to instance..."
    gcloud compute scp deploy-app.sh "${PROJECT_NAME}-instance":/home/$USER/ \
        --zone="$ZONE" \
        --project="$PROJECT_ID"
    
    # Execute deployment script
    print_step "Executing deployment script..."
    gcloud compute ssh "${PROJECT_NAME}-instance" \
        --zone="$ZONE" \
        --project="$PROJECT_ID" \
        --command="chmod +x deploy-app.sh && ./deploy-app.sh"
    
    print_success "Application deployed successfully"
}

# Function to setup SSL certificate
setup_ssl() {
    print_header "Setting Up SSL Certificate"
    
    print_step "Installing Certbot..."
    gcloud compute ssh "${PROJECT_NAME}-instance" \
        --zone="$ZONE" \
        --project="$PROJECT_ID" \
        --command="sudo apt-get install -y certbot python3-certbot-nginx"
    
    print_warning "SSL certificate setup requires domain name and nginx configuration"
    print_warning "Run the following command on the instance to setup SSL:"
    echo "sudo certbot --nginx -d your-domain.com"
    
    print_success "SSL tools installed"
}

# Function to display deployment information
display_deployment_info() {
    print_header "Deployment Complete!"
    
    # Get static IP
    STATIC_IP=$(gcloud compute addresses describe "${PROJECT_NAME}-ip" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format="value(address)")
    
    echo -e "${GREEN}🎉 Contract Management System deployed successfully to GCP!${NC}"
    echo ""
    echo -e "${CYAN}📋 Deployment Information:${NC}"
    echo "  Project ID: $PROJECT_ID"
    echo "  Region: $REGION"
    echo "  Zone: $ZONE"
    echo "  Instance: ${PROJECT_NAME}-instance"
    echo "  Static IP: $STATIC_IP"
    echo "  Database: ${PROJECT_NAME}-db"
    echo "  Load Balancer: ${PROJECT_NAME}-backend"
    echo ""
    echo -e "${CYAN}🌐 Service URLs:${NC}"
    echo "  Frontend: http://$STATIC_IP:3000"
    echo "  Backend API: http://$STATIC_IP:5001"
    echo "  Keycloak: http://$STATIC_IP:8080"
    echo ""
    echo -e "${CYAN}🔧 Management Commands:${NC}"
    echo "  SSH Access: gcloud compute ssh ${PROJECT_NAME}-instance --zone=$ZONE"
    echo "  View Logs: gcloud compute ssh ${PROJECT_NAME}-instance --zone=$ZONE --command='docker-compose -f ContractManagement/docker-compose.prod.yml logs -f'"
    echo "  Restart Services: gcloud compute ssh ${PROJECT_NAME}-instance --zone=$ZONE --command='cd ContractManagement && docker-compose -f docker-compose.prod.yml restart'"
    echo ""
    echo -e "${YELLOW}⚠️  Next Steps:${NC}"
    echo "1. Configure domain name and SSL certificate"
    echo "2. Update database connection settings"
    echo "3. Configure Keycloak for production"
    echo "4. Set up monitoring and logging"
    echo "5. Configure backup procedures"
    echo ""
    echo -e "${GREEN}📚 Documentation:${NC}"
    echo "- GCP Console: https://console.cloud.google.com"
    echo "- Project: $PROJECT_ID"
    echo "- Instance: ${PROJECT_NAME}-instance"
    echo "- Database: ${PROJECT_NAME}-db"
    echo ""
}

# Function to cleanup resources
cleanup() {
    print_header "Cleaning Up Resources"
    
    read -p "This will delete all created resources. Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Cleanup cancelled"
        exit 0
    fi
    
    print_step "Deleting resources..."
    
    # Delete load balancer components
    gcloud compute forwarding-rules delete "${PROJECT_NAME}-forwarding-rule" --global --quiet --project="$PROJECT_ID" || true
    gcloud compute target-http-proxies delete "${PROJECT_NAME}-http-proxy" --quiet --project="$PROJECT_ID" || true
    gcloud compute url-maps delete "${PROJECT_NAME}-url-map" --quiet --project="$PROJECT_ID" || true
    gcloud compute backend-services delete "${PROJECT_NAME}-backend" --global --quiet --project="$PROJECT_ID" || true
    gcloud compute instance-groups unmanaged delete "${PROJECT_NAME}-group" --zone="$ZONE" --quiet --project="$PROJECT_ID" || true
    gcloud compute health-checks delete "${PROJECT_NAME}-health-check" --quiet --project="$PROJECT_ID" || true
    
    # Delete Cloud SQL
    gcloud sql instances delete "${PROJECT_NAME}-db" --quiet --project="$PROJECT_ID" || true
    
    # Delete compute instance
    gcloud compute instances delete "${PROJECT_NAME}-instance" --zone="$ZONE" --quiet --project="$PROJECT_ID" || true
    
    # Delete static IP
    gcloud compute addresses delete "${PROJECT_NAME}-ip" --region="$REGION" --quiet --project="$PROJECT_ID" || true
    
    # Delete VPC network
    gcloud compute networks delete "${PROJECT_NAME}-vpc" --quiet --project="$PROJECT_ID" || true
    
    print_success "Cleanup completed"
}

# Main execution
main() {
    print_header "Contract Management System - GCP Deployment"
    
    # Check prerequisites
    check_prerequisites
    
    # Create infrastructure
    enable_apis
    create_vpc_network
    create_compute_instance
    create_cloud_sql
    create_load_balancer
    
    # Deploy application
    deploy_application
    setup_ssl
    
    # Display information
    display_deployment_info
}

# Handle command line arguments
case "${1:-}" in
    "cleanup")
        cleanup
        ;;
    "info")
        display_deployment_info
        ;;
    *)
        main
        ;;
esac
