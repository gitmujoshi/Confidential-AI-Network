#!/bin/bash

# Contract Management System - Multi-VM Production Deployment Script
# This script deploys the system across multiple VMs for production

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
CLOUD_PROVIDER="${CLOUD_PROVIDER:-aws}"  # aws, azure, gcp, oci
REGION="${REGION:-us-east-1}"
ENVIRONMENT="${ENVIRONMENT:-production}"

# VM Configuration
VM_SPECS=(
    "load-balancer:2:4:20"
    "frontend:2:4:20"
    "backend:4:8:50"
    "keycloak:2:4:20"
    "database:4:16:100"
    "keycloak-db:2:8:50"
    "scitt:4:8:50"
    "scitt-db:2:8:50"
)

# Network Configuration
VPC_CIDR="172.20.0.0/16"
SUBNET_CIDR="172.20.1.0/24"

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
    
    case $CLOUD_PROVIDER in
        "aws")
            if ! command -v aws >/dev/null 2>&1; then
                print_error "AWS CLI is not installed. Please install it first."
                exit 1
            fi
            if ! aws sts get-caller-identity >/dev/null 2>&1; then
                print_error "AWS CLI is not configured. Please run 'aws configure' first."
                exit 1
            fi
            ;;
        "azure")
            if ! command -v az >/dev/null 2>&1; then
                print_error "Azure CLI is not installed. Please install it first."
                exit 1
            fi
            if ! az account show >/dev/null 2>&1; then
                print_error "Not logged in to Azure. Please run 'az login' first."
                exit 1
            fi
            ;;
        "gcp")
            if ! command -v gcloud >/dev/null 2>&1; then
                print_error "gcloud CLI is not installed. Please install it first."
                exit 1
            fi
            if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
                print_error "Not authenticated with gcloud. Please run 'gcloud auth login' first."
                exit 1
            fi
            ;;
        "oci")
            if ! command -v oci >/dev/null 2>&1; then
                print_error "OCI CLI is not installed. Please install it first."
                exit 1
            fi
            if ! oci setup config --list >/dev/null 2>&1; then
                print_error "OCI CLI is not configured. Please run 'oci setup config' first."
                exit 1
            fi
            ;;
        *)
            print_error "Unsupported cloud provider: $CLOUD_PROVIDER"
            exit 1
            ;;
    esac
    
    print_success "Prerequisites check passed"
}

# Function to create infrastructure
create_infrastructure() {
    print_header "Creating Infrastructure"
    
    case $CLOUD_PROVIDER in
        "aws")
            create_aws_infrastructure
            ;;
        "azure")
            create_azure_infrastructure
            ;;
        "gcp")
            create_gcp_infrastructure
            ;;
        "oci")
            create_oci_infrastructure
            ;;
    esac
}

# Function to create AWS infrastructure
create_aws_infrastructure() {
    print_step "Creating AWS infrastructure..."
    
    # Create VPC
    VPC_ID=$(aws ec2 create-vpc \
        --cidr-block $VPC_CIDR \
        --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value='$PROJECT_NAME'-vpc}]' \
        --query 'Vpc.VpcId' \
        --output text)
    
    # Create Internet Gateway
    IGW_ID=$(aws ec2 create-internet-gateway \
        --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value='$PROJECT_NAME'-igw}]' \
        --query 'InternetGateway.InternetGatewayId' \
        --output text)
    
    # Attach Internet Gateway
    aws ec2 attach-internet-gateway \
        --vpc-id $VPC_ID \
        --internet-gateway-id $IGW_ID
    
    # Create Subnet
    SUBNET_ID=$(aws ec2 create-subnet \
        --vpc-id $VPC_ID \
        --cidr-block $SUBNET_CIDR \
        --availability-zone ${REGION}a \
        --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value='$PROJECT_NAME'-subnet}]' \
        --query 'Subnet.SubnetId' \
        --output text)
    
    # Create Route Table
    RT_ID=$(aws ec2 create-route-table \
        --vpc-id $VPC_ID \
        --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value='$PROJECT_NAME'-rt}]' \
        --query 'RouteTable.RouteTableId' \
        --output text)
    
    # Add route to Internet Gateway
    aws ec2 create-route \
        --route-table-id $RT_ID \
        --destination-cidr-block 0.0.0.0/0 \
        --gateway-id $IGW_ID
    
    # Associate route table with subnet
    aws ec2 associate-route-table \
        --subnet-id $SUBNET_ID \
        --route-table-id $RT_ID
    
    # Create Security Group
    SG_ID=$(aws ec2 create-security-group \
        --group-name $PROJECT_NAME-sg \
        --description "Security group for $PROJECT_NAME" \
        --vpc-id $VPC_ID \
        --query 'GroupId' \
        --output text)
    
    # Add security group rules
    aws ec2 authorize-security-group-ingress \
        --group-id $SG_ID \
        --protocol tcp \
        --port 22 \
        --cidr 0.0.0.0/0
    
    aws ec2 authorize-security-group-ingress \
        --group-id $SG_ID \
        --protocol tcp \
        --port 80 \
        --cidr 0.0.0.0/0
    
    aws ec2 authorize-security-group-ingress \
        --group-id $SG_ID \
        --protocol tcp \
        --port 443 \
        --cidr 0.0.0.0/0
    
    # Create VMs
    for vm_spec in "${VM_SPECS[@]}"; do
        IFS=':' read -r vm_name vcpu memory storage <<< "$vm_spec"
        create_aws_vm "$vm_name" "$vcpu" "$memory" "$storage" "$VPC_ID" "$SUBNET_ID" "$SG_ID"
    done
    
    print_success "AWS infrastructure created"
}

# Function to create AWS VM
create_aws_vm() {
    local vm_name=$1
    local vcpu=$2
    local memory=$3
    local storage=$4
    local vpc_id=$5
    local subnet_id=$6
    local sg_id=$7
    
    print_step "Creating VM: $vm_name"
    
    # Get latest Ubuntu AMI
    AMI_ID=$(aws ec2 describe-images \
        --owners 099720109477 \
        --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*" \
        --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' \
        --output text)
    
    # Create key pair
    aws ec2 create-key-pair \
        --key-name $PROJECT_NAME-$vm_name-key \
        --query 'KeyMaterial' \
        --output text > $PROJECT_NAME-$vm_name-key.pem
    chmod 400 $PROJECT_NAME-$vm_name-key.pem
    
    # Launch instance
    INSTANCE_ID=$(aws ec2 run-instances \
        --image-id $AMI_ID \
        --count 1 \
        --instance-type t3.medium \
        --key-name $PROJECT_NAME-$vm_name-key \
        --security-group-ids $sg_id \
        --subnet-id $subnet_id \
        --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value='$PROJECT_NAME'-'$vm_name'}]' \
        --query 'Instances[0].InstanceId' \
        --output text)
    
    # Wait for instance to be running
    aws ec2 wait instance-running --instance-ids $INSTANCE_ID
    
    # Get public IP
    PUBLIC_IP=$(aws ec2 describe-instances \
        --instance-ids $INSTANCE_ID \
        --query 'Reservations[0].Instances[0].PublicIpAddress' \
        --output text)
    
    print_success "VM $vm_name created with IP: $PUBLIC_IP"
}

# Function to create Azure infrastructure
create_azure_infrastructure() {
    print_step "Creating Azure infrastructure..."
    
    # Create resource group
    az group create \
        --name $PROJECT_NAME-rg \
        --location $REGION
    
    # Create VNet
    az network vnet create \
        --resource-group $PROJECT_NAME-rg \
        --name $PROJECT_NAME-vnet \
        --address-prefix $VPC_CIDR \
        --subnet-name $PROJECT_NAME-subnet \
        --subnet-prefix $SUBNET_CIDR
    
    # Create Network Security Group
    az network nsg create \
        --resource-group $PROJECT_NAME-rg \
        --name $PROJECT_NAME-nsg
    
    # Add security rules
    az network nsg rule create \
        --resource-group $PROJECT_NAME-rg \
        --nsg-name $PROJECT_NAME-nsg \
        --name SSH \
        --priority 1000 \
        --source-address-prefixes "*" \
        --destination-address-prefixes "*" \
        --destination-port-ranges 22 \
        --access Allow \
        --protocol Tcp
    
    az network nsg rule create \
        --resource-group $PROJECT_NAME-rg \
        --nsg-name $PROJECT_NAME-nsg \
        --name HTTP \
        --priority 1001 \
        --source-address-prefixes "*" \
        --destination-address-prefixes "*" \
        --destination-port-ranges 80 \
        --access Allow \
        --protocol Tcp
    
    az network nsg rule create \
        --resource-group $PROJECT_NAME-rg \
        --nsg-name $PROJECT_NAME-nsg \
        --name HTTPS \
        --priority 1002 \
        --source-address-prefixes "*" \
        --destination-address-prefixes "*" \
        --destination-port-ranges 443 \
        --access Allow \
        --protocol Tcp
    
    # Create VMs
    for vm_spec in "${VM_SPECS[@]}"; do
        IFS=':' read -r vm_name vcpu memory storage <<< "$vm_spec"
        create_azure_vm "$vm_name" "$vcpu" "$memory" "$storage"
    done
    
    print_success "Azure infrastructure created"
}

# Function to create Azure VM
create_azure_vm() {
    local vm_name=$1
    local vcpu=$2
    local memory=$3
    local storage=$4
    
    print_step "Creating VM: $vm_name"
    
    # Create VM
    az vm create \
        --resource-group $PROJECT_NAME-rg \
        --name $PROJECT_NAME-$vm_name \
        --image Ubuntu2004 \
        --size Standard_D2s_v3 \
        --admin-username azureuser \
        --generate-ssh-keys \
        --vnet-name $PROJECT_NAME-vnet \
        --subnet $PROJECT_NAME-subnet \
        --nsg $PROJECT_NAME-nsg \
        --storage-sku Premium_LRS
    
    # Get public IP
    PUBLIC_IP=$(az vm show \
        --resource-group $PROJECT_NAME-rg \
        --name $PROJECT_NAME-$vm_name \
        --show-details \
        --query 'publicIps' \
        --output tsv)
    
    print_success "VM $vm_name created with IP: $PUBLIC_IP"
}

# Function to create GCP infrastructure
create_gcp_infrastructure() {
    print_step "Creating GCP infrastructure..."
    
    # Set project
    gcloud config set project $PROJECT_ID
    
    # Create VPC network
    gcloud compute networks create $PROJECT_NAME-vpc \
        --subnet-mode=custom \
        --bgp-routing-mode=regional
    
    # Create subnet
    gcloud compute networks subnets create $PROJECT_NAME-subnet \
        --network=$PROJECT_NAME-vpc \
        --range=$SUBNET_CIDR \
        --region=$REGION
    
    # Create firewall rules
    gcloud compute firewall-rules create $PROJECT_NAME-allow-ssh \
        --network=$PROJECT_NAME-vpc \
        --allow=tcp:22 \
        --source-ranges=0.0.0.0/0 \
        --target-tags=ssh
    
    gcloud compute firewall-rules create $PROJECT_NAME-allow-http \
        --network=$PROJECT_NAME-vpc \
        --allow=tcp:80 \
        --source-ranges=0.0.0.0/0 \
        --target-tags=http-server
    
    gcloud compute firewall-rules create $PROJECT_NAME-allow-https \
        --network=$PROJECT_NAME-vpc \
        --allow=tcp:443 \
        --source-ranges=0.0.0.0/0 \
        --target-tags=https-server
    
    # Create VMs
    for vm_spec in "${VM_SPECS[@]}"; do
        IFS=':' read -r vm_name vcpu memory storage <<< "$vm_spec"
        create_gcp_vm "$vm_name" "$vcpu" "$memory" "$storage"
    done
    
    print_success "GCP infrastructure created"
}

# Function to create GCP VM
create_gcp_vm() {
    local vm_name=$1
    local vcpu=$2
    local memory=$3
    local storage=$4
    
    print_step "Creating VM: $vm_name"
    
    # Create instance
    gcloud compute instances create $PROJECT_NAME-$vm_name \
        --zone=${REGION}-a \
        --machine-type=e2-standard-2 \
        --network-interface=subnet=$PROJECT_NAME-subnet,no-address \
        --create-disk=auto-delete=yes,boot=yes,device-name=$PROJECT_NAME-$vm_name,image=projects/ubuntu-os-cloud/global/images/family/ubuntu-2004-lts,mode=rw,size=20,type=projects/$PROJECT_ID/zones/${REGION}-a/diskTypes/pd-standard \
        --tags=ssh,http-server,https-server
    
    # Create static IP
    gcloud compute addresses create $PROJECT_NAME-$vm_name-ip \
        --region=$REGION
    
    # Get static IP
    STATIC_IP=$(gcloud compute addresses describe $PROJECT_NAME-$vm_name-ip \
        --region=$REGION \
        --format="value(address)")
    
    # Assign static IP to instance
    gcloud compute instances add-access-config $PROJECT_NAME-$vm_name \
        --zone=${REGION}-a \
        --address=$STATIC_IP
    
    print_success "VM $vm_name created with IP: $STATIC_IP"
}

# Function to create OCI infrastructure
create_oci_infrastructure() {
    print_step "Creating OCI infrastructure..."
    
    # Create VCN
    VCN_ID=$(oci network vcn create \
        --compartment-id $COMPARTMENT_ID \
        --display-name $PROJECT_NAME-vcn \
        --cidr-block $VPC_CIDR \
        --dns-label $PROJECT_NAME \
        --query 'data.id' \
        --raw-output)
    
    # Create Internet Gateway
    IGW_ID=$(oci network internet-gateway create \
        --compartment-id $COMPARTMENT_ID \
        --vcn-id $VCN_ID \
        --display-name $PROJECT_NAME-igw \
        --is-enabled true \
        --query 'data.id' \
        --raw-output)
    
    # Create Route Table
    RT_ID=$(oci network route-table create \
        --compartment-id $COMPARTMENT_ID \
        --vcn-id $VCN_ID \
        --display-name $PROJECT_NAME-rt \
        --route-rules '[{"cidrBlock":"0.0.0.0/0","networkEntityId":"'$IGW_ID'"}]' \
        --query 'data.id' \
        --raw-output)
    
    # Create Subnet
    SUBNET_ID=$(oci network subnet create \
        --compartment-id $COMPARTMENT_ID \
        --vcn-id $VCN_ID \
        --display-name $PROJECT_NAME-subnet \
        --dns-label $PROJECT_NAME-subnet \
        --cidr-block $SUBNET_CIDR \
        --route-table-id $RT_ID \
        --security-list-ids '[]' \
        --query 'data.id' \
        --raw-output)
    
    # Create Security List
    SL_ID=$(oci network security-list create \
        --compartment-id $COMPARTMENT_ID \
        --vcn-id $VCN_ID \
        --display-name $PROJECT_NAME-sl \
        --egress-security-rules '[{"destination":"0.0.0.0/0","protocol":"all","isStateless":false}]' \
        --ingress-security-rules '[
            {"source":"0.0.0.0/0","protocol":"6","isStateless":false,"tcpOptions":{"destinationPortRange":{"min":22,"max":22}}},
            {"source":"0.0.0.0/0","protocol":"6","isStateless":false,"tcpOptions":{"destinationPortRange":{"min":80,"max":80}}},
            {"source":"0.0.0.0/0","protocol":"6","isStateless":false,"tcpOptions":{"destinationPortRange":{"min":443,"max":443}}}
        ]' \
        --query 'data.id' \
        --raw-output)
    
    # Update Subnet with Security List
    oci network subnet update \
        --subnet-id $SUBNET_ID \
        --security-list-ids "[\"$SL_ID\"]" \
        --force >/dev/null
    
    # Create VMs
    for vm_spec in "${VM_SPECS[@]}"; do
        IFS=':' read -r vm_name vcpu memory storage <<< "$vm_spec"
        create_oci_vm "$vm_name" "$vcpu" "$memory" "$storage" "$COMPARTMENT_ID" "$SUBNET_ID"
    done
    
    print_success "OCI infrastructure created"
}

# Function to create OCI VM
create_oci_vm() {
    local vm_name=$1
    local vcpu=$2
    local memory=$3
    local storage=$4
    local compartment_id=$5
    local subnet_id=$6
    
    print_step "Creating VM: $vm_name"
    
    # Get latest Oracle Linux 8 image
    IMAGE_ID=$(oci compute image list \
        --compartment-id $compartment_id \
        --operating-system "Oracle Linux" \
        --operating-system-version "8" \
        --sort-by TIMECREATED \
        --sort-order DESC \
        --query 'data[0].id' \
        --raw-output)
    
    # Create instance
    INSTANCE_ID=$(oci compute instance launch \
        --compartment-id $compartment_id \
        --availability-domain "AD-1" \
        --display-name $PROJECT_NAME-$vm_name \
        --image-id $IMAGE_ID \
        --shape "VM.Standard.E4.Flex" \
        --shape-config '{"ocpus":'$vcpu',"memoryInGBs":'$memory'}' \
        --subnet-id $subnet_id \
        --assign-public-ip true \
        --query 'data.id' \
        --raw-output)
    
    # Wait for instance to be running
    oci compute instance wait \
        --instance-id $INSTANCE_ID \
        --wait-for-state RUNNING \
        --max-wait-seconds 600
    
    # Get public IP
    PUBLIC_IP=$(oci compute instance list-vnics \
        --instance-id $INSTANCE_ID \
        --query 'data[0]."public-ip"' \
        --raw-output)
    
    print_success "VM $vm_name created with IP: $PUBLIC_IP"
}

# Function to deploy services
deploy_services() {
    print_header "Deploying Services"
    
    # Create deployment scripts for each VM
    create_deployment_scripts
    
    # Deploy to each VM
    for vm_spec in "${VM_SPECS[@]}"; do
        IFS=':' read -r vm_name vcpu memory storage <<< "$vm_spec"
        deploy_to_vm "$vm_name"
    done
    
    print_success "Services deployed"
}

# Function to create deployment scripts
create_deployment_scripts() {
    print_step "Creating deployment scripts..."
    
    # Create base deployment script
    cat > deploy-base.sh << 'EOF'
#!/bin/bash

# Base deployment script for Contract Management System

set -e

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

# Install additional tools
sudo apt-get install -y curl wget unzip

# Setup firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

echo "Base deployment completed successfully!"
EOF

    # Create service-specific deployment scripts
    create_frontend_deploy_script
    create_backend_deploy_script
    create_keycloak_deploy_script
    create_database_deploy_script
    create_scitt_deploy_script
    create_load_balancer_deploy_script
    
    print_success "Deployment scripts created"
}

# Function to create frontend deployment script
create_frontend_deploy_script() {
    cat > deploy-frontend.sh << 'EOF'
#!/bin/bash

# Frontend deployment script

# Clone repository
git clone https://github.com/your-username/ContractManagement.git
cd ContractManagement

# Create production environment file
cat > .env << 'ENVEOF'
NODE_ENV=production
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_KEYCLOAK_URL=https://auth.yourdomain.com
REACT_APP_KEYCLOAK_REALM=contract-management
REACT_APP_KEYCLOAK_CLIENT_ID=contract-management-frontend
ENVEOF

# Build and start frontend
docker-compose -f deploy/production/docker-compose.prod.yml up -d frontend

echo "Frontend deployed successfully!"
EOF
}

# Function to create backend deployment script
create_backend_deploy_script() {
    cat > deploy-backend.sh << 'EOF'
#!/bin/bash

# Backend deployment script

# Clone repository
git clone https://github.com/your-username/ContractManagement.git
cd ContractManagement

# Create production environment file
cat > .env << 'ENVEOF'
NODE_ENV=production
DB_HOST=172.20.1.50
DB_PORT=5432
DB_NAME=contract_management
DB_USER=postgres
DB_PASSWORD=secure_password
KEYCLOAK_URL=http://172.20.1.40:8080
KEYCLOAK_REALM=contract-management
KEYCLOAK_CLIENT_ID=contract-management-client
KEYCLOAK_CLIENT_SECRET=client_secret
SCITT_CCF_NODE_URL=http://172.20.1.70:8000
REDIS_URL=redis://172.20.1.30:6379
ENVEOF

# Build and start backend
docker-compose -f deploy/production/docker-compose.prod.yml up -d backend redis

echo "Backend deployed successfully!"
EOF
}

# Function to create Keycloak deployment script
create_keycloak_deploy_script() {
    cat > deploy-keycloak.sh << 'EOF'
#!/bin/bash

# Keycloak deployment script

# Clone repository
git clone https://github.com/your-username/ContractManagement.git
cd ContractManagement

# Create production environment file
cat > .env << 'ENVEOF'
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=secure_admin_password
KC_DB_URL=jdbc:postgresql://172.20.1.60:5432/keycloak
KC_DB_USERNAME=keycloak
KC_DB_PASSWORD=keycloak_password
ENVEOF

# Build and start Keycloak
docker-compose -f deploy/production/docker-compose.prod.yml up -d keycloak

echo "Keycloak deployed successfully!"
EOF
}

# Function to create database deployment script
create_database_deploy_script() {
    cat > deploy-database.sh << 'EOF'
#!/bin/bash

# Database deployment script

# Clone repository
git clone https://github.com/your-username/ContractManagement.git
cd ContractManagement

# Create production environment file
cat > .env << 'ENVEOF'
POSTGRES_DB=contract_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_password
ENVEOF

# Build and start database
docker-compose -f deploy/production/docker-compose.prod.yml up -d postgres-app

# Run migrations
cd backend
npm install
npm run migrate

echo "Database deployed successfully!"
EOF
}

# Function to create SCITT deployment script
create_scitt_deploy_script() {
    cat > deploy-scitt.sh << 'EOF'
#!/bin/bash

# SCITT CCF deployment script

# Clone repository
git clone https://github.com/your-username/ContractManagement.git
cd ContractManagement

# Create production environment file
cat > .env << 'ENVEOF'
SCITT_CCF_PLATFORM=virtual
SCITT_DB_PASSWORD=scitt_password
ENVEOF

# Build and start SCITT services
docker-compose -f deploy/production/docker-compose.prod.yml up -d scitt-ccf-node scitt-ccf-monitor scitt-ccf-dashboard scitt-ccf-postgres

echo "SCITT CCF deployed successfully!"
EOF
}

# Function to create load balancer deployment script
create_load_balancer_deploy_script() {
    cat > deploy-load-balancer.sh << 'EOF'
#!/bin/bash

# Load balancer deployment script

# Clone repository
git clone https://github.com/your-username/ContractManagement.git
cd ContractManagement

# Create production environment file
cat > .env << 'ENVEOF'
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
FRONTEND_UPSTREAM=172.20.1.20:3000
BACKEND_UPSTREAM=172.20.1.30:5001
KEYCLOAK_UPSTREAM=172.20.1.40:8080
ENVEOF

# Build and start load balancer
docker-compose -f deploy/production/docker-compose.prod.yml up -d nginx

echo "Load balancer deployed successfully!"
EOF
}

# Function to deploy to specific VM
deploy_to_vm() {
    local vm_name=$1
    
    print_step "Deploying to VM: $vm_name"
    
    # Get VM IP (this would be retrieved from cloud provider)
    VM_IP="172.20.1.$(echo $vm_name | cut -d'-' -f1 | wc -c)"
    
    # Copy base deployment script
    scp -o StrictHostKeyChecking=no deploy-base.sh ubuntu@$VM_IP:/home/ubuntu/
    
    # Copy service-specific deployment script
    scp -o StrictHostKeyChecking=no deploy-$vm_name.sh ubuntu@$VM_IP:/home/ubuntu/
    
    # Execute deployment
    ssh -o StrictHostKeyChecking=no ubuntu@$VM_IP "chmod +x deploy-base.sh deploy-$vm_name.sh && ./deploy-base.sh && ./deploy-$vm_name.sh"
    
    print_success "Deployed to VM: $vm_name"
}

# Function to display deployment information
display_deployment_info() {
    print_header "Deployment Complete!"
    
    echo -e "${GREEN}🎉 Contract Management System deployed successfully across multiple VMs!${NC}"
    echo ""
    echo -e "${CYAN}📋 Deployment Information:${NC}"
    echo "  Cloud Provider: $CLOUD_PROVIDER"
    echo "  Region: $REGION"
    echo "  Environment: $ENVIRONMENT"
    echo ""
    echo -e "${CYAN}🏗️ Infrastructure:${NC}"
    echo "  Load Balancer VM: 172.20.1.10"
    echo "  Frontend VM: 172.20.1.20"
    echo "  Backend VM: 172.20.1.30"
    echo "  Keycloak VM: 172.20.1.40"
    echo "  Database VM: 172.20.1.50"
    echo "  Keycloak DB VM: 172.20.1.60"
    echo "  SCITT VM: 172.20.1.70"
    echo "  SCITT DB VM: 172.20.1.80"
    echo ""
    echo -e "${CYAN}🌐 Service URLs:${NC}"
    echo "  Frontend: https://yourdomain.com"
    echo "  Backend API: https://api.yourdomain.com"
    echo "  Keycloak: https://auth.yourdomain.com"
    echo "  SCITT Dashboard: https://scitt.yourdomain.com"
    echo ""
    echo -e "${YELLOW}⚠️  Next Steps:${NC}"
    echo "1. Configure DNS records"
    echo "2. Setup SSL certificates"
    echo "3. Configure monitoring"
    echo "4. Setup backup procedures"
    echo "5. Configure security hardening"
    echo ""
}

# Main execution
main() {
    print_header "Contract Management System - Multi-VM Production Deployment"
    
    # Check prerequisites
    check_prerequisites
    
    # Create infrastructure
    create_infrastructure
    
    # Deploy services
    deploy_services
    
    # Display information
    display_deployment_info
}

# Handle command line arguments
case "${1:-}" in
    "cleanup")
        print_warning "Cleanup functionality not implemented yet"
        ;;
    "info")
        display_deployment_info
        ;;
    *)
        main
        ;;
esac
