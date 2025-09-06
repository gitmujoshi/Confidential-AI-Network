# ContractFlow Pro - Complete API Specifications

## 📋 Overview

This document provides comprehensive API specifications for the ContractFlow Pro system, covering all endpoints, authentication mechanisms, request/response formats, and examples. The system implements a multi-tenant, multi-cloud contract management platform with Ricardian contracts and confidential computing capabilities.

## 🔐 Authentication & Authorization

### JWT Token Authentication
```http
Authorization: Bearer <jwt_token>
```

### User Roles
- **AppAdmin**: System administrators with full access
- **TDP**: Training Data Provider (dataset owners)
- **TDC**: Training Data Consumer (contract initiators)
- **CCRP**: Confidential Clean Room Provider (runtime environment)

## 🏗️ API Base URLs

- **Development**: `http://localhost:5001/api`
- **Production**: `https://api.contractflowpro.com/api`
- **Health Check**: `/health`

---

## 📊 Core API Endpoints

### 1. Health & System Status

#### GET `/health`
**Description**: System health check and status information

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-11T16:00:46.645Z",
  "uptime": 135.068862834,
  "memory": {
    "rss": 96518144,
    "heapTotal": 34029568,
    "heapUsed": 27507648
  },
  "version": "1.0.0"
}
```

---

## 🔐 Authentication API

### 1. User Authentication

#### POST `/api/auth/login`
**Description**: User login with email/password

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "partyType": "TDC",
    "did": "did:web:example.com:user:123"
  }
}
```

#### POST `/api/auth/register`
**Description**: User registration

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "partyType": "TDC",
  "organization": "AI Training Corp"
}
```

#### GET `/api/auth/profile`
**Description**: Get current user profile

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "user@example.com",
  "partyType": "TDC",
  "organization": "AI Training Corp",
  "did": "did:web:example.com:user:123",
  "walletAddress": "0x1234...",
  "createdAt": "2025-08-11T10:00:00.000Z"
}
```

---

## 📋 Contract Management API

### 1. Ricardian Contract Creation

#### POST `/api/contracts/ricardian`
**Description**: Create a new Ricardian contract (TDC only)

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "datasetSelections": [
    {
      "datasetId": "DS-001",
      "individualPrice": 1000
    },
    {
      "datasetId": "DS-002", 
      "individualPrice": 1500
    }
  ],
  "duration": 30,
  "termsAndConditions": "Custom terms and conditions...",
  "contractType": "AI_TRAINING",
  "ccrpId": 3,
  "privacyRequirements": {
    "maxPrivacyLoss": 0.1,
    "minAccuracy": 0.85,
    "differentialPrivacy": true,
    "federatedLearning": false
  },
  "trainingEnvironment": {
    "computeType": "confidential-vm",
    "memoryGB": 32,
    "cpuCores": 8,
    "gpuType": "V100",
    "gpuCount": 2
  },
  "complianceSpecs": {
    "regulations": ["GDPR", "DPDP_2023"],
    "dataRetentionDays": 90,
    "auditLogging": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "contract": {
    "id": 1,
    "contractId": "RICARDIAN-1733928000000-abc123",
    "status": "PENDING_TDP_APPROVAL",
    "tdpId": 1,
    "tdcId": 2,
    "price": 2500,
    "duration": 30,
    "createdAt": "2025-08-11T16:00:00.000Z"
  },
  "legalDocument": {
    "title": "AI Model Training Agreement",
    "metadata": {
      "contractType": "AI_TRAINING_CONTRACT",
      "version": "1.0.0"
    }
  },
  "smartContractData": {
    "address": "0x1234...",
    "network": "localhost",
    "contractId": 12345
  }
}
```

### 2. Contract Management

#### GET `/api/contracts`
**Description**: List all contracts (with pagination)

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status
- `partyType`: Filter by party type

**Response**:
```json
{
  "contracts": [
    {
      "id": 1,
      "contractId": "RICARDIAN-1733928000000-abc123",
      "status": "PENDING_TDP_APPROVAL",
      "tdpId": 1,
      "tdcId": 2,
      "price": 2500,
      "duration": 30,
      "createdAt": "2025-08-11T16:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

#### GET `/api/contracts/:id`
**Description**: Get contract details by ID

**Response**:
```json
{
  "id": 1,
  "contractId": "RICARDIAN-1733928000000-abc123",
  "status": "PENDING_TDP_APPROVAL",
  "tdpId": 1,
  "tdcId": 2,
  "ccrpId": 3,
  "price": 2500,
  "duration": 30,
  "termsAndConditions": "Custom terms...",
  "legalDocumentHash": "0x1234...",
  "ricardianSignature": "0x5678...",
  "smartContractAddress": "0x9abc...",
  "createdAt": "2025-08-11T16:00:00.000Z",
  "tdp": { "name": "Data Provider Corp" },
  "tdc": { "name": "AI Training Corp" },
  "ccrp": { "name": "Secure Cloud LLC" }
}
```

#### PUT `/api/contracts/:id`
**Description**: Update contract (limited fields)

**Request Body**:
```json
{
  "status": "SIGNED",
  "tdpSigned": true,
  "tdpSignedAt": "2025-08-11T16:30:00.000Z"
}
```

### 3. Contract Preview (No Authentication)

#### POST `/api/contracts/ricardian/multi-tdp-preview-test`
**Description**: Preview Ricardian contract without authentication

**Request Body**:
```json
{
  "datasetSelections": [
    {
      "datasetId": "DS-001",
      "individualPrice": 1000
    }
  ],
  "duration": 30,
  "termsAndConditions": "Preview terms...",
  "contractType": "AI_TRAINING"
}
```

**Response**:
```json
{
  "legalDocument": {
    "title": "AI Model Training Agreement",
    "metadata": {
      "contractType": "AI_TRAINING_CONTRACT",
      "version": "1.0.0"
    }
  },
  "smartContract": {
    "address": null,
    "state": {
      "contractId": "PREVIEW-123",
      "legalDocumentHash": null
    }
  }
}
```

---

## 📊 Dataset Management API

### 1. Dataset Operations

#### GET `/api/datasets/public`
**Description**: Get public datasets for browsing

**Query Parameters**:
- `category`: Filter by category
- `priceRange`: Filter by price range
- `size`: Filter by dataset size

**Response**:
```json
{
  "datasets": [
    {
      "id": 1,
      "datasetId": "DS-001",
      "name": "Customer Behavior Dataset",
      "description": "Comprehensive customer behavior data...",
      "category": "CUSTOMER_DATA",
      "size": "2.5 GB",
      "recordCount": 1000000,
      "price": 1000,
      "license": "COMMERCIAL_USE",
      "owner": {
        "name": "Data Provider Corp",
        "partyType": "TDP"
      }
    }
  ],
  "total": 1
}
```

#### GET `/api/tdp/datasets/:userId`
**Description**: Get datasets owned by TDP user

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "datasets": [
    {
      "id": 1,
      "datasetId": "DS-001",
      "name": "Customer Behavior Dataset",
      "status": "ACTIVE",
      "price": 1000,
      "createdAt": "2025-08-11T10:00:00.000Z"
    }
  ]
}
```

#### POST `/api/datasets`
**Description**: Create new dataset (TDP only)

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "New Dataset",
  "description": "Dataset description...",
  "category": "CUSTOMER_DATA",
  "size": "1.0 GB",
  "recordCount": 500000,
  "price": 800,
  "license": "COMMERCIAL_USE",
  "confidentialComputingRequired": true
}
```

---

## 🏗️ Infrastructure & Cloud API

### 1. Training Environment Management

#### POST `/api/infrastructure/environments`
**Description**: Create training environment

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "contractId": "CONTRACT-001",
  "cloudProvider": "AZURE",
  "region": "eastus",
  "vmSize": "Standard_D2s_v3",
  "vmCount": 2,
  "enableGPU": true,
  "gpuType": "V100",
  "gpuCount": 1,
  "enableConfidentialComputing": true,
  "enableEncryption": true,
  "complianceFramework": "GDPR"
}
```

**Response**:
```json
{
  "success": true,
  "environment": {
    "id": 1,
    "environmentId": "env-CONTRACT-001-1733928000000",
    "contractId": "CONTRACT-001",
    "cloudProvider": "AZURE",
    "region": "eastus",
    "status": "PROVISIONING",
    "costEstimate": 150.00,
    "createdAt": "2025-08-11T16:00:00.000Z"
  }
}
```

#### GET `/api/infrastructure/environments/:environmentId`
**Description**: Get environment status and details

**Response**:
```json
{
  "id": 1,
  "environmentId": "env-CONTRACT-001-1733928000000",
  "status": "ACTIVE",
  "cloudProvider": "AZURE",
  "region": "eastus",
  "resources": {
    "vms": [
      {
        "id": "vm-001",
        "name": "training-vm-1",
        "status": "RUNNING",
        "ipAddress": "10.0.1.10"
      }
    ],
    "storage": {
      "total": "100 GB",
      "used": "25 GB"
    }
  },
  "costs": {
    "current": 45.50,
    "estimated": 150.00
  }
}
```

#### DELETE `/api/infrastructure/environments/:environmentId`
**Description**: Destroy training environment

**Response**:
```json
{
  "success": true,
  "message": "Environment destruction initiated",
  "estimatedTime": "5-10 minutes"
}
```

### 2. Cloud Provider Management

#### GET `/api/ccrp/cloud-providers/:userId`
**Description**: Get CCRP cloud provider configuration

**Response**:
```json
{
  "cloudProviders": ["AWS", "Azure", "GCP"],
  "description": "Multi-cloud confidential computing provider",
  "defaultLocation": "eastus",
  "defaultVMSize": "Standard_D2s_v3"
}
```

#### PUT `/api/ccrp/cloud-providers/:userId`
**Description**: Update CCRP cloud provider configuration

**Request Body**:
```json
{
  "cloudProviders": ["AWS", "Azure"],
  "description": "Updated description",
  "defaultLocation": "us-east-1",
  "defaultVMSize": "t3.medium"
}
```

---

## 🔐 Secret Management API

### 1. Cloud Credentials

#### POST `/api/ccrp/cloud-credentials`
**Description**: Store cloud provider credentials

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "cloudProvider": "AZURE",
  "secretManager": "VAULT",
  "authMethod": "SERVICE_PRINCIPAL",
  "defaultLocation": "eastus",
  "defaultResourceGroupPrefix": "training",
  "defaultVMSize": "Standard_D2s_v3",
  "enableEncryption": true,
  "enableMonitoring": true
}
```

**Response**:
```json
{
  "success": true,
  "credential": {
    "id": 1,
    "cloudProvider": "AZURE",
    "secretManager": "VAULT",
    "secretName": "azure-credentials-001",
    "validationStatus": "PENDING",
    "createdAt": "2025-08-11T16:00:00.000Z"
  }
}
```

#### GET `/api/ccrp/cloud-credentials/:userId`
**Description**: Get stored cloud credentials

**Response**:
```json
{
  "credentials": [
    {
      "id": 1,
      "cloudProvider": "AZURE",
      "secretManager": "VAULT",
      "secretName": "azure-credentials-001",
      "validationStatus": "VALID",
      "lastValidated": "2025-08-11T16:00:00.000Z"
    }
  ]
}
```

#### POST `/api/ccrp/cloud-credentials/:id/validate`
**Description**: Validate cloud credentials

**Response**:
```json
{
  "success": true,
  "validation": {
    "status": "VALID",
    "services": {
      "compute": "✅ Available",
      "storage": "✅ Available",
      "networking": "✅ Available",
      "security": "✅ Available"
    },
    "lastValidated": "2025-08-11T16:00:00.000Z"
  }
}
```

---

## 👥 User Management API

### 1. User Operations

#### GET `/api/users`
**Description**: List all users (Admin only)

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "partyType": "TDC",
      "organization": "AI Training Corp",
      "status": "ACTIVE",
      "createdAt": "2025-08-11T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

#### GET `/api/users/:id`
**Description**: Get user details by ID

**Response**:
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "user@example.com",
  "partyType": "TDC",
  "organization": "AI Training Corp",
  "did": "did:web:example.com:user:123",
  "walletAddress": "0x1234...",
  "status": "ACTIVE",
  "createdAt": "2025-08-11T10:00:00.000Z"
}
```

---

## 📊 Dashboard API

### 1. TDC Dashboard

#### GET `/api/tdc/dashboard/:userId`
**Description**: Get TDC dashboard data

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "partyType": "TDC"
  },
  "datasets": [
    {
      "id": 1,
      "name": "Customer Dataset",
      "category": "CUSTOMER_DATA",
      "price": 1000
    }
  ],
  "contracts": [
    {
      "id": 1,
      "contractId": "CONTRACT-001",
      "status": "ACTIVE",
      "price": 2500
    }
  ],
  "training": [
    {
      "id": 1,
      "status": "ACTIVE",
      "progress": 75
    }
  ],
  "payments": {
    "totalSpent": 5000,
    "pendingPayments": 1000
  }
}
```

### 2. TDP Dashboard

#### GET `/api/tdp/dashboard/:userId`
**Description**: Get TDP dashboard data

**Response**:
```json
{
  "user": {
    "id": 2,
    "name": "Data Provider Corp",
    "partyType": "TDP"
  },
  "datasets": [
    {
      "id": 1,
      "name": "Customer Dataset",
      "status": "ACTIVE",
      "price": 1000,
      "downloads": 5
    }
  ],
  "contracts": [
    {
      "id": 1,
      "contractId": "CONTRACT-001",
      "status": "ACTIVE",
      "price": 2500
    }
  ],
  "payments": {
    "totalEarned": 5000,
    "pendingPayments": 1000
  },
  "analytics": {
    "totalDownloads": 25,
    "totalRevenue": 15000
  }
}
```

### 3. CCRP Dashboard

#### GET `/api/ccrp/dashboard/:userId`
**Description**: Get CCRP dashboard data

**Response**:
```json
{
  "user": {
    "id": 3,
    "name": "Secure Cloud LLC",
    "partyType": "CCRP",
    "cloudProviders": ["AWS", "Azure"]
  },
  "environments": [
    {
      "id": 1,
      "status": "ACTIVE",
      "cloudProvider": "AZURE",
      "region": "eastus"
    }
  ],
  "activeContracts": [
    {
      "id": 1,
      "contractId": "CONTRACT-001",
      "status": "ACTIVE"
    }
  ],
  "resourceUtilization": {
    "cpu": 65,
    "memory": 45,
    "storage": 30
  },
  "securityMetrics": {
    "attestationStatus": "VERIFIED",
    "encryptionStatus": "ENABLED",
    "complianceStatus": "COMPLIANT"
  }
}
```

---

## 🔍 Search & Discovery API

### 1. Dataset Search

#### GET `/api/datasets/search`
**Description**: Search datasets with filters

**Query Parameters**:
- `q`: Search query
- `category`: Dataset category
- `priceMin`: Minimum price
- `priceMax`: Maximum price
- `sizeMin`: Minimum size
- `sizeMax`: Maximum size
- `license`: License type

**Response**:
```json
{
  "datasets": [
    {
      "id": 1,
      "name": "Customer Behavior Dataset",
      "category": "CUSTOMER_DATA",
      "price": 1000,
      "size": "2.5 GB",
      "score": 0.95
    }
  ],
  "total": 1,
  "facets": {
    "categories": [
      { "name": "CUSTOMER_DATA", "count": 5 },
      { "name": "FINANCIAL_DATA", "count": 3 }
    ],
    "priceRanges": [
      { "range": "0-500", "count": 2 },
      { "range": "500-1000", "count": 3 }
    ]
  }
}
```

---

## 📈 Analytics & Reporting API

### 1. Contract Analytics

#### GET `/api/analytics/contracts`
**Description**: Get contract analytics

**Query Parameters**:
- `startDate`: Start date (ISO format)
- `endDate`: End date (ISO format)
- `partyType`: Filter by party type

**Response**:
```json
{
  "totalContracts": 150,
  "activeContracts": 45,
  "completedContracts": 95,
  "totalValue": 250000,
  "averageContractValue": 1667,
  "monthlyTrends": [
    {
      "month": "2025-08",
      "contracts": 25,
      "value": 45000
    }
  ],
  "topCategories": [
    {
      "category": "AI_TRAINING",
      "contracts": 80,
      "value": 120000
    }
  ]
}
```

---

## 🚨 Error Handling

### Standard Error Response Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  },
  "timestamp": "2025-08-11T16:00:00.000Z"
}
```

### Common Error Codes
- `AUTHENTICATION_FAILED`: Invalid or expired token
- `AUTHORIZATION_DENIED`: Insufficient permissions
- `VALIDATION_ERROR`: Invalid request data
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `INTERNAL_ERROR`: Server error

---

## 📚 API Versioning

### Version Header
```http
Accept: application/vnd.contractflowpro.v1+json
```

### Current Version: v1.0.0

---

## 🔒 Rate Limiting

### Limits
- **Authentication endpoints**: 5 requests per minute
- **Contract creation**: 10 requests per hour
- **General API**: 100 requests per minute per user

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1733928600
```

---

## 📖 API Documentation

### Interactive Documentation
- **Swagger UI**: Available at `/api/docs` (when enabled)
- **OpenAPI Specification**: Available at `/api/openapi.json`

### SDKs & Libraries
- **JavaScript/Node.js**: Available via npm
- **Python**: Available via pip
- **Java**: Available via Maven
- **C#**: Available via NuGet

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-08-11  
**API Version**: v1.0.0  
**Status**: Complete API Specifications 