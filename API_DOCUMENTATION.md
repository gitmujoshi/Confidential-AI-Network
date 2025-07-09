# Contract Management System API Documentation

**Version:** 2.0.0  
**Base URL:** `http://localhost:5001/api`  
**Last Updated:** July 8, 2024

## Table of Contents

1. [Authentication & User Management](#authentication--user-management)
2. [DID (Decentralized Identifier) Management](#did-decentralized-identifier-management)
3. [Contract Management](#contract-management)
4. [Dataset Management](#dataset-management)
5. [DPDP (Digital Personal Data Protection) Compliance](#dpdp-digital-personal-data-protection-compliance)
6. [User Management (AppAdmin)](#user-management-appadmin)
7. [Notification System](#notification-system)
8. [Error Handling](#error-handling)

---

## Authentication & User Management

### User Registration
**POST** `/auth/register`

Register a new user with support for both `did:ethr` and `did:web` methods.

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
  "didVerificationSignature": "0xsignature..."
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
    "isRegistered": true
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
    "didVerified": true
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

Update user profile information.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "description": "Updated description",
  "organization": "Updated Organization",
  "phoneNumber": "+1-555-5678",
  "website": "https://updatedwebsite.com",
  "location": "New York, NY"
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
    "organization": "Updated Organization"
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
    "verifiedAt": "2024-07-08T18:00:00.000Z"
  }
}
```

### Get DID Information
**GET** `/did/info/:did`

Get detailed information about a specific DID.

**Response:**
```json
{
  "success": true,
  "didInfo": {
    "did": "did:web:mukeshjoshidpi.github.io",
    "method": "web",
    "identifier": "mukeshjoshidpi.github.io",
    "verificationMethods": [...],
    "authentication": [...],
    "assertionMethod": [...],
    "created": "2024-01-01T00:00:00Z",
    "updated": "2024-01-01T00:00:00Z"
  }
}
```

### Resolve DID Document
**GET** `/did/resolve/:did`

Resolve a DID to its document.

**Response:**
```json
{
  "success": true,
  "did": "did:web:mukeshjoshidpi.github.io",
  "didDocument": {
    "@context": "https://www.w3.org/ns/did/v1",
    "id": "did:web:mukeshjoshidpi.github.io",
    "verificationMethod": [...],
    "authentication": [...]
  },
  "metadata": {
    "method": "web",
    "domain": "mukeshjoshidpi.github.io",
    "resolved": true
  }
}
```

### Check DID Availability
**GET** `/did/check/:did`

Check if a DID is available for registration.

**Response:**
```json
{
  "success": true,
  "available": true,
  "did": "did:web:example.com:user:john"
}
```

### Get Supported DID Methods
**GET** `/did/supported-methods`

Get list of supported DID methods.

**Response:**
```json
{
  "success": true,
  "methods": [
    {
      "method": "web",
      "description": "Web-based DIDs",
      "example": "did:web:example.com:user:john"
    },
    {
      "method": "ethr",
      "description": "Ethereum-based DIDs",
      "example": "did:ethr:0x1234567890abcdef..."
    }
  ]
}
```

### Create System DID
**POST** `/did/create-system`

Create a system-generated DID (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "walletAddress": "0x1234567890abcdef...",
  "method": "ethr",
  "network": "goerli"
}
```

**Response:**
```json
{
  "success": true,
  "did": "did:ethr:goerli:0x1234567890abcdef...",
  "method": "ethr",
  "walletAddress": "0x1234567890abcdef...",
  "network": "goerli"
}
```

---

## Contract Management

### Get User Contracts
**GET** `/contracts/user/:userId`

Get all contracts for a specific user.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (string): Filter by contract status
- `limit` (number): Number of contracts to return (default: 10)
- `offset` (number): Number of contracts to skip (default: 0)

**Response:**
```json
{
  "contracts": [
    {
      "contractId": 1,
      "title": "Data Sharing Agreement",
      "status": "PENDING_TDC_APPROVAL",
      "price": "1000 ETH",
      "duration": 365,
      "tdp": {
        "id": 1,
        "name": "Data Provider",
        "email": "provider@example.com",
        "did": "did:web:provider.com"
      },
      "tdc": {
        "id": 2,
        "name": "Data Consumer",
        "email": "consumer@example.com",
        "did": "did:web:consumer.com"
      },
      "ccrp": {
        "id": 3,
        "name": "CCRP Provider",
        "email": "ccrp@example.com",
        "did": "did:web:ccrp.com"
      },
      "dataset": {
        "id": 1,
        "name": "Training Dataset",
        "description": "High-quality training data"
      }
    }
  ],
  "total": 5,
  "limit": 10,
  "offset": 0
}
```

### Get Specific Contract
**GET** `/contracts/:contractId`

Get detailed information about a specific contract.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "contractId": 1,
  "title": "Data Sharing Agreement",
  "description": "Contract for sharing training data",
  "status": "PENDING_TDC_APPROVAL",
  "price": "1000 ETH",
  "duration": 365,
  "termsAndConditions": "Contract terms...",
  "tdp": {
    "id": 1,
    "name": "Data Provider",
    "email": "provider@example.com",
    "did": "did:web:provider.com"
  },
  "tdc": {
    "id": 2,
    "name": "Data Consumer",
    "email": "consumer@example.com",
    "did": "did:web:consumer.com"
  },
  "ccrp": {
    "id": 3,
    "name": "CCRP Provider",
    "email": "ccrp@example.com",
    "did": "did:web:ccrp.com"
  },
  "dataset": {
    "id": 1,
    "name": "Training Dataset",
    "description": "High-quality training data",
    "price": "500 ETH"
  }
}
```

### Create Contract
**POST** `/contracts`

Create a new contract (TDC only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "tdpId": 1,
  "datasetId": 1,
  "modelId": "gpt-4",
  "price": "1000 ETH",
  "duration": 365,
  "termsAndConditions": "Contract terms and conditions...",
  "ccrpId": 3
}
```

**Response:**
```json
{
  "success": true,
  "contract": {
    "contractId": 1,
    "status": "PENDING_CCRP_APPROVAL",
    "tdpSigned": true,
    "tdpSignedAt": "2024-07-08T18:00:00.000Z"
  },
  "blockchainTransaction": {
    "transactionHash": "0x1234567890abcdef...",
    "blockNumber": 12345
  }
}
```

### Sign Contract
**POST** `/contracts/:contractId/sign`

Sign a contract using wallet or DID-based signing.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "did": "did:web:mukeshjoshidpi.github.io",
  "signature": "0xsignature...",
  "method": "did:web"
}
```

**Response:**
```json
{
  "success": true,
  "contract": {
    "contractId": 1,
    "status": "SIGNED",
    "tdcSigned": true,
    "tdcSignedAt": "2024-07-08T18:00:00.000Z"
  },
  "blockchainTransaction": {
    "transactionHash": "0x1234567890abcdef...",
    "blockNumber": 12346
  }
}
```

### Select CCRP
**POST** `/contracts/:contractId/select-ccrp`

Select a CCRP for contract review.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "ccrpId": 3
}
```

**Response:**
```json
{
  "success": true,
  "contract": {
    "contractId": 1,
    "status": "PENDING_CCRP_APPROVAL",
    "ccrpId": 3
  }
}
```

---

## Dataset Management

### Get Public Datasets
**GET** `/datasets/public`

Get all publicly available datasets.

**Query Parameters:**
- `category` (string): Filter by dataset category
- `owner` (string): Filter by dataset owner
- `limit` (number): Number of datasets to return
- `offset` (number): Number of datasets to skip

**Response:**
```json
{
  "success": true,
  "datasets": [
    {
      "datasetId": 1,
      "name": "Training Dataset 1",
      "description": "High-quality training data for AI models",
      "category": "TEXT",
      "size": "1GB",
      "format": "JSON",
      "price": "500 ETH",
      "owner": {
        "id": 1,
        "name": "Data Provider",
        "email": "provider@example.com",
        "did": "did:web:provider.com"
      },
      "createdAt": "2024-07-08T18:00:00.000Z"
    }
  ],
  "total": 10,
  "limit": 10,
  "offset": 0
}
```

### Get Specific Dataset
**GET** `/datasets/:datasetId`

Get detailed information about a specific dataset.

**Response:**
```json
{
  "success": true,
  "dataset": {
    "datasetId": 1,
    "name": "Training Dataset 1",
    "description": "High-quality training data for AI models",
    "category": "TEXT",
    "size": "1GB",
    "format": "JSON",
    "price": "500 ETH",
    "metadata": {
      "language": "English",
      "domain": "Technology",
      "quality": "High"
    },
    "owner": {
      "id": 1,
      "name": "Data Provider",
      "email": "provider@example.com",
      "did": "did:web:provider.com"
    },
    "createdAt": "2024-07-08T18:00:00.000Z"
  }
}
```

### Create Dataset
**POST** `/datasets`

Create a new dataset (TDP only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "New Training Dataset",
  "description": "High-quality training data",
  "category": "TEXT",
  "size": "2GB",
  "format": "JSON",
  "price": "750 ETH",
  "metadata": {
    "language": "English",
    "domain": "Technology",
    "quality": "High"
  }
}
```

**Response:**
```json
{
  "success": true,
  "dataset": {
    "datasetId": 2,
    "name": "New Training Dataset",
    "description": "High-quality training data",
    "category": "TEXT",
    "size": "2GB",
    "format": "JSON",
    "price": "750 ETH",
    "ownerId": 1,
    "createdAt": "2024-07-08T18:00:00.000Z"
  }
}
```

### Update Dataset
**PUT** `/datasets/:datasetId`

Update dataset information.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Dataset Name",
  "description": "Updated description",
  "price": "600 ETH"
}
```

**Response:**
```json
{
  "success": true,
  "dataset": {
    "datasetId": 1,
    "name": "Updated Dataset Name",
    "description": "Updated description",
    "price": "600 ETH"
  }
}
```

### Delete Dataset
**DELETE** `/datasets/:datasetId`

Soft delete a dataset.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Dataset deleted successfully"
}
```

### Search Datasets
**GET** `/datasets/search`

Search datasets by various criteria.

**Query Parameters:**
- `q` (string): Search query
- `category` (string): Filter by category
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `format` (string): Filter by format

**Response:**
```json
{
  "success": true,
  "datasets": [...],
  "total": 5,
  "query": "training data"
}
```

### Get Dataset Categories
**GET** `/datasets/categories/list`

Get list of available dataset categories.

**Response:**
```json
{
  "success": true,
  "categories": [
    "TEXT",
    "IMAGE",
    "AUDIO",
    "VIDEO",
    "TABULAR",
    "MULTIMODAL"
  ]
}
```

### Get Dataset Statistics
**GET** `/datasets/stats/overview`

Get dataset statistics overview.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalDatasets": 50,
    "totalSize": "100GB",
    "averagePrice": "500 ETH",
    "categories": {
      "TEXT": 20,
      "IMAGE": 15,
      "AUDIO": 10,
      "VIDEO": 5
    }
  }
}
```

---

## DPDP (Digital Personal Data Protection) Compliance

### Get Personal Data
**GET** `/dpdp/personal-data`

Get user's personal data (Right to Access).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "personalInfo": {
      "name": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "+1-555-1234"
    },
    "contracts": [...],
    "datasets": [...],
    "consents": [...]
  },
  "timestamp": "2024-07-08T18:00:00.000Z"
}
```

### Update Personal Data
**PUT** `/dpdp/personal-data`

Update personal data (Right to Correction).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "phoneNumber": "+1-555-5678"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Personal data updated successfully",
  "updatedFields": ["name", "phoneNumber"],
  "timestamp": "2024-07-08T18:00:00.000Z"
}
```

### Delete Personal Data
**DELETE** `/dpdp/personal-data`

Delete personal data (Right to Erasure).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Personal data deleted successfully",
  "timestamp": "2024-07-08T18:00:00.000Z"
}
```

### Export Personal Data
**GET** `/dpdp/export`

Export personal data (Right to Data Portability).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "personalInfo": {...},
    "contracts": [...],
    "datasets": [...],
    "consents": [...],
    "grievances": [...]
  },
  "timestamp": "2024-07-08T18:00:00.000Z"
}
```

### Get User Consents
**GET** `/dpdp/consents`

Get user's consent records.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "purpose": "CONTRACT_MANAGEMENT",
      "status": "GRANTED",
      "grantedAt": "2024-07-08T18:00:00.000Z",
      "withdrawnAt": null
    }
  ],
  "timestamp": "2024-07-08T18:00:00.000Z"
}
```

### Withdraw Consent
**POST** `/dpdp/consents/:purpose/withdraw`

Withdraw consent for specific purpose.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Consent withdrawn successfully",
  "consent": {
    "id": 1,
    "purpose": "CONTRACT_MANAGEMENT",
    "withdrawnAt": "2024-07-08T18:00:00.000Z"
  },
  "timestamp": "2024-07-08T18:00:00.000Z"
}
```

### Submit Grievance
**POST** `/dpdp/grievances`

Submit grievance (Right to Grievance Redressal).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "type": "DATA_ACCESS",
  "subject": "Unable to access personal data",
  "description": "I am unable to access my personal data through the portal",
  "priority": "HIGH"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Grievance submitted successfully",
  "grievance": {
    "id": 1,
    "type": "DATA_ACCESS",
    "subject": "Unable to access personal data",
    "status": "PENDING",
    "submittedAt": "2024-07-08T18:00:00.000Z"
  },
  "timestamp": "2024-07-08T18:00:00.000Z"
}
```

### Get User Grievances
**GET** `/dpdp/grievances`

Get user's grievances.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "DATA_ACCESS",
      "subject": "Unable to access personal data",
      "status": "PENDING",
      "submittedAt": "2024-07-08T18:00:00.000Z"
    }
  ],
  "timestamp": "2024-07-08T18:00:00.000Z"
}
```

### Get Data Retention Information
**GET** `/dpdp/retention-info`

Get data retention information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "personalData": {
      "retentionPeriod": "7 years",
      "retentionReason": "Legal compliance",
      "deletionDate": "2031-07-08T18:00:00.000Z"
    },
    "contractData": {
      "retentionPeriod": "10 years",
      "retentionReason": "Contractual obligations",
      "deletionDate": "2034-07-08T18:00:00.000Z"
    }
  },
  "timestamp": "2024-07-08T18:00:00.000Z"
}
```

### Report Data Breach (Admin Only)
**POST** `/dpdp/breach-report`

Report data breach (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "type": "UNAUTHORIZED_ACCESS",
  "severity": "HIGH",
  "affectedUsers": 100,
  "dataTypes": ["PERSONAL_INFO", "CONTRACT_DATA"],
  "description": "Unauthorized access to user database",
  "impactAssessment": "High impact on user privacy"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data breach reported successfully",
  "breach": {
    "id": 1,
    "type": "UNAUTHORIZED_ACCESS",
    "severity": "HIGH",
    "status": "REPORTED",
    "detectedAt": "2024-07-08T18:00:00.000Z"
  },
  "timestamp": "2024-07-08T18:00:00.000Z"
}
```

### Get Data Breaches (Admin Only)
**GET** `/dpdp/breaches`

Get data breaches (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "UNAUTHORIZED_ACCESS",
      "severity": "HIGH",
      "affectedUsers": 100,
      "status": "INVESTIGATING",
      "detectedAt": "2024-07-08T18:00:00.000Z"
    }
  ],
  "timestamp": "2024-07-08T18:00:00.000Z"
}
```

### DPDP Health Check
**GET** `/dpdp/health`

DPDP service health check.

**Response:**
```json
{
  "success": true,
  "service": "DPDP Compliance Service",
  "status": "healthy",
  "timestamp": "2024-07-08T18:00:00.000Z",
  "version": "1.0.0",
  "compliance": {
    "dpdpAct2023": true,
    "consentManagement": true,
    "dataPrincipalRights": true,
    "breachNotification": true,
    "auditLogging": true
  }
}
```

---

## User Management (AppAdmin)

### Get All Users
**GET** `/users`

Get all users (AppAdmin only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "partyType": "TDC",
    "walletAddress": "0x1234567890abcdef...",
    "did": "did:web:mukeshjoshidpi.github.io",
    "didVerified": true,
    "isRegistered": true,
    "createdAt": "2024-07-08T18:00:00.000Z"
  }
]
```

### Get CCRP Users
**GET** `/users/ccrp`

Get all CCRP users (available to all authenticated users).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": 3,
    "name": "CCRP Provider",
    "email": "ccrp@example.com",
    "partyType": "CCRP",
    "organization": "CCRP Organization",
    "description": "Confidential Clean Room Provider",
    "website": "https://ccrp.com",
    "location": "New York, NY",
    "did": "did:web:ccrp.com",
    "walletAddress": "0xabcdef123456...",
    "isActive": true
  }
]
```

### Get Specific User
**GET** `/users/:id`

Get specific user by ID (AppAdmin only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
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
  "did": "did:web:mukeshjoshidpi.github.io",
  "didSource": "USER_PROVIDED",
  "didVerified": true,
  "didVerificationMethod": "SIGNATURE_VERIFICATION",
  "isRegistered": true,
  "registrationDate": "2024-07-08T18:00:00.000Z",
  "createdAt": "2024-07-08T18:00:00.000Z",
  "updatedAt": "2024-07-08T18:00:00.000Z",
  "lastLoginAt": "2024-07-08T18:00:00.000Z"
}
```

### Update User
**PUT** `/users/:id`

Update user by ID (AppAdmin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "description": "Updated description",
  "organization": "Updated Organization",
  "did": "did:web:updated.github.io",
  "didVerified": true,
  "isActive": true
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
    "did": "did:web:updated.github.io",
    "didVerified": true,
    "isActive": true
  }
}
```

### Delete User
**DELETE** `/users/:id`

Soft delete user by ID (AppAdmin only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "User deleted successfully",
  "userId": 1
}
```

---

## Notification System

### Get User Notifications
**GET** `/notifications`

Get user notifications.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `type` (string): Filter by notification type
- `read` (boolean): Filter by read status
- `limit` (number): Limit number of notifications

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "type": "CONTRACT_SIGNED",
      "title": "Contract Signed",
      "message": "Contract 'Data Sharing Agreement' has been signed",
      "read": false,
      "data": {
        "contractId": 1,
        "contractTitle": "Data Sharing Agreement"
      },
      "createdAt": "2024-07-08T18:00:00.000Z"
    }
  ]
}
```

### Mark Notification as Read
**PUT** `/notifications/:id/read`

Mark notification as read.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### Mark All Notifications as Read
**PUT** `/notifications/read-all`

Mark all notifications as read.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": "ERROR_TYPE",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common Error Types

#### Authentication Errors
- `INVALID_SIGNATURE`: Wallet signature verification failed
- `USER_NOT_FOUND`: User not found with provided credentials
- `INVALID_TOKEN`: JWT token is invalid or expired
- `ACCESS_DENIED`: User doesn't have required permissions

#### DID Errors
- `INVALID_DID_FORMAT`: DID format is not supported
- `DID_ALREADY_EXISTS`: DID is already registered by another user
- `DID_VERIFICATION_FAILED`: DID ownership verification failed
- `DID_RESOLUTION_ERROR`: Failed to resolve DID document

#### Contract Errors
- `CONTRACT_NOT_FOUND`: Contract not found
- `INVALID_CONTRACT_STATUS`: Contract status doesn't allow this operation
- `SIGNATURE_REQUIRED`: Contract signing requires valid signature
- `CCRP_REQUIRED`: CCRP selection is required for this contract

#### Dataset Errors
- `DATASET_NOT_FOUND`: Dataset not found
- `DATASET_ACCESS_DENIED`: User doesn't have access to this dataset
- `INVALID_DATASET_FORMAT`: Dataset format is not supported

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
- Expiration time

### Token Expiration
Tokens expire after 24 hours. Use the refresh token endpoint to get a new token.

---

## Versioning

API versioning is handled through the URL path. Current version is v1 (default).

To specify a version explicitly:
```
GET /api/v1/contracts
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
  "message": "Sign contract CONTRACT-123 as TDP at 2024-01-01T00:00:00.000Z",
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
  "message": "Sign contract CONTRACT-123 as TDP at 2024-01-01T00:00:00.000Z"
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
    "tdpSignedAt": "2024-01-01T00:00:00.000Z"
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
  "timestamp": "2024-01-01T00:00:00.000Z"
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

---

## Support

For API support and questions:
- Email: support@contractmanagement.com
- Documentation: https://docs.contractmanagement.com
- GitHub Issues: https://github.com/gitmujoshi/ContractManagement/issues 