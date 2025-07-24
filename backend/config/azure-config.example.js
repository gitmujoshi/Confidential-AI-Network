/**
 * Azure Configuration Example
 * 
 * Copy this file to azure-config.js and fill in your Azure credentials
 * 
 * Required Environment Variables:
 * - AZURE_SUBSCRIPTION_ID: Your Azure subscription ID
 * - AZURE_TENANT_ID: Your Azure tenant ID
 * - AZURE_CLIENT_ID: Service principal client ID (if using service principal)
 * - AZURE_CLIENT_SECRET: Service principal client secret (if using service principal)
 * 
 * Authentication Methods:
 * 1. Environment Variables (recommended for production)
 * 2. Managed Identity (for Azure-hosted applications)
 * 3. Azure CLI (for development)
 * 4. Service Principal (for CI/CD)
 */

module.exports = {
  // Azure Subscription Configuration
  subscription: {
    id: process.env.AZURE_SUBSCRIPTION_ID,
    tenantId: process.env.AZURE_TENANT_ID
  },

  // Authentication Configuration
  auth: {
    // Method 1: Service Principal (recommended for production)
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    
    // Method 2: Managed Identity (for Azure-hosted apps)
    useManagedIdentity: process.env.AZURE_USE_MANAGED_IDENTITY === 'true',
    
    // Method 3: Azure CLI (for development)
    useAzureCLI: process.env.AZURE_USE_CLI === 'true'
  },

  // Default Resource Configuration
  defaults: {
    location: 'eastus',
    resourceGroupPrefix: 'training',
    storageAccountPrefix: 'training',
    keyVaultPrefix: 'training'
  },

  // Network Configuration
  network: {
    vnetAddressSpace: '10.0.0.0/16',
    privateSubnetPrefix: '10.0.1.0/24',
    publicSubnetPrefix: '10.0.2.0/24',
    allowedIPRanges: ['0.0.0.0/0'] // Restrict in production
  },

  // Compute Configuration
  compute: {
    defaultVMSize: 'Standard_D2s_v3',
    gpuVMSize: 'Standard_NC6s_v3',
    imageReference: {
      publisher: 'Canonical',
      offer: 'UbuntuServer',
      sku: '18.04-LTS',
      version: 'latest'
    }
  },

  // Storage Configuration
  storage: {
    defaultSku: 'Standard_LRS',
    premiumSku: 'Premium_LRS',
    encryptionEnabled: true
  },

  // Database Configuration
  database: {
    defaultSku: 'Basic',
    adminUsername: 'sqladmin',
    minTlsVersion: '1.2'
  },

  // ML Services Configuration
  mlServices: {
    workspaceSku: 'Basic',
    encryptionEnabled: true
  },

  // Monitoring Configuration
  monitoring: {
    logRetentionDays: 30,
    workspaceSku: 'PerGB2018'
  },

  // Security Configuration
  security: {
    keyVaultSku: 'standard',
    enableDiskEncryption: true,
    enableTemplateDeployment: true
  },

  // Cost Management
  cost: {
    budgetLimit: 1000, // USD per month
    alertThreshold: 0.8, // 80% of budget
    enableCostAlerts: true
  }
};

/**
 * Setup Instructions:
 * 
 * 1. Create Azure Service Principal:
 *    az ad sp create-for-rbac --name "ContractManagement" --role contributor
 * 
 * 2. Set Environment Variables:
 *    export AZURE_SUBSCRIPTION_ID="your-subscription-id"
 *    export AZURE_TENANT_ID="your-tenant-id"
 *    export AZURE_CLIENT_ID="your-client-id"
 *    export AZURE_CLIENT_SECRET="your-client-secret"
 * 
 * 3. Grant Permissions:
 *    - Contributor role on subscription
 *    - Key Vault Administrator role (for encryption)
 *    - Storage Account Contributor role
 * 
 * 4. Enable Required Providers:
 *    az provider register --namespace Microsoft.Compute
 *    az provider register --namespace Microsoft.Storage
 *    az provider register --namespace Microsoft.Network
 *    az provider register --namespace Microsoft.Sql
 *    az provider register --namespace Microsoft.KeyVault
 *    az provider register --namespace Microsoft.OperationalInsights
 *    az provider register --namespace Microsoft.MachineLearningServices
 */ 