# Key Management Design Document
## Contract Management System - Digital Signing Key Management

### 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Key Lifecycle Management](#key-lifecycle-management)
4. [Supported Algorithms](#supported-algorithms)
5. [Configuration Management](#configuration-management)
6. [Security Model](#security-model)
7. [API Design](#api-design)
8. [Database Schema](#database-schema)
9. [Integration Points](#integration-points)
10. [Deployment Considerations](#deployment-considerations)
11. [Monitoring & Auditing](#monitoring--auditing)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The Key Management system provides secure generation, storage, and management of digital signing keys for the Contract Management System. It integrates with HashiCorp Vault for secure key storage, Keycloak for authentication and authorization, and supports multiple cryptographic algorithms for different security requirements.

### Scope note (Portal signing keys vs CAN principal keys)

This document covers **portal/user signing keys** (e.g., for contract signing and SCITT CCF signatures) managed via **Keycloak-authenticated** backend APIs and stored in Vault.

It does **not** describe **CAN principal-owned DEK/MEK custody**. For CAN, the system is explicitly designed so the platform **must not generate, hold, or receive** principal-owned encryption keys or plaintext assets; see:
- `ARCHITECTURE.md` (CAN section)
- `CAN_GAP_DECISION_MEMO.md`
- `CAN_QUICKSTART.md`

### Key Features
- **Multi-Algorithm Support**: ECDSA-P256, RSA-2048, RSA-4096
- **Vault Integration**: Secure key storage using HashiCorp Vault
- **User Registration Integration**: Automatic key generation during user registration
- **Existing Key Support**: Import and use user's existing keys
- **Environment-Based Configuration**: Configurable through environment variables
- **Role-Based Access**: Integrated with Keycloak authentication
- **Audit Logging**: Comprehensive logging of all key operations
- **SCITT CCF Integration**: Keys used for immutable signature storage

### Security Requirements
- **Vault Storage**: All private keys stored securely in HashiCorp Vault
- **Access Control**: Only authenticated users can access their keys through backend APIs
- **Frontend Isolation**: Frontend never directly accesses Vault or private keys
- **Audit Trail**: All key operations logged for compliance
- **Key Rotation**: Support for regular key rotation
- **Secure Generation**: Cryptographically secure key generation

---

## 🏗️ Architecture

### System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   HashiCorp     │
│   Key UI        │◄──►│   Key Service   │◄──►│   Vault         │
│                │    │                │    │                │
│ - Key Gen      │    │ - Key Gen      │    │ - Private Keys  │
│ - Key Import   │    │ - Key Import   │    │ - Key Metadata  │
│ - Key Export   │    │ - Key Export   │    │ - Encryption    │
│ - Key List     │    │ - Key List     │    │ - Access Control│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                    ┌─────────────────┐
                    │   Database      │
                    │   (Metadata)    │
                    │                │
                    │ - Key IDs      │
                    │ - Key Status   │
                    │ - Key History  │
                    │ - User Mapping │
                    └─────────────────┘
                                │
                                ▼
                    ┌─────────────────┐
                    │   Keycloak      │
                    │   (Auth)        │
                    │                │
                    │ - User Auth    │
                    │ - Role Check   │
                    │ - Permission   │
                    │   Validation   │
                    └─────────────────┘
                                │
                                ▼
                    ┌─────────────────┐
                    │   SCITT CCF     │
                    │   (Ledger)      │
                    │                │
                    │ - Signature    │
                    │   Storage      │
                    │ - Receipts     │
                    │ - Verification │
                    └─────────────────┘
```

### Key Management Service Architecture
```javascript
class KeyManagementService {
  constructor() {
    this.loadConfiguration();
  }

  // Configuration Management
  loadConfiguration() { /* Load from environment variables */ }
  reloadConfiguration() { /* Hot-reload configuration */ }
  getConfiguration() { /* Get current configuration */ }

  // Key Generation
  generateKeyPair(options) { /* Generate new key pair */ }
  generateKeyPairAsync(algorithm) { /* Async key generation */ }

  // Key Management
  generateKeyId() { /* Generate unique key ID */ }
  validateKeyData(keyData) { /* Validate key format */ }

  // Encryption/Decryption
  encryptPrivateKey(privateKey, password) { /* Encrypt private key */ }
  decryptPrivateKey(encryptedData, password) { /* Decrypt private key */ }

  // Signing Operations
  generateSignature(data, privateKey, algorithm) { /* Generate signature */ }
  verifySignature(data, signature, publicKey, algorithm) { /* Verify signature */ }

  // Algorithm Support
  getSupportedAlgorithms() { /* Get supported algorithms */ }
  getAlgorithmInfo(algorithm) { /* Get algorithm information */ }
  getAlgorithmDescription(algorithm) { /* Get human-readable description */ }
}
```

---

## 🔐 Vault Integration

### HashiCorp Vault Setup
The system uses HashiCorp Vault for secure key storage instead of database encryption:

```bash
# Vault Configuration (config.env)
VAULT_ADDR=http://localhost:8200
VAULT_KEYS_PATH=secret/contract-management/keys

# Vault Authentication (secrets.env)
VAULT_TOKEN=hvs.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Vault Authentication Methods

#### 1. Token Authentication (Current Implementation)
The backend uses a Vault token for authentication:

```javascript
// Vault Client Configuration
const vault = require('node-vault')({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN  // From secrets.env
});
```

#### 2. Cloud KMS Integration
Vault can integrate with cloud KMS services for enhanced security:

##### Azure Key Vault Integration
```javascript
// Azure Key Vault through Vault
const vault = require('node-vault')({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN
});

// Enable Azure Key Vault secrets engine
await vault.enableSecretEngine({
  type: 'azure',
  path: 'azure',
  config: {
    subscription_id: process.env.AZURE_SUBSCRIPTION_ID,
    tenant_id: process.env.AZURE_TENANT_ID,
    client_id: process.env.AZURE_CLIENT_ID,
    client_secret: process.env.AZURE_CLIENT_SECRET
  }
});
```

##### AWS KMS Integration
```javascript
// AWS KMS through Vault
const vault = require('node-vault')({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN
});

// Enable AWS KMS secrets engine
await vault.enableSecretEngine({
  type: 'aws',
  path: 'aws',
  config: {
    access_key: process.env.AWS_ACCESS_KEY_ID,
    secret_key: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  }
});
```

##### Google Cloud KMS Integration
```javascript
// Google Cloud KMS through Vault
const vault = require('node-vault')({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN
});

// Enable GCP KMS secrets engine
await vault.enableSecretEngine({
  type: 'gcpkms',
  path: 'gcpkms',
  config: {
    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    project: process.env.GOOGLE_CLOUD_PROJECT
  }
});
```

##### Oracle Cloud Infrastructure (OCI) KMS Integration
```javascript
// OCI KMS through Vault
const vault = require('node-vault')({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN
});

// Enable OCI KMS secrets engine
await vault.enableSecretEngine({
  type: 'oci',
  path: 'oci',
  config: {
    user_ocid: process.env.OCI_USER_OCID,
    tenancy_ocid: process.env.OCI_TENANCY_OCID,
    fingerprint: process.env.OCI_FINGERPRINT,
    private_key_path: process.env.OCI_PRIVATE_KEY_PATH,
    region: process.env.OCI_REGION
  }
});
```

#### 2. Alternative Authentication Methods

##### AppRole Authentication (Recommended for Production)
```javascript
// AppRole Authentication
const vault = require('node-vault')({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR
});

// Authenticate using AppRole
const result = await vault.approleLogin({
  role_id: process.env.VAULT_ROLE_ID,
  secret_id: process.env.VAULT_SECRET_ID
});

vault.token = result.auth.client_token;
```

##### AWS IAM Authentication
```javascript
// AWS IAM Authentication
const vault = require('node-vault')({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR
});

// Authenticate using AWS IAM
const result = await vault.awsIamLogin({
  role: process.env.VAULT_AWS_ROLE,
  iam_request_url: process.env.VAULT_AWS_REQUEST_URL,
  iam_request_body: process.env.VAULT_AWS_REQUEST_BODY,
  iam_request_headers: process.env.VAULT_AWS_REQUEST_HEADERS
});

vault.token = result.auth.client_token;
```

##### Kubernetes Authentication
```javascript
// Kubernetes Authentication
const vault = require('node-vault')({
  apiVersion: 'v1',
  endpoint: process.env.VAULT_ADDR
});

// Authenticate using Kubernetes service account
const result = await vault.kubernetesLogin({
  role: process.env.VAULT_K8S_ROLE,
  jwt: process.env.VAULT_K8S_JWT  // From service account token
});

vault.token = result.auth.client_token;
```

### Vault Token Management

#### Token Renewal
```javascript
class VaultKeyService {
  constructor() {
    this.vault = require('node-vault')({
      apiVersion: 'v1',
      endpoint: process.env.VAULT_ADDR,
      token: process.env.VAULT_TOKEN
    });
    this.setupTokenRenewal();
  }

  setupTokenRenewal() {
    // Renew token every 30 minutes
    setInterval(async () => {
      try {
        await this.vault.tokenRenewSelf();
        console.log('✅ Vault token renewed successfully');
      } catch (error) {
        console.error('❌ Failed to renew Vault token:', error);
        // Implement fallback authentication or alert
      }
    }, 30 * 60 * 1000); // 30 minutes
  }
}
```

#### Token Validation
```javascript
async validateVaultConnection() {
  try {
    const result = await this.vault.tokenLookupSelf();
    console.log('✅ Vault connection validated');
    return {
      valid: true,
      token: result.data.id,
      ttl: result.data.ttl,
      renewable: result.data.renewable
    };
  } catch (error) {
    console.error('❌ Vault connection failed:', error);
    return { valid: false, error: error.message };
  }
}
```

### Vault Key Storage Structure
```
secret/contract-management/keys/
├── users/
│   ├── {userId}/
│   │   ├── {keyId}/
│   │   │   ├── private_key    # Encrypted private key
│   │   │   ├── public_key     # Public key (for verification)
│   │   │   ├── metadata       # Key metadata (algorithm, created_at, etc.)
│   │   │   └── status         # Key status (active, revoked, expired)
│   │   └── ...
│   └── ...
└── system/
    ├── encryption_keys/       # System encryption keys
    └── audit_logs/           # Key operation audit logs
```

### Vault Policies and Permissions

#### Contract Management Policy
```hcl
# Vault policy for contract management system
path "secret/contract-management/keys/users/*" {
  capabilities = ["read", "write", "update", "delete"]
}

path "secret/contract-management/keys/system/*" {
  capabilities = ["read", "write", "update", "delete"]
}

# Allow token renewal
path "auth/token/renew-self" {
  capabilities = ["update"]
}

# Allow token lookup
path "auth/token/lookup-self" {
  capabilities = ["read"]
}
```

#### User-Specific Policy (Advanced)
```hcl
# Policy for specific user access
path "secret/contract-management/keys/users/{{identity.entity.id}}/*" {
  capabilities = ["read", "write", "update", "delete"]
}

# Deny access to other users' keys
path "secret/contract-management/keys/users/*" {
  capabilities = ["deny"]
}
```

#### Environment-Specific Configuration
```bash
# Development Environment
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=hvs.dev.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Production Environment
VAULT_ADDR=https://vault.company.com
VAULT_ROLE_ID=contract-management-role
VAULT_SECRET_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VAULT_KEYS_PATH=secret/prod/contract-management/keys
```

### Cloud KMS Integration Options

#### 1. Azure Key Vault Integration
```bash
# Azure Key Vault Configuration
AZURE_SUBSCRIPTION_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AZURE_KEY_VAULT_URL=https://your-keyvault.vault.azure.net/
AZURE_KEY_VAULT_KEY_NAME=contract-signing-key
```

**Vault Setup for Azure:**
```bash
# Enable Azure Key Vault secrets engine
vault secrets enable -path=azure azure

# Configure Azure Key Vault
vault write azure/config \
    subscription_id=$AZURE_SUBSCRIPTION_ID \
    tenant_id=$AZURE_TENANT_ID \
    client_id=$AZURE_CLIENT_ID \
    client_secret=$AZURE_CLIENT_SECRET

# Create Azure Key Vault role
vault write azure/roles/contract-management \
    key_name=$AZURE_KEY_VAULT_KEY_NAME \
    key_ops="encrypt,decrypt,sign,verify"
```

#### 2. AWS KMS Integration
```bash
# AWS KMS Configuration
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_KMS_KEY_ID=arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012
```

**Vault Setup for AWS:**
```bash
# Enable AWS KMS secrets engine
vault secrets enable -path=aws aws

# Configure AWS KMS
vault write aws/config/root \
    access_key=$AWS_ACCESS_KEY_ID \
    secret_key=$AWS_SECRET_ACCESS_KEY \
    region=$AWS_REGION

# Create AWS KMS role
vault write aws/roles/contract-management \
    credential_type=iam_user \
    policy_document='{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:Sign",
                    "kms:Verify"
                ],
                "Resource": "'$AWS_KMS_KEY_ID'"
            }
        ]
    }'
```

#### 3. Google Cloud KMS Integration
```bash
# Google Cloud KMS Configuration
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_REGION=us-central1
GOOGLE_CLOUD_KEY_RING=contract-management-keys
GOOGLE_CLOUD_CRYPTO_KEY=signing-key
```

**Vault Setup for GCP:**
```bash
# Enable Google Cloud KMS secrets engine
vault secrets enable -path=gcpkms gcpkms

# Configure Google Cloud KMS
vault write gcpkms/config \
    credentials=@/path/to/service-account-key.json \
    project=$GOOGLE_CLOUD_PROJECT

# Create GCP KMS role
vault write gcpkms/roles/contract-management \
    project=$GOOGLE_CLOUD_PROJECT \
    key_ring=$GOOGLE_CLOUD_KEY_RING \
    crypto_key=$GOOGLE_CLOUD_CRYPTO_KEY \
    key_algorithm=EC_SIGN_P256_SHA256
```

#### 4. Oracle Cloud Infrastructure (OCI) KMS Integration
```bash
# OCI KMS Configuration
OCI_USER_OCID=ocid1.user.oc1..xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OCI_TENANCY_OCID=ocid1.tenancy.oc1..xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OCI_FINGERPRINT=xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx
OCI_PRIVATE_KEY_PATH=/path/to/oci-private-key.pem
OCI_REGION=us-ashburn-1
OCI_VAULT_OCID=ocid1.vault.oc1.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OCI_KEY_OCID=ocid1.key.oc1.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Vault Setup for OCI:**
```bash
# Enable OCI KMS secrets engine
vault secrets enable -path=oci oci

# Configure OCI KMS
vault write oci/config \
    user_ocid=$OCI_USER_OCID \
    tenancy_ocid=$OCI_TENANCY_OCID \
    fingerprint=$OCI_FINGERPRINT \
    private_key_path=$OCI_PRIVATE_KEY_PATH \
    region=$OCI_REGION

# Create OCI KMS role
vault write oci/roles/contract-management \
    vault_ocid=$OCI_VAULT_OCID \
    key_ocid=$OCI_KEY_OCID
```

### Cloud KMS Service Implementation

#### Unified Cloud KMS Service
```javascript
class CloudKMSService {
  constructor(provider, config) {
    this.provider = provider;
    this.config = config;
    this.vault = require('node-vault')({
      apiVersion: 'v1',
      endpoint: process.env.VAULT_ADDR,
      token: process.env.VAULT_TOKEN
    });
  }

  async initialize() {
    switch (this.provider) {
      case 'azure':
        await this.initializeAzure();
        break;
      case 'aws':
        await this.initializeAWS();
        break;
      case 'gcp':
        await this.initializeGCP();
        break;
      case 'oci':
        await this.initializeOCI();
        break;
      default:
        throw new Error(`Unsupported cloud provider: ${this.provider}`);
    }
  }

  async initializeAzure() {
    await this.vault.enableSecretEngine({
      type: 'azure',
      path: 'azure',
      config: {
        subscription_id: this.config.subscriptionId,
        tenant_id: this.config.tenantId,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      }
    });
  }

  async initializeAWS() {
    await this.vault.enableSecretEngine({
      type: 'aws',
      path: 'aws',
      config: {
        access_key: this.config.accessKeyId,
        secret_key: this.config.secretAccessKey,
        region: this.config.region
      }
    });
  }

  async initializeGCP() {
    await this.vault.enableSecretEngine({
      type: 'gcpkms',
      path: 'gcpkms',
      config: {
        credentials: this.config.credentials,
        project: this.config.project
      }
    });
  }

  async initializeOCI() {
    await this.vault.enableSecretEngine({
      type: 'oci',
      path: 'oci',
      config: {
        user_ocid: this.config.userOcid,
        tenancy_ocid: this.config.tenancyOcid,
        fingerprint: this.config.fingerprint,
        private_key_path: this.config.privateKeyPath,
        region: this.config.region
      }
    });
  }

  async encryptKey(keyData, keyId) {
    const path = `${this.provider}/encrypt/contract-management`;
    return await this.vault.write(path, {
      key_id: keyId,
      plaintext: Buffer.from(JSON.stringify(keyData)).toString('base64')
    });
  }

  async decryptKey(encryptedData, keyId) {
    const path = `${this.provider}/decrypt/contract-management`;
    const result = await this.vault.write(path, {
      key_id: keyId,
      ciphertext: encryptedData
    });
    return JSON.parse(Buffer.from(result.data.plaintext, 'base64').toString());
  }
}
```

#### Environment Configuration for Cloud KMS
```bash
# Cloud KMS Provider Selection
CLOUD_KMS_PROVIDER=azure  # Options: azure, aws, gcp, oci, vault

# Azure Key Vault
AZURE_SUBSCRIPTION_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# AWS KMS
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1

# Google Cloud KMS
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
GOOGLE_CLOUD_PROJECT=your-project-id

# Oracle Cloud KMS
OCI_USER_OCID=ocid1.user.oc1..xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OCI_TENANCY_OCID=ocid1.tenancy.oc1..xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OCI_FINGERPRINT=xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx
OCI_PRIVATE_KEY_PATH=/path/to/oci-private-key.pem
OCI_REGION=us-ashburn-1
```

### Cloud KMS Deployment Considerations

#### 1. Azure Key Vault Deployment
**Advantages:**
- Native Azure integration
- Hardware Security Module (HSM) support
- Compliance certifications (SOC 2, ISO 27001)
- Managed service with high availability

**Configuration:**
```bash
# Azure Key Vault Environment Variables
AZURE_SUBSCRIPTION_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AZURE_KEY_VAULT_URL=https://your-keyvault.vault.azure.net/
AZURE_KEY_VAULT_KEY_NAME=contract-signing-key
```

**Vault Integration:**
```bash
# Enable Azure Key Vault secrets engine
vault secrets enable -path=azure azure

# Configure Azure Key Vault
vault write azure/config \
    subscription_id=$AZURE_SUBSCRIPTION_ID \
    tenant_id=$AZURE_TENANT_ID \
    client_id=$AZURE_CLIENT_ID \
    client_secret=$AZURE_CLIENT_SECRET
```

#### 2. AWS KMS Deployment
**Advantages:**
- Native AWS integration
- CloudHSM support for FIPS 140-2 Level 3
- Integration with AWS IAM
- Pay-per-use pricing model

**Configuration:**
```bash
# AWS KMS Environment Variables
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_KMS_KEY_ID=arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012
```

**Vault Integration:**
```bash
# Enable AWS KMS secrets engine
vault secrets enable -path=aws aws

# Configure AWS KMS
vault write aws/config/root \
    access_key=$AWS_ACCESS_KEY_ID \
    secret_key=$AWS_SECRET_ACCESS_KEY \
    region=$AWS_REGION
```

#### 3. Google Cloud KMS Deployment
**Advantages:**
- Native GCP integration
- Cloud HSM support
- Integration with Google Cloud IAM
- Global key management

**Configuration:**
```bash
# Google Cloud KMS Environment Variables
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_REGION=us-central1
GOOGLE_CLOUD_KEY_RING=contract-management-keys
GOOGLE_CLOUD_CRYPTO_KEY=signing-key
```

**Vault Integration:**
```bash
# Enable Google Cloud KMS secrets engine
vault secrets enable -path=gcpkms gcpkms

# Configure Google Cloud KMS
vault write gcpkms/config \
    credentials=@/path/to/service-account-key.json \
    project=$GOOGLE_CLOUD_PROJECT
```

#### 4. Oracle Cloud KMS Deployment
**Advantages:**
- Native OCI integration
- Hardware Security Module (HSM) support
- Compliance with various standards
- Integration with OCI IAM

**Configuration:**
```bash
# Oracle Cloud KMS Environment Variables
OCI_USER_OCID=ocid1.user.oc1..xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OCI_TENANCY_OCID=ocid1.tenancy.oc1..xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OCI_FINGERPRINT=xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx
OCI_PRIVATE_KEY_PATH=/path/to/oci-private-key.pem
OCI_REGION=us-ashburn-1
OCI_VAULT_OCID=ocid1.vault.oc1.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OCI_KEY_OCID=ocid1.key.oc1.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Vault Integration:**
```bash
# Enable Oracle Cloud KMS secrets engine
vault secrets enable -path=oci oci

# Configure Oracle Cloud KMS
vault write oci/config \
    user_ocid=$OCI_USER_OCID \
    tenancy_ocid=$OCI_TENANCY_OCID \
    fingerprint=$OCI_FINGERPRINT \
    private_key_path=$OCI_PRIVATE_KEY_PATH \
    region=$OCI_REGION
```

### Multi-Cloud KMS Support

#### Provider Selection Logic
```javascript
class KeyManagementService {
  constructor() {
    this.provider = process.env.CLOUD_KMS_PROVIDER || 'vault';
    this.cloudKMS = null;
    
    if (this.provider !== 'vault') {
      this.cloudKMS = new CloudKMSService(this.provider, this.getCloudConfig());
    }
  }

  getCloudConfig() {
    switch (this.provider) {
      case 'azure':
        return {
          subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
          tenantId: process.env.AZURE_TENANT_ID,
          clientId: process.env.AZURE_CLIENT_ID,
          clientSecret: process.env.AZURE_CLIENT_SECRET
        };
      case 'aws':
        return {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION
        };
      case 'gcp':
        return {
          credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
          project: process.env.GOOGLE_CLOUD_PROJECT
        };
      case 'oci':
        return {
          userOcid: process.env.OCI_USER_OCID,
          tenancyOcid: process.env.OCI_TENANCY_OCID,
          fingerprint: process.env.OCI_FINGERPRINT,
          privateKeyPath: process.env.OCI_PRIVATE_KEY_PATH,
          region: process.env.OCI_REGION
        };
      default:
        return {};
    }
  }

  async storeKey(userId, keyId, keyData) {
    if (this.cloudKMS) {
      // Use cloud KMS for encryption
      const encryptedData = await this.cloudKMS.encryptKey(keyData, keyId);
      return await this.vaultKeyService.storeKey(userId, keyId, {
        ...keyData,
        encryptedData: encryptedData
      });
    } else {
      // Use Vault's built-in encryption
      return await this.vaultKeyService.storeKey(userId, keyId, keyData);
    }
  }
}
```

### Security and Compliance Benefits

#### Cloud KMS Advantages
1. **Hardware Security Modules (HSM)**: All major cloud providers offer HSM-backed key management
2. **Compliance Certifications**: SOC 2, ISO 27001, FedRAMP, and other compliance standards
3. **Audit Logging**: Comprehensive audit trails for compliance requirements
4. **Key Rotation**: Automated key rotation capabilities
5. **Access Control**: Fine-grained access control through cloud IAM
6. **High Availability**: Managed services with 99.9%+ uptime
7. **Geographic Distribution**: Multi-region key storage for disaster recovery

#### Cost Considerations
- **Azure Key Vault**: Pay-per-operation model
- **AWS KMS**: Pay-per-request model with free tier
- **Google Cloud KMS**: Pay-per-operation model
- **Oracle Cloud KMS**: Pay-per-operation model

#### Migration Strategy
1. **Phase 1**: Implement Vault with local storage
2. **Phase 2**: Add cloud KMS integration as secrets engine
3. **Phase 3**: Migrate existing keys to cloud KMS
4. **Phase 4**: Implement cloud-specific features (HSM, compliance)

### Vault Setup and Initialization

#### 1. Local Vault Setup (Development)
```bash
# Start Vault in development mode
vault server -dev -dev-root-token-id="root"

# Set environment variables
export VAULT_ADDR="http://127.0.0.1:8200"
export VAULT_TOKEN="root"

# Enable KV secrets engine
vault secrets enable -path=secret kv-v2

# Create policy
vault policy write contract-management-policy contract-management-policy.hcl

# Create token with policy
vault token create -policy=contract-management-policy
```

#### 2. Production Vault Setup
```bash
# Initialize Vault (first time only)
vault operator init

# Unseal Vault (requires 3 of 5 unseal keys)
vault operator unseal <unseal-key-1>
vault operator unseal <unseal-key-2>
vault operator unseal <unseal-key-3>

# Login with root token
vault auth -method=token token=<root-token>

# Enable KV secrets engine
vault secrets enable -path=secret kv-v2

# Create AppRole
vault auth enable approle
vault write auth/approle/role/contract-management \
    token_policies="contract-management-policy" \
    token_ttl=1h \
    token_max_ttl=4h

# Get Role ID and Secret ID
vault read auth/approle/role/contract-management/role-id
vault write -f auth/approle/role/contract-management/secret-id
```

#### 3. Backend Vault Integration
```javascript
// Vault service initialization
class VaultKeyService {
  constructor() {
    this.vault = require('node-vault')({
      apiVersion: 'v1',
      endpoint: process.env.VAULT_ADDR,
      token: process.env.VAULT_TOKEN
    });
    
    this.keysPath = process.env.VAULT_KEYS_PATH || 'secret/contract-management/keys';
    this.initializeVault();
  }

  async initializeVault() {
    try {
      // Validate Vault connection
      const health = await this.vault.health();
      console.log('✅ Vault connection established');

      // Check if secrets engine is enabled
      const mounts = await this.vault.mounts();
      if (!mounts['secret/']) {
        throw new Error('KV secrets engine not enabled at secret/');
      }

      // Test write/read access
      await this.vault.write(`${this.keysPath}/test`, { test: 'value' });
      await this.vault.read(`${this.keysPath}/test`);
      await this.vault.delete(`${this.keysPath}/test`);
      
      console.log('✅ Vault initialization completed');
    } catch (error) {
      console.error('❌ Vault initialization failed:', error);
      throw error;
    }
  }
}
```

### Vault Service Integration
```javascript
class VaultKeyService {
  constructor() {
    this.vault = new VaultClient({
      endpoint: process.env.VAULT_ADDR,
      token: process.env.VAULT_TOKEN
    });
    this.keysPath = process.env.VAULT_KEYS_PATH || 'secret/contract-management/keys';
  }

  async storeKey(userId, keyId, keyData) {
    const path = `${this.keysPath}/users/${userId}/${keyId}`;
    return await this.vault.write(path, {
      private_key: keyData.privateKey,
      public_key: keyData.publicKey,
      metadata: JSON.stringify(keyData.metadata),
      status: keyData.status || 'active'
    });
  }

  async retrieveKey(userId, keyId) {
    const path = `${this.keysPath}/users/${userId}/${keyId}`;
    const result = await this.vault.read(path);
    return {
      privateKey: result.data.private_key,
      publicKey: result.data.public_key,
      metadata: JSON.parse(result.data.metadata),
      status: result.data.status
    };
  }

  async listUserKeys(userId) {
    const path = `${this.keysPath}/users/${userId}`;
    const result = await this.vault.list(path);
    return result.data.keys || [];
  }

  async revokeKey(userId, keyId) {
    const path = `${this.keysPath}/users/${userId}/${keyId}`;
    return await this.vault.write(path, { status: 'revoked' });
  }
}
```

---

## 👤 User Registration Integration

### Enterprise Key Management Integration
In enterprise scenarios, signing keys are owned and managed by individual parties in their own enterprise or cloud KMS systems. The application provides a secure interface for key registration and signing operations without storing private keys.

#### Key Registration Flow (Enterprise)
```javascript
// User Registration with Enterprise Key Registration
const registerUserWithEnterpriseKey = async (userData, enterpriseKeyInfo) => {
  // 1. Create user in Keycloak
  const keycloakUser = await keycloakService.createUser(userData);
  
  // 2. Create user in local database
  const localUser = await User.create({
    keycloakId: keycloakUser.id,
    name: userData.name,
    email: userData.email,
    partyType: userData.partyType,
    depaId: generateDEPAId(userData.partyType)
  });

  // 3. Register enterprise key (public key only)
  const keyRegistration = await registerEnterpriseKey(localUser.id, enterpriseKeyInfo);

  // 4. Store only public key and metadata
  await UserKey.create({
    userId: localUser.id,
    keyId: keyRegistration.keyId,
    keyType: enterpriseKeyInfo.keyType,
    publicKey: enterpriseKeyInfo.publicKey,
    keyStatus: 'active',
    enterpriseKeyId: enterpriseKeyInfo.enterpriseKeyId,
    enterpriseKMS: enterpriseKeyInfo.kmsProvider,
    createdAt: new Date()
  });

  return { user: localUser, keyId: keyRegistration.keyId };
};
```

### Enterprise Key Registration
```javascript
// Enterprise Key Registration Service
class EnterpriseKeyService {
  async registerEnterpriseKey(userId, keyInfo) {
    const keyId = this.generateKeyId();
    
    // Store only public key and enterprise metadata
    const keyData = {
      keyId,
      userId,
      keyType: keyInfo.keyType,
      publicKey: keyInfo.publicKey,
      enterpriseKeyId: keyInfo.enterpriseKeyId,
      enterpriseKMS: keyInfo.kmsProvider,
      keyStatus: 'active',
      metadata: {
        enterpriseName: keyInfo.enterpriseName,
        kmsProvider: keyInfo.kmsProvider,
        keyLocation: keyInfo.keyLocation,
        keyPurpose: 'contract_signing',
        registeredAt: new Date()
      }
    };

    // Store in database (no private key)
    await UserKey.create(keyData);
    
    return keyData;
  }

  async validateEnterpriseKey(publicKey, keyType) {
    // Validate public key format and type
    return keyManagementService.validatePublicKey(publicKey, keyType);
  }
}
```

### Enterprise Signing Workflows

#### 1. User KMS Credential Configuration

Users provide their cloud KMS credentials through a dedicated configuration interface:

**KMS Configuration Component** (`EnterpriseKMSConfiguration.js`):
- **Provider Selection**: Choose from Azure Key Vault, AWS KMS, Google Cloud KMS, or OCI KMS
- **Credential Input**: Secure form fields for provider-specific credentials
- **Connection Testing**: Validate credentials before saving
- **Key ID Configuration**: Specify the signing key identifier
- **Region/Vault Settings**: Configure location-specific settings

**Credential Storage**:
- **Encrypted Storage**: All credentials encrypted using HashiCorp Vault
- **Secret Naming**: `kms-config-{userId}-{provider}` format
- **Access Control**: User-specific credential access
- **Audit Logging**: Complete credential access tracking

**Supported Cloud Providers**:

*Azure Key Vault:*
```javascript
{
  vaultUrl: 'https://your-vault.vault.azure.net/',
  clientId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  clientSecret: 'your-client-secret',
  tenantId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
}
```

*AWS KMS:*
```javascript
{
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'your-secret-access-key',
  region: 'us-east-1'
}
```

*Google Cloud KMS:*
```javascript
{
  projectId: 'your-project-id',
  location: 'us-central1',
  keyRing: 'contract-management-keys',
  cryptoKey: 'signing-key',
  serviceAccountKey: '{"type": "service_account", ...}'
}
```

*Oracle Cloud KMS:*
```javascript
{
  compartmentId: 'ocid1.compartment.oc1..xxxxxxxx',
  vaultId: 'ocid1.vault.oc1..xxxxxxxx',
  userId: 'ocid1.user.oc1..xxxxxxxx',
  fingerprint: 'xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx',
  privateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
  region: 'us-ashburn-1'
}
```

#### 2. Remote Signing (Recommended for Enterprise)
The application provides signing requests to enterprise systems without accessing private keys:

```javascript
// Enterprise Remote Signing Service
class EnterpriseSigningService {
  async initiateSigningRequest(contractId, userId, keyId) {
    // 1. Get user's enterprise key info
    const userKey = await UserKey.findOne({
      where: { userId, keyId, keyStatus: 'active' }
    });

    if (!userKey || !userKey.enterpriseKeyId) {
      throw new Error('Enterprise key not found');
    }

    // 2. Generate signing request
    const signingRequest = await this.generateSigningRequest(contractId, userKey);

    // 3. Store signing request for tracking
    await SigningRequest.create({
      contractId,
      userId,
      keyId,
      requestId: signingRequest.requestId,
      status: 'pending',
      enterpriseKeyId: userKey.enterpriseKeyId,
      enterpriseKMS: userKey.enterpriseKMS,
      createdAt: new Date()
    });

    // 4. Send signing request to enterprise system
    await this.sendSigningRequestToEnterprise(signingRequest, userKey);

    return signingRequest;
  }

  async generateSigningRequest(contractId, userKey) {
    const contract = await Contract.findByPk(contractId);
    
    // Generate hash for signing
    const contractHash = crypto.createHash('sha256')
      .update(JSON.stringify({
        contractId: contract.contractId,
        contractData: contract.contractData,
        timestamp: Date.now()
      }))
      .digest('hex');

    return {
      requestId: this.generateRequestId(),
      contractId: contract.contractId,
      contractHash,
      publicKey: userKey.publicKey,
      keyType: userKey.keyType,
      enterpriseKeyId: userKey.enterpriseKeyId,
      enterpriseKMS: userKey.enterpriseKMS,
      timestamp: Date.now()
    };
  }

  async sendSigningRequestToEnterprise(signingRequest, userKey) {
    // Send to enterprise signing service
    const enterpriseEndpoint = this.getEnterpriseEndpoint(userKey.enterpriseKMS);
    
    const response = await fetch(`${enterpriseEndpoint}/api/signing/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getEnterpriseToken(userKey.enterpriseKMS)}`
      },
      body: JSON.stringify(signingRequest)
    });

    if (!response.ok) {
      throw new Error('Failed to send signing request to enterprise');
    }

    return await response.json();
  }
}
```

#### 2. Enterprise Signing Callback
Enterprise systems sign the contract and send back the signature:

```javascript
// Enterprise Signing Callback Handler
router.post('/api/signing/enterprise/callback', async (req, res) => {
  try {
    const { requestId, signature, enterpriseKeyId, timestamp } = req.body;

    // 1. Validate callback authenticity
    if (!await validateEnterpriseCallback(req)) {
      return res.status(401).json({ error: 'Invalid callback' });
    }

    // 2. Find signing request
    const signingRequest = await SigningRequest.findOne({
      where: { requestId, status: 'pending' }
    });

    if (!signingRequest) {
      return res.status(404).json({ error: 'Signing request not found' });
    }

    // 3. Verify signature using stored public key
    const userKey = await UserKey.findOne({
      where: { keyId: signingRequest.keyId }
    });

    const isValid = await keyManagementService.verifySignature(
      signingRequest.contractHash,
      signature,
      userKey.publicKey,
      userKey.keyType
    );

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // 4. Create SCITT CCF signature claim
    const signatureClaim = {
      type: 'contract_signature',
      data: {
        contractId: signingRequest.contractId,
        signer: signingRequest.userId,
        signature: signature,
        algorithm: userKey.keyType,
        timestamp: timestamp,
        contractHash: signingRequest.contractHash,
        enterpriseKeyId: enterpriseKeyId,
        metadata: {
          system: 'Contract Management System',
          version: '1.0.0',
          enterpriseKMS: userKey.enterpriseKMS
        }
      }
    };

    // 5. Submit to SCITT CCF
    const scittCcfService = require('../services/scittCcfService');
    const scittResult = await scittCcfService.submitClaim(signatureClaim);

    // 6. Update signing request status
    await signingRequest.update({ 
      status: 'completed',
      signature: signature,
      scittClaimId: scittResult.claimId,
      completedAt: new Date()
    });

    res.json({ success: true, scittClaimId: scittResult.claimId });
  } catch (error) {
    console.error('Error processing enterprise signing callback:', error);
    res.status(500).json({ error: 'Failed to process signing callback' });
  }
});
```

#### 3. Enterprise Key Management Integration
```javascript
// Enterprise Key Management Integration
class EnterpriseKeyIntegration {
  async registerEnterpriseKey(userId, keyInfo) {
    // Validate enterprise key format
    if (!this.validateEnterpriseKey(keyInfo)) {
      throw new Error('Invalid enterprise key format');
    }

    // Store only public key and enterprise metadata
    const keyData = {
      userId,
      keyId: this.generateKeyId(),
      keyType: keyInfo.keyType,
      publicKey: keyInfo.publicKey,
      enterpriseKeyId: keyInfo.enterpriseKeyId,
      enterpriseKMS: keyInfo.kmsProvider,
      enterpriseName: keyInfo.enterpriseName,
      keyStatus: 'active',
      metadata: {
        keyLocation: keyInfo.keyLocation,
        keyPurpose: 'contract_signing',
        registeredAt: new Date()
      }
    };

    return await UserKey.create(keyData);
  }

  async validateEnterpriseKey(keyInfo) {
    // Validate public key format
    if (!keyManagementService.validatePublicKey(keyInfo.publicKey, keyInfo.keyType)) {
      return false;
    }

    // Validate enterprise key ID format
    if (!keyInfo.enterpriseKeyId || !keyInfo.kmsProvider) {
      return false;
    }

    return true;
  }

  async getEnterpriseEndpoint(kmsProvider) {
    const endpoints = {
      'azure': process.env.AZURE_KEY_VAULT_ENDPOINT,
      'aws': process.env.AWS_KMS_ENDPOINT,
      'gcp': process.env.GOOGLE_CLOUD_KMS_ENDPOINT,
      'oci': process.env.OCI_KMS_ENDPOINT
    };

    return endpoints[kmsProvider] || process.env.DEFAULT_ENTERPRISE_ENDPOINT;
  }
}
```

### Enterprise Signing API Endpoints

#### Register Enterprise Key
```http
POST /api/signing/enterprise/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "keyType": "ECDSA-P256",
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
  "enterpriseKeyId": "enterprise-key-123",
  "kmsProvider": "azure",
  "enterpriseName": "Acme Corp",
  "keyLocation": "Azure Key Vault"
}
```

#### Initiate Signing Request
```http
POST /api/signing/enterprise/sign
Authorization: Bearer <token>
Content-Type: application/json

{
  "contractId": "CONTRACT-123",
  "keyId": "KEY-456"
}
```

#### Enterprise Signing Callback
```http
POST /api/signing/enterprise/callback
Content-Type: application/json
X-Enterprise-Signature: <enterprise-signature>

{
  "requestId": "REQ-789",
  "signature": "signature-data",
  "enterpriseKeyId": "enterprise-key-123",
  "timestamp": 1640995200000
}
```

---

## 🌐 Frontend Access Pattern

### Frontend Never Directly Accesses Vault
The frontend follows a secure pattern where it never directly accesses Vault or private keys:

```javascript
// Frontend Key Management Flow
class KeyManagementAPI {
  constructor(apiService) {
    this.api = apiService;
  }

  // Frontend only calls backend APIs
  async generateKey(keyType = 'ECDSA-P256') {
    return await this.api.post('/api/signing/keys/generate', { keyType });
  }

  async listKeys() {
    return await this.api.get('/api/signing/keys');
  }

  async importKey(keyData) {
    return await this.api.post('/api/signing/keys/import', { keyData });
  }

  async exportKey(keyId) {
    return await this.api.get(`/api/signing/keys/${keyId}/export`);
  }

  async revokeKey(keyId) {
    return await this.api.delete(`/api/signing/keys/${keyId}`);
  }
}
```

### Backend API Layer
The backend acts as a secure proxy between frontend and Vault:

```javascript
// Backend API - Secure Vault Access
router.post('/keys/generate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.localUser?.id || req.user.id;
    const { keyType = 'ECDSA-P256' } = req.body;

    // 1. Generate key pair
    const keyData = await keyManagementService.generateKeyPair({
      algorithm: keyType,
      userId
    });

    // 2. Store private key in Vault (secure)
    await vaultKeyService.storeKey(userId, keyData.keyId, keyData);

    // 3. Store only metadata in database
    const userKey = await UserKey.create({
      userId,
      keyId: keyData.keyId,
      keyType: keyData.keyType,
      publicKey: keyData.publicKey, // Only public key in DB
      keyStatus: 'active',
      createdAt: keyData.createdAt
    });

    // 4. Return only safe metadata to frontend
    res.json({ 
      success: true, 
      key: {
        id: userKey.id,
        keyId: userKey.keyId,
        keyType: userKey.keyType,
        keyStatus: userKey.keyStatus,
        createdAt: userKey.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate key' });
  }
});
```

---

## 🔄 Key Lifecycle Management

### 1. Key Generation
```mermaid
sequenceDiagram
    participant U as User
    participant UI as Frontend UI
    participant API as Key API
    participant KS as Key Service
    participant DB as Database
    participant KC as Keycloak

    U->>UI: Request Key Generation
    UI->>API: POST /api/signing/keys/generate
    API->>KC: Validate Authentication
    KC->>API: Return User Info
    API->>KS: generateKeyPair(options)
    KS->>KS: Generate Key Pair
    KS->>KS: Encrypt Private Key
    KS->>DB: Store Key Data
    DB->>KS: Confirm Storage
    KS->>API: Return Key Metadata
    API->>UI: Return Success Response
    UI->>U: Display Key Information
```

### 2. Key Access
```mermaid
sequenceDiagram
    participant U as User
    participant UI as Frontend UI
    participant API as Key API
    participant KS as Key Service
    participant DB as Database

    U->>UI: Request Key Access
    UI->>API: GET /api/signing/keys
    API->>KS: getUserKeys(userId)
    KS->>DB: Query User Keys
    DB->>KS: Return Key List
    KS->>API: Return Key Metadata
    API->>UI: Return Key List
    UI->>U: Display Keys
```

### 3. Key Revocation
```mermaid
sequenceDiagram
    participant U as User
    participant UI as Frontend UI
    participant API as Key API
    participant KS as Key Service
    participant DB as Database

    U->>UI: Request Key Revocation
    UI->>API: DELETE /api/signing/keys/:keyId
    API->>KS: revokeKey(keyId)
    KS->>DB: Update Key Status
    DB->>KS: Confirm Update
    KS->>API: Return Success
    API->>UI: Return Success Response
    UI->>U: Confirm Revocation
```

---

## 🔐 Supported Algorithms

### ECDSA-P256 (Recommended)
- **Type**: Elliptic Curve Digital Signature Algorithm
- **Curve**: P-256 (prime256v1)
- **Key Size**: 256 bits
- **Security Level**: 128 bits
- **Performance**: Fast
- **Use Case**: Most applications, mobile devices

```javascript
{
  "name": "ECDSA-P256",
  "cryptoConfig": {
    "name": "ec",
    "namedCurve": "prime256v1"
  },
  "description": "Elliptic Curve Digital Signature Algorithm with P-256 curve. Recommended for most use cases."
}
```

### RSA-2048
- **Type**: Rivest-Shamir-Adleman
- **Key Size**: 2048 bits
- **Security Level**: 112 bits
- **Performance**: Moderate
- **Use Case**: Legacy systems, moderate security requirements

```javascript
{
  "name": "RSA-2048",
  "cryptoConfig": {
    "name": "rsa",
    "modulusLength": 2048
  },
  "description": "RSA algorithm with 2048-bit key length. Good balance of security and performance."
}
```

### RSA-4096
- **Type**: Rivest-Shamir-Adleman
- **Key Size**: 4096 bits
- **Security Level**: 150 bits
- **Performance**: Slow
- **Use Case**: High-security applications, long-term storage

```javascript
{
  "name": "RSA-4096",
  "cryptoConfig": {
    "name": "rsa",
    "modulusLength": 4096
  },
  "description": "RSA algorithm with 4096-bit key length. Maximum security but slower performance."
}
```

---

## ⚙️ Configuration Management

### Environment Variables
The key management system is fully configurable through environment variables:

```bash
# Key Management Configuration
KEY_ALGORITHMS=ECDSA-P256,RSA-2048,RSA-4096
DEFAULT_KEY_ALGORITHM=ECDSA-P256
KEY_ID_PREFIX=KEY
KEY_EXPIRY_DAYS=365
KEY_ENCRYPTION_ALGORITHM=aes-256-gcm
KEY_ENCRYPTION_SALT=salt
```

### Configuration Loading
```javascript
loadConfiguration() {
  // Parse supported algorithms from environment
  const algorithmsEnv = process.env.KEY_ALGORITHMS || 'ECDSA-P256,RSA-2048,RSA-4096';
  const supportedAlgorithms = algorithmsEnv.split(',').map(alg => alg.trim());
  
  // Build key algorithms configuration
  this.keyAlgorithms = {};
  
  if (supportedAlgorithms.includes('ECDSA-P256')) {
    this.keyAlgorithms['ECDSA-P256'] = { name: 'ec', namedCurve: 'prime256v1' };
  }
  
  if (supportedAlgorithms.includes('RSA-2048')) {
    this.keyAlgorithms['RSA-2048'] = { name: 'rsa', modulusLength: 2048 };
  }
  
  if (supportedAlgorithms.includes('RSA-4096')) {
    this.keyAlgorithms['RSA-4096'] = { name: 'rsa', modulusLength: 4096 };
  }
  
  // Set other configuration
  this.defaultAlgorithm = process.env.DEFAULT_KEY_ALGORITHM || 'ECDSA-P256';
  this.keyIdPrefix = process.env.KEY_ID_PREFIX || 'KEY';
  this.keyExpiryDays = parseInt(process.env.KEY_EXPIRY_DAYS) || 365;
  this.encryptionAlgorithm = process.env.KEY_ENCRYPTION_ALGORITHM || 'aes-256-gcm';
  this.encryptionSalt = process.env.KEY_ENCRYPTION_SALT || 'salt';
}
```

### Hot Configuration Reload
The system supports hot-reloading of configuration without restart:

```javascript
// Reload configuration from environment variables
keyManagementService.reloadConfiguration();

// Get current configuration
const config = keyManagementService.getConfiguration();
```

---

## 🛡️ Security Model

### Vault-Based Security
Private keys are stored securely in HashiCorp Vault with enterprise-grade security:

```javascript
// Vault provides built-in encryption and access control
class VaultKeyService {
  async storeKey(userId, keyId, keyData) {
    const path = `${this.keysPath}/users/${userId}/${keyId}`;
    
    // Vault handles encryption at rest automatically
    return await this.vault.write(path, {
      private_key: keyData.privateKey,  // Vault encrypts this
      public_key: keyData.publicKey,    // Stored for verification
      metadata: JSON.stringify(keyData.metadata),
      status: keyData.status || 'active'
    });
  }

  async retrieveKey(userId, keyId) {
    const path = `${this.keysPath}/users/${userId}/${keyId}`;
    
    // Vault handles decryption and access control
    const result = await this.vault.read(path);
    return {
      privateKey: result.data.private_key,  // Automatically decrypted
      publicKey: result.data.public_key,
      metadata: JSON.parse(result.data.metadata),
      status: result.data.status
    };
  }
}
```

### Multi-Layer Access Control
1. **Vault Authentication**: Backend authenticates with Vault using tokens
2. **Vault Authorization**: Vault policies control key access by user
3. **Application Authentication**: Keycloak JWT tokens for user authentication
4. **User Isolation**: Users can only access their own keys through backend APIs

### Security Features
- **Vault Encryption**: Enterprise-grade encryption at rest and in transit
- **Access Policies**: Fine-grained access control through Vault policies
- **Audit Logging**: Vault provides comprehensive audit trails
- **Key Rotation**: Easy key rotation with Vault's versioning
- **Secure Generation**: Uses Node.js crypto module for secure key generation
- **Unique Key IDs**: Each key has a unique identifier
- **Key Status Tracking**: Keys can be active, revoked, or expired
- **Last Used Tracking**: Track when keys were last used
- **No Frontend Access**: Frontend never directly accesses Vault or private keys

---

## 🔌 API Design

### Key Management Endpoints

#### Get Configuration
```http
GET /api/signing/config
Authorization: Bearer <token>

Response:
{
  "success": true,
  "config": {
    "supportedAlgorithms": ["ECDSA-P256", "RSA-2048", "RSA-4096"],
    "defaultAlgorithm": "ECDSA-P256",
    "keyIdPrefix": "KEY",
    "keyExpiryDays": 365,
    "encryptionAlgorithm": "aes-256-gcm",
    "algorithms": [
      {
        "name": "ECDSA-P256",
        "description": "Elliptic Curve Digital Signature Algorithm with P-256 curve. Recommended for most use cases.",
        "info": {
          "name": "ec",
          "namedCurve": "prime256v1"
        }
      }
    ]
  }
}
```

#### List User Keys
```http
GET /api/signing/keys
Authorization: Bearer <token>

Response:
{
  "success": true,
  "keys": [
    {
      "id": 1,
      "keyId": "KEY-abc123-def456",
      "keyType": "ECDSA-P256",
      "keyStatus": "active",
      "createdAt": "2025-01-01T00:00:00Z",
      "lastUsedAt": "2025-01-01T12:00:00Z"
    }
  ]
}
```

#### Generate New Key
```http
POST /api/signing/keys/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "keyType": "ECDSA-P256"
}

Response:
{
  "success": true,
  "key": {
    "id": 1,
    "keyId": "KEY-abc123-def456",
    "keyType": "ECDSA-P256",
    "keyStatus": "active",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

#### Import Key
```http
POST /api/signing/keys/import
Authorization: Bearer <token>
Content-Type: application/json

{
  "keyData": {
    "keyId": "KEY-imported-123",
    "keyType": "ECDSA-P256",
    "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
  }
}

Response:
{
  "success": true,
  "key": {
    "id": 2,
    "keyId": "KEY-imported-123",
    "keyType": "ECDSA-P256",
    "keyStatus": "active",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

#### Delete Key
```http
DELETE /api/signing/keys/:keyId
Authorization: Bearer <token>

Response:
{
  "success": true
}
```

#### Export Key
```http
GET /api/signing/keys/:keyId/export
Authorization: Bearer <token>

Response:
{
  "success": true,
  "keyData": {
    "keyId": "KEY-abc123-def456",
    "keyType": "ECDSA-P256",
    "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

---

## 🗄️ Database Schema

### User Keys Table
```sql
CREATE TABLE user_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    key_id VARCHAR(255) NOT NULL UNIQUE,
    key_type VARCHAR(50) NOT NULL,
    public_key TEXT NOT NULL,
    private_key TEXT, -- Encrypted private key
    key_status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP,
    
    CONSTRAINT fk_user_keys_user_id FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT chk_key_status CHECK (key_status IN ('active', 'revoked', 'expired')),
    CONSTRAINT chk_key_type CHECK (key_type IN ('ECDSA-P256', 'RSA-2048', 'RSA-4096'))
);

-- Indexes
CREATE INDEX idx_user_keys_user_id ON user_keys(user_id);
CREATE INDEX idx_user_keys_key_id ON user_keys(key_id);
CREATE INDEX idx_user_keys_key_status ON user_keys(key_status);
CREATE INDEX idx_user_keys_created_at ON user_keys(created_at);
```

### Signing Events Table
```sql
CREATE TABLE signing_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    contract_id INTEGER REFERENCES contracts(id),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_signing_events_user_id FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_signing_events_contract_id FOREIGN KEY (contract_id) REFERENCES contracts(id)
);

-- Indexes
CREATE INDEX idx_signing_events_user_id ON signing_events(user_id);
CREATE INDEX idx_signing_events_contract_id ON signing_events(contract_id);
CREATE INDEX idx_signing_events_event_type ON signing_events(event_type);
CREATE INDEX idx_signing_events_created_at ON signing_events(created_at);
```

---

## 🔗 Integration Points

### Keycloak Integration
```javascript
// Authentication middleware for key operations
const authenticateKeyAccess = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const user = await keycloakService.validateToken(token);
    
    if (!user.valid) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication required' });
  }
};
```

### SCITT CCF Integration
```javascript
// Key usage in signature generation
const generateSignature = async (contractData, keyId, userId) => {
  // Get user's key
  const userKey = await UserKey.findOne({
    where: { keyId, userId, keyStatus: 'active' }
  });
  
  if (!userKey) {
    throw new Error('Key not found or inactive');
  }
  
  // Generate signature
  const signature = await keyManagementService.generateSignature(
    contractData,
    userKey.privateKey, // In production, decrypt first
    userKey.keyType
  );
  
  // Submit to SCITT CCF
  const scittResult = await scittCcfService.submitClaim({
    type: 'contract_signature',
    data: {
      contractId: contractData.id,
      signer: userId,
      signature: signature.signature,
      algorithm: signature.algorithm,
      timestamp: signature.timestamp
    }
  });
  
  return scittResult;
};
```

---

## 🚀 Deployment Considerations

### Environment Configuration
```bash
# Production Environment Variables
KEY_ALGORITHMS=ECDSA-P256,RSA-4096
DEFAULT_KEY_ALGORITHM=ECDSA-P256
KEY_ID_PREFIX=PROD-KEY
KEY_EXPIRY_DAYS=730
KEY_ENCRYPTION_ALGORITHM=aes-256-gcm
KEY_ENCRYPTION_SALT=production-salt-value
```

### Security Considerations
- **Salt Management**: Use strong, unique salt values for encryption
- **Key Rotation**: Implement regular key rotation policies
- **Access Logging**: Enable comprehensive audit logging
- **Backup Security**: Secure backup of encrypted keys
- **HSM Integration**: Consider Hardware Security Module for production

### Performance Considerations
- **Key Caching**: Cache frequently used keys in memory
- **Database Indexing**: Proper indexing for key lookups
- **Algorithm Selection**: Choose appropriate algorithms for performance needs
- **Connection Pooling**: Use database connection pooling

---

## 📊 Monitoring & Auditing

### Key Operations Audit
```javascript
// Audit logging for key operations
const logKeyOperation = async (userId, operation, keyId, metadata = {}) => {
  await SigningEvent.create({
    userId,
    eventType: `key_${operation}`,
    eventData: {
      keyId,
      operation,
      timestamp: new Date(),
      ...metadata
    },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });
};
```

### Monitoring Metrics
- **Key Generation Rate**: Number of keys generated per time period
- **Key Usage Rate**: Number of keys used for signing per time period
- **Key Revocation Rate**: Number of keys revoked per time period
- **Algorithm Distribution**: Distribution of key algorithms in use
- **Error Rates**: Key operation error rates

### Alerting
- **Failed Key Operations**: Alert on failed key generation or access
- **Suspicious Activity**: Alert on unusual key access patterns
- **Key Expiry**: Alert on keys approaching expiry
- **High Usage**: Alert on unusually high key usage

---

## 🔧 Troubleshooting

### Common Issues

#### Key Generation Failures
```bash
Error: Failed to generate key pair
Solution: Check algorithm configuration and Node.js crypto support
```

#### Key Access Denied
```bash
Error: Key not found or inactive
Solution: Verify key exists and user has access permissions
```

#### Encryption/Decryption Errors
```bash
Error: Invalid key format
Solution: Check encryption algorithm and salt configuration
```

#### Database Connection Issues
```bash
Error: Database connection failed
Solution: Check database connectivity and user permissions
```

### Debug Commands
```bash
# Test key generation
curl -X POST http://localhost:5001/api/signing/keys/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keyType": "ECDSA-P256"}'

# List user keys
curl -X GET http://localhost:5001/api/signing/keys \
  -H "Authorization: Bearer $TOKEN"

# Get configuration
curl -X GET http://localhost:5001/api/signing/config
```

---

## 📚 References

### Documentation
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [ECDSA Specification](https://tools.ietf.org/html/rfc6090)
- [RSA Specification](https://tools.ietf.org/html/rfc8017)

### Standards
- [FIPS 186-4: Digital Signature Standard](https://csrc.nist.gov/publications/detail/fips/186/4/final)
- [RFC 7517: JSON Web Key (JWK)](https://tools.ietf.org/html/rfc7517)
- [RFC 7518: JSON Web Algorithms (JWA)](https://tools.ietf.org/html/rfc7518)

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-11  
**Maintained By**: Contract Management System Team
