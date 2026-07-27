# Azure Integration Guide

## Overview

This guide explains the **real Azure infrastructure provisioning** implementation in the Contract Management System. The system now uses actual Azure SDK calls to provision real infrastructure and supports CCRP-specific Azure credentials for multi-tenant deployments.

**Related (platform Azure docs):**

- [Azure Features & Configuration](../docs/deployment/AZURE_FEATURES_AND_CONFIGURATION.md) — full feature catalog + env vars (Entra, Blob, train modes, DEK/MEK)
- [config.azure.env.example](../config/examples/config.azure.env.example) — target Azure env template
- [Azure Security Architecture](../docs/production/AZURE_SECURITY_ARCHITECTURE.md) — platform topology & crypto flows

## 🏗️ What's Been Implemented

### ✅ **Real Azure Infrastructure Provisioning**

1. **Resource Groups** - Actual Azure resource groups created
2. **Virtual Networks** - Real VNets with subnets and security groups
3. **Virtual Machines** - Actual compute instances with Ubuntu 18.04
4. **Storage Accounts** - Real Azure Storage with blob containers
5. **Key Vault** - Actual Azure Key Vault for encryption
6. **SQL Database** - Real Azure SQL Database servers
7. **ML Workspace** - Actual Azure Machine Learning workspaces
8. **Log Analytics** - Real monitoring and logging
9. **Container Instances** - Actual container deployment for training

### ✅ **CCRP-Specific Azure Credentials**

1. **Multi-Tenant Support** - Each CCRP has their own Azure subscription
2. **Encrypted Storage** - Client secrets encrypted with AES-256-CBC
3. **Contract Integration** - Contract-specific Azure configuration
4. **Credential Validation** - Automatic validation of Azure credentials
5. **Audit Trail** - Complete tracking of credential changes

### ✅ **Real Training Execution**

1. **Container Deployment** - Real Azure Container Instances
2. **Data Access** - Actual Azure Storage blob access
3. **Model Registration** - Real Azure ML model registration
4. **KMS Integration** - Actual Azure Key Vault encryption
5. **Monitoring** - Real Azure Monitor integration

## 🔧 **Azure SDK Integration**

### **Installed Packages**
```bash
npm install @azure/arm-compute @azure/arm-storage @azure/arm-network 
npm install @azure/arm-sql @azure/arm-keyvault @azure/arm-monitor 
npm install @azure/arm-machinelearning @azure/arm-containerinstance
npm install @azure/identity @azure/storage-blob
```

### **Authentication Methods**
1. **Service Principal** (Recommended for production)
2. **Managed Identity** (For Azure-hosted applications)
3. **Azure CLI** (For development)
4. **CCRP-Specific Credentials** (Multi-tenant support)

## 📋 **Required Environment Variables**

### **Global Azure Configuration (Fallback)**
```bash
# Azure Subscription
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
export AZURE_TENANT_ID="your-tenant-id"

# Service Principal (recommended)
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"

# Optional: Use Azure CLI for development
export AZURE_USE_CLI="true"

# Optional: Use Managed Identity
export AZURE_USE_MANAGED_IDENTITY="true"

# Encryption key for CCRP credentials
export ENCRYPTION_KEY="your-encryption-key"
```

### **CCRP-Specific Credentials (Database Stored)**
- Stored in `ccrp_azure_credentials` table
- Encrypted client secrets
- Per-CCRP subscription and tenant IDs
- Contract-specific overrides

## 🚀 **Setup Instructions**

### **1. Database Migration**
```bash
# Run the migration to add CCRP Azure fields
node scripts/migration/addCcrpAzureFields.js
```

### **2. Create Azure Service Principal**
```bash
# Create service principal with contributor role
az ad sp create-for-rbac --name "ContractManagement" --role contributor

# Output will include:
# {
#   "clientId": "your-client-id",
#   "clientSecret": "your-client-secret",
#   "subscriptionId": "your-subscription-id",
#   "tenantId": "your-tenant-id"
# }
```

### **3. Set Environment Variables**
```bash
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
export ENCRYPTION_KEY="your-encryption-key"
```

### **4. Grant Additional Permissions**
```bash
# Key Vault Administrator (for encryption)
az role assignment create --assignee "your-client-id" \
  --role "Key Vault Administrator" \
  --scope "/subscriptions/your-subscription-id"

# Storage Account Contributor
az role assignment create --assignee "your-client-id" \
  --role "Storage Account Contributor" \
  --scope "/subscriptions/your-subscription-id"
```

### **5. Enable Required Azure Providers**
```bash
az provider register --namespace Microsoft.Compute
az provider register --namespace Microsoft.Storage
az provider register --namespace Microsoft.Network
az provider register --namespace Microsoft.Sql
az provider register --namespace Microsoft.KeyVault
az provider register --namespace Microsoft.OperationalInsights
az provider register --namespace Microsoft.MachineLearningServices
az provider register --namespace Microsoft.ContainerInstance
```

## 🧪 **Testing the Integration**

### **Run the Azure Integration Test**
```bash
node test-azure-integration.js
```

### **Run the CCRP Azure Integration Test**
```bash
node test-ccrp-azure-integration.js
```

### **Expected Output**
```
🧪 Testing CCRP Azure Credentials Integration...

👤 Creating test CCRP user...
✅ Created CCRP user: Test CCRP Azure (ID: 123)

🔐 Creating Azure credentials for CCRP...
✅ Created Azure credentials for CCRP: 456

📋 Creating test contract with Azure configuration...
✅ Created test contract: test-contract-azure-1234567890

🔧 Testing contract Azure configuration retrieval...
✅ Contract Azure configuration:
- Subscription ID: test-subscription-id
- Tenant ID: test-tenant-id
- Location: eastus
- VM Size: Standard_D4s_v3
- Storage SKU: Premium_LRS
- Encryption: true
- Monitoring: true
- Budget Limit: $500

🏗️ Demonstrating infrastructure provisioning with CCRP credentials...
✅ Infrastructure provisioning initiated with CCRP credentials
- Environment ID: env-test-contract-azure-1234567890-1234567890
- Cloud Provider: Azure
- Status: PENDING

🎉 CCRP Azure Credentials Integration Test Completed Successfully!
```

## 🏗️ **Infrastructure Components**

### **1. Resource Group**
- **Name**: `{environmentId}-rg`
- **Location**: Configurable (default: eastus)
- **Tags**: Environment, CreatedBy, CreatedAt

### **2. Virtual Network**
- **Name**: `{environmentId}-vnet`
- **Address Space**: 10.0.0.0/16
- **Subnets**:
  - Private: 10.0.1.0/24
  - Public: 10.0.2.0/24

### **3. Network Security Group**
- **Name**: `{environmentId}-nsg`
- **Rules**:
  - SSH (22)
  - HTTP (80)
  - HTTPS (443)
  - Jupyter (8888)

### **4. Virtual Machines**
- **Image**: Ubuntu Server 18.04 LTS
- **Size**: Configurable (default: Standard_D2s_v3)
- **GPU**: Available (Standard_NC6s_v3)
- **Custom Data**: Auto-installs ML libraries

### **5. Storage Account**
- **Name**: `sa{environmentId}` (lowercase, no hyphens)
- **Type**: StorageV2
- **Encryption**: Enabled
- **Network**: VNet-restricted access

### **6. Key Vault**
- **Name**: `{environmentId}-kv`
- **SKU**: Standard
- **Features**: Disk encryption, template deployment

### **7. SQL Database**
- **Server**: `{environmentId}-sql-server`
- **Database**: `{environmentId}-training-db`
- **SKU**: Basic
- **Security**: TLS 1.2, private network

### **8. ML Workspace**
- **Name**: `{environmentId}-ml-workspace`
- **SKU**: Basic
- **Encryption**: Enabled with Key Vault

### **9. Log Analytics**
- **Name**: `{environmentId}-log-workspace`
- **SKU**: PerGB2018
- **Retention**: 30 days

## 🔐 **CCRP Azure Credentials**

### **Database Schema**
```sql
-- CCRP Azure Credentials Table
CREATE TABLE ccrp_azure_credentials (
  id SERIAL PRIMARY KEY,
  ccrpUserId INTEGER REFERENCES users(id),
  subscriptionId VARCHAR NOT NULL,
  tenantId VARCHAR NOT NULL,
  clientId VARCHAR NOT NULL,
  clientSecret TEXT NOT NULL, -- Encrypted
  authMethod ENUM('SERVICE_PRINCIPAL', 'MANAGED_IDENTITY', 'AZURE_CLI'),
  defaultLocation VARCHAR DEFAULT 'eastus',
  defaultVMSize VARCHAR DEFAULT 'Standard_D2s_v3',
  enableEncryption BOOLEAN DEFAULT true,
  budgetLimit DECIMAL(10,2),
  validationStatus ENUM('PENDING', 'VALID', 'INVALID', 'EXPIRED'),
  isActive BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Contract Azure Fields**
```sql
-- Contract Azure Configuration Fields
ALTER TABLE contracts ADD COLUMN ccrpAzureSubscriptionId VARCHAR;
ALTER TABLE contracts ADD COLUMN ccrpAzureTenantId VARCHAR;
ALTER TABLE contracts ADD COLUMN ccrpAzureLocation VARCHAR DEFAULT 'eastus';
ALTER TABLE contracts ADD COLUMN ccrpAzureVMSize VARCHAR DEFAULT 'Standard_D2s_v3';
ALTER TABLE contracts ADD COLUMN ccrpAzureStorageSku VARCHAR DEFAULT 'Standard_LRS';
ALTER TABLE contracts ADD COLUMN ccrpAzureDatabaseSku VARCHAR DEFAULT 'Basic';
ALTER TABLE contracts ADD COLUMN ccrpAzureEnableEncryption BOOLEAN DEFAULT true;
ALTER TABLE contracts ADD COLUMN ccrpAzureEnableMonitoring BOOLEAN DEFAULT true;
ALTER TABLE contracts ADD COLUMN ccrpAzureBudgetLimit DECIMAL(10,2);
```

### **Usage Examples**

#### **1. Create CCRP Azure Credentials**
```javascript
const CCRPAzureCredentialsService = require('./services/ccrpAzureCredentialsService');
const ccrpService = new CCRPAzureCredentialsService();

await ccrpService.createOrUpdateCredentials(
  ccrpUserId,
  {
    subscriptionId: 'ccrp-subscription-id',
    tenantId: 'ccrp-tenant-id',
    clientId: 'ccrp-client-id',
    clientSecret: 'ccrp-client-secret'
  },
  {
    defaultLocation: 'eastus',
    defaultVMSize: 'Standard_D2s_v3',
    budgetLimit: 1000.00
  }
);
```

#### **2. Get Contract Azure Configuration**
```javascript
const contractConfig = await ccrpService.getContractAzureConfig(contractId);
// Returns merged configuration: contract-specific settings override CCRP defaults
```

#### **3. Infrastructure Provisioning with CCRP Credentials**
```javascript
// Automatically uses CCRP credentials for Azure contracts
const environment = await infrastructureService.createTrainingEnvironment(contractId, config);
```

## 🐳 **Container Deployment**

### **Training Container Configuration**
```javascript
{
  name: 'training-container',
  image: 'mcr.microsoft.com/azureml/openmpi4.1.0-ubuntu20.04',
  resources: {
    requests: {
      memoryInGB: 4,
      cpu: 2
    }
  },
  environmentVariables: [
    { name: 'CONTRACT_ID', value: contractId },
    { name: 'JOB_ID', value: jobId },
    { name: 'DATASET_IDS', value: datasetIds },
    { name: 'MODEL_IDS', value: modelIds }
  ]
}
```

### **Volume Mounts**
- **Training Data**: Azure File Share
- **Model Storage**: Azure Blob Storage
- **Logs**: Azure Monitor

## 🔐 **Security Features**

### **1. Network Security**
- Private subnets for compute
- NSG rules for specific ports
- VNet-restricted storage access

### **2. Encryption**
- Storage account encryption
- Disk encryption with Key Vault
- TLS 1.2 for databases
- Encrypted CCRP credentials

### **3. Access Control**
- Service principal authentication
- Role-based access control
- Managed identities
- CCRP-specific credentials

### **4. Monitoring**
- Log Analytics workspace
- Application Insights
- Azure Monitor metrics

## 💰 **Cost Management**

### **Estimated Monthly Costs**
- **Standard_D2s_v3 VM**: $45.67/month
- **Storage Account**: $2.40/month (100GB)
- **Key Vault**: $3.00/month
- **SQL Database**: $5.00/month
- **ML Workspace**: $1.50/month
- **Log Analytics**: $2.00/month

**Total**: ~$59.57/month per environment

### **CCRP-Specific Cost Management**
- **Per-CCRP Budgets**: Each CCRP can set their own budget limits
- **Contract-Specific Budgets**: Contracts can have custom budget limits
- **Cost Tracking**: Real-time cost monitoring per contract
- **Alert Thresholds**: Configurable budget alerts

### **Cost Optimization**
- Use Basic SKUs for development
- Enable auto-shutdown for VMs
- Set up budget alerts
- Use spot instances for training

## 🔍 **Monitoring & Logging**

### **Azure Monitor Integration**
```javascript
// Real monitoring implementation
const { MonitorClient } = require('@azure/arm-monitor');
const monitorClient = new MonitorClient(credential, subscriptionId);

// Get VM metrics
const metrics = await monitorClient.metrics.list(
  resourceId,
  {
    timespan: `${startTime}/${endTime}`,
    interval: 'PT1H',
    metricnames: 'Percentage CPU,Available Memory'
  }
);
```

### **Log Analytics Queries**
```kusto
// Training job logs
ContainerInstanceLog_CL
| where ContainerGroupName_s contains "training"
| where TimeGenerated > ago(1h)
| project TimeGenerated, Log_s, ContainerName_s
```

## 🚨 **Error Handling**

### **Common Issues & Solutions**

#### **1. Authentication Errors**
```bash
# Check service principal
az ad sp show --id "your-client-id"

# Verify permissions
az role assignment list --assignee "your-client-id"
```

#### **2. CCRP Credential Issues**
```javascript
// Check CCRP credentials
const ccrpService = new CCRPAzureCredentialsService();
const credentials = await ccrpService.getCredentials(ccrpUserId);
console.log('Validation Status:', credentials.validationStatus);
```

#### **3. Resource Creation Failures**
```bash
# Check provider registration
az provider list --query "[?registrationState=='Registered']"

# Verify subscription
az account show
```

#### **4. Network Issues**
```bash
# Check VNet creation
az network vnet show --name "vnet-name" --resource-group "rg-name"

# Verify NSG rules
az network nsg rule list --nsg-name "nsg-name" --resource-group "rg-name"
```

## 📊 **Performance Optimization**

### **1. Parallel Resource Creation**
```javascript
// Create resources in parallel
const [vnet, nsg, storage] = await Promise.all([
  this.createVirtualNetwork(),
  this.createNetworkSecurityGroup(),
  this.createStorageAccount()
]);
```

### **2. Resource Caching**
```javascript
// Cache frequently used resources
this.resourceCache = new Map();
```

### **3. Async Operations**
```javascript
// Use polling for long-running operations
const operation = await client.beginCreateOrUpdate(resourceGroup, name, parameters);
const result = await operation.pollUntilDone();
```

## 🔄 **Cleanup & Resource Management**

### **Automatic Cleanup**
```javascript
// Delete entire resource group
await this.computeClient.resourceGroups.beginDelete(resourceGroupName);
await deleteOperation.pollUntilDone();
```

### **Resource Tagging**
```javascript
// Tag resources for cost tracking
tags: {
  Environment: 'Training',
  ContractId: contractId,
  CCRPId: ccrpId,
  CreatedBy: 'ContractManagement',
  CreatedAt: new Date().toISOString()
}
```

## 🎯 **Multi-Tenant Architecture**

### **CCRP Isolation**
- Each CCRP has their own Azure subscription
- Encrypted credential storage per CCRP
- Contract-specific configuration overrides
- Independent cost tracking per CCRP

### **Contract-Specific Configuration**
- Contract can override CCRP defaults
- Per-contract budget limits
- Contract-specific Azure regions
- Contract-specific VM sizes

### **Security Benefits**
- Credential isolation between CCRPs
- Encrypted storage of sensitive data
- Audit trail for all credential changes
- Validation of credentials before use

## 🎯 **Next Steps**

### **1. Production Deployment**
- [ ] Set up Azure DevOps pipeline
- [ ] Configure monitoring alerts
- [ ] Implement cost controls
- [ ] Add security compliance

### **2. Multi-Region Support**
- [ ] Add region selection
- [ ] Implement geo-replication
- [ ] Add disaster recovery

### **3. Advanced Features**
- [ ] GPU cluster deployment
- [ ] Auto-scaling groups
- [ ] Advanced networking
- [ ] Custom container images

### **4. CCRP Management**
- [ ] CCRP credential management UI
- [ ] Credential validation dashboard
- [ ] Cost tracking per CCRP
- [ ] Multi-subscription support

## 📚 **Additional Resources**

- [Azure SDK for JavaScript](https://docs.microsoft.com/en-us/javascript/api/overview/azure/)
- [Azure Resource Manager](https://docs.microsoft.com/en-us/azure/azure-resource-manager/)
- [Azure Container Instances](https://docs.microsoft.com/en-us/azure/container-instances/)
- [Azure Machine Learning](https://docs.microsoft.com/en-us/azure/machine-learning/)
- [Azure Key Vault](https://docs.microsoft.com/en-us/azure/key-vault/)

---

**This implementation provides real Azure infrastructure provisioning with CCRP-specific credentials, full security, monitoring, and cost management capabilities for multi-tenant deployments.** 