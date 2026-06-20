/**
 * Terraform Service for Infrastructure as Code
 * 
 * Handles Terraform operations for Azure infrastructure provisioning
 * Provides Infrastructure as Code capabilities with state management
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class TerraformService {
  constructor(workingDir = './deployment/azure/terraform/environments') {
    this.workingDir = workingDir;
    this.ensureWorkingDir();
  }

  /**
   * Ensure working directory exists
   */
  async ensureWorkingDir() {
    try {
      await fs.mkdir(this.workingDir, { recursive: true });
    } catch (error) {
      console.error('Error creating Terraform working directory:', error);
    }
  }

  /**
   * Generate Terraform configuration for a training environment
   */
  async generateTerraformConfig(contractId, environmentId, config, azureConfig = null) {
    try {
      console.log(`🏗️ Generating Terraform configuration for environment: ${environmentId}`);
      
      const terraformDir = path.join(this.workingDir, environmentId);
      
      // Create terraform directory
      await fs.mkdir(terraformDir, { recursive: true });
      
      // Generate main.tf
      const mainTf = this.buildMainTf(environmentId, config);
      await fs.writeFile(path.join(terraformDir, 'main.tf'), mainTf);
      
      // Generate variables.tf
      const variablesTf = this.buildVariablesTf(config);
      await fs.writeFile(path.join(terraformDir, 'variables.tf'), variablesTf);
      
      // Generate terraform.tfvars
      const tfvars = this.buildTfvars(contractId, environmentId, config, azureConfig);
      await fs.writeFile(path.join(terraformDir, 'terraform.tfvars'), tfvars);
      
      // Generate outputs.tf
      const outputsTf = this.buildOutputsTf();
      await fs.writeFile(path.join(terraformDir, 'outputs.tf'), outputsTf);
      
      // Generate cloud-init template
      const cloudInitTpl = this.buildCloudInitTemplate();
      await fs.writeFile(path.join(terraformDir, 'cloud-init.tpl'), cloudInitTpl);
      
      // Generate provider configuration
      const providerConfig = this.buildProviderConfig(azureConfig);
      await fs.writeFile(path.join(terraformDir, 'providers.tf'), providerConfig);
      
      console.log(`✅ Terraform configuration generated in: ${terraformDir}`);
      return terraformDir;
      
    } catch (error) {
      console.error('❌ Error generating Terraform configuration:', error);
      throw error;
    }
  }

  /**
   * Initialize Terraform
   */
  async initialize(terraformDir) {
    return new Promise((resolve, reject) => {
      console.log(`🔧 Initializing Terraform in: ${terraformDir}`);
      
      exec('terraform init', { cwd: terraformDir }, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Terraform init failed:', error);
          reject(new Error(`Terraform init failed: ${error.message}`));
        } else {
          console.log('✅ Terraform initialized successfully');
          resolve(stdout);
        }
      });
    });
  }

  /**
   * Plan Terraform deployment
   */
  async plan(terraformDir) {
    return new Promise((resolve, reject) => {
      console.log(`📋 Planning Terraform deployment in: ${terraformDir}`);
      
      exec('terraform plan -out=tfplan', { cwd: terraformDir }, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Terraform plan failed:', error);
          reject(new Error(`Terraform plan failed: ${error.message}`));
        } else {
          console.log('✅ Terraform plan completed successfully');
          resolve(stdout);
        }
      });
    });
  }

  /**
   * Apply Terraform deployment
   */
  async apply(terraformDir) {
    return new Promise((resolve, reject) => {
      console.log(`🚀 Applying Terraform deployment in: ${terraformDir}`);
      
      exec('terraform apply -auto-approve tfplan', { cwd: terraformDir }, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Terraform apply failed:', error);
          reject(new Error(`Terraform apply failed: ${error.message}`));
        } else {
          console.log('✅ Terraform apply completed successfully');
          resolve(stdout);
        }
      });
    });
  }

  /**
   * Get Terraform outputs
   */
  async getOutputs(terraformDir) {
    return new Promise((resolve, reject) => {
      console.log(`📤 Getting Terraform outputs from: ${terraformDir}`);
      
      exec('terraform output -json', { cwd: terraformDir }, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Terraform output failed:', error);
          reject(new Error(`Terraform output failed: ${error.message}`));
        } else {
          try {
            const outputs = JSON.parse(stdout);
            console.log('✅ Terraform outputs retrieved successfully');
            resolve(outputs);
          } catch (parseError) {
            console.error('❌ Failed to parse Terraform outputs:', parseError);
            reject(new Error(`Failed to parse Terraform outputs: ${parseError.message}`));
          }
        }
      });
    });
  }

  /**
   * Get Terraform state
   */
  async getState(terraformDir) {
    return new Promise((resolve, reject) => {
      exec('terraform show -json', { cwd: terraformDir }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Terraform state failed: ${error.message}`));
        } else {
          try {
            const state = JSON.parse(stdout);
            resolve(state);
          } catch (parseError) {
            reject(new Error(`Failed to parse Terraform state: ${parseError.message}`));
          }
        }
      });
    });
  }

  /**
   * Destroy Terraform resources
   */
  async destroy(terraformDir) {
    return new Promise((resolve, reject) => {
      console.log(`🗑️ Destroying Terraform resources in: ${terraformDir}`);
      
      exec('terraform destroy -auto-approve', { cwd: terraformDir }, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Terraform destroy failed:', error);
          reject(new Error(`Terraform destroy failed: ${error.message}`));
        } else {
          console.log('✅ Terraform destroy completed successfully');
          resolve(stdout);
        }
      });
    });
  }

  /**
   * Validate Terraform configuration
   */
  async validate(terraformDir) {
    return new Promise((resolve, reject) => {
      console.log(`✅ Validating Terraform configuration in: ${terraformDir}`);
      
      exec('terraform validate', { cwd: terraformDir }, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Terraform validation failed:', error);
          reject(new Error(`Terraform validation failed: ${error.message}`));
        } else {
          console.log('✅ Terraform configuration is valid');
          resolve(stdout);
        }
      });
    });
  }

  /**
   * Format Terraform files
   */
  async format(terraformDir) {
    return new Promise((resolve, reject) => {
      exec('terraform fmt', { cwd: terraformDir }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Terraform format failed: ${error.message}`));
        } else {
          resolve(stdout);
        }
      });
    });
  }

  /**
   * Build main.tf content
   */
  buildMainTf(environmentId, config) {
    return `terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# Data source for current Azure configuration
data "azurerm_client_config" "current" {}

# Resource Group
resource "azurerm_resource_group" "training" {
  name     = "\${var.environment_id}-rg"
  location = var.location
  tags     = var.tags
}

# Virtual Network
resource "azurerm_virtual_network" "training" {
  name                = "\${var.environment_id}-vnet"
  resource_group_name = azurerm_resource_group.training.name
  location            = azurerm_resource_group.training.location
  address_space       = [var.vnet_address_space]
  
  tags = var.tags
}

# Subnets
resource "azurerm_subnet" "private" {
  name                 = "private-subnet"
  resource_group_name  = azurerm_resource_group.training.name
  virtual_network_name = azurerm_virtual_network.training.name
  address_prefixes     = [var.private_subnet_prefix]
}

resource "azurerm_subnet" "public" {
  name                 = "public-subnet"
  resource_group_name  = azurerm_resource_group.training.name
  virtual_network_name = azurerm_virtual_network.training.name
  address_prefixes     = [var.public_subnet_prefix]
}

# Network Security Group
resource "azurerm_network_security_group" "training" {
  name                = "\${var.environment_id}-nsg"
  location            = azurerm_resource_group.training.location
  resource_group_name = azurerm_resource_group.training.name

  security_rule {
    name                       = "SSH"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "HTTP"
    priority                   = 1002
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "HTTPS"
    priority                   = 1003
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "Jupyter"
    priority                   = 1004
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "8888"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = var.tags
}

# Network Interface
resource "azurerm_network_interface" "vm" {
  count               = var.vm_count
  name                = "\${var.environment_id}-nic-\${count.index}"
  location            = azurerm_resource_group.training.location
  resource_group_name = azurerm_resource_group.training.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.private.id
    private_ip_address_allocation = "Dynamic"
  }

  tags = var.tags
}

# Virtual Machines
resource "azurerm_linux_virtual_machine" "vm" {
  count               = var.vm_count
  name                = "\${var.environment_id}-vm-\${count.index}"
  resource_group_name = azurerm_resource_group.training.name
  location            = azurerm_resource_group.training.location
  size                = var.vm_size
  admin_username      = "azureuser"

  network_interface_ids = [
    azurerm_network_interface.vm[count.index].id,
  ]

  admin_ssh_key {
    username   = "azureuser"
    public_key = file(var.ssh_public_key_path)
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "UbuntuServer"
    sku       = "18.04-LTS"
    version   = "latest"
  }

  custom_data = base64encode(templatefile("\${path.module}/cloud-init.tpl", {
    environment_id = var.environment_id
    contract_id    = var.contract_id
    vm_index       = count.index
  }))

  tags = var.tags
}

# Storage Account
resource "azurerm_storage_account" "training" {
  name                     = "sa\${replace(var.environment_id, "-", "")}"
  resource_group_name      = azurerm_resource_group.training.name
  location                 = azurerm_resource_group.training.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  account_kind             = "StorageV2"

  network_rules {
    default_action = "Deny"
    virtual_network_subnet_ids = [
      azurerm_subnet.private.id
    ]
  }

  tags = var.tags
}

# Storage Container for Training Data
resource "azurerm_storage_container" "training_data" {
  name                  = "training-data"
  storage_account_name  = azurerm_storage_account.training.name
  container_access_type = "private"
}

# Storage Container for Training Output
resource "azurerm_storage_container" "training_output" {
  name                  = "training-output"
  storage_account_name  = azurerm_storage_account.training.name
  container_access_type = "private"
}

# Key Vault
resource "azurerm_key_vault" "training" {
  name                        = "\${var.environment_id}-kv"
  location                    = azurerm_resource_group.training.location
  resource_group_name         = azurerm_resource_group.training.name
  enabled_for_disk_encryption = true
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days  = 7
  purge_protection_enabled    = false
  sku_name                   = "standard"

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    key_permissions = [
      "Get", "List", "Create", "Delete", "Update", "Import", "Backup", "Restore", "Recover", "Purge"
    ]

    secret_permissions = [
      "Get", "List", "Set", "Delete", "Backup", "Restore", "Recover", "Purge"
    ]

    certificate_permissions = [
      "Get", "List", "Create", "Delete", "Update", "Import", "Backup", "Restore", "Recover", "Purge"
    ]
  }

  tags = var.tags
}

# SQL Database Server
resource "azurerm_mssql_server" "training" {
  count                        = var.enable_database ? 1 : 0
  name                         = "\${var.environment_id}-sql-server"
  resource_group_name          = azurerm_resource_group.training.name
  location                     = azurerm_resource_group.training.location
  version                      = "12.0"
  administrator_login           = "sqladmin"
  administrator_login_password  = var.sql_password

  tags = var.tags
}

# SQL Database
resource "azurerm_mssql_database" "training" {
  count           = var.enable_database ? 1 : 0
  name            = "\${var.environment_id}-training-db"
  server_id       = azurerm_mssql_server.training[0].id
  sku_name        = var.sql_sku
  max_size_gb     = var.sql_max_size_gb

  tags = var.tags
}

# Container Instances for Training
resource "azurerm_container_group" "training" {
  count               = var.enable_container_training ? 1 : 0
  name                = "\${var.environment_id}-training"
  location            = azurerm_resource_group.training.location
  resource_group_name = azurerm_resource_group.training.name
  os_type             = "Linux"
  restart_policy      = "Never"

  container {
    name   = "training-container"
    image  = "mcr.microsoft.com/azureml/openmpi4.1.0-ubuntu20.04"
    cpu    = var.container_cpu
    memory = var.container_memory

    environment_variables = {
      CONTRACT_ID = var.contract_id
      JOB_ID      = var.job_id
      DATASET_IDS = var.dataset_ids
      MODEL_IDS   = var.model_ids
      ENVIRONMENT_ID = var.environment_id
    }

    volume {
      name       = "training-data"
      mount_path = "/data"
      read_only  = true
      share_name = azurerm_storage_share.training_data[0].name
      storage_account_name = azurerm_storage_account.training.name
      storage_account_key  = azurerm_storage_account.training.primary_access_key
    }

    volume {
      name       = "training-output"
      mount_path = "/output"
      share_name = azurerm_storage_share.training_output[0].name
      storage_account_name = azurerm_storage_account.training.name
      storage_account_key  = azurerm_storage_account.training.primary_access_key
    }
  }

  tags = var.tags
}

# File Share for Training Data
resource "azurerm_storage_share" "training_data" {
  count                = var.enable_container_training ? 1 : 0
  name                 = "training-data"
  storage_account_name = azurerm_storage_account.training.name
  quota                = 50
}

# File Share for Training Output
resource "azurerm_storage_share" "training_output" {
  count                = var.enable_container_training ? 1 : 0
  name                 = "training-output"
  storage_account_name = azurerm_storage_account.training.name
  quota                = 50
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "training" {
  count               = var.enable_monitoring ? 1 : 0
  name                = "\${var.environment_id}-log-workspace"
  location            = azurerm_resource_group.training.location
  resource_group_name = azurerm_resource_group.training.name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = var.tags
}

# Application Insights
resource "azurerm_application_insights" "training" {
  count               = var.enable_monitoring ? 1 : 0
  name                = "\${var.environment_id}-app-insights"
  location            = azurerm_resource_group.training.location
  resource_group_name = azurerm_resource_group.training.name
  application_type    = "web"

  tags = var.tags
}`;
  }

  /**
   * Build variables.tf content
   */
  buildVariablesTf(config) {
    return `variable "location" {
  description = "Azure region"
  type        = string
  default     = "${config.location || 'eastus'}"
}

variable "environment_id" {
  description = "Environment ID"
  type        = string
}

variable "contract_id" {
  description = "Contract ID"
  type        = string
}

variable "vm_count" {
  description = "Number of virtual machines"
  type        = number
  default     = ${config.compute?.instanceCount || 1}
}

variable "vm_size" {
  description = "Virtual machine size"
  type        = string
  default     = "${config.compute?.instanceType || 'Standard_D2s_v3'}"
}

variable "container_cpu" {
  description = "Container CPU cores"
  type        = number
  default     = ${config.container?.cpu || 2}
}

variable "container_memory" {
  description = "Container memory in GB"
  type        = number
  default     = ${config.container?.memory || 4}
}

variable "vnet_address_space" {
  description = "Virtual network address space"
  type        = string
  default     = "${config.networking?.addressSpace || '10.0.0.0/16'}"
}

variable "private_subnet_prefix" {
  description = "Private subnet address prefix"
  type        = string
  default     = "${config.networking?.privateSubnetPrefix || '10.0.1.0/24'}"
}

variable "public_subnet_prefix" {
  description = "Public subnet address prefix"
  type        = string
  default     = "${config.networking?.publicSubnetPrefix || '10.0.2.0/24'}"
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "enable_database" {
  description = "Enable SQL Database"
  type        = bool
  default     = ${config.database?.enabled || false}
}

variable "sql_password" {
  description = "SQL Database password"
  type        = string
  default     = "${config.database?.password || 'TrainingPassword123!'}"
}

variable "sql_sku" {
  description = "SQL Database SKU"
  type        = string
  default     = "${config.database?.sku || 'Basic'}"
}

variable "sql_max_size_gb" {
  description = "SQL Database max size in GB"
  type        = number
  default     = ${config.database?.maxSizeGB || 2}
}

variable "enable_container_training" {
  description = "Enable container-based training"
  type        = bool
  default     = ${config.container?.enabled || false}
}

variable "enable_monitoring" {
  description = "Enable monitoring and logging"
  type        = bool
  default     = ${config.monitoring?.enabled || true}
}

variable "job_id" {
  description = "Training job ID"
  type        = string
  default     = ""
}

variable "dataset_ids" {
  description = "Dataset IDs for training"
  type        = string
  default     = ""
}

variable "model_ids" {
  description = "Model IDs for training"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default = {
    Environment = "Training"
    Project     = "ContractManagement"
    ManagedBy   = "Terraform"
    CreatedBy   = "TSP"
  }
}`;
  }

  /**
   * Build terraform.tfvars content
   */
  buildTfvars(contractId, environmentId, config, azureConfig = null) {
    return `location = "${config.location || 'eastus'}"
environment_id = "${environmentId}"
contract_id = "${contractId}"
vm_count = ${config.compute?.instanceCount || 1}
vm_size = "${config.compute?.instanceType || 'Standard_D2s_v3'}"
container_cpu = ${config.container?.cpu || 2}
container_memory = ${config.container?.memory || 4}
vnet_address_space = "${config.networking?.addressSpace || '10.0.0.0/16'}"
private_subnet_prefix = "${config.networking?.privateSubnetPrefix || '10.0.1.0/24'}"
public_subnet_prefix = "${config.networking?.publicSubnetPrefix || '10.0.2.0/24'}"
ssh_public_key_path = "${config.sshPublicKeyPath || '~/.ssh/id_rsa.pub'}"
enable_database = ${config.database?.enabled || false}
sql_password = "${config.database?.password || 'TrainingPassword123!'}"
sql_sku = "${config.database?.sku || 'Basic'}"
sql_max_size_gb = ${config.database?.maxSizeGB || 2}
enable_container_training = ${config.container?.enabled || false}
enable_monitoring = ${config.monitoring?.enabled || true}
job_id = "${config.jobId || ''}"
dataset_ids = "${config.datasetIds || ''}"
model_ids = "${config.modelIds || ''}"`;
  }

  /**
   * Build outputs.tf content
   */
  buildOutputsTf() {
    return `output "resource_group_name" {
  description = "Resource group name"
  value       = azurerm_resource_group.training.name
}

output "resource_group_location" {
  description = "Resource group location"
  value       = azurerm_resource_group.training.location
}

output "virtual_network_name" {
  description = "Virtual network name"
  value       = azurerm_virtual_network.training.name
}

output "virtual_network_id" {
  description = "Virtual network ID"
  value       = azurerm_virtual_network.training.id
}

output "virtual_machine_names" {
  description = "Virtual machine names"
  value       = azurerm_linux_virtual_machine.vm[*].name
}

output "virtual_machine_private_ips" {
  description = "Virtual machine private IPs"
  value       = azurerm_network_interface.vm[*].private_ip_address
}

output "virtual_machine_public_ips" {
  description = "Virtual machine public IPs"
  value       = azurerm_linux_virtual_machine.vm[*].public_ip_address
}

output "storage_account_name" {
  description = "Storage account name"
  value       = azurerm_storage_account.training.name
}

output "storage_account_primary_key" {
  description = "Storage account primary key"
  value       = azurerm_storage_account.training.primary_access_key
  sensitive   = true
}

output "key_vault_name" {
  description = "Key vault name"
  value       = azurerm_key_vault.training.name
}

output "key_vault_uri" {
  description = "Key vault URI"
  value       = azurerm_key_vault.training.vault_uri
}

output "sql_server_name" {
  description = "SQL server name"
  value       = var.enable_database ? azurerm_mssql_server.training[0].name : null
}

output "sql_database_name" {
  description = "SQL database name"
  value       = var.enable_database ? azurerm_mssql_database.training[0].name : null
}

output "container_group_name" {
  description = "Container group name"
  value       = var.enable_container_training ? azurerm_container_group.training[0].name : null
}

output "log_analytics_workspace_name" {
  description = "Log Analytics workspace name"
  value       = var.enable_monitoring ? azurerm_log_analytics_workspace.training[0].name : null
}

output "application_insights_name" {
  description = "Application Insights name"
  value       = var.enable_monitoring ? azurerm_application_insights.training[0].name : null
}

output "environment_url" {
  description = "Azure portal URL"
  value       = "https://portal.azure.com/#@\${data.azurerm_client_config.current.tenant_id}/resource/subscriptions/\${data.azurerm_client_config.current.subscription_id}/resourceGroups/\${azurerm_resource_group.training.name}"
}

output "estimated_monthly_cost" {
  description = "Estimated monthly cost in USD"
  value       = "~$60-80/month"
}`;
  }

  /**
   * Build cloud-init template
   */
  buildCloudInitTemplate() {
    return `#!/bin/bash

# Update system
apt-get update
apt-get upgrade -y

# Install essential packages
apt-get install -y \
  curl \
  wget \
  git \
  unzip \
  software-properties-common \
  apt-transport-https \
  ca-certificates \
  gnupg \
  lsb-release

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \$(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Install Python and pip
apt-get install -y python3 python3-pip python3-venv

# Install Jupyter
pip3 install jupyter notebook

# Install ML libraries
pip3 install \
  numpy \
  pandas \
  scikit-learn \
  matplotlib \
  seaborn \
  tensorflow \
  torch \
  transformers \
  azure-storage-blob \
  azure-identity

# Create training user
useradd -m -s /bin/bash training
usermod -aG docker training
usermod -aG sudo training

# Create training directory
mkdir -p /home/training/workspace
chown -R training:training /home/training

# Configure environment variables
cat >> /home/training/.bashrc << EOF
export CONTRACT_ID="${contract_id}"
export ENVIRONMENT_ID="${environment_id}"
export VM_INDEX="${vm_index}"
export PYTHONPATH=/home/training/workspace
EOF

# Create startup script
cat > /home/training/startup.sh << 'EOF'
#!/bin/bash
cd /home/training/workspace

# Start Jupyter notebook
nohup jupyter notebook --ip=0.0.0.0 --port=8888 --no-browser --allow-root --NotebookApp.token='' --NotebookApp.password='' > jupyter.log 2>&1 &

# Start training service
nohup python3 -m http.server 8080 > training.log 2>&1 &

echo "Training environment started successfully!"
echo "Jupyter Notebook: http://\$(curl -s ifconfig.me):8888"
echo "Training Service: http://\$(curl -s ifconfig.me):8080"
EOF

chmod +x /home/training/startup.sh
chown training:training /home/training/startup.sh

# Run startup script
sudo -u training /home/training/startup.sh

echo "Cloud-init completed for environment: ${environment_id}"
echo "Contract ID: ${contract_id}"
echo "VM Index: ${vm_index}"`;
  }

  /**
   * Build provider configuration
   */
  buildProviderConfig(azureConfig = null) {
    if (azureConfig) {
      // Use TSP-specific Azure configuration
      return `provider "azurerm" {
  features {}
  
  subscription_id = "${azureConfig.subscription.id}"
  tenant_id       = "${azureConfig.subscription.tenantId}"
  client_id       = "${azureConfig.auth.clientId}"
  client_secret   = "${azureConfig.auth.clientSecret}"
}`;
    } else {
      // Use default Azure configuration
      return `provider "azurerm" {
  features {}
}`;
    }
  }

  /**
   * Calculate estimated cost based on resources
   */
  calculateEstimatedCost(outputs) {
    // Basic cost estimation based on Azure pricing
    const vmCount = outputs.virtual_machine_names?.value?.length || 0;
    const vmSize = outputs.virtual_machine_names?.value?.[0] || 'Standard_D2s_v3';
    
    let estimatedCost = 0;
    
    // VM costs (monthly)
    if (vmSize.includes('Standard_D2s_v3')) {
      estimatedCost += vmCount * 45.67; // ~$45.67/month per D2s_v3
    } else if (vmSize.includes('Standard_NC6s_v3')) {
      estimatedCost += vmCount * 180.00; // ~$180/month per NC6s_v3 (GPU)
    }
    
    // Storage costs
    estimatedCost += 2.40; // ~$2.40/month for storage account
    
    // Key Vault costs
    estimatedCost += 3.00; // ~$3.00/month for Key Vault
    
    // Database costs (if enabled)
    if (outputs.sql_database_name?.value) {
      estimatedCost += 5.00; // ~$5.00/month for Basic SQL Database
    }
    
    // Monitoring costs
    if (outputs.log_analytics_workspace_name?.value) {
      estimatedCost += 2.00; // ~$2.00/month for Log Analytics
    }
    
    return estimatedCost;
  }

  /**
   * Clean up Terraform files
   */
  async cleanup(terraformDir) {
    try {
      await fs.rm(terraformDir, { recursive: true, force: true });
      console.log(`✅ Cleaned up Terraform directory: ${terraformDir}`);
    } catch (error) {
      console.error(`❌ Error cleaning up Terraform directory: ${error.message}`);
    }
  }
}

module.exports = TerraformService; 