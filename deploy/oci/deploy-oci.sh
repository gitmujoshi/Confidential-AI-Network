#!/bin/bash

# Contract Management System - OCI Production Deployment Script
# This script deploys the system to Oracle Cloud Infrastructure

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
COMPARTMENT_ID="${OCI_COMPARTMENT_ID:-}"
REGION="${OCI_REGION:-us-ashburn-1}"
AVAILABILITY_DOMAIN="${OCI_AVAILABILITY_DOMAIN:-1}"
VCN_CIDR="10.0.0.0/16"
SUBNET_CIDR="10.0.1.0/24"
INSTANCE_SHAPE="VM.Standard.E4.Flex"
INSTANCE_OCPUS=2
INSTANCE_MEMORY=8
INSTANCE_OS="Oracle Linux 8"
SSH_KEY_PATH="${SSH_KEY_PATH:-~/.ssh/id_rsa.pub}"

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
    
    # Check OCI CLI
    if ! command -v oci >/dev/null 2>&1; then
        print_error "OCI CLI is not installed. Please install it first:"
        echo "https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm"
        exit 1
    fi
    
    # Check OCI configuration
    if ! oci setup config --list >/dev/null 2>&1; then
        print_error "OCI CLI is not configured. Please run 'oci setup config' first."
        exit 1
    fi
    
    # Check required environment variables
    if [ -z "$COMPARTMENT_ID" ]; then
        print_error "OCI_COMPARTMENT_ID environment variable is required."
        echo "Set it with: export OCI_COMPARTMENT_ID=ocid1.compartment.oc1..xxxxx"
        exit 1
    fi
    
    # Check SSH key
    if [ ! -f "$SSH_KEY_PATH" ]; then
        print_error "SSH key not found at $SSH_KEY_PATH"
        echo "Please provide a valid SSH public key path."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to create VCN and networking
create_networking() {
    print_header "Creating Networking Infrastructure"
    
    # Create VCN
    print_step "Creating VCN..."
    VCN_ID=$(oci network vcn create \
        --compartment-id "$COMPARTMENT_ID" \
        --display-name "${PROJECT_NAME}-vcn" \
        --cidr-block "$VCN_CIDR" \
        --dns-label "${PROJECT_NAME}" \
        --query 'data.id' \
        --raw-output)
    
    print_success "VCN created: $VCN_ID"
    
    # Create Internet Gateway
    print_step "Creating Internet Gateway..."
    IGW_ID=$(oci network internet-gateway create \
        --compartment-id "$COMPARTMENT_ID" \
        --vcn-id "$VCN_ID" \
        --display-name "${PROJECT_NAME}-igw" \
        --is-enabled true \
        --query 'data.id' \
        --raw-output)
    
    print_success "Internet Gateway created: $IGW_ID"
    
    # Create Route Table
    print_step "Creating Route Table..."
    RT_ID=$(oci network route-table create \
        --compartment-id "$COMPARTMENT_ID" \
        --vcn-id "$VCN_ID" \
        --display-name "${PROJECT_NAME}-rt" \
        --route-rules '[{"cidrBlock":"0.0.0.0/0","networkEntityId":"'$IGW_ID'"}]' \
        --query 'data.id' \
        --raw-output)
    
    print_success "Route Table created: $RT_ID"
    
    # Create Subnet
    print_step "Creating Subnet..."
    SUBNET_ID=$(oci network subnet create \
        --compartment-id "$COMPARTMENT_ID" \
        --vcn-id "$VCN_ID" \
        --display-name "${PROJECT_NAME}-subnet" \
        --dns-label "${PROJECT_NAME}-subnet" \
        --cidr-block "$SUBNET_CIDR" \
        --route-table-id "$RT_ID" \
        --security-list-ids '[]' \
        --query 'data.id' \
        --raw-output)
    
    print_success "Subnet created: $SUBNET_ID"
    
    # Create Security List
    print_step "Creating Security List..."
    SL_ID=$(oci network security-list create \
        --compartment-id "$COMPARTMENT_ID" \
        --vcn-id "$VCN_ID" \
        --display-name "${PROJECT_NAME}-sl" \
        --egress-security-rules '[{"destination":"0.0.0.0/0","protocol":"all","isStateless":false}]' \
        --ingress-security-rules '[
            {"source":"0.0.0.0/0","protocol":"6","isStateless":false,"tcpOptions":{"destinationPortRange":{"min":22,"max":22}}},
            {"source":"0.0.0.0/0","protocol":"6","isStateless":false,"tcpOptions":{"destinationPortRange":{"min":80,"max":80}}},
            {"source":"0.0.0.0/0","protocol":"6","isStateless":false,"tcpOptions":{"destinationPortRange":{"min":443,"max":443}}},
            {"source":"0.0.0.0/0","protocol":"6","isStateless":false,"tcpOptions":{"destinationPortRange":{"min":3000,"max":3000}}},
            {"source":"0.0.0.0/0","protocol":"6","isStateless":false,"tcpOptions":{"destinationPortRange":{"min":5001,"max":5001}}},
            {"source":"0.0.0.0/0","protocol":"6","isStateless":false,"tcpOptions":{"destinationPortRange":{"min":8080,"max":8080}}}
        ]' \
        --query 'data.id' \
        --raw-output)
    
    print_success "Security List created: $SL_ID"
    
    # Update Subnet with Security List
    print_step "Updating Subnet with Security List..."
    oci network subnet update \
        --subnet-id "$SUBNET_ID" \
        --security-list-ids "[\"$SL_ID\"]" \
        --force >/dev/null
    
    print_success "Subnet updated with Security List"
}

# Function to create compute instance
create_compute_instance() {
    print_header "Creating Compute Instance"
    
    # Get latest Oracle Linux 8 image
    print_step "Getting latest Oracle Linux 8 image..."
    IMAGE_ID=$(oci compute image list \
        --compartment-id "$COMPARTMENT_ID" \
        --operating-system "Oracle Linux" \
        --operating-system-version "8" \
        --sort-by TIMECREATED \
        --sort-order DESC \
        --query 'data[0].id' \
        --raw-output)
    
    print_success "Using image: $IMAGE_ID"
    
    # Create instance
    print_step "Creating compute instance..."
    INSTANCE_ID=$(oci compute instance launch \
        --compartment-id "$COMPARTMENT_ID" \
        --availability-domain "AD-$AVAILABILITY_DOMAIN" \
        --display-name "${PROJECT_NAME}-instance" \
        --image-id "$IMAGE_ID" \
        --shape "$INSTANCE_SHAPE" \
        --shape-config '{"ocpus":'$INSTANCE_OCPUS',"memoryInGBs":'$INSTANCE_MEMORY'}' \
        --subnet-id "$SUBNET_ID" \
        --ssh-authorized-keys-file "$SSH_KEY_PATH" \
        --assign-public-ip true \
        --query 'data.id' \
        --raw-output)
    
    print_success "Instance created: $INSTANCE_ID"
    
    # Wait for instance to be running
    print_step "Waiting for instance to be running..."
    oci compute instance wait \
        --instance-id "$INSTANCE_ID" \
        --wait-for-state RUNNING \
        --max-wait-seconds 600
    
    # Get public IP
    PUBLIC_IP=$(oci compute instance list-vnics \
        --instance-id "$INSTANCE_ID" \
        --query 'data[0]."public-ip"' \
        --raw-output)
    
    print_success "Instance is running with public IP: $PUBLIC_IP"
}

# Function to create database
create_database() {
    print_header "Creating Database"
    
    # Create Autonomous Database
    print_step "Creating Autonomous Database..."
    DB_ID=$(oci db autonomous-database create \
        --compartment-id "$COMPARTMENT_ID" \
        --db-name "${PROJECT_NAME^^}" \
        --display-name "${PROJECT_NAME}-db" \
        --cpu-core-count 1 \
        --data-storage-size-in-tbs 1 \
        --admin-password "ContractManagement123!" \
        --db-version "19c" \
        --is-auto-scaling-enabled false \
        --is-dedicated false \
        --license-model LICENSE_INCLUDED \
        --query 'data.id' \
        --raw-output)
    
    print_success "Database created: $DB_ID"
    
    # Wait for database to be available
    print_step "Waiting for database to be available..."
    oci db autonomous-database wait \
        --autonomous-database-id "$DB_ID" \
        --wait-for-state AVAILABLE \
        --max-wait-seconds 1800
    
    print_success "Database is available"
}

# Function to create load balancer
create_load_balancer() {
    print_header "Creating Load Balancer"
    
    # Create Load Balancer
    print_step "Creating Load Balancer..."
    LB_ID=$(oci lb load-balancer create \
        --compartment-id "$COMPARTMENT_ID" \
        --display-name "${PROJECT_NAME}-lb" \
        --shape-name "flexible" \
        --shape-details '{"minimumBandwidthInMbps":10,"maximumBandwidthInMbps":100}' \
        --subnet-ids "[\"$SUBNET_ID\"]" \
        --is-private false \
        --query 'data.id' \
        --raw-output)
    
    print_success "Load Balancer created: $LB_ID"
    
    # Wait for load balancer to be active
    print_step "Waiting for Load Balancer to be active..."
    oci lb load-balancer wait \
        --load-balancer-id "$LB_ID" \
        --wait-for-state ACTIVE \
        --max-wait-seconds 600
    
    print_success "Load Balancer is active"
}

# Function to deploy application
deploy_application() {
    print_header "Deploying Application"
    
    # Create deployment script
    print_step "Creating deployment script..."
    cat > deploy-app.sh << 'EOF'
#!/bin/bash

# Update system
sudo yum update -y

# Install Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker opc

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Install Git
sudo yum install -y git

# Clone repository
git clone https://github.com/your-username/ContractManagement.git
cd ContractManagement

# Create production environment file
cat > .env << 'ENVEOF'
NODE_ENV=production
COMPOSE_PROJECT_NAME=contract-management-prod

# Database
DB_HOST=your-db-host
DB_PORT=1521
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password

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
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=5001/tcp
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload

echo "Application deployed successfully!"
EOF

    # Copy deployment script to instance
    print_step "Copying deployment script to instance..."
    scp -o StrictHostKeyChecking=no deploy-app.sh opc@$PUBLIC_IP:/home/opc/
    
    # Execute deployment script
    print_step "Executing deployment script..."
    ssh -o StrictHostKeyChecking=no opc@$PUBLIC_IP "chmod +x deploy-app.sh && ./deploy-app.sh"
    
    print_success "Application deployed successfully"
}

# Function to setup SSL certificate
setup_ssl() {
    print_header "Setting Up SSL Certificate"
    
    print_step "Installing Certbot..."
    ssh -o StrictHostKeyChecking=no opc@$PUBLIC_IP "sudo yum install -y certbot python3-certbot-nginx"
    
    print_warning "SSL certificate setup requires domain name and nginx configuration"
    print_warning "Run the following command on the instance to setup SSL:"
    echo "sudo certbot --nginx -d your-domain.com"
    
    print_success "SSL tools installed"
}

# Function to display deployment information
display_deployment_info() {
    print_header "Deployment Complete!"
    
    echo -e "${GREEN}🎉 Contract Management System deployed successfully to OCI!${NC}"
    echo ""
    echo -e "${CYAN}📋 Deployment Information:${NC}"
    echo "  Instance ID: $INSTANCE_ID"
    echo "  Public IP: $PUBLIC_IP"
    echo "  VCN ID: $VCN_ID"
    echo "  Subnet ID: $SUBNET_ID"
    echo "  Database ID: $DB_ID"
    echo "  Load Balancer ID: $LB_ID"
    echo ""
    echo -e "${CYAN}🌐 Service URLs:${NC}"
    echo "  Frontend: http://$PUBLIC_IP:3000"
    echo "  Backend API: http://$PUBLIC_IP:5001"
    echo "  Keycloak: http://$PUBLIC_IP:8080"
    echo ""
    echo -e "${CYAN}🔧 Management Commands:${NC}"
    echo "  SSH Access: ssh opc@$PUBLIC_IP"
    echo "  View Logs: ssh opc@$PUBLIC_IP 'docker-compose -f ContractManagement/docker-compose.prod.yml logs -f'"
    echo "  Restart Services: ssh opc@$PUBLIC_IP 'cd ContractManagement && docker-compose -f docker-compose.prod.yml restart'"
    echo ""
    echo -e "${YELLOW}⚠️  Next Steps:${NC}"
    echo "1. Configure domain name and SSL certificate"
    echo "2. Update database connection settings"
    echo "3. Configure Keycloak for production"
    echo "4. Set up monitoring and logging"
    echo "5. Configure backup procedures"
    echo ""
    echo -e "${GREEN}📚 Documentation:${NC}"
    echo "- OCI Console: https://console.us-ashburn-1.oraclecloud.com"
    echo "- Instance: $INSTANCE_ID"
    echo "- Database: $DB_ID"
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
    
    # Delete Load Balancer
    if [ ! -z "$LB_ID" ]; then
        oci lb load-balancer delete --load-balancer-id "$LB_ID" --force
        print_success "Load Balancer deleted"
    fi
    
    # Delete Database
    if [ ! -z "$DB_ID" ]; then
        oci db autonomous-database delete --autonomous-database-id "$DB_ID" --force
        print_success "Database deleted"
    fi
    
    # Delete Instance
    if [ ! -z "$INSTANCE_ID" ]; then
        oci compute instance terminate --instance-id "$INSTANCE_ID" --force
        print_success "Instance terminated"
    fi
    
    # Delete VCN (this will delete all networking resources)
    if [ ! -z "$VCN_ID" ]; then
        oci network vcn delete --vcn-id "$VCN_ID" --force
        print_success "VCN and networking resources deleted"
    fi
    
    print_success "Cleanup completed"
}

# Main execution
main() {
    print_header "Contract Management System - OCI Deployment"
    
    # Check prerequisites
    check_prerequisites
    
    # Create infrastructure
    create_networking
    create_compute_instance
    create_database
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
