# Simple API Specifications
## Contract Management System

## Base URL
```
http://localhost:5001/api
```

## Authentication
```
Authorization: Bearer <jwt_token>
```

## IAM Endpoints

### POST /auth/register
**Register new user**

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "partyType": "TDP",
  "organization": "DataCorp Inc",
  "phoneNumber": "+1234567890",
  "website": "https://datacorp.com",
  "existingDID": "did:web:example.com"
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
    "partyType": "TDP",
    "did": "did:web:example.com",
    "didVerified": true
  }
}
```

### POST /auth/login
**User login**

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "partyType": "TDP"
  }
}
```

### POST /auth/forgot-password
**Initiate password reset**

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### POST /auth/reset-password
**Reset password with token**

**Request:**
```json
{
  "token": "reset_token",
  "newPassword": "NewPass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### GET /auth/profile
**Get user profile**

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
    "organization": "DataCorp Inc",
    "did": "did:web:example.com",
    "didVerified": true
  }
}
```

## Contract Endpoints

### GET /contracts/user/:userId
**Get user contracts**

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (optional): Filter by status
- `limit` (optional): Number of contracts (default: 10)
- `offset` (optional): Skip contracts (default: 0)

**Response:**
```json
{
  "contracts": [
    {
      "contractId": "CONTRACT_001",
      "tdpId": 1,
      "tdcId": 2,
      "ccrpId": 3,
      "datasetId": "DATASET_001",
      "modelId": "MODEL_001",
      "price": 1000.00,
      "duration": 30,
      "status": "ACTIVE",
      "tdpSignature": "signature_hash",
      "tdcSignature": "signature_hash",
      "ccrpSignature": "signature_hash",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "tdp": {
        "id": 1,
        "name": "Data Provider",
        "email": "tdp@example.com"
      },
      "tdc": {
        "id": 2,
        "name": "Data Consumer",
        "email": "tdc@example.com"
      },
      "ccrp": {
        "id": 3,
        "name": "Clean Room Provider",
        "email": "ccrp@example.com"
      },
      "dataset": {
        "id": "DATASET_001",
        "name": "Training Dataset",
        "description": "High-quality training data",
        "category": "IMAGE_RECOGNITION",
        "price": 500.00
      }
    }
  ],
  "total": 25,
  "limit": 10,
  "offset": 0
}
```

### GET /contracts/:contractId
**Get specific contract**

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "contractId": "CONTRACT_001",
  "tdpId": 1,
  "tdcId": 2,
  "ccrpId": 3,
  "datasetId": "DATASET_001",
  "modelId": "MODEL_001",
  "price": 1000.00,
  "duration": 30,
  "status": "ACTIVE",
  "termsAndConditions": "Contract terms...",
  "tdpSignature": "signature_hash",
  "tdcSignature": "signature_hash",
  "ccrpSignature": "signature_hash",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "tdp": {
    "id": 1,
    "name": "Data Provider",
    "email": "tdp@example.com"
  },
  "tdc": {
    "id": 2,
    "name": "Data Consumer",
    "email": "tdc@example.com"
  },
  "ccrp": {
    "id": 3,
    "name": "Clean Room Provider",
    "email": "ccrp@example.com"
  },
  "dataset": {
    "id": "DATASET_001",
    "name": "Training Dataset",
    "description": "High-quality training data",
    "category": "IMAGE_RECOGNITION",
    "price": 500.00
  }
}
```

### POST /contracts
**Create new contract (TDC only)**

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "tdpId": 1,
  "datasetId": "DATASET_001",
  "modelId": "MODEL_001",
  "price": 1000.00,
  "duration": 30,
  "termsAndConditions": "Contract terms and conditions...",
  "ccrpId": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contract created successfully",
  "contract": {
    "contractId": "CONTRACT_001",
    "tdpId": 1,
    "tdcId": 2,
    "ccrpId": 3,
    "datasetId": "DATASET_001",
    "modelId": "MODEL_001",
    "price": 1000.00,
    "duration": 30,
    "status": "PENDING_CCRP_APPROVAL",
    "termsAndConditions": "Contract terms and conditions...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /contracts/:contractId/sign
**Sign contract with DID**

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "did": "did:web:example.com",
  "signature": "base64url_signature",
  "message": "Contract signing message"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contract signed successfully",
  "contract": {
    "contractId": "CONTRACT_001",
    "status": "ACTIVE",
    "tdpSignature": "signature_hash",
    "tdcSignature": "signature_hash",
    "ccrpSignature": "signature_hash",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### PUT /contracts/:contractId/status
**Update contract status (CCRP only)**

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "status": "COMPLETED",
  "reason": "Contract execution completed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contract status updated",
  "contract": {
    "contractId": "CONTRACT_001",
    "status": "COMPLETED",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Signing Endpoints

### POST /signing/sign
**Sign message with enterprise DID**

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "message": "Message to sign",
  "did": "did:web:example.com"
}
```

**Response:**
```json
{
  "success": true,
  "signature": "base64url_signature",
  "did": "did:web:example.com",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET /signing/dids
**Get available enterprise DIDs**

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "dids": [
    {
      "did": "did:web:example.com",
      "publicKey": {
        "kty": "EC",
        "crv": "P-256",
        "x": "FFQw_IJcWPr8qZrwq48azt1hVM8JNp3nnJ0367TxUyQ=",
        "y": "AkPYsoJhbJNqIRGwnUHQN2D3cq4MPtzlVPx8BVuzTAo=",
        "alg": "ES256"
      },
      "available": true
    }
  ]
}
```

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional details"
  }
}
```

### Common Error Codes
- `MISSING_REQUIRED_FIELDS` - Required fields not provided
- `INVALID_PARTY_TYPE` - Invalid user role
- `EMAIL_ALREADY_EXISTS` - Email already registered
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found

## User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **TDP** | Training Data Provider | Create datasets, sign contracts |
| **TDC** | Training Data Consumer | Create contracts, sign contracts |
| **CCRP** | Clean Room Provider | Complete contracts |
| **AppAdmin** | System Administrator | Full access |

## Contract Statuses

| Status | Description |
|--------|-------------|
| `DRAFT` | Contract being created |
| `PENDING_TDP_APPROVAL` | Waiting for TDP signature |
| `PENDING_TDC_APPROVAL` | Waiting for TDC signature |
| `PENDING_CCRP_APPROVAL` | Waiting for CCRP approval |
| `ACTIVE` | Contract is active |
| `COMPLETED` | Contract completed |
| `CANCELLED` | Contract cancelled | 