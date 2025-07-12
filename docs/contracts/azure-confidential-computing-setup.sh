#!/bin/bash

# Azure Confidential Computing Setup for CCRP
# This script sets up Azure Confidential Computing environment with multi-KMS support

set -e

# Configuration
RESOURCE_GROUP="ccrp-confidential-rg"
LOCATION="eastus"
VM_NAME="ccrp-confidential-vm"
VM_SIZE="Standard_DC8s_v3"
VNET_NAME="ccrp-vnet"
SUBNET_NAME="ccrp-subnet"
NSG_NAME="ccrp-nsg"
KEY_VAULT_NAME="ccrp-keyvault"
STORAGE_ACCOUNT_NAME="ccrpstorage"
CONTAINER_REGISTRY_NAME="ccrpregistry"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Azure CLI is installed
check_azure_cli() {
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install it first."
        exit 1
    fi
    log_success "Azure CLI is installed"
}

# Check if user is logged in to Azure
check_azure_login() {
    if ! az account show &> /dev/null; then
        log_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    log_success "Logged in to Azure"
}

# Create resource group
create_resource_group() {
    log_info "Creating resource group: $RESOURCE_GROUP"
    
    if az group exists --name $RESOURCE_GROUP; then
        log_warning "Resource group $RESOURCE_GROUP already exists"
    else
        az group create --name $RESOURCE_GROUP --location $LOCATION
        log_success "Resource group created"
    fi
}

# Create virtual network
create_virtual_network() {
    log_info "Creating virtual network: $VNET_NAME"
    
    az network vnet create \
        --resource-group $RESOURCE_GROUP \
        --name $VNET_NAME \
        --subnet-name $SUBNET_NAME \
        --address-prefix 10.0.0.0/16 \
        --subnet-prefix 10.0.1.0/24
    
    log_success "Virtual network created"
}

# Create network security group
create_network_security_group() {
    log_info "Creating network security group: $NSG_NAME"
    
    az network nsg create \
        --resource-group $RESOURCE_GROUP \
        --name $NSG_NAME
    
    # Allow SSH access
    az network nsg rule create \
        --resource-group $RESOURCE_GROUP \
        --nsg-name $NSG_NAME \
        --name allow-ssh \
        --protocol tcp \
        --priority 1000 \
        --destination-port-range 22 \
        --access allow
    
    # Allow HTTPS access
    az network nsg rule create \
        --resource-group $RESOURCE_GROUP \
        --nsg-name $NSG_NAME \
        --name allow-https \
        --protocol tcp \
        --priority 1001 \
        --destination-port-range 443 \
        --access allow
    
    # Allow HTTP access (for development)
    az network nsg rule create \
        --resource-group $RESOURCE_GROUP \
        --nsg-name $NSG_NAME \
        --name allow-http \
        --protocol tcp \
        --priority 1002 \
        --destination-port-range 80 \
        --access allow
    
    log_success "Network security group created"
}

# Create Key Vault
create_key_vault() {
    log_info "Creating Key Vault: $KEY_VAULT_NAME"
    
    # Create Key Vault with soft delete enabled
    az keyvault create \
        --resource-group $RESOURCE_GROUP \
        --name $KEY_VAULT_NAME \
        --location $LOCATION \
        --enable-soft-delete true \
        --enable-purge-protection true \
        --sku standard
    
    # Create encryption keys for different KMS providers
    log_info "Creating encryption keys for multi-KMS support"
    
    # AWS KMS simulation key
    az keyvault key create \
        --vault-name $KEY_VAULT_NAME \
        --name aws-kms-key \
        --kty RSA \
        --size 2048
    
    # Azure Key Vault key
    az keyvault key create \
        --vault-name $KEY_VAULT_NAME \
        --name azure-keyvault-key \
        --kty RSA \
        --size 2048
    
    # Google Cloud KMS simulation key
    az keyvault key create \
        --vault-name $KEY_VAULT_NAME \
        --name gcp-kms-key \
        --kty RSA \
        --size 2048
    
    # Hashicorp Vault simulation key
    az keyvault key create \
        --vault-name $KEY_VAULT_NAME \
        --name hashicorp-vault-key \
        --kty RSA \
        --size 2048
    
    # Attestation verification keys
    az keyvault key create \
        --vault-name $KEY_VAULT_NAME \
        --name attestation-verification-key \
        --kty RSA \
        --size 2048
    
    log_success "Key Vault and encryption keys created"
}

# Create storage account
create_storage_account() {
    log_info "Creating storage account: $STORAGE_ACCOUNT_NAME"
    
    az storage account create \
        --resource-group $RESOURCE_GROUP \
        --name $STORAGE_ACCOUNT_NAME \
        --location $LOCATION \
        --sku Standard_LRS \
        --encryption-services blob file \
        --require-hns false
    
    # Create containers for different data providers
    log_info "Creating storage containers for data providers"
    
    # Get storage account key
    STORAGE_KEY=$(az storage account keys list \
        --resource-group $RESOURCE_GROUP \
        --account-name $STORAGE_ACCOUNT_NAME \
        --query '[0].value' -o tsv)
    
    # Create containers
    az storage container create \
        --account-name $STORAGE_ACCOUNT_NAME \
        --account-key $STORAGE_KEY \
        --name healthcare-data
    
    az storage container create \
        --account-name $STORAGE_ACCOUNT_NAME \
        --account-key $STORAGE_KEY \
        --name financial-data
    
    az storage container create \
        --account-name $STORAGE_ACCOUNT_NAME \
        --account-key $STORAGE_KEY \
        --name research-data
    
    log_success "Storage account and containers created"
}

# Create container registry
create_container_registry() {
    log_info "Creating container registry: $CONTAINER_REGISTRY_NAME"
    
    az acr create \
        --resource-group $RESOURCE_GROUP \
        --name $CONTAINER_REGISTRY_NAME \
        --sku Standard \
        --admin-enabled true
    
    log_success "Container registry created"
}

# Create confidential VM
create_confidential_vm() {
    log_info "Creating confidential VM: $VM_NAME"
    
    # Create encryption set for OS disk
    log_info "Creating disk encryption set"
    
    az disk-encryption-set create \
        --resource-group $RESOURCE_GROUP \
        --name ccrp-encryption-set \
        --key-url "https://$KEY_VAULT_NAME.vault.azure.net/keys/azure-keyvault-key"
    
    # Create confidential VM
    az vm create \
        --resource-group $RESOURCE_GROUP \
        --name $VM_NAME \
        --image Canonical:0001-com-ubuntu-server-focal:20_04-lts-gen2:latest \
        --size $VM_SIZE \
        --admin-username azureuser \
        --generate-ssh-keys \
        --enable-secure-boot \
        --enable-vtpm \
        --security-type ConfidentialVM \
        --os-disk-security-encryption-type DiskWithVMGuestState \
        --os-disk-encryption-set ccrp-encryption-set \
        --vnet-name $VNET_NAME \
        --subnet $SUBNET_NAME \
        --nsg $NSG_NAME \
        --public-ip-sku Standard
    
    log_success "Confidential VM created"
}

# Configure VM extensions
configure_vm_extensions() {
    log_info "Configuring VM extensions"
    
    # Install Docker extension
    az vm extension set \
        --resource-group $RESOURCE_GROUP \
        --vm-name $VM_NAME \
        --name DockerExtension \
        --publisher Microsoft.Azure.Extensions \
        --version 1.0 \
        --settings '{"docker": {"port": "2375"}}'
    
    # Install custom script extension for setup
    az vm extension set \
        --resource-group $RESOURCE_GROUP \
        --vm-name $VM_NAME \
        --name CustomScript \
        --publisher Microsoft.Azure.Extensions \
        --version 2.0 \
        --settings '{
            "fileUris": ["https://raw.githubusercontent.com/your-repo/ccrp-setup/main/setup.sh"],
            "commandToExecute": "bash setup.sh"
        }'
    
    log_success "VM extensions configured"
}

# Create managed identity
create_managed_identity() {
    log_info "Creating managed identity for CCRP"
    
    az identity create \
        --resource-group $RESOURCE_GROUP \
        --name ccrp-managed-identity
    
    # Get managed identity principal ID
    PRINCIPAL_ID=$(az identity show \
        --resource-group $RESOURCE_GROUP \
        --name ccrp-managed-identity \
        --query principalId -o tsv)
    
    # Assign Key Vault access to managed identity
    az keyvault set-policy \
        --name $KEY_VAULT_NAME \
        --object-id $PRINCIPAL_ID \
        --key-permissions get list decrypt encrypt sign verify
    
    log_success "Managed identity created and configured"
}

# Create attestation service
create_attestation_service() {
    log_info "Creating Azure Attestation service"
    
    az attestation create \
        --resource-group $RESOURCE_GROUP \
        --name ccrp-attestation \
        --location $LOCATION \
        --certs-input-file attestation-policy.json
    
    log_success "Attestation service created"
}

# Deploy CCRP application
deploy_ccrp_application() {
    log_info "Deploying CCRP application"
    
    # Build and push Docker image
    log_info "Building CCRP Docker image"
    
    docker build -t ccrp-confidential-app ./src/
    docker tag ccrp-confidential-app $CONTAINER_REGISTRY_NAME.azurecr.io/ccrp-confidential-app:latest
    
    # Login to container registry
    az acr login --name $CONTAINER_REGISTRY_NAME
    
    # Push image
    docker push $CONTAINER_REGISTRY_NAME.azurecr.io/ccrp-confidential-app:latest
    
    log_success "CCRP application deployed"
}

# Configure monitoring
configure_monitoring() {
    log_info "Configuring monitoring and logging"
    
    # Create Log Analytics workspace
    az monitor log-analytics workspace create \
        --resource-group $RESOURCE_GROUP \
        --workspace-name ccrp-log-analytics
    
    # Enable monitoring on VM
    az vm extension set \
        --resource-group $RESOURCE_GROUP \
        --vm-name $VM_NAME \
        --name OmsAgentForLinux \
        --publisher Microsoft.EnterpriseCloud.Monitoring \
        --version 1.0 \
        --settings '{"workspaceId": "your-workspace-id"}'
    
    log_success "Monitoring configured"
}

# Create backup policy
create_backup_policy() {
    log_info "Creating backup policy"
    
    # Create recovery services vault
    az backup vault create \
        --resource-group $RESOURCE_GROUP \
        --name ccrp-backup-vault \
        --location $LOCATION
    
    # Create backup policy
    az backup protection enable-for-vm \
        --resource-group $RESOURCE_GROUP \
        --vault-name ccrp-backup-vault \
        --vm $VM_NAME \
        --policy-name DefaultPolicy
    
    log_success "Backup policy created"
}

# Output configuration
output_configuration() {
    log_info "Generating configuration output"
    
    # Get VM public IP
    VM_IP=$(az vm show \
        --resource-group $RESOURCE_GROUP \
        --name $VM_NAME \
        --show-details \
        --query publicIps -o tsv)
    
    # Get Key Vault URL
    KEY_VAULT_URL="https://$KEY_VAULT_NAME.vault.azure.net/"
    
    # Get Container Registry login server
    ACR_LOGIN_SERVER="$CONTAINER_REGISTRY_NAME.azurecr.io"
    
    # Create configuration file
    cat > ccrp-config.json << EOF
{
    "resourceGroup": "$RESOURCE_GROUP",
    "location": "$LOCATION",
    "vmName": "$VM_NAME",
    "vmSize": "$VM_SIZE",
    "vmPublicIP": "$VM_IP",
    "keyVaultName": "$KEY_VAULT_NAME",
    "keyVaultUrl": "$KEY_VAULT_URL",
    "storageAccountName": "$STORAGE_ACCOUNT_NAME",
    "containerRegistryName": "$CONTAINER_REGISTRY_NAME",
    "acrLoginServer": "$ACR_LOGIN_SERVER",
    "vnetName": "$VNET_NAME",
    "subnetName": "$SUBNET_NAME",
    "nsgName": "$NSG_NAME",
    "kmsProviders": {
        "aws": {
            "keyId": "aws-kms-key",
            "attestationKeyId": "attestation-verification-key"
        },
        "azure": {
            "keyId": "azure-keyvault-key",
            "attestationKeyId": "attestation-verification-key"
        },
        "gcp": {
            "keyId": "gcp-kms-key",
            "attestationKeyId": "attestation-verification-key"
        },
        "hashicorp": {
            "keyId": "hashicorp-vault-key",
            "attestationKeyId": "attestation-verification-key"
        }
    },
    "dataContainers": {
        "healthcare": "healthcare-data",
        "financial": "financial-data",
        "research": "research-data"
    }
}
EOF
    
    log_success "Configuration saved to ccrp-config.json"
    
    # Display connection information
    echo ""
    log_info "=== CCRP Azure Confidential Computing Setup Complete ==="
    echo ""
    log_info "VM Public IP: $VM_IP"
    log_info "SSH Command: ssh azureuser@$VM_IP"
    log_info "Key Vault URL: $KEY_VAULT_URL"
    log_info "Container Registry: $ACR_LOGIN_SERVER"
    echo ""
    log_info "Configuration file: ccrp-config.json"
    echo ""
}

# Main deployment function
main() {
    log_info "Starting Azure Confidential Computing setup for CCRP"
    
    # Pre-flight checks
    check_azure_cli
    check_azure_login
    
    # Create resources
    create_resource_group
    create_virtual_network
    create_network_security_group
    create_key_vault
    create_storage_account
    create_container_registry
    create_confidential_vm
    configure_vm_extensions
    create_managed_identity
    create_attestation_service
    deploy_ccrp_application
    configure_monitoring
    create_backup_policy
    
    # Output configuration
    output_configuration
    
    log_success "Azure Confidential Computing setup completed successfully!"
}

# Run main function
main "$@" 