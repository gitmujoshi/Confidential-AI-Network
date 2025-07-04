# API Documentation
## Contract Management System API

**Version:** 3.0  
**Base URL:** `http://localhost:3001/api`  
**Date:** December 2024

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Enterprise Management](#enterprise-management)
4. [Contract Management](#contract-management)
5. [Dataset Management](#dataset-management)
6. [DID Management](#did-management)
7. [Organization Management](#organization-management)
8. [Notification Management](#notification-management)
9. [Error Handling](#error-handling)

---

## Authentication

### Register User
**POST** `/auth/register`

Register a new user with support for both `did:web` (primary for enterprise) and `did:ethr` (for blockchain operations).

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
  "existingDID": "did:web:company.com:user:john.doe",
  "didVerificationSignature": "0xsignature...",
  "enterpriseUser": false,
  "organizationDomain": "company.com",
  "department": "Engineering",
  "role": "Developer",
  "employeeId": "EMP001"
}
```

**DID Options:**
- **Enterprise (did:web) - Primary Recommendation**: Provide `did:web:company.com:user:john.doe` for enterprise users
- **System-Generated (did:ethr)**: Omit `existingDID` and `didVerificationSignature` - system creates DID from wallet address
- **User-Provided (did:ethr)**: Provide existing Ethereum-based DID with signature verification
- **User-Provided (did:web)**: Provide existing web-based DID

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
    "did": "did:web:company.com:user:john.doe",
    "didSource": "USER_PROVIDED",
    "didVerified": true,
    "didVerificationMethod": "web_resolution",
    "onboardingStatus": "COMPLETED",
    "profileCompleted": true,
    "enterpriseUser": true,
    "organizationDomain": "company.com",
    "department": "Engineering",
    "role": "Developer",
    "employeeId": "EMP001",
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
    "did": "did:web:company.com:user:john.doe",
    "didSource": "USER_PROVIDED",
    "didVerified": true,
    "onboardingStatus": "COMPLETED",
    "enterpriseUser": true,
    "organizationDomain": "company.com"
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
    "did": "did:web:company.com:user:john.doe",
    "didSource": "USER_PROVIDED",
    "didVerified": true,
    "didVerificationMethod": "web_resolution",
    "onboardingStatus": "COMPLETED",
    "profileCompleted": true,
    "organization": "Company Name",
    "phoneNumber": "+1234567890",
    "website": "https://example.com",
    "location": "New York, USA",
    "enterpriseUser": true,
    "organizationDomain": "company.com",
    "department": "Engineering",
    "role": "Developer",
    "employeeId": "EMP001",
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
  "location": "San Francisco, USA",
  "department": "Product",
  "role": "Senior Developer"
}
```

### Get All Users
**GET** `/users`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `enterpriseUser` (boolean): Filter by enterprise users
- `organizationDomain` (string): Filter by organization domain
- `department` (string): Filter by department
- `role` (string): Filter by role

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
      "did": "did:web:company.com:user:john.doe",
      "didSource": "USER_PROVIDED",
      "didVerified": true,
      "onboardingStatus": "COMPLETED",
      "organization": "Company Name",
      "enterpriseUser": true,
      "organizationDomain": "company.com",
      "department": "Engineering",
      "role": "Developer",
      "createdAt": "2024-12-01T10:00:00.000Z"
    }
  ]
}
```

---

## Enterprise Management

### Register Organization
**POST** `/enterprise/organizations`

Register a new organization for enterprise DID management.

**Request Body:**
```json
{
  "name": "Acme Corporation",
  "domain": "acme.com",
  "description": "Leading technology company",
  "website": "https://acme.com",
  "contactEmail": "admin@acme.com",
  "contactPhone": "+1234567890",
  "address": "123 Business St, New York, NY",
  "industry": "Technology",
  "size": "1000-5000",
  "adminWalletAddress": "0x1234567890abcdef...",
  "adminSignature": "0xsignature...",
  "adminMessage": "Organization registration message"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Organization registered successfully",
  "organization": {
    "id": 1,
    "name": "Acme Corporation",
    "domain": "acme.com",
    "did": "did:web:acme.com",
    "status": "ACTIVE",
    "createdAt": "2024-12-01T10:00:00.000Z"
  }
}
```

### Get Organization Details
**GET** `/enterprise/organizations/:domain`

**Response:**
```json
{
  "success": true,
  "organization": {
    "id": 1,
    "name": "Acme Corporation",
    "domain": "acme.com",
    "did": "did:web:acme.com",
    "description": "Leading technology company",
    "website": "https://acme.com",
    "contactEmail": "admin@acme.com",
    "contactPhone": "+1234567890",
    "address": "123 Business St, New York, NY",
    "industry": "Technology",
    "size": "1000-5000",
    "status": "ACTIVE",
    "userCount": 150,
    "createdAt": "2024-12-01T10:00:00.000Z"
  }
}
```

### Get Organization Users
**GET** `/enterprise/organizations/:domain/users`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `department` (string): Filter by department
- `role` (string): Filter by role
- `status` (string): Filter by user status

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@acme.com",
      "did": "did:web:acme.com:user:john.doe",
      "department": "Engineering",
      "role": "Developer",
      "employeeId": "EMP001",
      "status": "ACTIVE",
      "createdAt": "2024-12-01T10:00:00.000Z"
    }
  ]
}
```

### Bulk Register Enterprise Users
**POST** `/enterprise/organizations/:domain/users/bulk`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "users": [
    {
      "name": "Jane Smith",
      "email": "jane@acme.com",
      "department": "Legal",
      "role": "Legal Counsel",
      "employeeId": "EMP002"
    },
    {
      "name": "Bob Johnson",
      "email": "bob@acme.com",
      "department": "Finance",
      "role": "Financial Analyst",
      "employeeId": "EMP003"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk user registration completed",
  "results": {
    "successful": 2,
    "failed": 0,
    "users": [
      {
        "name": "Jane Smith",
        "email": "jane@acme.com",
        "did": "did:web:acme.com:user:jane.smith",
        "status": "REGISTERED"
      },
      {
        "name": "Bob Johnson",
        "email": "bob@acme.com",
        "did": "did:web:acme.com:user:bob.johnson",
        "status": "REGISTERED"
      }
    ]
  }
}
```

---

## DID Management

### Create Web DID
**POST** `/did/web/create`

Create a new `did:web` for enterprise users.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "domain": "company.com",
  "path": "user:john.doe",
  "verificationMethods": [
    {
      "id": "key-1",
      "type": "Ed25519VerificationKey2020",
      "publicKeyMultibase": "z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
    }
  ],
  "authentication": ["key-1"],
  "assertionMethod": ["key-1"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Web DID created successfully",
  "did": "did:web:company.com:user:john.doe",
  "didDocument": {
    "@context": "https://www.w3.org/ns/did/v1",
    "id": "did:web:company.com:user:john.doe",
    "verificationMethod": [
      {
        "id": "did:web:company.com:user:john.doe#key-1",
        "type": "Ed25519VerificationKey2020",
        "controller": "did:web:company.com:user:john.doe",
        "publicKeyMultibase": "z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
      }
    ],
    "authentication": ["did:web:company.com:user:john.doe#key-1"],
    "assertionMethod": ["did:web:company.com:user:john.doe#key-1"]
  }
}
```

### Verify DID Ownership
**POST** `/did/verify`

Verify ownership of a user-provided DID (both `did:ethr` and `did:web`).

**Request Body:**
```json
{
  "did": "did:web:company.com:user:john.doe",
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
    "did": "did:web:company.com:user:john.doe",
    "verified": true,
    "method": "web_resolution",
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
    "did": "did:web:company.com:user:john.doe",
    "method": "web",
    "domain": "company.com",
    "path": "user:john.doe",
    "controller": "did:web:company.com:user:john.doe",
    "verificationMethods": [
      {
        "id": "did:web:company.com:user:john.doe#key-1",
        "type": "Ed25519VerificationKey2020",
        "controller": "did:web:company.com:user:john.doe",
        "publicKeyMultibase": "z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
      }
    ],
    "authentication": ["did:web:company.com:user:john.doe#key-1"],
    "assertionMethod": ["did:web:company.com:user:john.doe#key-1"],
    "created": "2024-12-01T10:00:00.000Z",
    "updated": "2024-12-01T10:00:00.000Z"
  }
}
```

### Resolve DID Document
**GET** `/did/resolve/:did`

Resolve a DID to its document (supports both `did:ethr` and `did:web`).

**Response for did:web:**
```json
{
  "success": true,
  "didDocument": {
    "@context": "https://www.w3.org/ns/did/v1",
    "id": "did:web:company.com:user:john.doe",
    "verificationMethod": [
      {
        "id": "did:web:company.com:user:john.doe#key-1",
        "type": "Ed25519VerificationKey2020",
        "controller": "did:web:company.com:user:john.doe",
        "publicKeyMultibase": "z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
      }
    ],
    "authentication": ["did:web:company.com:user:john.doe#key-1"],
    "assertionMethod": ["did:web:company.com:user:john.doe#key-1"]
  }
}
```

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

### Check DID Availability
**GET** `/did/check/:did`

Check if a DID is available for registration.

**Response:**
```json
{
  "success": true,
  "available": true,
  "did": "did:web:company.com:user:john.doe",
  "message": "DID is available for registration"
}
```

### List User DIDs
**GET** `/did/user/:userId`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "dids": [
    {
      "did": "did:web:company.com:user:john.doe",
      "method": "web",
      "source": "USER_PROVIDED",
      "verified": true,
      "verificationMethod": "web_resolution",
      "primary": true,
      "createdAt": "2024-12-01T10:00:00.000Z"
    }
  ]
}
```

---

## Organization Management

### Create Organization
**POST** `/organizations`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Acme Corporation",
  "domain": "acme.com",
  "description": "Leading technology company",
  "website": "https://acme.com",
  "contactEmail": "admin@acme.com",
  "contactPhone": "+1234567890",
  "address": "123 Business St, New York, NY",
  "industry": "Technology",
  "size": "1000-5000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Organization created successfully",
  "organization": {
    "id": 1,
    "name": "Acme Corporation",
    "domain": "acme.com",
    "did": "did:web:acme.com",
    "status": "ACTIVE",
    "createdAt": "2024-12-01T10:00:00.000Z"
  }
}
```

### Get Organization
**GET** `/organizations/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "organization": {
    "id": 1,
    "name": "Acme Corporation",
    "domain": "acme.com",
    "did": "did:web:acme.com",
    "description": "Leading technology company",
    "website": "https://acme.com",
    "contactEmail": "admin@acme.com",
    "contactPhone": "+1234567890",
    "address": "123 Business St, New York, NY",
    "industry": "Technology",
    "size": "1000-5000",
    "status": "ACTIVE",
    "userCount": 150,
    "createdAt": "2024-12-01T10:00:00.000Z"
  }
}
```

### Get All Organizations
**GET** `/organizations`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "organizations": [
    {
      "id": 1,
      "name": "Acme Corporation",
      "domain": "acme.com",
      "did": "did:web:acme.com",
      "status": "ACTIVE",
      "userCount": 150,
      "createdAt": "2024-12-01T10:00:00.000Z"
    }
  ]
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
        "did": "did:web:company.com:user:john.doe"
      },
      "tdc": {
        "id": 2,
        "name": "Jane Smith",
        "did": "did:web:company.com:user:jane.smith"
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
      "did": "did:web:company.com:user:john.doe"
    },
    "tdc": {
      "id": 2,
      "name": "Jane Smith",
      "did": "did:web:company.com:user:jane.smith"
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
        "did": "did:web:company.com:user:john.doe"
      },
      "createdAt": "2024-12-01T10:00:00.000Z"
    }
  ]
}
```

---

## Notification Management

### Get User Notifications
**GET** `/notifications`

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
      "createdAt": "2024-12-01T10:00:00.000Z"
    }
  ]
}
```

### Mark Notification as Read
**PUT** `/notifications/:id/read`

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
- `USER_NOT_FOUND`: User not found with provided wallet address
- `INVALID_TOKEN`: JWT token is invalid or expired

#### DID Errors
- `INVALID_DID_FORMAT`: DID format is not valid
- `DID_ALREADY_REGISTERED`: DID is already registered by another user
- `DID_VERIFICATION_FAILED`: DID ownership verification failed
- `DID_NOT_RESOLVABLE`: DID cannot be resolved
- `UNSUPPORTED_DID_METHOD`: DID method is not supported
- `WEB_DID_RESOLUTION_FAILED`: Web DID document resolution failed
- `DOMAIN_NOT_VERIFIED`: Domain ownership not verified

#### Enterprise Errors
- `ORGANIZATION_NOT_FOUND`: Organization not found
- `DOMAIN_ALREADY_REGISTERED`: Domain already registered
- `INVALID_EMPLOYEE_ID`: Employee ID format is invalid
- `DEPARTMENT_NOT_FOUND`: Department not found in organization
- `ROLE_NOT_FOUND`: Role not found in organization

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

#### did:web (Web-based) - Primary for Enterprise
- **Format**: `did:web:[domain]:[path]`
- **Examples**:
  - `did:web:company.com:user:john.doe`
  - `did:web:university.edu:students:student123`
  - `did:web:organization.org:employees:jane.smith`
  - `did:web:company.com:departments:legal`
  - `did:web:company.com:roles:compliance-officer`
- **Verification**: DID document resolution via HTTPS
- **Best for**: **Enterprise organizations** with web domains
- **Benefits**:
  - **Enterprise control** over identity infrastructure
  - **No blockchain fees** or complex setup
  - **Fast resolution** via HTTP requests with caching
  - **Integration** with existing web infrastructure
  - **Compliance** with enterprise security policies
  - **Scalability** for large organizations

#### did:ethr (Ethereum-based) - For Blockchain Operations
- **Format**: `did:ethr:[network]:[ethereum-address]`
- **Examples**:
  - `did:ethr:goerli:0x1234567890abcdef...`
  - `did:ethr:mainnet:0x1234567890abcdef...`
  - `did:ethr:polygon:0x1234567890abcdef...`
- **Verification**: Wallet signature
- **Best for**: Individual users with Ethereum wallets and blockchain operations
- **Benefits**:
  - Self-sovereign identity
  - No central authority
  - Works with existing wallets
  - Widely supported in blockchain ecosystem
  - Fully decentralized
  - Built-in cryptographic verification

### DID Verification Methods

#### For did:web:
1. User provides DID
2. System resolves DID document from web server via HTTPS
3. System validates DID document format and structure
4. System verifies domain ownership and SSL certificate validity
5. System checks that the DID document is properly hosted at the expected URL

#### For did:ethr:
1. User provides DID and wallet address
2. System creates verification message with timestamp and nonce
3. User signs message with their wallet
4. System verifies signature against the DID controller address
5. System confirms the wallet address matches the DID controller

### DID Method Comparison

| Feature | did:web | did:ethr |
|---------|---------|----------|
| **Primary Use** | **Enterprise identity** | Blockchain operations |
| **Infrastructure** | Web servers (existing) | Ethereum blockchain |
| **Cost** | **Hosting costs only** | Gas fees + infrastructure |
| **Speed** | **Fast (HTTP + caching)** | Slower (blockchain) |
| **Control** | **Organization control** | Individual wallet control |
| **Decentralization** | Organization-controlled | Fully decentralized |
| **Setup Complexity** | **Simple (web hosting)** | Moderate (blockchain) |
| **Enterprise Integration** | **Native support** | Limited integration |
| **Compliance** | **Enterprise-ready** | Blockchain-focused |
| **Scalability** | **High (thousands of users)** | Individual-focused |
| **Security** | **SSL/TLS + enterprise** | Cryptographic only |
| **Audit Trails** | **Enterprise logging** | Blockchain transactions |

---

## Rate Limiting

- **Authentication endpoints**: 10 requests per minute
- **DID verification**: 5 requests per minute
- **Enterprise endpoints**: 20 requests per minute
- **General API endpoints**: 100 requests per minute

---

## Versioning

API versioning is handled through the URL path. Current version is v3.0.

**Example:**
- Current: `/api/auth/register`
- Future: `/api/v4/auth/register`

---

**API Documentation End** 