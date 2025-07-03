# API Documentation
## Contract Management System API

**Version:** 2.0  
**Base URL:** `http://localhost:3001/api`  
**Date:** December 2024

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Contract Management](#contract-management)
4. [Dataset Management](#dataset-management)
5. [DID Management](#did-management)
6. [Error Handling](#error-handling)

---

## Authentication

### Register User
**POST** `/auth/register`

Register a new user with support for both `did:ethr` and `did:web` DIDs.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "partyType": "TDP",
  "walletAddress": "0x1234567890abcdef...",
  "publicKey": "0xabcdef123456...",
  "description": "Optional description",
  "organization": "Company Name",
  "phoneNumber": "+1234567890",
  "website": "https://example.com",
  "location": "New York, USA",
  "existingDID": "did:ethr:goerli:0x1234567890abcdef...",
  "didVerificationSignature": "0xsignature..."
}
```

**DID Options:**
- **System-Generated (did:ethr)**: Omit `existingDID` and `didVerificationSignature` - system creates DID from wallet address
- **User-Provided (did:ethr)**: Provide existing Ethereum-based DID with signature verification
- **User-Provided (did:web)**: Provide existing web-based DID (e.g., `did:web:company.com:user:alice`)

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "partyType": "TDP",
    "walletAddress": "0x1234567890abcdef...",
    "did": "did:ethr:goerli:0x1234567890abcdef...",
    "didSource": "USER_PROVIDED",
    "didVerified": true,
    "didVerificationMethod": "signature",
    "onboardingStatus": "COMPLETED",
    "profileCompleted": true,
    "createdAt": "2024-12-01T10:00:00.000Z"
  }
}
```

### Login User
**POST** `/auth/login`

**Request Body:**
```json
{
  "walletAddress": "0x1234567890abcdef...",
  "signature": "0xsignature...",
  "message": "Login message to sign"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "partyType": "TDP",
    "walletAddress": "0x1234567890abcdef...",
    "did": "did:ethr:goerli:0x1234567890abcdef...",
    "didSource": "USER_PROVIDED",
    "didVerified": true,
    "onboardingStatus": "COMPLETED"
  }
}
```

---

## User Management

### Get User Profile
**GET** `/users/profile`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "partyType": "TDP",
    "walletAddress": "0x1234567890abcdef...",
    "publicKey": "0xabcdef123456...",
    "did": "did:ethr:goerli:0x1234567890abcdef...",
    "didSource": "USER_PROVIDED",
    "didVerified": true,
    "didVerificationMethod": "signature",
    "onboardingStatus": "COMPLETED",
    "profileCompleted": true,
    "organization": "Company Name",
    "phoneNumber": "+1234567890",
    "website": "https://example.com",
    "location": "New York, USA",
    "createdAt": "2024-12-01T10:00:00.000Z",
    "lastLoginAt": "2024-12-01T15:30:00.000Z"
  }
}
```

### Update User Profile
**PUT** `/users/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "description": "Updated description",
  "organization": "Updated Company",
  "phoneNumber": "+1234567890",
  "website": "https://updated-example.com",
  "location": "San Francisco, USA"
}
```

### Get All Users
**GET** `/users`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "partyType": "TDP",
      "walletAddress": "0x1234567890abcdef...",
      "did": "did:ethr:goerli:0x1234567890abcdef...",
      "didSource": "USER_PROVIDED",
      "didVerified": true,
      "onboardingStatus": "COMPLETED",
      "organization": "Company Name",
      "createdAt": "2024-12-01T10:00:00.000Z"
    }
  ]
}
```

---

## DID Management

### Verify DID Ownership
**POST** `/did/verify`

Verify ownership of a user-provided DID (both `did:ethr` and `did:web`).

**Request Body:**
```json
{
  "did": "did:ethr:goerli:0x1234567890abcdef...",
  "walletAddress": "0x1234567890abcdef...",
  "signature": "0xsignature...",
  "message": "Verification message"
}
```

**Response:**
```json
{
  "success": true,
  "message": "DID ownership verified successfully",
  "verification": {
    "did": "did:ethr:goerli:0x1234567890abcdef...",
    "verified": true,
    "method": "signature",
    "verifiedAt": "2024-12-01T10:00:00.000Z"
  }
}
```

### Get DID Information
**GET** `/did/info/:did`

Get information about a specific DID.

**Response:**
```json
{
  "success": true,
  "didInfo": {
    "did": "did:ethr:goerli:0x1234567890abcdef...",
    "method": "ethr",
    "network": "goerli",
    "controller": "0x1234567890abcdef...",
    "verificationMethods": [
      {
        "id": "did:ethr:goerli:0x1234567890abcdef...#controller",
        "type": "EcdsaSecp256k1VerificationKey2019",
        "controller": "did:ethr:goerli:0x1234567890abcdef...",
        "publicKeyHex": "0xabcdef123456..."
      }
    ],
    "authentication": ["did:ethr:goerli:0x1234567890abcdef...#controller"],
    "assertionMethod": ["did:ethr:goerli:0x1234567890abcdef...#controller"],
    "created": "2024-12-01T10:00:00.000Z",
    "updated": "2024-12-01T10:00:00.000Z"
  }
}
```

### Resolve DID Document
**GET** `/did/resolve/:did`

Resolve a DID to its document (supports both `did:ethr` and `did:web`).

**Response for did:ethr:**
```json
{
  "success": true,
  "didDocument": {
    "@context": "https://www.w3.org/ns/did/v1",
    "id": "did:ethr:goerli:0x1234567890abcdef...",
    "verificationMethod": [
      {
        "id": "did:ethr:goerli:0x1234567890abcdef...#controller",
        "type": "EcdsaSecp256k1VerificationKey2019",
        "controller": "did:ethr:goerli:0x1234567890abcdef...",
        "publicKeyHex": "0xabcdef123456..."
      }
    ],
    "authentication": ["did:ethr:goerli:0x1234567890abcdef...#controller"],
    "assertionMethod": ["did:ethr:goerli:0x1234567890abcdef...#controller"]
  }
}
```

**Response for did:web:**
```json
{
  "success": true,
  "didDocument": {
    "@context": "https://www.w3.org/ns/did/v1",
    "id": "did:web:company.com:user:alice",
    "verificationMethod": [
      {
        "id": "did:web:company.com:user:alice#key-1",
        "type": "Ed25519VerificationKey2020",
        "controller": "did:web:company.com:user:alice",
        "publicKeyMultibase": "z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
      }
    ],
    "authentication": ["did:web:company.com:user:alice#key-1"]
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
  "did": "did:ethr:goerli:0x1234567890abcdef...",
  "message": "DID is available for registration"
}
```

---

## Contract Management

### Create Contract
**POST** `/contracts`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Data Sharing Agreement",
  "description": "Contract for sharing training data",
  "tdpId": 1,
  "tdcId": 2,
  "ccrpId": 3,
  "datasetIds": [1, 2],
  "terms": "Contract terms and conditions",
  "duration": 365,
  "compensation": "1000 ETH"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contract created successfully",
  "contract": {
    "id": 1,
    "title": "Data Sharing Agreement",
    "description": "Contract for sharing training data",
    "status": "DRAFT",
    "tdpId": 1,
    "tdcId": 2,
    "ccrpId": 3,
    "createdAt": "2024-12-01T10:00:00.000Z"
  }
}
```

### Get All Contracts
**GET** `/contracts`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "contracts": [
    {
      "id": 1,
      "title": "Data Sharing Agreement",
      "description": "Contract for sharing training data",
      "status": "DRAFT",
      "tdp": {
        "id": 1,
        "name": "John Doe",
        "did": "did:ethr:goerli:0x1234567890abcdef..."
      },
      "tdc": {
        "id": 2,
        "name": "Jane Smith",
        "did": "did:web:company.com:user:jane"
      },
      "ccrp": {
        "id": 3,
        "name": "Bob Johnson",
        "did": "did:ethr:goerli:0xabcdef123456..."
      },
      "createdAt": "2024-12-01T10:00:00.000Z"
    }
  ]
}
```

### Get Contract by ID
**GET** `/contracts/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "contract": {
    "id": 1,
    "title": "Data Sharing Agreement",
    "description": "Contract for sharing training data",
    "status": "DRAFT",
    "terms": "Contract terms and conditions",
    "duration": 365,
    "compensation": "1000 ETH",
    "tdp": {
      "id": 1,
      "name": "John Doe",
      "did": "did:ethr:goerli:0x1234567890abcdef..."
    },
    "tdc": {
      "id": 2,
      "name": "Jane Smith",
      "did": "did:web:company.com:user:jane"
    },
    "ccrp": {
      "id": 3,
      "name": "Bob Johnson",
      "did": "did:ethr:goerli:0xabcdef123456..."
    },
    "datasets": [
      {
        "id": 1,
        "name": "Training Dataset 1",
        "description": "First training dataset"
      }
    ],
    "createdAt": "2024-12-01T10:00:00.000Z",
    "updatedAt": "2024-12-01T10:00:00.000Z"
  }
}
```

### Update Contract Status
**PUT** `/contracts/:id/status`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "SIGNED"
}
```

---

## Dataset Management

### Create Dataset
**POST** `/datasets`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Training Dataset 1",
  "description": "High-quality training data for AI models",
  "type": "TEXT",
  "size": "1GB",
  "format": "JSON",
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
  "message": "Dataset created successfully",
  "dataset": {
    "id": 1,
    "name": "Training Dataset 1",
    "description": "High-quality training data for AI models",
    "type": "TEXT",
    "size": "1GB",
    "format": "JSON",
    "ownerId": 1,
    "createdAt": "2024-12-01T10:00:00.000Z"
  }
}
```

### Get All Datasets
**GET** `/datasets`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "datasets": [
    {
      "id": 1,
      "name": "Training Dataset 1",
      "description": "High-quality training data for AI models",
      "type": "TEXT",
      "size": "1GB",
      "format": "JSON",
      "owner": {
        "id": 1,
        "name": "John Doe",
        "did": "did:ethr:goerli:0x1234567890abcdef..."
      },
      "createdAt": "2024-12-01T10:00:00.000Z"
    }
  ]
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
- `USER_NOT_FOUND`: User not found with provided wallet address
- `INVALID_TOKEN`: JWT token is invalid or expired

#### DID Errors
- `INVALID_DID_FORMAT`: DID format is not valid
- `DID_ALREADY_REGISTERED`: DID is already registered by another user
- `DID_VERIFICATION_FAILED`: DID ownership verification failed
- `DID_NOT_RESOLVABLE`: DID cannot be resolved
- `UNSUPPORTED_DID_METHOD`: DID method is not supported

#### Validation Errors
- `MISSING_REQUIRED_FIELD`: Required field is missing
- `INVALID_EMAIL_FORMAT`: Email format is invalid
- `INVALID_WALLET_ADDRESS`: Wallet address format is invalid
- `INVALID_PARTY_TYPE`: Party type is not valid

#### Database Errors
- `DUPLICATE_ENTRY`: Entry already exists
- `FOREIGN_KEY_CONSTRAINT`: Related record not found
- `DATABASE_ERROR`: General database error

### HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

---

## DID Method Support

### Supported DID Methods

#### did:ethr (Ethereum-based)
- **Format**: `did:ethr:[network]:[ethereum-address]`
- **Examples**:
  - `did:ethr:goerli:0x1234567890abcdef...`
  - `did:ethr:mainnet:0x1234567890abcdef...`
  - `did:ethr:polygon:0x1234567890abcdef...`
- **Verification**: Wallet signature
- **Best for**: Individual users with Ethereum wallets

#### did:web (Web-based)
- **Format**: `did:web:[domain]:[path]`
- **Examples**:
  - `did:web:company.com:user:alice`
  - `did:web:university.edu:students:student123`
  - `did:web:organization.org:employees:john`
- **Verification**: DID document resolution
- **Best for**: Organizations with web domains

### DID Verification Methods

#### For did:ethr:
1. User provides DID and wallet address
2. System creates verification message
3. User signs message with wallet
4. System verifies signature against DID controller

#### For did:web:
1. User provides DID
2. System resolves DID document from web server
3. System validates DID document format
4. System verifies domain ownership and SSL certificate

---

## Rate Limiting

- **Authentication endpoints**: 10 requests per minute
- **DID verification**: 5 requests per minute
- **General API endpoints**: 100 requests per minute

---

## Versioning

API versioning is handled through the URL path. Current version is v2.0.

**Example:**
- Current: `/api/auth/register`
- Future: `/api/v3/auth/register`

---

**API Documentation End** 