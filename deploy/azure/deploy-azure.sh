#!/bin/bash

# Contract Management System - Azure Production Deployment Script
# This script deploys the system to Microsoft Azure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration — set via environment or edit defaults
PROJECT_NAME="${CAN_PROJECT_NAME:-confidential-ai-network}"
GITHUB_REPO="${CAN_GITHUB_REPO:-https://github.com/gitmujoshi/Confidential-AI-Network.git}"
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-contract-management-rg}"
LOCATION="${AZURE_LOCATION:-eastus}"
VM_SIZE="${AZURE_VM_SIZE:-Standard_D2s_v3}"
VM_IMAGE="Canonical:0001-com-ubuntu-server-focal:20_04-lts:latest"
ADMIN_USERNAME="${AZURE_ADMIN_USERNAME:-azureuser}"
SSH_KEY_PATH="${SSH_KEY_PATH:-~/.ssh/id_rsa.pub}"
VNET_CIDR="10.0.0.0/16"
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
    
    # Check Azure CLI
    if ! command -v az >/dev/null 2>&1; then
        print_error "Azure CLI is not installed. Please install it first:"
        echo "https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi
    
    # Check Azure login
    if ! az account show >/dev/null 2>&1; then
        print_error "Not logged in to Azure. Please run 'az login' first."
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

# Function to create resource group
create_resource_group() {
    print_header "Creating Resource Group"
    
    print_step "Creating resource group..."
    az group create \
        --name "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --output table
    
    print_success "Resource group created: $RESOURCE_GROUP"
}

# Function to create virtual network
create_virtual_network() {
    print_header "Creating Virtual Network"
    
    # Create VNet
    print_step "Creating virtual network..."
    az network vnet create \
        --resource-group "$RESOURCE_GROUP" \
        --name "${PROJECT_NAME}-vnet" \
        --address-prefix "$VNET_CIDR" \
        --subnet-name "${PROJECT_NAME}-subnet" \
        --subnet-prefix "$SUBNET_CIDR" \
        --output table
    
    print_success "Virtual network created"
    
    # Create Network Security Group
    print_step "Creating network security group..."
    az network nsg create \
        --resource-group "$RESOURCE_GROUP" \
        --name "${PROJECT_NAME}-nsg" \
        --output table
    
    # Add security rules
    print_step "Adding security rules..."
    az network nsg rule create \
        --resource-group "$RESOURCE_GROUP" \
        --nsg-name "${PROJECT_NAME}-nsg" \
        --name "SSH" \
        --priority 1000 \
        --source-address-prefixes "*" \
        --source-port-ranges "*" \
        --destination-address-prefixes "*" \
        --destination-port-ranges 22 \
        --access Allow \
        --protocol Tcp \
        --output table
    
    az network nsg rule create \
        --resource-group "$RESOURCE_GROUP" \
        --nsg-name "${PROJECT_NAME}-nsg" \
        --name "HTTP" \
        --priority 1001 \
        --source-address-prefixes "*" \
        --source-port-ranges "*" \
        --destination-address-prefixes "*" \
        --destination-port-ranges 80 \
        --access Allow \
        --protocol Tcp \
        --output table
    
    az network nsg rule create \
        --resource-group "$RESOURCE_GROUP" \
        --nsg-name "${PROJECT_NAME}-nsg" \
        --name "HTTPS" \
        --priority 1002 \
        --source-address-prefixes "*" \
        --source-port-ranges "*" \
        --destination-address-prefixes "*" \
        --destination-port-ranges 443 \
        --access Allow \
        --protocol Tcp \
        --output table
    
    az network nsg rule create \
        --resource-group "$RESOURCE_GROUP" \
        --nsg-name "${PROJECT_NAME}-nsg" \
        --name "Frontend" \
        --priority 1003 \
        --source-address-prefixes "*" \
        --source-port-ranges "*" \
        --destination-address-prefixes "*" \
        --destination-port-ranges 3000 \
        --access Allow \
        --protocol Tcp \
        --output table
    
    az network nsg rule create \
        --resource-group "$RESOURCE_GROUP" \
        --nsg-name "${PROJECT_NAME}-nsg" \
        --name "Backend" \
        --priority 1004 \
        --source-address-prefixes "*" \
        --source-port-ranges "*" \
        --destination-address-prefixes "*" \
        --destination-port-ranges 5001 \
        --access Allow \
        --protocol Tcp \
        --output table
    
    az network nsg rule create \
        --resource-group "$RESOURCE_GROUP" \
        --nsg-name "${PROJECT_NAME}-nsg" \
        --name "Keycloak" \
        --priority 1005 \
        --source-address-prefixes "*" \
        --source-port-ranges "*" \
        --destination-address-prefixes "*" \
        --destination-port-ranges 8080 \
        --access Allow \
        --protocol Tcp \
        --output table
    
    print_success "Network security group created with rules"
}

# Function to create public IP
create_public_ip() {
    print_header "Creating Public IP"
    
    print_step "Creating public IP address..."
    PUBLIC_IP=$(az network public-ip create \
        --resource-group "$RESOURCE_GROUP" \
        --name "${PROJECT_NAME}-public-ip" \
        --allocation-method Static \
        --sku Standard \
        --query 'publicIp.ipAddress' \
        --output tsv)
    
    print_success "Public IP created: $PUBLIC_IP"
}

# Function to create virtual machine
create_virtual_machine() {
    print_header "Creating Virtual Machine"
    
    print_step "Creating virtual machine..."
    az vm create \
        --resource-group "$RESOURCE_GROUP" \
        --name "${PROJECT_NAME}-vm" \
        --image "$VM_IMAGE" \
        --size "$VM_SIZE" \
        --admin-username "$ADMIN_USERNAME" \
        --ssh-key-values "$(cat $SSH_KEY_PATH)" \
        --vnet-name "${PROJECT_NAME}-vnet" \
        --subnet "${PROJECT_NAME}-subnet" \
        --nsg "${PROJECT_NAME}-nsg" \
        --public-ip-address "${PROJECT_NAME}-public-ip" \
        --storage-sku Premium_LRS \
        --output table
    
    print_success "Virtual machine created"
    
    # Get VM details
    VM_IP=$(az vm show \
        --resource-group "$RESOURCE_GROUP" \
        --name "${PROJECT_NAME}-vm" \
        --show-details \
        --query 'publicIps' \
        --output tsv)
    
    print_success "VM is running with public IP: $VM_IP"
}

# Function to create database
create_database() {
    print_header "Creating Database"
    
    DB_ADMIN_PASSWORD="${DB_ADMIN_PASSWORD:-}"
    if [ -z "$DB_ADMIN_PASSWORD" ]; then
        print_error "Set DB_ADMIN_PASSWORD before creating the database."
        echo "  export DB_ADMIN_PASSWORD='your-strong-password'"
        exit 1
    fi

    # Create PostgreSQL Flexible Server
    print_step "Creating PostgreSQL Flexible Server..."
    az postgres flexible-server create \
        --resource-group "$RESOURCE_GROUP" \
        --name "${PROJECT_NAME}-db" \
        --location "$LOCATION" \
        --admin-user "canadmin" \
        --admin-password "$DB_ADMIN_PASSWORD" \
        --sku-name "Standard_B1ms" \
        --tier "Burstable" \
        --public-access "0.0.0.0" \
        --storage-size 32 \
        --version 15 \
        --output table
    
    print_success "PostgreSQL Flexible Server created"
    
    # Create database
    print_step "Creating database..."
    az postgres flexible-server db create \
        --resource-group "$RESOURCE_GROUP" \
        --server-name "${PROJECT_NAME}-db" \
        --database-name "contract_management" \
        --output table
    
    print_success "Database created"
}

# Function to create application gateway
create_application_gateway() {
    print_header "Creating Application Gateway"
    
    # Create public IP for Application Gateway
    print_step "Creating public IP for Application Gateway..."
    az network public-ip create \
        --resource-group "$RESOURCE_GROUP" \
        --name "${PROJECT_NAME}-agw-public-ip" \
        --allocation-method Static \
        --sku Standard \
        --output table
    
    # Create Application Gateway
    print_step "Creating Application Gateway..."
    az network application-gateway create \
        --resource-group "$RESOURCE_GROUP" \
        --name "${PROJECT_NAME}-agw" \
        --location "$LOCATION" \
        --sku-name "Standard_v2" \
        --sku-tier "Standard_v2" \
        --capacity 2 \
        --vnet-name "${PROJECT_NAME}-vnet" \
        --subnet "${PROJECT_NAME}-subnet" \
        --public-ip-address "${PROJECT_NAME}-agw-public-ip" \
        --output table
    
    print_success "Application Gateway created"
}

# Function to deploy application
deploy_application() {
    print_header "Deploying Application"
    
    # Get VM IP
    VM_IP=$(az vm show \
        --resource-group "$RESOURCE_GROUP" \
        --name "${PROJECT_NAME}-vm" \
        --show-details \
        --query 'publicIps' \
        --output tsv)
    
    # Create deployment script
    print_step "Creating deployment script..."
    cat > deploy-app.sh <<EOF
#!/bin/bash
set -euo pipefail

GITHUB_REPO="${GITHUB_REPO}"

sudo apt-get update -y
sudo apt-get upgrade -y

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=\$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \$(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin git curl
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker azureuser

git clone "\${GITHUB_REPO}"
cd Confidential-AI-Network 2>/dev/null || cd "\$(basename "\${GITHUB_REPO}" .git)"

cat > .env <<'ENVEOF'
NODE_ENV=production
COMPOSE_PROJECT_NAME=confidential-ai-network-prod
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=contract_management
DB_USER=canadmin
DB_PASSWORD=CHANGE_ME
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=contract-management
KEYCLOAK_CLIENT_ID=contract-management-client
KEYCLOAK_CLIENT_SECRET=your-client-secret
API_PORT=5001
FRONTEND_PORT=3000
KEYCLOAK_PORT=8080
SCITT_CCF_ENABLED=false
ENVEOF

docker compose -f deploy/production/docker-compose.prod.yml up -d --build

sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
sudo ufw allow 5001
sudo ufw allow 8080
sudo ufw --force enable

echo "Confidential AI Network VM deployment complete"
EOF

    # Copy deployment script to VM
    print_step "Copying deployment script to VM..."
    scp -o StrictHostKeyChecking=no deploy-app.sh $ADMIN_USERNAME@$VM_IP:/home/$ADMIN_USERNAME/
    
    # Execute deployment script
    print_step "Executing deployment script..."
    ssh -o StrictHostKeyChecking=no $ADMIN_USERNAME@$VM_IP "chmod +x deploy-app.sh && ./deploy-app.sh"
    
    print_success "Application deployed successfully"
}

# Function to setup SSL certificate
setup_ssl() {
    print_header "Setting Up SSL Certificate"
    
    # Get VM IP
    VM_IP=$(az vm show \
        --resource-group "$RESOURCE_GROUP" \
        --name "${PROJECT_NAME}-vm" \
        --show-details \
        --query 'publicIps' \
        --output tsv)
    
    print_step "Installing Certbot..."
    ssh -o StrictHostKeyChecking=no $ADMIN_USERNAME@$VM_IP "sudo apt-get install -y certbot python3-certbot-nginx"
    
    print_warning "SSL certificate setup requires domain name and nginx configuration"
    print_warning "Run the following command on the VM to setup SSL:"
    echo "sudo certbot --nginx -d your-domain.com"
    
    print_success "SSL tools installed"
}

# Function to display deployment information
display_deployment_info() {
    print_header "Deployment Complete!"
    
    # Get VM IP
    VM_IP=$(az vm show \
        --resource-group "$RESOURCE_GROUP" \
        --name "${PROJECT_NAME}-vm" \
        --show-details \
        --query 'publicIps' \
        --output tsv)
    
    echo -e "${GREEN}Confidential AI Network deployed to Azure VM${NC}"
    echo ""
    echo -e "${CYAN}📋 Deployment Information:${NC}"
    echo "  Resource Group: $RESOURCE_GROUP"
    echo "  Location: $LOCATION"
    echo "  VM Name: ${PROJECT_NAME}-vm"
    echo "  Public IP: $VM_IP"
    echo "  Database: ${PROJECT_NAME}-db"
    echo "  Application Gateway: ${PROJECT_NAME}-agw"
    echo ""
    echo -e "${CYAN}🌐 Service URLs:${NC}"
    echo "  Frontend: http://$VM_IP:3000"
    echo "  Backend API: http://$VM_IP:5001"
    echo "  Keycloak: http://$VM_IP:8080"
    echo ""
    echo -e "${CYAN}🔧 Management Commands:${NC}"
    echo "  SSH Access: ssh $ADMIN_USERNAME@$VM_IP"
    echo "  View Logs: ssh $ADMIN_USERNAME@$VM_IP 'docker-compose -f ContractManagement/docker-compose.prod.yml logs -f'"
    echo "  Restart Services: ssh $ADMIN_USERNAME@$VM_IP 'cd ContractManagement && docker-compose -f docker-compose.prod.yml restart'"
    echo ""
    echo -e "${YELLOW}⚠️  Next Steps:${NC}"
    echo "1. Configure domain name and SSL certificate"
    echo "2. Update database connection settings"
    echo "3. Configure Keycloak for production"
    echo "4. Set up monitoring and logging"
    echo "5. Configure backup procedures"
    echo ""
    echo -e "${GREEN}📚 Documentation:${NC}"
    echo "- Azure Portal: https://portal.azure.com"
    echo "- Resource Group: $RESOURCE_GROUP"
    echo "- VM: ${PROJECT_NAME}-vm"
    echo "- Database: ${PROJECT_NAME}-db"
    echo ""
}

# Function to cleanup resources
cleanup() {
    print_header "Cleaning Up Resources"
    
    read -p "This will delete all resources in the resource group. Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Cleanup cancelled"
        exit 0
    fi
    
    print_step "Deleting resource group..."
    az group delete \
        --name "$RESOURCE_GROUP" \
        --yes \
        --no-wait
    
    print_success "Resource group deletion initiated"
    print_warning "This may take several minutes to complete"
}

# Main execution
main() {
    print_header "Confidential AI Network - Azure VM Deployment"
    
    # Check prerequisites
    check_prerequisites
    
    # Create infrastructure
    create_resource_group
    create_virtual_network
    create_public_ip
    create_virtual_machine
    create_database
    create_application_gateway
    
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
