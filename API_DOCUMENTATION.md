# Contract Management System API Documentation

**Version:** 3.0.0  
**Base URL:** `http://localhost:5001/api`  
**Last Updated:** December 2024

## Table of Contents

1. [Authentication & User Management](#authentication--user-management)
2. [Multi-Tenant Infrastructure Management](#multi-tenant-infrastructure-management)
3. [KMS (Key Management Service) Integration](#kms-key-management-service-integration)
4. [Merkle Tree Provenance Tracking](#merkle-tree-provenance-tracking)
5. [DID (Decentralized Identifier) Management](#did-decentralized-identifier-management)
6. [Contract Management](#contract-management)
7. [Dataset Management](#dataset-management)
8. [Cross-Cloud Training Management](#cross-cloud-training-management)
9. [DPDP (Digital Personal Data Protection) Compliance](#dpdp-digital-personal-data-protection-compliance)
10. [User Management (AppAdmin)](#user-management-appadmin)
11. [Notification System](#notification-system)
12. [Error Handling](#error-handling)

---

## Authentication & User Management

### User Registration
**POST** `/auth/register`

Register a new user with support for both `did:ethr` and `did:web` methods, including multi-tenant infrastructure configuration.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "partyType": "TDC",
  "walletAddress": "0x1234567890abcdef...",
  "publicKey": "0xabcdef123456...",
  "description": "AI research organization",
  "organization": "TechAI Labs",
  "phoneNumber": "+1-555-1234",
  "website": "https://techailabs.com",
  "location": "Boston, MA",
  "existingDID": "did:web:mukeshjoshidpi.github.io",
  "didVerificationSignature": "0xsignature...",
  "tenantInfrastructure": {
    "cloudProvider": "AZURE",
    "kmsProvider": "AZURE_KEY_VAULT",
    "storageProvider": "AZURE_BLOB",
    "region": "eastus",
    "infrastructureType": "HYBRID_CLOUD",
    "complianceStandards": ["GDPR", "ISO27001", "SOC2"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "partyType": "TDC",
    "did": "did:web:mukeshjoshidpi.github.io",
    "didVerified": true,
    "isRegistered": true,
    "tenantInfrastructure": {
      "cloudProvider": "AZURE",
      "kmsProvider": "AZURE_KEY_VAULT",
      "storageProvider": "AZURE_BLOB",
      "region": "eastus"
    }
  },
  "***REMOVED-KEYCLOAK_DB_PASSWORD***Success": true
}
```

### User Login
**POST** `/auth/login`

Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "partyType": "TDC",
    "did": "did:web:mukeshjoshidpi.github.io",
    "didVerified": true,
    "tenantInfrastructure": {
      "cloudProvider": "AZURE",
      "kmsProvider": "AZURE_KEY_VAULT",
      "storageProvider": "AZURE_BLOB"
    }
  }
}
```

### Forgot Password
**POST** `/auth/forgot-password`

Request password reset link.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset link sent to email"
}
```

### Reset Password
**POST** `/auth/reset-password`

Reset password using token.

**Request Body:**
```json
{
  "token": "reset_token_here",
  "newPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### Update Profile
**PUT** `/auth/profile`

Update user profile information including tenant infrastructure.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "description": "Updated description",
  "organization": "Updated Organization",
  "phoneNumber": "+1-555-5678",
  "website": "https://updatedwebsite.com",
  "location": "New York, NY",
  "tenantInfrastructure": {
    "cloudProvider": "AWS",
    "kmsProvider": "AWS_KMS",
    "storageProvider": "AWS_S3",
    "region": "us-east-1"
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe Updated",
    "email": "john@example.com",
    "description": "Updated description",
    "organization": "Updated Organization",
    "tenantInfrastructure": {
      "cloudProvider": "AWS",
      "kmsProvider": "AWS_KMS",
      "storageProvider": "AWS_S3",
      "region": "us-east-1"
    }
  }
}
```

---

## Multi-Tenant Infrastructure Management

### Get Tenant Configuration
**GET** `/tenants/:tenantId/config`

Get tenant infrastructure configuration.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "tenantConfig": {
    "tenantId": "tdc-ai-research",
    "organization": "AI Research Institute",
    "cloudProvider": "AZURE",
    "kmsConfiguration": {
      "provider": "AZURE_KEY_VAULT",
      "region": "eastus",
      "vaultUrl": "https://ai-research-kv.vault.azure.net/",
      "keyPrefix": "tdc-ai-research",
      "encryptionAlgorithm": "AES_256_GCM"
    },
    "storageConfiguration": {
      "provider": "AZURE_BLOB",
      "region": "eastus",
      "container": "ai-research-models",
      "encryptionAtRest": true,
      "encryptionInTransit": true
    },
    "securityConfiguration": {
      "encryptionAtRest": true,
      "encryptionInTransit": true,
      "accessControl": "role-based",
      "auditLogging": true,
      "complianceStandards": ["GDPR", "ISO27001", "SOC2"]
    }
  }
}
```

### Update Tenant Configuration
**PUT** `/tenants/:tenantId/config`

Update tenant infrastructure configuration.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "kmsConfiguration": {
    "provider": "AZURE_KEY_VAULT",
    "region": "eastus",
    "vaultUrl": "https://updated-kv.vault.azure.net/",
    "keyPrefix": "tdc-ai-research-updated"
  },
  "storageConfiguration": {
    "provider": "AZURE_BLOB",
    "region": "eastus",
    "container": "updated-models",
    "encryptionAtRest": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tenant configuration updated successfully",
  "tenantConfig": {
    "tenantId": "tdc-ai-research",
    "kmsConfiguration": {
      "provider": "AZURE_KEY_VAULT",
      "region": "eastus",
      "vaultUrl": "https://updated-kv.vault.azure.net/"
    },
    "storageConfiguration": {
      "provider": "AZURE_BLOB",
      "region": "eastus",
      "container": "updated-models"
    }
  }
}
```

### List Supported Cloud Providers
**GET** `/tenants/cloud-providers`

Get list of supported cloud providers and their capabilities.

**Response:**
```json
{
  "success": true,
  "cloudProviders": [
    {
      "name": "AWS",
      "kmsProviders": ["AWS_KMS"],
      "storageProviders": ["AWS_S3"],
      "regions": ["us-east-1", "us-west-2", "eu-west-1"],
      "complianceStandards": ["SOC2", "ISO27001", "HIPAA"]
    },
    {
      "name": "AZURE",
      "kmsProviders": ["AZURE_KEY_VAULT"],
      "storageProviders": ["AZURE_BLOB"],
      "regions": ["eastus", "westus", "northeurope"],
      "complianceStandards": ["SOC2", "ISO27001", "GDPR"]
    },
    {
      "name": "GCP",
      "kmsProviders": ["GCP_KMS"],
      "storageProviders": ["GCP_GCS"],
      "regions": ["us-central1", "europe-west1", "asia-southeast1"],
      "complianceStandards": ["SOC2", "ISO27001"]
    }
  ]
}
```

---

## KMS (Key Management Service) Integration

### Create KMS Key
**POST** `/kms/keys`

Create a new encryption key in the tenant's KMS.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "keyType": "DATA_ENCRYPTION",
  "keyName": "dataset-encryption-key",
  "description": "Encryption key for dataset DS-MEDICAL-2024-001",
  "metadata": {
    "purpose": "dataset-encryption",
    "datasetId": "DS-MEDICAL-2024-001",
    "contractId": "CONTRACT-123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "keyInfo": {
    "keyId": "tdc-ai-research-dataset-key-001",
    "keyType": "DATA_ENCRYPTION",
    "algorithm": "AES_256_GCM",
    "keySize": 256,
    "createdAt": "2024-12-15T10:30:00.000Z",
    "expiresAt": "2025-01-15T10:30:00.000Z",
    "metadata": {
      "purpose": "dataset-encryption",
      "datasetId": "DS-MEDICAL-2024-001",
      "contractId": "CONTRACT-123"
    },
    "status": "ACTIVE"
  }
}
```

### Encrypt Data
**POST** `/kms/encrypt`

Encrypt data using tenant's KMS key.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "keyId": "tdc-ai-research-dataset-key-001",
  "data": "base64_encoded_data_here",
  "algorithm": "AES_256_GCM"
}
```

**Response:**
```json
{
  "success": true,
  "encryptedData": {
    "encryptedData": "base64_encrypted_data",
    "keyId": "tdc-ai-research-dataset-key-001",
    "algorithm": "AES_256_GCM",
    "iv": "base64_iv",
    "checksum": "sha256_checksum"
  }
}
```

### Decrypt Data
**POST** `/kms/decrypt`

Decrypt data using tenant's KMS key.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "keyId": "tdc-ai-research-dataset-key-001",
  "encryptedData": "base64_encrypted_data",
  "iv": "base64_iv",
  "algorithm": "AES_256_GCM"
}
```

**Response:**
```json
{
  "success": true,
  "decryptedData": "base64_decrypted_data"
}
```

### List KMS Keys
**GET** `/kms/keys`

List all KMS keys for the tenant.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "keys": [
    {
      "keyId": "tdc-ai-research-dataset-key-001",
      "keyType": "DATA_ENCRYPTION",
      "algorithm": "AES_256_GCM",
      "createdAt": "2024-12-15T10:30:00.000Z",
      "status": "ACTIVE",
      "metadata": {
        "purpose": "dataset-encryption",
        "datasetId": "DS-MEDICAL-2024-001"
      }
    }
  ]
}
```

---

## Merkle Tree Provenance Tracking

### Capture Provenance
**POST** `/provenance/capture`

Capture Merkle tree provenance for model auditing.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "contractId": "CONTRACT-123",
  "nodeType": "DATASET_ROOT",
  "dataHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "timestamp": "2024-12-15T10:30:00.000Z",
  "crossCloudVerified": true,
  "metadata": {
    "dataSource": "TDP_AWS_S3",
    "encryptionKeyId": "tdp-dataset-key-001",
    "hashAlgorithm": "SHA256"
  }
}
```

**Response:**
```json
{
  "success": true,
  "provenance": {
    "provenanceId": "PROV-001",
    "contractId": "CONTRACT-123",
    "nodeType": "DATASET_ROOT",
    "merkleRoot": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "timestamp": "2024-12-15T10:30:00.000Z",
    "crossCloudVerified": true,
    "auditSignature": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  }
}
```

### Verify Provenance
**POST** `/provenance/verify`

Verify Merkle tree provenance for model audit.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "contractId": "CONTRACT-123",
  "nodeType": "DATASET_ROOT",
  "merkleProof": [
    "0x1111111111111111111111111111111111111111111111111111111111111111",
    "0x2222222222222222222222222222222222222222222222222222222222222222"
  ],
  "expectedHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

**Response:**
```json
{
  "success": true,
  "verification": {
    "verified": true,
    "nodeType": "DATASET_ROOT",
    "merkleRoot": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "verificationMethod": "MERKLE_PROOF_VERIFICATION",
    "crossCloudVerified": true,
    "timestamp": "2024-12-15T10:30:00.000Z"
  }
}
```

### Get Provenance Audit Trail
**GET** `/provenance/audit-trail/:contractId`

Get complete provenance audit trail for a contract.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "auditTrail": [
    {
      "timestamp": "2024-12-15T10:30:00.000Z",
      "action": "DATASET_PROVENANCE_CAPTURED",
      "nodeType": "DATASET_ROOT",
      "merkleRoot": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "dataSource": "TDP_AWS_S3",
      "crossCloudVerified": true,
      "auditSignature": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    },
    {
      "timestamp": "2024-12-15T10:30:00.000Z",
      "action": "MODEL_SPECIFICATION_PROVENANCE_CAPTURED",
      "nodeType": "MODEL_SPECIFICATION_ROOT",
      "merkleRoot": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      "dataSource": "TDC_AZURE_BLOB",
      "crossCloudVerified": true,
      "auditSignature": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    }
  ]
}
```

### Generate Provenance Report
**POST** `/provenance/report`

Generate comprehensive provenance report for model governance.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "contractId": "CONTRACT-123",
  "reportType": "COMPREHENSIVE",
  "dateRange": {
    "startDate": "2024-12-15T00:00:00.000Z",
    "endDate": "2025-01-15T23:59:59.000Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "report": {
    "reportId": "REPORT-001",
    "contractId": "CONTRACT-123",
    "reportType": "COMPREHENSIVE",
    "generatedAt": "2024-12-15T12:00:00.000Z",
    "dataLineage": {
      "dataSource": "TDP_AWS_S3",
      "transformations": ["preprocessing", "training", "validation"],
      "finalOutput": "TDC_AZURE_BLOB"
    },
    "modelExplainability": {
      "dataInfluence": "High",
      "featureImportance": "Tracked",
      "decisionPath": "Documented"
    },
    "complianceVerification": {
      "dpdp2023": "Compliant",
      "gdpr": "Compliant",
      "hipaa": "Compliant"
    },
    "biasDetection": {
      "dataBias": "None detected",
      "modelBias": "None detected",
      "demographicBias": "None detected"
    }
  }
}
```

---

## DID (Decentralized Identifier) Management

### Verify DID Ownership
**POST** `/did/verify`

Verify ownership of a user-provided DID.

**Request Body:**
```json
{
  "did": "did:web:mukeshjoshidpi.github.io",
  "walletAddress": "0x1234567890abcdef...",
  "signature": "0xsignature...",
  "message": "I verify ownership of this DID"
}
```

**Response:**
```json
{
  "success": true,
  "message": "DID ownership verified successfully",
  "verification": {
    "did": "did:web:mukeshjoshidpi.github.io",
    "verified": true,
    "method": "signature",
    "verifiedAt": "2024-12-15T18:00:00.000Z"
  }
}
```

### Get DID Information
**GET** `/did/info/:did`

Get detailed information about a DID.

**Response:**
```json
{
  "success": true,
  "did": {
    "did": "did:web:mukeshjoshidpi.github.io",
    "document": {
      "@context": ["https://www.w3.org/ns/did/v1"],
      "id": "did:web:mukeshjoshidpi.github.io",
      "verificationMethod": [
        {
          "id": "did:web:mukeshjoshidpi.github.io#key-1",
          "type": "Ed25519VerificationKey2020",
          "controller": "did:web:mukeshjoshidpi.github.io",
          "publicKeyMultibase": "z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
        }
      ]
    },
    "resolved": true,
    "resolvedAt": "2024-12-15T18:00:00.000Z"
  }
}
```

---

## Contract Management

### Create Multi-Tenant Contract
**POST** `/contracts`

Create a new contract with multi-tenant infrastructure specifications.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Multi-Cloud AI Training Contract",
  "description": "Cross-cloud AI model training with privacy preservation",
  "tdpIds": [1, 2],
  "datasets": [
    {
      "id": 1,
      "price": 50000,
      "tdpId": 1
    },
    {
      "id": 2,
      "price": 30000,
      "tdpId": 2
    }
  ],
  "duration": 30,
  "multiTenantInfrastructure": {
    "tdp": {
      "cloudProvider": "AWS",
      "kmsProvider": "AWS_KMS",
      "storageProvider": "AWS_S3",
      "region": "us-east-1"
    },
    "tdc": {
      "cloudProvider": "AZURE",
      "kmsProvider": "AZURE_KEY_VAULT",
      "storageProvider": "AZURE_BLOB",
      "region": "eastus"
    },
    "ccrp": {
      "cloudProvider": "MULTI_CLOUD",
      "supportedClouds": ["AWS", "AZURE", "GCP"]
    }
  },
  "provenanceTracking": {
    "enabled": true,
    "trackingLevel": "COMPREHENSIVE",
    "retentionPeriod": "PERMANENT"
  }
}
```

**Response:**
```json
{
  "success": true,
  "contract": {
    "id": "CONTRACT-123",
    "title": "Multi-Cloud AI Training Contract",
    "status": "PENDING_TDP_APPROVAL",
    "multiTenantInfrastructure": {
      "tdp": {
        "cloudProvider": "AWS",
        "kmsProvider": "AWS_KMS",
        "storageProvider": "AWS_S3"
      },
      "tdc": {
        "cloudProvider": "AZURE",
        "kmsProvider": "AZURE_KEY_VAULT",
        "storageProvider": "AZURE_BLOB"
      },
      "ccrp": {
        "cloudProvider": "MULTI_CLOUD",
        "supportedClouds": ["AWS", "AZURE", "GCP"]
      }
    },
    "provenanceTracking": {
      "enabled": true,
      "trackingLevel": "COMPREHENSIVE"
    },
    "createdAt": "2024-12-15T10:30:00.000Z"
  }
}
```

### Get Contract with Provenance
**GET** `/contracts/:contractId`

Get contract details including provenance information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "contract": {
    "id": "CONTRACT-123",
    "title": "Multi-Cloud AI Training Contract",
    "status": "TRAINING_IN_PROGRESS",
    "multiTenantInfrastructure": {
      "tdp": {
        "cloudProvider": "AWS",
        "kmsProvider": "AWS_KMS",
        "storageProvider": "AWS_S3"
      },
      "tdc": {
        "cloudProvider": "AZURE",
        "kmsProvider": "AZURE_KEY_VAULT",
        "storageProvider": "AZURE_BLOB"
      },
      "ccrp": {
        "cloudProvider": "MULTI_CLOUD",
        "supportedClouds": ["AWS", "AZURE", "GCP"]
      }
    },
    "provenanceCaptured": {
      "datasetProvenance": true,
      "modelSpecificationProvenance": true,
      "trainingConfigurationProvenance": true,
      "trainedModelProvenance": false,
      "validationResultsProvenance": false,
      "privacyMetricsProvenance": false
    },
    "provenanceVerified": {
      "datasetProvenance": true,
      "modelSpecificationProvenance": true,
      "trainingConfigurationProvenance": true,
      "trainedModelProvenance": false,
      "validationResultsProvenance": false,
      "privacyMetricsProvenance": false
    },
    "createdAt": "2024-12-15T10:30:00.000Z"
  }
}
```

---

## Cross-Cloud Training Management

### Provision Cross-Cloud Environment
**POST** `/training/provision-environment`

Provision cross-cloud training environment.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "contractId": "CONTRACT-123",
  "environmentConfig": {
    "compute": {
      "aws": {
        "cpu": "64 cores (AMD EPYC 7763)",
        "memory": "512 GB DDR4 ECC",
        "gpu": "8x NVIDIA A100 (80GB each)"
      },
      "azure": {
        "cpu": "64 cores (Intel Xeon)",
        "memory": "512 GB DDR4 ECC",
        "gpu": "8x NVIDIA A100 (80GB each)"
      }
    },
    "storage": {
      "type": "DISTRIBUTED_ENCRYPTED_STORAGE",
      "encryption": "AES-256-XTS",
      "keyManagement": "MULTI_CLOUD_KMS"
    },
    "network": {
      "type": "MULTI_CLOUD_NETWORK",
      "isolation": "CROSS_CLOUD_VPN",
      "bandwidth": "100 Gbps distributed"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "environment": {
    "environmentId": "ENV-001",
    "contractId": "CONTRACT-123",
    "status": "PROVISIONING",
    "resources": {
      "aws": {
        "instanceId": "i-1234567890abcdef0",
        "status": "RUNNING"
      },
      "azure": {
        "vmId": "vm-12345678-1234-5678-9012-123456789012",
        "status": "RUNNING"
      }
    },
    "estimatedDuration": "2 hours"
  }
}
```

### Start Cross-Cloud Training
**POST** `/training/start`

Start cross-cloud training execution.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "contractId": "CONTRACT-123",
  "trainingConfig": {
    "algorithm": "CROSS_CLOUD_FEDERATED_LEARNING",
    "privacyTechniques": [
      "DIFFERENTIAL_PRIVACY",
      "SECURE_MULTIPARTY_COMPUTATION",
      "HOMOMORPHIC_ENCRYPTION"
    ],
    "hyperparameters": {
      "learningRate": 0.001,
      "batchSize": 32,
      "epochs": 100
    },
    "provenanceTracking": {
      "enabled": true,
      "captureFrequency": "EVERY_EPOCH"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "training": {
    "trainingId": "TRAINING-001",
    "contractId": "CONTRACT-123",
    "status": "STARTING",
    "algorithm": "CROSS_CLOUD_FEDERATED_LEARNING",
    "privacyTechniques": [
      "DIFFERENTIAL_PRIVACY",
      "SECURE_MULTIPARTY_COMPUTATION",
      "HOMOMORPHIC_ENCRYPTION"
    ],
    "estimatedDuration": "30 days",
    "provenanceTracking": {
      "enabled": true,
      "captureFrequency": "EVERY_EPOCH"
    }
  }
}
```

### Monitor Cross-Cloud Training
**GET** `/training/:trainingId/status`

Get cross-cloud training status and progress.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "training": {
    "trainingId": "TRAINING-001",
    "contractId": "CONTRACT-123",
    "status": "RUNNING",
    "progress": {
      "currentEpoch": 45,
      "totalEpochs": 100,
      "accuracy": 0.92,
      "loss": 0.08
    },
    "crossCloudStatus": {
      "aws": {
        "status": "RUNNING",
        "resources": "8x NVIDIA A100",
        "utilization": "85%"
      },
      "azure": {
        "status": "RUNNING",
        "resources": "8x NVIDIA A100",
        "utilization": "78%"
      }
    },
    "provenanceCaptured": {
      "trainingCheckpoints": true,
      "privacyBudget": true,
      "dataPreprocessing": true
    },
    "estimatedCompletion": "2025-01-14T10:30:00.000Z"
  }
}
```

---

## Dataset Management

### Create Dataset with Multi-Cloud Storage
**POST** `/datasets`

Create a dataset with multi-cloud storage configuration.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Medical Imaging Dataset",
  "description": "High-resolution medical images for AI training",
  "size": "10GB",
  "format": "DICOM",
  "storageConfiguration": {
    "primaryStorage": {
      "provider": "AWS_S3",
      "bucket": "medical-datasets",
      "region": "us-east-1",
      "encryptionAtRest": true
    },
    "backupStorage": {
      "provider": "AZURE_BLOB",
      "container": "medical-datasets-backup",
      "region": "eastus",
      "encryptionAtRest": true
    }
  },
  "encryptionKeyId": "tdp-dataset-key-001",
  "complianceStandards": ["HIPAA", "DPDP_2023"]
}
```

**Response:**
```json
{
  "success": true,
  "dataset": {
    "id": 1,
    "name": "Medical Imaging Dataset",
    "description": "High-resolution medical images for AI training",
    "size": "10GB",
    "format": "DICOM",
    "storageConfiguration": {
      "primaryStorage": {
        "provider": "AWS_S3",
        "bucket": "medical-datasets",
        "region": "us-east-1"
      },
      "backupStorage": {
        "provider": "AZURE_BLOB",
        "container": "medical-datasets-backup",
        "region": "eastus"
      }
    },
    "encryptionKeyId": "tdp-dataset-key-001",
    "complianceStandards": ["HIPAA", "DPDP_2023"],
    "createdAt": "2024-12-15T10:30:00.000Z"
  }
}
```

---

## DPDP (Digital Personal Data Protection) Compliance

### Submit Data Subject Request
**POST** `/dpdp/data-subject-request`

Submit a data subject request under DPDP 2023.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "requestType": "RIGHT_TO_ERASURE",
  "dataSubjectId": "DS-001",
  "personalData": {
    "email": "john@example.com",
    "phoneNumber": "+1-555-1234"
  },
  "reason": "Data subject requests deletion of personal data",
  "crossCloudRequest": true,
  "cloudProviders": ["AWS", "AZURE", "GCP"]
}
```

**Response:**
```json
{
  "success": true,
  "request": {
    "requestId": "DSR-001",
    "requestType": "RIGHT_TO_ERASURE",
    "status": "PROCESSING",
    "dataSubjectId": "DS-001",
    "crossCloudRequest": true,
    "cloudProviders": ["AWS", "AZURE", "GCP"],
    "estimatedCompletion": "2024-12-22T10:30:00.000Z",
    "createdAt": "2024-12-15T10:30:00.000Z"
  }
}
```

---

## Error Handling

### Error Response Format
```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details",
    "suggestion": "How to fix the error"
  },
  "timestamp": "2024-12-15T10:30:00.000Z"
}
```

### Common Error Codes

#### Authentication Errors
- `INVALID_CREDENTIALS`: Invalid email or password
- `TOKEN_EXPIRED`: JWT token has expired
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `TENANT_ACCESS_DENIED`: Access denied to tenant resources

#### Multi-Tenant Errors
- `TENANT_NOT_FOUND`: Tenant configuration not found
- `CLOUD_PROVIDER_NOT_SUPPORTED`: Cloud provider not supported
- `KMS_PROVIDER_NOT_SUPPORTED`: KMS provider not supported
- `CROSS_CLOUD_VERIFICATION_FAILED`: Cross-cloud verification failed

#### KMS Errors
- `KEY_CREATION_FAILED`: Failed to create KMS key
- `ENCRYPTION_FAILED`: Data encryption failed
- `DECRYPTION_FAILED`: Data decryption failed
- `KEY_ACCESS_DENIED`: Access denied to KMS key

#### Provenance Errors
- `PROVENANCE_CAPTURE_FAILED`: Failed to capture provenance
- `PROVENANCE_VERIFICATION_FAILED`: Failed to verify provenance
- `MERKLE_PROOF_INVALID`: Invalid Merkle proof
- `CROSS_CLOUD_CONSISTENCY_FAILED`: Cross-cloud consistency check failed

#### Training Errors
- `ENVIRONMENT_PROVISIONING_FAILED`: Failed to provision training environment
- `CROSS_CLOUD_TRAINING_FAILED`: Cross-cloud training failed
- `KEY_COORDINATION_FAILED`: Failed to coordinate keys across clouds
- `DATA_TRANSFER_FAILED`: Failed to transfer data between clouds

#### DPDP Errors
- `PERSONAL_DATA_ACCESS_ERROR`: Failed to access personal data
- `CONSENT_REQUIRED`: User consent is required for this operation
- `GRIEVANCE_SUBMISSION_ERROR`: Failed to submit grievance
- `BREACH_REPORT_ERROR`: Failed to report data breach

#### Rate Limiting
- `RATE_LIMIT_EXCEEDED`: Too many requests, please try again later

#### Validation Errors
- `MISSING_REQUIRED_FIELDS`: Required fields are missing
- `INVALID_EMAIL_FORMAT`: Email format is invalid
- `INVALID_WALLET_ADDRESS`: Wallet address format is invalid
- `INVALID_PARTY_TYPE`: Party type is not supported

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (resource already exists)
- `429`: Too Many Requests (rate limiting)
- `500`: Internal Server Error

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints**: 10 requests per 15 minutes
- **Multi-tenant endpoints**: 50 requests per 15 minutes
- **KMS endpoints**: 100 requests per 15 minutes
- **Provenance endpoints**: 200 requests per 15 minutes
- **Training endpoints**: 30 requests per 15 minutes
- **DID endpoints**: 100 requests per 15 minutes
- **DPDP endpoints**: 50 requests per 15 minutes
- **General endpoints**: 1000 requests per 15 minutes

When rate limit is exceeded, the API returns:
```json
{
  "error": "Too many requests, please try again later",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

---

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Token Format
JWT tokens are issued upon successful login and contain:
- User ID
- Party Type (TDC, TDP, CCRP, AppAdmin)
- DID information
- Tenant infrastructure configuration
- Expiration time

### Token Expiration
Tokens expire after 24 hours. Use the refresh token endpoint to get a new token.

---

## Versioning

API versioning is handled through the URL path. Current version is v3 (default).

To specify a version explicitly:
```
GET /api/v3/contracts
```

---

## Enhanced DID-Based Contract Signing

### DID Signature Verification
**POST** `/did/verify`

Verify a cryptographic signature using DID-based authentication.

**Request Body:**
```json
{
  "did": "did:web:mukeshjoshidpi.github.io",
  "message": "Sign contract CONTRACT-123 as TDP at 2024-12-15T00:00:00.000Z",
  "signature": "0x...",
  "verificationMethodId": "did:web:mukeshjoshidpi.github.io#key-1"
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "verificationMethod": {
    "id": "did:web:mukeshjoshidpi.github.io#key-1",
    "type": "Ed25519VerificationKey2020"
  }
}
```

### Enhanced Contract Signing with DID
**POST** `/contracts/:contractId/sign`

Sign a contract using enhanced DID-based authentication with cryptographic verification.

**Request Body (DID Signing):**
```json
{
  "signatureType": "DID",
  "did": "did:web:mukeshjoshidpi.github.io",
  "signature": "0x...",
  "message": "Sign contract CONTRACT-123 as TDP at 2024-12-15T00:00:00.000Z"
}
```

**Request Body (Wallet Signing):**
```json
{
  "signatureType": "WALLET",
  "signedTransaction": "0x...",
  "userWalletAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "contract": {
    "contractId": "CONTRACT-123",
    "status": "PENDING_CCRP_APPROVAL",
    "tdpSigned": true,
    "tdpSignedAt": "2024-12-15T00:00:00.000Z"
  },
  "blockchainTransaction": {
    "transactionHash": "DID_TX_1704067200000_did_web_mukeshjoshidpi_github_io",
    "message": "DID signature recorded on blockchain",
    "mode": "DATABASE_ONLY"
  }
}
```

### DID Health Check
**GET** `/did/health`

Check the health and status of DID resolution services.

**Response:**
```json
{
  "status": "healthy",
  "supportedMethods": ["did:web", "did:key", "did:ethr"],
  "testDID": "did:web:mukeshjoshidpi.github.io",
  "testResult": "success",
  "timestamp": "2024-12-15T00:00:00.000Z"
}
```

### Supported DID Methods

#### did:web
- **Format:** `did:web:domain:path`
- **Example:** `did:web:mukeshjoshidpi.github.io`
- **Resolution:** HTTP GET to `https://domain/.well-known/did.json`
- **Verification:** Ed25519, ECDSA, RSA signatures

#### did:key
- **Format:** `did:key:multibase-encoded-public-key`
- **Example:** `did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK`
- **Verification:** Ed25519, ECDSA signatures

#### did:ethr
- **Format:** `did:ethr:network:address`
- **Example:** `did:ethr:0x1234567890123456789012345678901234567890`
- **Verification:** ECDSA Secp256k1 signatures

### Security Features
- **Cryptographic Verification:** All signatures are cryptographically verified
- **DID Document Resolution:** Automatic resolution and validation of DID documents
- **Timestamp-based Messages:** Prevents replay attacks with unique timestamps
- **Multiple Verification Methods:** Support for various cryptographic algorithms
- **Fallback Mode:** Database-only operation when blockchain unavailable
- **Enterprise Security:** Role-based access control and audit logging
- **Multi-Cloud Security:** Cross-cloud security isolation and verification
- **Provenance Security:** Tamper-proof provenance tracking with Merkle trees

---

## Support

For API support and questions:
- Email: support@contractmanagement.com
- Documentation: https://docs.contractmanagement.com
- GitHub Issues: https://github.com/gitmujoshi/ContractManagement/issues 