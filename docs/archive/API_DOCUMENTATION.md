# Contract Management System API Documentation

**Version:** 3.0.0  
**Base URL:** `http://localhost:5001/api`  
**Last Updated:** December 2024

## Table of Contents

1. [Authentication & User Management](#authentication--user-management)
2. [Multi-Tenant Infrastructure Management](#multi-tenant-infrastructure-management)
3. [KMS (Key Management Service) Integration](#kms-key-management-service-integration)
4. [Provenance Tracking System](#provenance-tracking-system)
5. [DID (Decentralized Identifier) Management](#did-decentralized-identifier-management)
6. [Contract Management](#contract-management)
7. [Dataset Management](#dataset-management)
8. [Cross-Cloud Training Management](#cross-cloud-training-management)
9. [DPDP (Digital Personal Data Protection) Compliance](#dpdp-digital-personal-data-protection-compliance)
10. [User Management (AppAdmin)](#user-management-appadmin)
11. [Enhanced Encryption System](#enhanced-encryption-system)
12. [Notification System](#notification-system)
13. [Error Handling](#error-handling)

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
  "keycloakSuccess": true
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

## Provenance Tracking System

The Provenance Tracking System provides comprehensive auditability of AI model training processes, data lineage, and code execution using Merkle trees and cryptographic verification.

### Base URL
```
/api/provenance
```

---

## 🌳 **Merkle Tree Management**

### Create Merkle Tree
**POST** `/provenance/trees`

Creates a new Merkle tree for tracking provenance of a contract.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "contractId": "CONTRACT-001",
  "treeType": "BINARY_MERKLE_TREE",
  "hashAlgorithm": "SHA256",
  "maxDepth": 10,
  "description": "Provenance tree for MNIST training contract"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "treeId": "TREE-001",
    "contractId": "CONTRACT-001",
    "rootHash": "0xabc123...",
    "depth": 0,
    "nodeCount": 0,
    "status": "ACTIVE",
    "createdAt": "2025-01-08T10:00:00Z"
  }
}
```

### Get Merkle Tree
**GET** `/provenance/trees/{treeId}`

Retrieves details of a specific Merkle tree.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "treeId": "TREE-001",
    "contractId": "CONTRACT-001",
    "rootHash": "0xabc123...",
    "depth": 4,
    "nodeCount": 15,
    "status": "ACTIVE",
    "createdAt": "2025-01-08T10:00:00Z",
    "updatedAt": "2025-01-08T12:00:00Z"
  }
}
```

### List Merkle Trees
**GET** `/provenance/trees`

Lists all Merkle trees with optional filtering.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `contractId` (optional): Filter by contract ID
- `status` (optional): Filter by tree status
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "trees": [
      {
        "treeId": "TREE-001",
        "contractId": "CONTRACT-001",
        "rootHash": "0xabc123...",
        "status": "ACTIVE",
        "nodeCount": 15,
        "createdAt": "2025-01-08T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 50,
      "offset": 0
    }
  }
}
```

---

## 📝 **Provenance Node Management**

### Create Provenance Node
**POST** `/provenance/nodes`

Creates a new node in the Merkle tree.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "treeId": "TREE-001",
  "nodeType": "DATASET",
  "content": "MNIST training dataset",
  "metadata": {
    "datasetName": "MNIST",
    "size": "11.2MB",
    "recordCount": 70000,
    "dataSource": "TDP-001"
  },
  "parentNodes": [],
  "childNodes": []
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nodeId": "NODE-001",
    "treeId": "TREE-001",
    "nodeType": "DATASET",
    "dataHash": "0xdef456...",
    "parentHash": null,
    "leftChildHash": null,
    "rightChildHash": null,
    "level": 0,
    "position": 0,
    "metadata": {
      "datasetName": "MNIST",
      "size": "11.2MB",
      "recordCount": 70000,
      "dataSource": "TDP-001"
    },
    "isVerified": true,
    "createdAt": "2025-01-08T10:00:00Z"
  }
}
```

### Get Provenance Node
**GET** `/provenance/nodes/{nodeId}`

Retrieves details of a specific provenance node.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "nodeId": "NODE-001",
    "treeId": "TREE-001",
    "nodeType": "DATASET",
    "dataHash": "0xdef456...",
    "parentHash": null,
    "leftChildHash": "0x789abc...",
    "rightChildHash": "0x123def...",
    "level": 0,
    "position": 0,
    "metadata": {
      "datasetName": "MNIST",
      "size": "11.2MB",
      "recordCount": 70000,
      "dataSource": "TDP-001"
    },
    "isVerified": true,
    "createdAt": "2025-01-08T10:00:00Z"
  }
}
```

### List Provenance Nodes
**GET** `/provenance/nodes`

Lists all provenance nodes with optional filtering.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `treeId` (optional): Filter by tree ID
- `nodeType` (optional): Filter by node type
- `isVerified` (optional): Filter by verification status
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "nodeId": "NODE-001",
        "treeId": "TREE-001",
        "nodeType": "DATASET",
        "dataHash": "0xdef456...",
        "level": 0,
        "position": 0,
        "isVerified": true,
        "createdAt": "2025-01-08T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 50,
      "offset": 0
    }
  }
}
```

---

## 🔍 **Provenance Capture Management**

### Create Provenance Capture
**POST** `/provenance/captures`

Captures provenance data at a specific point in time.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "contractId": "CONTRACT-001",
  "nodeId": "NODE-001",
  "captureType": "TRAINING_START",
  "dataHash": "0xabc123...",
  "metadata": {
    "trainingJobId": "JOB-001",
    "environmentId": "ENV-001",
    "timestamp": "2025-01-08T10:00:00Z",
    "dataSize": "11.2MB"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "captureId": "CAPTURE-001",
    "contractId": "CONTRACT-001",
    "nodeId": "NODE-001",
    "captureType": "TRAINING_START",
    "dataHash": "0xabc123...",
    "metadata": {
      "trainingJobId": "JOB-001",
      "environmentId": "ENV-001",
      "timestamp": "2025-01-08T10:00:00Z",
      "dataSize": "11.2MB"
    },
    "timestamp": "2025-01-08T10:00:00Z",
    "createdAt": "2025-01-08T10:00:00Z"
  }
}
```

### Get Provenance Capture
**GET** `/provenance/captures/{captureId}`

Retrieves details of a specific provenance capture.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "captureId": "CAPTURE-001",
    "contractId": "CONTRACT-001",
    "nodeId": "NODE-001",
    "captureType": "TRAINING_START",
    "dataHash": "0xabc123...",
    "metadata": {
      "trainingJobId": "JOB-001",
      "environmentId": "ENV-001",
      "timestamp": "2025-01-08T10:00:00Z",
      "dataSize": "11.2MB"
    },
    "timestamp": "2025-01-08T10:00:00Z",
    "createdAt": "2025-01-08T10:00:00Z"
  }
}
```

---

## ✅ **Provenance Verification**

### Verify Provenance Node
**POST** `/provenance/verify`

Verifies the integrity of a provenance node using Merkle proof.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "nodeId": "NODE-001",
  "proof": "0xproof123...",
  "rootHash": "0xabc123...",
  "verificationType": "MERKLE_PROOF"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verificationId": "VERIFY-001",
    "nodeId": "NODE-001",
    "verificationType": "MERKLE_PROOF",
    "status": "SUCCESS",
    "proof": "0xproof123...",
    "verifiedAt": "2025-01-08T10:00:00Z",
    "details": {
      "isValid": true,
      "verificationTime": "0.001s",
      "proofSize": "256 bytes"
    }
  }
}
```

### Get Verification Status
**GET** `/provenance/verifications/{verificationId}`

Retrieves the status of a provenance verification.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "verificationId": "VERIFY-001",
    "captureId": "CAPTURE-001",
    "verificationType": "MERKLE_PROOF",
    "status": "SUCCESS",
    "proof": "0xproof123...",
    "verifiedAt": "2025-01-08T10:00:00Z",
    "createdAt": "2025-01-08T10:00:00Z"
  }
}
```

---

## 🔗 **Provenance Chain & Lineage**

### Get Provenance Chain
**GET** `/provenance/chain/{contractId}`

Retrieves the complete provenance chain for a contract.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "contractId": "CONTRACT-001",
    "treeId": "TREE-001",
    "rootHash": "0xabc123...",
    "chain": [
      {
        "nodeId": "NODE-001",
        "nodeType": "DATASET",
        "level": 0,
        "position": 0,
        "dataHash": "0xdef456...",
        "captures": [
          {
            "captureId": "CAPTURE-001",
            "captureType": "TRAINING_START",
            "timestamp": "2025-01-08T10:00:00Z"
          }
        ]
      }
    ],
    "totalNodes": 15,
    "verifiedNodes": 15,
    "verificationRate": "100%"
  }
}
```

### Get Data Lineage
**GET** `/provenance/lineage/{datasetId}`

Retrieves the complete data lineage for a dataset.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "datasetId": "DATASET-001",
    "lineage": {
      "source": {
        "nodeId": "NODE-001",
        "nodeType": "DATASET",
        "dataHash": "0xdef456...",
        "metadata": {
          "datasetName": "MNIST",
          "size": "11.2MB",
          "recordCount": 70000
        }
      },
      "transformations": [
        {
          "nodeId": "NODE-002",
          "nodeType": "TRANSFORM",
          "operation": "DATA_PREPROCESSING",
          "dataHash": "0x789abc...",
          "timestamp": "2025-01-08T10:30:00Z"
        }
      ],
      "outputs": [
        {
          "nodeId": "NODE-003",
          "nodeType": "MODEL",
          "dataHash": "0x123def...",
          "metadata": {
            "modelName": "MNIST_CNN",
            "accuracy": "99.2%",
            "framework": "TensorFlow"
          }
        }
      ]
    },
    "verificationStatus": "VERIFIED",
    "lastVerified": "2025-01-08T12:00:00Z"
  }
}
```

---

## 📊 **Provenance Analytics**

### Get Provenance Statistics
**GET** `/provenance/stats`

Retrieves provenance tracking statistics.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `contractId` (optional): Filter by contract ID
- `timeRange` (optional): Time range filter (e.g., "7d", "30d", "90d")

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTrees": 25,
    "totalNodes": 1500,
    "totalCaptures": 5000,
    "totalVerifications": 4800,
    "verificationRate": "96%",
    "averageTreeDepth": 4.2,
    "averageNodesPerTree": 60,
    "timeRange": "30d",
    "trends": {
      "treesCreated": [5, 8, 12, 15, 18, 22, 25],
      "nodesAdded": [50, 80, 120, 150, 180, 220, 250],
      "verificationsCompleted": [45, 75, 115, 145, 175, 210, 240]
    }
  }
}
```

### Get Audit Trail
**GET** `/provenance/audit/{contractId}`

Retrieves the complete audit trail for a contract.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "contractId": "CONTRACT-001",
    "auditTrail": [
      {
        "timestamp": "2025-01-08T10:00:00Z",
        "action": "TREE_CREATED",
        "details": {
          "treeId": "TREE-001",
          "rootHash": "0xabc123...",
          "initiatedBy": "TDC-001"
        }
      },
      {
        "timestamp": "2025-01-08T10:30:00Z",
        "action": "NODE_ADDED",
        "details": {
          "nodeId": "NODE-001",
          "nodeType": "DATASET",
          "dataHash": "0xdef456...",
          "initiatedBy": "TDP-001"
        }
      }
    ],
    "totalEvents": 15,
    "verificationStatus": "COMPLETE",
    "lastUpdated": "2025-01-08T12:00:00Z"
  }
}
```

---

## 🚨 **Provenance Error Responses**

### Common Error Codes:

**400 Bad Request:**
```json
{
  "success": false,
  "error": "INVALID_REQUEST",
  "message": "Invalid request parameters",
  "details": {
    "field": "treeId",
    "issue": "Required field missing"
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Authentication required",
  "code": "TOKEN_MISSING"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Provenance tree not found",
  "details": {
    "treeId": "TREE-999"
  }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "INTERNAL_ERROR",
  "message": "Provenance service error",
  "requestId": "req-123456"
}
```

---

## 🔧 **Provenance Rate Limiting**

- **Standard endpoints**: 100 requests per minute
- **Verification endpoints**: 50 requests per minute
- **Analytics endpoints**: 20 requests per minute

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 📚 **Provenance Integration Examples**

### JavaScript/Node.js:
```javascript
const axios = require('axios');

const provenanceAPI = axios.create({
  baseURL: 'https://api.contractmanagement.com/api/provenance',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  }
});

// Create a Merkle tree
const createTree = async (contractId) => {
  const response = await provenanceAPI.post('/trees', {
    contractId,
    treeType: 'BINARY_MERKLE_TREE',
    hashAlgorithm: 'SHA256',
    maxDepth: 10
  });
  return response.data;
};
```

### Python:
```python
import requests

class ProvenanceClient:
    def __init__(self, base_url, jwt_token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {jwt_token}',
            'Content-Type': 'application/json'
        }
    
    def create_tree(self, contract_id):
        response = requests.post(
            f'{self.base_url}/api/provenance/trees',
            json={
                'contractId': contract_id,
                'treeType': 'BINARY_MERKLE_TREE',
                'hashAlgorithm': 'SHA256',
                'maxDepth': 10
            },
            headers=self.headers
        )
        return response.json()
```

---

## 🔄 **Provenance Webhook Events**

The provenance system can send webhook notifications for important events:

### Available Events:
- `tree.created` - Merkle tree created
- `node.added` - Node added to tree
- `capture.created` - Provenance data captured
- `verification.completed` - Verification completed
- `verification.failed` - Verification failed

### Webhook Payload:
```json
{
  "event": "verification.completed",
  "timestamp": "2025-01-08T10:00:00Z",
  "data": {
    "verificationId": "VERIFY-001",
    "nodeId": "NODE-001",
    "status": "SUCCESS",
    "contractId": "CONTRACT-001"
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
  "scittTransaction": {
    "transactionHash": "DID_TX_1704067200000_did_web_mukeshjoshidpi_github_io",
    "message": "DID signature recorded on SCITT CCF ledger",
    "mode": "SCITT_CCF_ONLY"
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
- **SCITT CCF Mode:** High-performance ledger operation with confidential computing
- **Enterprise Security:** Role-based access control and audit logging
- **Multi-Cloud Security:** Cross-cloud security isolation and verification
- **Provenance Security:** Tamper-proof provenance tracking with Merkle trees

---

## Enhanced Encryption System

The system provides intelligent encryption that automatically selects the optimal method based on file size and type.

### Encryption Method Selection

| File Size | Method | Throughput | Memory Usage | Use Case |
|-----------|--------|------------|--------------|----------|
| < 100MB | In-Memory | 500 MB/s | File size × 2 | JSON, config files |
| 100MB-1GB | Streaming | 200 MB/s | 64KB chunks | CSV, log files |
| > 1GB | **LUKS** | **1000+ MB/s** | **64KB blocks** | **Large datasets, models** |

### Get Encryption Methods
**GET** `/enhanced-encryption/methods`

Get available encryption methods and their capabilities.

**Response:**
```json
{
  "success": true,
  "methods": {
    "memory": {
      "name": "In-Memory Encryption",
      "description": "Fast encryption for small files (< 100MB)",
      "maxSize": "100MB",
      "advantages": ["Fast", "Simple", "Low memory overhead"],
      "useCases": ["JSON data", "Small text files", "Configuration files"]
    },
    "streaming": {
      "name": "Streaming Encryption",
      "description": "Chunked encryption for medium files (100MB - 1GB)",
      "maxSize": "1GB",
      "advantages": ["Memory efficient", "Progress tracking", "Resumable"],
      "useCases": ["CSV files", "Log files", "Medium datasets"]
    },
    "luks": {
      "name": "LUKS Encryption",
      "description": "Hardware-accelerated encryption for large files (> 1GB)",
      "maxSize": "10GB+",
      "advantages": ["Hardware acceleration", "Industry standard", "High performance"],
      "useCases": ["Large datasets", "Model files", "Binary data"]
    }
  },
  "autoSelection": "The system automatically selects the best method based on file size",
  "timestamp": "2024-12-15T00:00:00.000Z"
}
```

### Encrypt Data
**POST** `/enhanced-encryption/encrypt-data`

Encrypt data with automatic method selection.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "data": {
    "sensitive": "test data",
    "value": 123
  },
  "dataType": "TRAINING_DATA"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "method": "memory",
    "encryptedData": {
      "encrypted": "a1b2c3d4...",
      "iv": "e5f6g7h8...",
      "tag": "i9j0k1l2...",
      "keyId": "TRAINING_DATA_1704067200000",
      "algorithm": "aes-256-gcm",
      "timestamp": "2024-12-15T00:00:00.000Z"
    },
    "originalSize": 25,
    "encryptedSize": 89
  },
  "message": "Data encrypted successfully"
}
```

### Encrypt File
**POST** `/enhanced-encryption/encrypt-file`

Encrypt uploaded file with automatic method selection.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body:**
- `file`: File upload (multipart)
- `dataType`: String (e.g., "TRAINING_DATA", "MODEL", "DATASET")

**Response (Small File - Memory Method):**
```json
{
  "success": true,
  "data": {
    "method": "memory",
    "encryptedData": {
      "encrypted": "a1b2c3d4...",
      "iv": "e5f6g7h8...",
      "tag": "i9j0k1l2...",
      "keyId": "TRAINING_DATA_1704067200000",
      "algorithm": "aes-256-gcm",
      "timestamp": "2024-12-15T00:00:00.000Z"
    },
    "originalSize": 1024000,
    "encryptedSize": 1024128
  },
  "message": "File encrypted successfully"
}
```

**Response (Large File - LUKS Method):**
```json
{
  "success": true,
  "data": {
    "method": "luks",
    "containerPath": "/tmp/luks-containers/dataset-1704067200000.luks",
    "originalSize": 2147483648,
    "containerSize": 2362232012,
    "algorithm": "LUKS",
    "cipher": "aes-xts-plain64",
    "hash": "sha256",
    "keySize": 256,
    "metadata": {
      "keyId": "TRAINING_DATA_1704067200000",
      "tdpId": "TDP-123",
      "fileName": "large_dataset.zip",
      "timestamp": "2024-12-15T00:00:00.000Z"
    }
  },
  "message": "File encrypted successfully"
}
```

### Decrypt Data
**POST** `/enhanced-encryption/decrypt-data`

Decrypt data with automatic method detection.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "encryptedData": {
    "method": "luks",
    "containerPath": "/tmp/luks-containers/dataset-1704067200000.luks",
    "dataType": "TRAINING_DATA"
  },
  "accessToken": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "data": "decrypted data content",
    "method": "luks",
    "extractedSize": 2147483648
  },
  "message": "Data decrypted successfully"
}
```

### Get Encryption Status
**GET** `/enhanced-encryption/status`

Get enhanced encryption service status and statistics.

**Response:**
```json
{
  "success": true,
  "service": "Enhanced Platform Encryption",
  "statistics": {
    "thresholds": {
      "small": 104857600,
      "medium": 1073741824,
      "large": 10737418240
    },
    "supportedTypes": ["json", "text", "binary", "image", "archive"],
    "methods": ["memory", "streaming", "luks"],
    "luksAvailable": true
  },
  "timestamp": "2024-12-15T00:00:00.000Z"
}
```

### Performance Test
**POST** `/enhanced-encryption/test-performance`

Test encryption performance with different methods (Admin only).

**Headers:**
- `Authorization: Bearer <admin-token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "testSizes": [1024, 1048576, 10485760, 104857600]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "size": 1024,
      "method": "memory",
      "duration": 5,
      "throughput": 204800,
      "success": true
    },
    {
      "size": 1048576,
      "method": "memory",
      "duration": 12,
      "throughput": 87381,
      "success": true
    },
    {
      "size": 10485760,
      "method": "streaming",
      "duration": 45,
      "throughput": 232794,
      "success": true
    },
    {
      "size": 104857600,
      "method": "luks",
      "duration": 120,
      "throughput": 873813,
      "success": true
    }
  ],
  "timestamp": "2024-12-15T00:00:00.000Z"
}
```

### LUKS Security Features

- **AES-256-XTS**: Industry-standard encryption algorithm
- **SHA-256**: Secure hash function for key derivation
- **PBKDF2**: 100,000 iterations for key derivation
- **Hardware Acceleration**: CPU AES-NI instructions for 10x+ performance
- **Random IVs**: Unique initialization vectors per container
- **Key Rotation**: Automatic key rotation every 30 days
- **TEE Integration**: Keys only accessible in secure environments

### Training Integration

The training code automatically handles LUKS-encrypted files:

```python
# Training code detects encrypted data
encrypted_data = self.config.get('encryptedData')
if encrypted_data:
    return self.load_encrypted_data(encrypted_data)

# LUKS decryption in TEE
decryptor = LUKSDecryptor(backend_url, access_token)
result = decryptor.decrypt_file(encrypted_data, output_path)
```

---

## Support

For API support and questions:
- Email: support@contractmanagement.com
- Documentation: https://docs.contractmanagement.com
- GitHub Issues: https://github.com/gitmujoshi/ContractManagement/issues 