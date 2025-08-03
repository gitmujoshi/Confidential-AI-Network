# Multi-Cloud Secret Management Architecture

## Overview

The Contract Management System now implements a comprehensive multi-cloud secret management solution that securely stores and manages cloud provider credentials across multiple platforms (Azure, AWS, GCP, OCI) using centralized secret management systems.

## Architecture Design

### 1. Core Components

#### 1.1 Secret Management Service (`backend/services/secretManager.js`)
- **Purpose**: Unified interface for managing secrets across multiple cloud providers and secret management systems
- **Supported Secret Managers**:
  - HashiCorp Vault (Primary)
  - AWS Secrets Manager
  - Azure Key Vault
  - Google Cloud Secret Manager
  - OCI Vault (Placeholder)

#### 1.2 Cloud Provider Services (`backend/services/providers/`)
- **Azure Provider** (`azureProvider.js`): Azure-specific operations
- **AWS Provider** (`awsProvider.js`): AWS-specific operations  
- **GCP Provider** (`gcpProvider.js`): Google Cloud operations
- **OCI Provider** (`ociProvider.js`): Oracle Cloud operations

#### 1.3 Database Model (`backend/models/CCRPCloudCredentials.js`)
- **Table**: `ccrp_cloud_credentials`
- **Purpose**: Store metadata about cloud credentials without storing sensitive data
- **Key Fields**:
  - `cloudProvider`: AZURE, AWS, GCP, OCI
  - `secretManager`: VAULT, AWS_SECRETS, AZURE_KEYVAULT, GCP_SECRETS, OCI_VAULT
  - `secretName`: Reference to secret in secret manager
  - `validationStatus`: PENDING, VALID, INVALID, EXPIRED

### 2. Security Architecture

#### 2.1 Separation of Concerns
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │    │   Secret Manager │    │  Cloud Provider │
│                 │    │                  │    │                 │
│ • Metadata      │◄──►│ • Encrypted      │◄──►│ • API Keys      │
│ • References    │    │ • Credentials    │    │ • Access Tokens │
│ • Status        │    │ • Rotation       │    │ • Permissions   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

#### 2.2 Data Flow
1. **Credential Storage**: Sensitive data stored in secret manager, metadata in database
2. **Credential Retrieval**: Application requests secret manager for credentials
3. **Validation**: Cloud provider validates credentials and updates status
4. **Usage**: Application uses credentials for cloud operations

### 3. Database Schema

#### 3.1 CCRP Cloud Credentials Table
```sql
CREATE TABLE ccrp_cloud_credentials (
  id SERIAL PRIMARY KEY,
  "ccrpUserId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "cloudProvider" VARCHAR(10) NOT NULL,
  "subscriptionId" VARCHAR(255),
  "tenantId" VARCHAR(255),
  "projectId" VARCHAR(255),
  "compartmentId" VARCHAR(255),
  "secretName" VARCHAR(255) NOT NULL,
  "secretManager" VARCHAR(20) NOT NULL DEFAULT 'VAULT',
  "authMethod" VARCHAR(20) NOT NULL DEFAULT 'SERVICE_PRINCIPAL',
  "defaultLocation" VARCHAR(50) NOT NULL DEFAULT 'eastus',
  "defaultResourceGroupPrefix" VARCHAR(255) NOT NULL DEFAULT 'training',
  "defaultVMSize" VARCHAR(255) NOT NULL DEFAULT 'Standard_D2s_v3',
  "defaultStorageSku" VARCHAR(255) NOT NULL DEFAULT 'Standard_LRS',
  "defaultDatabaseSku" VARCHAR(255) NOT NULL DEFAULT 'Basic',
  "vnetAddressSpace" VARCHAR(255) NOT NULL DEFAULT '10.0.0.0/16',
  "privateSubnetPrefix" VARCHAR(255) NOT NULL DEFAULT '10.0.1.0/24',
  "publicSubnetPrefix" VARCHAR(255) NOT NULL DEFAULT '10.0.2.0/24',
  "enableEncryption" BOOLEAN NOT NULL DEFAULT true,
  "enableMonitoring" BOOLEAN NOT NULL DEFAULT true,
  "enableKeyVault" BOOLEAN NOT NULL DEFAULT true,
  "budgetLimit" DECIMAL(10,2),
  "alertThreshold" DECIMAL(3,2) DEFAULT 0.8,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastValidated" TIMESTAMP WITH TIME ZONE,
  "validationStatus" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "createdBy" INTEGER REFERENCES users(id),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### 4. Secret Manager Integration

#### 4.1 HashiCorp Vault Configuration
```javascript
// Development Configuration
const vault = require('node-vault');
const vaultClient = vault({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR || 'http://localhost:8200',
  token: process.env.VAULT_TOKEN || 'dev-token-12345'
});

// Secret Storage Path
// Format: secret/data/{secretName}
// Example: secret/data/ccrp-16-azure-sample
```

#### 4.2 Secret Storage Format
```json
{
  "clientId": "azure-client-id",
  "clientSecret": "azure-client-secret", 
  "subscriptionId": "azure-subscription-id",
  "tenantId": "azure-tenant-id",
  "cloudProvider": "AZURE",
  "storedAt": "2025-01-02T10:30:00.000Z"
}
```

### 5. Cloud Provider Integration

#### 5.1 Azure Integration
```javascript
// Azure Provider Methods
- validateCredentials(credentials)
- createTrainingEnvironment(config)
- getRegions()
- getVMSizes()
- getStorageSkus()
- getDatabaseSkus()
- estimateCosts(requirements)
```

#### 5.2 AWS Integration
```javascript
// AWS Provider Methods
- validateCredentials(credentials)
- createTrainingEnvironment(config)
- getRegions()
- getInstanceTypes()
- getStorageTypes()
- getDatabaseTypes()
- estimateCosts(requirements)
```

#### 5.3 GCP Integration
```javascript
// GCP Provider Methods
- validateCredentials(credentials)
- createTrainingEnvironment(config)
- getRegions()
- getInstanceTypes()
- estimateCosts(requirements)
```

### 6. Frontend Integration

#### 6.1 Multi-Cloud Credentials Page (`frontend/src/pages/CCRPCloudCredentials.js`)
- **Purpose**: Manage cloud credentials for CCRP users
- **Features**:
  - Add/Edit/Delete cloud credentials
  - Validate credentials
  - View credential status
  - Support for multiple cloud providers
  - Secret manager selection

#### 6.2 Navigation Updates
- **Route**: `/ccrp/cloud-credentials`
- **Access**: CCRP and AppAdmin roles only
- **Redirect**: Old Azure credentials page redirects to new multi-cloud page

### 7. API Integration

#### 7.1 Backend API Routes
```javascript
// Cloud Credentials Management
GET    /api/ccrp/cloud-credentials
POST   /api/ccrp/cloud-credentials
PUT    /api/ccrp/cloud-credentials/:id
DELETE /api/ccrp/cloud-credentials/:id
POST   /api/ccrp/cloud-credentials/:id/validate

// Secret Manager Operations
GET    /api/secret-manager/available
POST   /api/secret-manager/store
GET    /api/secret-manager/retrieve
DELETE /api/secret-manager/delete

// Cloud Provider Operations
GET    /api/cloud-providers/:provider/regions
GET    /api/cloud-providers/:provider/instance-types
POST   /api/cloud-providers/:provider/validate
POST   /api/cloud-providers/:provider/estimate-costs
```

### 8. Security Features

#### 8.1 Credential Security
- **No Sensitive Data in Database**: Only metadata stored
- **Encrypted Storage**: All secrets encrypted at rest
- **Access Control**: Role-based access to credentials
- **Audit Logging**: All credential operations logged

#### 8.2 Secret Rotation
- **Automatic Rotation**: Secrets can be rotated automatically
- **Version Control**: Multiple versions of secrets supported
- **Rollback Capability**: Previous versions can be restored

#### 8.3 Compliance Features
- **DPDP Compliance**: Data protection and privacy compliance
- **Audit Trails**: Complete audit trail for all operations
- **Access Logs**: Detailed access logs for compliance reporting

### 9. Development Setup

#### 9.1 Vault Development Setup
```bash
# Start Vault Development Server
./setup-vault-dev.sh

# Environment Variables
export VAULT_ADDR='http://localhost:8200'
export VAULT_TOKEN='dev-token-12345'
```

#### 9.2 Database Migration
```bash
# Create Cloud Credentials Table
node scripts/migration/simple-migration.js

# Add Sample Credentials
psql -d contract_management -c "
INSERT INTO ccrp_cloud_credentials (
  \"ccrpUserId\", \"cloudProvider\", \"secretName\", \"secretManager\"
) VALUES (16, 'AZURE', 'ccrp-16-azure-sample', 'VAULT');
"
```

#### 9.3 Testing Integration
```bash
# Run Integration Tests
node test-multi-cloud-integration.js
```

### 10. Production Deployment

#### 10.1 Secret Manager Setup
- **Vault**: Deploy HashiCorp Vault cluster
- **AWS Secrets Manager**: Configure IAM roles and policies
- **Azure Key Vault**: Set up managed identity
- **GCP Secret Manager**: Configure service account

#### 10.2 Environment Configuration
```bash
# Production Environment Variables
VAULT_ADDR=https://vault.company.com
VAULT_TOKEN=<production-token>
AWS_SECRETS_ACCESS_KEY=<aws-access-key>
AWS_SECRETS_SECRET_KEY=<aws-secret-key>
AZURE_KEY_VAULT_NAME=<azure-key-vault-name>
GCP_SECRETS_PROJECT_ID=<gcp-project-id>
```

#### 10.3 Monitoring and Alerting
- **Credential Expiration**: Alerts for expiring credentials
- **Access Monitoring**: Monitor credential access patterns
- **Cost Alerts**: Budget limit alerts for cloud usage
- **Security Alerts**: Unusual access pattern detection

### 11. Usage Examples

#### 11.1 Adding Azure Credentials
```javascript
// Frontend: Add Azure Credentials
const credentialData = {
  cloudProvider: 'AZURE',
  secretManager: 'VAULT',
  secretName: 'my-azure-credentials',
  defaultLocation: 'eastus',
  defaultVMSize: 'Standard_D2s_v3'
};

await apiService.post('/api/ccrp/cloud-credentials', credentialData);
```

#### 11.2 Validating Credentials
```javascript
// Backend: Validate Azure Credentials
const secretManager = new SecretManager();
const credentials = await secretManager.getCredentials('my-azure-credentials', 'VAULT');
const azureProvider = new AzureProvider();
const isValid = await azureProvider.validateCredentials(credentials);
```

#### 11.3 Creating Training Environment
```javascript
// Backend: Create Training Environment
const config = {
  location: 'eastus',
  vmSize: 'Standard_D2s_v3',
  storageSku: 'Standard_LRS'
};

const environment = await azureProvider.createTrainingEnvironment(config);
```

### 12. Troubleshooting

#### 12.1 Common Issues
- **Vault Connection**: Check VAULT_ADDR and VAULT_TOKEN
- **Credential Validation**: Verify cloud provider credentials
- **Database Migration**: Ensure table creation completed
- **Frontend Routing**: Check route configuration

#### 12.2 Debug Commands
```bash
# Check Vault Status
./vault status

# List Secrets
./vault kv list secret/

# Test Database Connection
psql -d contract_management -c "SELECT COUNT(*) FROM ccrp_cloud_credentials;"

# Run Integration Test
node test-multi-cloud-integration.js
```

### 13. Future Enhancements

#### 13.1 Planned Features
- **Cost Optimization**: Automatic cost optimization recommendations
- **Multi-Region Support**: Deploy across multiple regions
- **Disaster Recovery**: Automated backup and recovery
- **Advanced Monitoring**: Real-time performance monitoring

#### 13.2 Integration Roadmap
- **Kubernetes Integration**: Native Kubernetes secret management
- **CI/CD Integration**: Automated credential rotation in pipelines
- **Compliance Reporting**: Automated compliance report generation
- **Cost Analytics**: Advanced cost analysis and forecasting

## Conclusion

The multi-cloud secret management architecture provides a secure, scalable, and compliant solution for managing cloud provider credentials across multiple platforms. The implementation follows security best practices and provides a unified interface for credential management while maintaining separation of concerns between sensitive data and application metadata. 