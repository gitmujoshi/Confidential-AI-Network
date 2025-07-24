/**
 * Microsoft Azure Provider Implementation
 * 
 * Handles infrastructure provisioning on Microsoft Azure
 * Uses Azure SDK for Node.js
 */

const { DefaultAzureCredential } = require('@azure/identity');
const { ComputeManagementClient } = require('@azure/arm-compute');
const { StorageManagementClient } = require('@azure/arm-storage');
const { NetworkManagementClient } = require('@azure/arm-network');
const { SqlManagementClient } = require('@azure/arm-sql');
const { KeyVaultManagementClient } = require('@azure/arm-keyvault');
const { MonitorClient } = require('@azure/arm-monitor');
const { MachineLearningServices } = require('@azure/arm-machinelearning');
const { BlobServiceClient } = require('@azure/storage-blob');

class AzureProvider {
  constructor(azureConfig = null) {
    // Initialize Azure credentials
    if (azureConfig) {
      // Use CCRP-specific configuration
      this.subscriptionId = azureConfig.subscription.id;
      this.tenantId = azureConfig.subscription.tenantId;
      
      // Set environment variables for service principal
      process.env.AZURE_SUBSCRIPTION_ID = this.subscriptionId;
      process.env.AZURE_TENANT_ID = this.tenantId;
      process.env.AZURE_CLIENT_ID = azureConfig.auth.clientId;
      process.env.AZURE_CLIENT_SECRET = azureConfig.auth.clientSecret;
      
      console.log(`🔧 Azure Provider initialized with CCRP-specific credentials for subscription: ${this.subscriptionId}`);
    } else {
      // Use global environment variables
      this.subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
      this.tenantId = process.env.AZURE_TENANT_ID;
      
      if (!this.subscriptionId) {
        throw new Error('AZURE_SUBSCRIPTION_ID environment variable is required');
      }
      
      console.log(`🔧 Azure Provider initialized with global credentials for subscription: ${this.subscriptionId}`);
    }
    
    this.credential = new DefaultAzureCredential();
    
    // Initialize Azure SDK clients
    this.computeClient = new ComputeManagementClient(this.credential, this.subscriptionId);
    this.storageClient = new StorageManagementClient(this.credential, this.subscriptionId);
    this.networkClient = new NetworkManagementClient(this.credential, this.subscriptionId);
    this.sqlClient = new SqlManagementClient(this.credential, this.subscriptionId);
    this.keyVaultClient = new KeyVaultManagementClient(this.credential, this.subscriptionId);
    this.monitorClient = new MonitorClient(this.credential, this.subscriptionId);
    this.mlClient = new MachineLearningServices(this.credential, this.subscriptionId);
    
    console.log('🔧 Azure Provider initialized with real SDK clients');
  }

  /**
   * Provision infrastructure on Azure
   */
  async provisionInfrastructure(environmentId, infrastructureConfig, securityConfig, monitoringConfig) {
    try {
      console.log(`🏗️ Provisioning Azure infrastructure for environment: ${environmentId}`);
      
      const resourceGroupName = `${environmentId}-rg`;
      const location = infrastructureConfig.location || 'eastus';
      
      // Create resource group
      await this.createResourceGroup(resourceGroupName, location);
      
      const resources = [];
      const logs = [];
      
      // 1. Create VNet and networking
      const networkResources = await this.createNetworking(environmentId, resourceGroupName, location, infrastructureConfig.networking, securityConfig.networkSecurity);
      resources.push(...networkResources);
      logs.push('✅ Networking resources created');
      
      // 2. Create compute instances
      const computeResources = await this.createCompute(environmentId, resourceGroupName, location, infrastructureConfig.compute, networkResources);
      resources.push(...computeResources);
      logs.push('✅ Compute resources created');
      
      // 3. Create storage
      const storageResources = await this.createStorage(environmentId, resourceGroupName, location, infrastructureConfig.storage, securityConfig.encryption);
      resources.push(...storageResources);
      logs.push('✅ Storage resources created');
      
      // 4. Create database if enabled
      if (infrastructureConfig.database.enabled) {
        const databaseResources = await this.createDatabase(environmentId, resourceGroupName, location, infrastructureConfig.database, networkResources);
        resources.push(...databaseResources);
        logs.push('✅ Database resources created');
      }
      
      // 5. Create ML services if GPU enabled
      if (infrastructureConfig.mlServices.gpuEnabled) {
        const mlResources = await this.createMLServices(environmentId, resourceGroupName, location, infrastructureConfig.mlServices);
        resources.push(...mlResources);
        logs.push('✅ ML services created');
      }
      
      // 6. Configure monitoring and logging
      const monitoringResources = await this.createMonitoring(environmentId, resourceGroupName, location, monitoringConfig);
      resources.push(...monitoringResources);
      logs.push('✅ Monitoring resources created');
      
      // 7. Configure security and IAM
      const securityResources = await this.createSecurity(environmentId, resourceGroupName, location, securityConfig);
      resources.push(...securityResources);
      logs.push('✅ Security resources created');
      
      // Calculate estimated cost
      const estimatedCost = this.calculateEstimatedCost(resources);
      
      return {
        environmentUrl: `https://portal.azure.com/#@${process.env.AZURE_TENANT_ID}/resource/subscriptions/${this.subscriptionId}/resourceGroups/${resourceGroupName}`,
        resources,
        logs: logs.join('\n'),
        estimatedCost
      };
      
    } catch (error) {
      console.error('❌ Error provisioning Azure infrastructure:', error);
      throw error;
    }
  }

  /**
   * Create Azure resource group
   */
  async createResourceGroup(resourceGroupName, location) {
    try {
      console.log(`📦 Creating resource group: ${resourceGroupName}`);
      
      const resourceGroup = await this.computeClient.resourceGroups.createOrUpdate(
        resourceGroupName,
        {
          location: location,
          tags: {
            Environment: 'Training',
            CreatedBy: 'ContractManagement',
            CreatedAt: new Date().toISOString()
          }
        }
      );
      
      console.log(`✅ Resource group created: ${resourceGroup.name}`);
      return resourceGroup;
      
    } catch (error) {
      console.error('❌ Error creating resource group:', error);
      throw error;
    }
  }

  /**
   * Create networking resources
   */
  async createNetworking(environmentId, resourceGroupName, location, networkingConfig, securityConfig) {
    const resources = [];
    
    try {
      // Create Virtual Network
      console.log(`🌐 Creating Virtual Network: ${environmentId}-vnet`);
      
      const vnetName = `${environmentId}-vnet`;
      const vnet = await this.networkClient.virtualNetworks.beginCreateOrUpdate(
        resourceGroupName,
        vnetName,
        {
          location: location,
          addressSpace: {
            addressPrefixes: ['10.0.0.0/16']
          },
          subnets: [
            {
              name: 'private-subnet',
              addressPrefix: '10.0.1.0/24',
              networkSecurityGroup: {
                id: `/subscriptions/${this.subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Network/networkSecurityGroups/${environmentId}-nsg`
              }
            },
            {
              name: 'public-subnet',
              addressPrefix: '10.0.2.0/24',
              networkSecurityGroup: {
                id: `/subscriptions/${this.subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Network/networkSecurityGroups/${environmentId}-nsg`
              }
            }
          ]
        }
      );
      
      const vnetResult = await vnet.pollUntilDone();
      resources.push({
        type: 'NETWORK',
        id: vnetResult.id,
        name: vnetResult.name,
        config: {
          addressSpace: vnetResult.addressSpace,
          location: vnetResult.location
        },
        status: 'ACTIVE'
      });
      
      // Create Network Security Group
      console.log(`🔒 Creating Network Security Group: ${environmentId}-nsg`);
      
      const nsgName = `${environmentId}-nsg`;
      const nsg = await this.networkClient.networkSecurityGroups.beginCreateOrUpdate(
        resourceGroupName,
        nsgName,
        {
          location: location,
          securityRules: [
            {
              name: 'SSH',
              protocol: 'Tcp',
              sourcePortRange: '*',
              destinationPortRange: '22',
              sourceAddressPrefix: '0.0.0.0/0',
              destinationAddressPrefix: '*',
              access: 'Allow',
              priority: 1000,
              direction: 'Inbound'
            },
            {
              name: 'HTTP',
              protocol: 'Tcp',
              sourcePortRange: '*',
              destinationPortRange: '80',
              sourceAddressPrefix: '0.0.0.0/0',
              destinationAddressPrefix: '*',
              access: 'Allow',
              priority: 1001,
              direction: 'Inbound'
            },
            {
              name: 'HTTPS',
              protocol: 'Tcp',
              sourcePortRange: '*',
              destinationPortRange: '443',
              sourceAddressPrefix: '0.0.0.0/0',
              destinationAddressPrefix: '*',
              access: 'Allow',
              priority: 1002,
              direction: 'Inbound'
            },
            {
              name: 'Jupyter',
              protocol: 'Tcp',
              sourcePortRange: '*',
              destinationPortRange: '8888',
              sourceAddressPrefix: '0.0.0.0/0',
              destinationAddressPrefix: '*',
              access: 'Allow',
              priority: 1003,
              direction: 'Inbound'
            }
          ]
        }
      );
      
      const nsgResult = await nsg.pollUntilDone();
      resources.push({
        type: 'SECURITY',
        id: nsgResult.id,
        name: nsgResult.name,
        config: {
          securityRules: nsgResult.securityRules
        },
        status: 'ACTIVE'
      });
      
      console.log(`✅ Networking resources created successfully`);
      
    } catch (error) {
      console.error('❌ Error creating networking resources:', error);
      throw error;
    }
    
    return resources;
  }

  /**
   * Create compute resources
   */
  async createCompute(environmentId, resourceGroupName, location, computeConfig, networkResources) {
    const resources = [];
    
    try {
      for (let i = 0; i < computeConfig.instanceCount; i++) {
        const vmName = `${environmentId}-vm-${i}`;
        const nicName = `${environmentId}-nic-${i}`;
        
        console.log(`🖥️ Creating Network Interface: ${nicName}`);
        
        // Create Network Interface
        const nic = await this.networkClient.networkInterfaces.beginCreateOrUpdate(
          resourceGroupName,
          nicName,
          {
            location: location,
            ipConfigurations: [
              {
                name: 'ipconfig1',
                subnet: {
                  id: `/subscriptions/${this.subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Network/virtualNetworks/${environmentId}-vnet/subnets/private-subnet`
                }
              }
            ],
            networkSecurityGroup: {
              id: `/subscriptions/${this.subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Network/networkSecurityGroups/${environmentId}-nsg`
            }
          }
        );
        
        const nicResult = await nic.pollUntilDone();
        
        console.log(`🖥️ Creating Virtual Machine: ${vmName}`);
        
        // Create Virtual Machine
        const vm = await this.computeClient.virtualMachines.beginCreateOrUpdate(
          resourceGroupName,
          vmName,
          {
            location: location,
            hardwareProfile: {
              vmSize: computeConfig.instanceType
            },
            osProfile: {
              computerName: vmName,
              adminUsername: 'azureuser',
              adminPassword: this.generateSecurePassword(),
              customData: this.generateCustomData(computeConfig)
            },
            networkProfile: {
              networkInterfaces: [
                {
                  id: nicResult.id
                }
              ]
            },
            storageProfile: {
              imageReference: {
                publisher: 'Canonical',
                offer: 'UbuntuServer',
                sku: '18.04-LTS',
                version: 'latest'
              },
              osDisk: {
                name: `${vmName}-osdisk`,
                caching: 'ReadWrite',
                createOption: 'FromImage',
                managedDisk: {
                  storageAccountType: 'Premium_LRS'
                }
              }
            },
            tags: {
              Environment: 'Training',
              ContractId: environmentId,
              Instance: i.toString()
            }
          }
        );
        
        const vmResult = await vm.pollUntilDone();
        resources.push({
          type: 'COMPUTE',
          id: vmResult.id,
          name: vmResult.name,
          config: {
            vmSize: vmResult.hardwareProfile.vmSize,
            imageReference: vmResult.storageProfile.imageReference,
            networkProfile: vmResult.networkProfile
          },
          status: 'ACTIVE'
        });
        
        console.log(`✅ Virtual Machine created: ${vmResult.name}`);
      }
      
    } catch (error) {
      console.error('❌ Error creating compute resources:', error);
      throw error;
    }
    
    return resources;
  }

  /**
   * Create storage resources
   */
  async createStorage(environmentId, resourceGroupName, location, storageConfig, encryptionConfig) {
    const resources = [];
    
    try {
      // Create Storage Account
      const storageAccountName = `sa${environmentId.replace(/-/g, '')}`.toLowerCase();
      console.log(`💾 Creating Storage Account: ${storageAccountName}`);
      
      const storageAccount = await this.storageClient.storageAccounts.beginCreate(
        resourceGroupName,
        storageAccountName,
        {
          location: location,
          sku: {
            name: storageConfig.type === 'SSD' ? 'Premium_LRS' : 'Standard_LRS'
          },
          kind: 'StorageV2',
          encryption: {
            services: {
              blob: {
                enabled: storageConfig.encrypted
              },
              file: {
                enabled: storageConfig.encrypted
              }
            },
            keySource: storageConfig.encrypted ? 'Microsoft.Keyvault' : 'Microsoft.Storage'
          },
          networkRuleSet: {
            defaultAction: 'Deny',
            ipRules: [],
            virtualNetworkRules: [
              {
                virtualNetworkResourceId: `/subscriptions/${this.subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Network/virtualNetworks/${environmentId}-vnet`
              }
            ]
          }
        }
      );
      
      const storageResult = await storageAccount.pollUntilDone();
      resources.push({
        type: 'STORAGE',
        id: storageResult.id,
        name: storageResult.name,
        config: {
          sku: storageResult.sku,
          kind: storageResult.kind,
          encryption: storageResult.encryption
        },
        status: 'ACTIVE'
      });
      
      // Create Blob Container for training data
      const blobServiceClient = BlobServiceClient.fromConnectionString(
        await this.getStorageConnectionString(storageResult.name, resourceGroupName)
      );
      
      const containerClient = blobServiceClient.getContainerClient('training-data');
      await containerClient.createIfNotExists();
      
      console.log(`✅ Storage resources created successfully`);
      
    } catch (error) {
      console.error('❌ Error creating storage resources:', error);
      throw error;
    }
    
    return resources;
  }

  /**
   * Create database resources
   */
  async createDatabase(environmentId, resourceGroupName, location, databaseConfig, networkResources) {
    const resources = [];
    
    try {
      const serverName = `${environmentId}-sql-server`;
      console.log(`🗄️ Creating SQL Server: ${serverName}`);
      
      // Create SQL Server
      const sqlServer = await this.sqlClient.servers.beginCreateOrUpdate(
        resourceGroupName,
        serverName,
        {
          location: location,
          administratorLogin: 'sqladmin',
          administratorLoginPassword: this.generateSecurePassword(),
          version: databaseConfig.type === 'PostgreSQL' ? '12.0' : '12.0',
          minimalTlsVersion: '1.2',
          publicNetworkAccess: 'Disabled'
        }
      );
      
      const serverResult = await sqlServer.pollUntilDone();
      
      // Create Database
      const databaseName = `${environmentId}-training-db`;
      console.log(`🗄️ Creating Database: ${databaseName}`);
      
      const database = await this.sqlClient.databases.beginCreateOrUpdate(
        resourceGroupName,
        serverName,
        databaseName,
        {
          location: location,
          sku: {
            name: 'Basic',
            tier: 'Basic'
          }
        }
      );
      
      const databaseResult = await database.pollUntilDone();
      
      resources.push({
        type: 'DATABASE',
        id: databaseResult.id,
        name: databaseResult.name,
        config: {
          serverName: serverResult.name,
          version: serverResult.version,
          sku: databaseResult.sku
        },
        status: 'ACTIVE'
      });
      
      console.log(`✅ Database resources created successfully`);
      
    } catch (error) {
      console.error('❌ Error creating database resources:', error);
      throw error;
    }
    
    return resources;
  }

  /**
   * Create ML services
   */
  async createMLServices(environmentId, resourceGroupName, location, mlConfig) {
    const resources = [];
    
    try {
      const workspaceName = `${environmentId}-ml-workspace`;
      console.log(`🤖 Creating ML Workspace: ${workspaceName}`);
      
      // Create Azure Machine Learning workspace
      const workspace = await this.mlClient.workspaces.beginCreateOrUpdate(
        resourceGroupName,
        workspaceName,
        {
          location: location,
          sku: {
            name: 'Basic'
          },
          encryption: {
            status: 'Enabled',
            keyVaultProperties: {
              keyVaultArmId: `/subscriptions/${this.subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.KeyVault/vaults/${environmentId}-kv`
            }
          },
          tags: {
            Environment: 'Training',
            ContractId: environmentId
          }
        }
      );
      
      const workspaceResult = await workspace.pollUntilDone();
      resources.push({
        type: 'ML_SERVICE',
        id: workspaceResult.id,
        name: workspaceResult.name,
        config: {
          sku: workspaceResult.sku,
          encryption: workspaceResult.encryption
        },
        status: 'ACTIVE'
      });
      
      console.log(`✅ ML services created successfully`);
      
    } catch (error) {
      console.error('❌ Error creating ML services:', error);
      throw error;
    }
    
    return resources;
  }

  /**
   * Create monitoring resources
   */
  async createMonitoring(environmentId, resourceGroupName, location, monitoringConfig) {
    const resources = [];
    
    try {
      // Create Log Analytics workspace
      const logWorkspaceName = `${environmentId}-log-workspace`;
      console.log(`📊 Creating Log Analytics Workspace: ${logWorkspaceName}`);
      
      const logWorkspace = await this.monitorClient.workspaces.beginCreateOrUpdate(
        resourceGroupName,
        logWorkspaceName,
        {
          location: location,
          sku: {
            name: 'PerGB2018'
          },
          retentionInDays: monitoringConfig.logging.retentionDays || 30
        }
      );
      
      const logWorkspaceResult = await logWorkspace.pollUntilDone();
      resources.push({
        type: 'MONITORING',
        id: logWorkspaceResult.id,
        name: logWorkspaceResult.name,
        config: {
          sku: logWorkspaceResult.sku,
          retentionInDays: logWorkspaceResult.retentionInDays
        },
        status: 'ACTIVE'
      });
      
      console.log(`✅ Monitoring resources created successfully`);
      
    } catch (error) {
      console.error('❌ Error creating monitoring resources:', error);
      throw error;
    }
    
    return resources;
  }

  /**
   * Create security resources
   */
  async createSecurity(environmentId, resourceGroupName, location, securityConfig) {
    const resources = [];
    
    try {
      // Create Key Vault
      const keyVaultName = `${environmentId}-kv`;
      console.log(`🔐 Creating Key Vault: ${keyVaultName}`);
      
      const keyVault = await this.keyVaultClient.vaults.beginCreateOrUpdate(
        resourceGroupName,
        keyVaultName,
        {
          location: location,
          properties: {
            sku: {
              family: 'A',
              name: 'standard'
            },
            tenantId: process.env.AZURE_TENANT_ID,
            accessPolicies: [],
            enabledForDeployment: true,
            enabledForDiskEncryption: true,
            enabledForTemplateDeployment: true,
            networkAcls: {
              defaultAction: 'Allow',
              bypass: 'AzureServices'
            }
          }
        }
      );
      
      const keyVaultResult = await keyVault.pollUntilDone();
      resources.push({
        type: 'SECURITY',
        id: keyVaultResult.id,
        name: keyVaultResult.name,
        config: {
          sku: keyVaultResult.properties.sku,
          enabledForDeployment: keyVaultResult.properties.enabledForDeployment
        },
        status: 'ACTIVE'
      });
      
      console.log(`✅ Security resources created successfully`);
      
    } catch (error) {
      console.error('❌ Error creating security resources:', error);
      throw error;
    }
    
    return resources;
  }

  /**
   * Generate secure password for Azure resources
   */
  generateSecurePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Generate custom data script for instances
   */
  generateCustomData(computeConfig) {
    const script = `#!/bin/bash
apt-get update
apt-get install -y docker.io
systemctl start docker
systemctl enable docker
usermod -a -G docker azureuser

# Install Python and ML libraries
apt-get install -y python3-pip python3-dev
pip3 install --upgrade pip

# Install Azure SDK
pip3 install azure-storage-blob azure-identity azure-keyvault-secrets

# Install ML libraries
pip3 install tensorflow torch scikit-learn pandas numpy matplotlib seaborn jupyter

# Install monitoring
pip3 install azure-monitor-opentelemetry

# Setup Jupyter
jupyter notebook --generate-config
echo "c.NotebookApp.ip = '0.0.0.0'" >> ~/.jupyter/jupyter_notebook_config.py
echo "c.NotebookApp.allow_root = True" >> ~/.jupyter/jupyter_notebook_config.py
echo "c.NotebookApp.allow_origin = '*'" >> ~/.jupyter/jupyter_notebook_config.py

# Create training directory
mkdir -p /home/azureuser/training
chown -R azureuser:azureuser /home/azureuser/training

echo "Training environment setup complete"`;
    
    return Buffer.from(script).toString('base64');
  }

  /**
   * Get storage connection string
   */
  async getStorageConnectionString(storageAccountName, resourceGroupName) {
    const keys = await this.storageClient.storageAccounts.listKeys(resourceGroupName, storageAccountName);
    const key = keys.keys[0].value;
    return `DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${key};EndpointSuffix=core.windows.net`;
  }

  /**
   * Calculate estimated cost
   */
  calculateEstimatedCost(resources) {
    let totalCost = 0;
    
    resources.forEach(resource => {
      switch (resource.type) {
        case 'COMPUTE':
          totalCost += this.getComputeCost(resource.config.vmSize);
          break;
        case 'STORAGE':
          totalCost += this.getStorageCost(100, resource.config.sku?.name); // Default 100GB
          break;
        case 'DATABASE':
          totalCost += this.getDatabaseCost(resource.config.version);
          break;
        case 'ML_SERVICE':
          totalCost += this.getMLServiceCost(resource.config.sku?.name);
          break;
      }
    });
    
    return totalCost;
  }

  getComputeCost(vmSize) {
    const hourlyRates = {
      'Standard_D2s_v3': 0.096,
      'Standard_D4s_v3': 0.192,
      'Standard_D8s_v3': 0.384,
      'Standard_NC6s_v3': 0.90,
      'Standard_NC12s_v3': 1.80
    };
    return (hourlyRates[vmSize] || 0.096) * 24 * 30; // Monthly cost
  }

  getStorageCost(sizeGB, skuName) {
    const gbRates = {
      'Premium_LRS': 0.12,
      'Standard_LRS': 0.04
    };
    return (gbRates[skuName] || 0.04) * sizeGB;
  }

  getDatabaseCost(version) {
    const dbRates = {
      '11': 0.015, // PostgreSQL
      '12.0': 0.015 // MySQL
    };
    return (dbRates[version] || 0.015) * 24 * 30;
  }

  getMLServiceCost(skuName) {
    const mlRates = {
      'Basic': 0.05,
      'Enterprise': 0.10
    };
    return (mlRates[skuName] || 0.05) * 24 * 30;
  }

  /**
   * Destroy infrastructure
   */
  async destroyInfrastructure(environmentId) {
    try {
      console.log(`🗑️ Destroying Azure infrastructure for environment: ${environmentId}`);
      
      const resourceGroupName = `${environmentId}-rg`;
      
      // Delete the entire resource group (this will delete all resources)
      const deleteOperation = await this.computeClient.resourceGroups.beginDelete(resourceGroupName);
      await deleteOperation.pollUntilDone();
      
      console.log(`✅ Azure infrastructure destroyed for environment: ${environmentId}`);
      
    } catch (error) {
      console.error('❌ Error destroying Azure infrastructure:', error);
      throw error;
    }
  }
}

module.exports = AzureProvider; 