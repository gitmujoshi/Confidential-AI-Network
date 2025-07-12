# API Specifications
## Contract Management System

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Author:** Contract Management System Team  
**Classification:** Internal Technical Specification

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Base URL & Headers](#base-url--headers)
4. [Error Handling](#error-handling)
5. [IAM API Endpoints](#iam-api-endpoints)
6. [Contract API Endpoints](#contract-api-endpoints)
7. [Signing API Endpoints](#signing-api-endpoints)
8. [Data Models](#data-models)
9. [Response Formats](#response-formats)
10. [Rate Limiting](#rate-limiting)

---

## Overview

This document provides comprehensive API specifications for the Contract Management System, focusing on Identity and Access Management (IAM) and Contract operations. The API supports enterprise-grade authentication, role-based access control, and secure contract management.

### Key Features
- **Multi-Method Authentication**: JWT tokens, Keycloak integration, DID-based authentication
- **Role-Based Access Control**: TDP, TDC, CCRP, and Admin roles
- **Enterprise Signing Service**: Secure cryptographic signing with private key management
- **DID Integration**: Support for did:web, did:ethr, and did:key
- **Contract Lifecycle Management**: Complete contract creation, signing, and execution workflow

---

## Authentication & Authorization

### Authentication Methods

#### 1. JWT Token Authentication
- **Header**: `Authorization: Bearer <jwt_token>`
- **Token Format**: JSON Web Token with user information
- **Expiration**: 24 hours (configurable)

#### 2. Keycloak Integration
- **Enterprise SSO**: Centralized user management
- **Token Introspection**: Real-time token validation
- **Fallback**: Local JWT validation when Keycloak unavailable

### Authorization Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **TDP** | Training Data Provider | Create datasets, sign contracts, view own contracts |
| **TDC** | Training Data Consumer | Create contracts, sign contracts, browse datasets |
| **CCRP** | Confidential Clean Room Provider | Complete contracts, manage clean room environments |
| **AppAdmin** | System Administrator | Full system access, user management |

---

## Base URL & Headers

### Base URL
```
Development: http://localhost:5001/api
Production: https://api.contractmanagement.com/api
```

### Required Headers
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

### Optional Headers
```http
X-Request-ID: <unique_request_id>
X-Client-Version: <client_version>
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `MISSING_REQUIRED_FIELDS` | Required fields not provided | 400 |
| `INVALID_PARTY_TYPE` | Invalid user role specified | 400 |
| `EMAIL_ALREADY_EXISTS` | Email already registered | 409 |
| `DID_ALREADY_EXISTS` | DID already registered | 409 |
| `INVALID_DID_FORMAT` | Invalid DID format | 400 |
| `DID_VERIFICATION_FAILED` | DID ownership verification failed | 400 |
| `UNAUTHORIZED` | Authentication required | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `INTERNAL_SERVER_ERROR` | Server error | 500 |

---

## IAM API Endpoints

### Authentication Endpoints

#### POST /api/auth/register
**Purpose**: Register a new user with support for DID integration

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "partyType": "TDP",
  "walletAddress": "0x1234567890abcdef...",
  "publicKey": "public_key_string",
  "description": "User description",
  "organization": "DataCorp Inc",
  "phoneNumber": "+1234567890",
  "website": "https://datacorp.com",
  "location": "New York, NY",
  "existingDID": "did:web:example.com",
  "didVerificationSignature": "signature_string"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "partyType": "TDP",
    "walletAddress": "0x1234567890abcdef...",
    "did": "did:web:example.com",
    "didVerified": true,
    "isRegistered": true,
    "onboardingStatus": "COMPLETED"
  }
}
```

#### POST /api/auth/login
**Purpose**: Authenticate user and get JWT token

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "secure_password"
}
```

**Response**:
```json
{
  "success": true,
  "token": "jwt_token_string",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "partyType": "TDP",
    "walletAddress": "0x1234567890abcdef...",
    "did": "did:web:example.com"
  }
}
```

#### POST /api/auth/forgot-password
**Purpose**: Initiate password reset process

**Request Body**:
```json
{
  "email": "john.doe@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### POST /api/auth/reset-password
**Purpose**: Reset password using token

**Request Body**:
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass123!"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

#### POST /api/auth/change-password
**Purpose**: Change password for authenticated user

**Headers**: `Authorization: Bearer <jwt_token>`

**Request Body**:
```json
{
  "currentPassword": "CurrentPass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### User Management Endpoints

#### GET /api/auth/profile
**Purpose**: Get current user profile

**Headers**: `Authorization: Bearer <jwt_token>`

**Response**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "partyType": "TDP",
    "walletAddress": "0x1234567890abcdef...",
    "did": "did:web:example.com",
    "didVerified": true,
    "organization": "DataCorp Inc",
    "phoneNumber": "+1234567890",
    "website": "https://datacorp.com",
    "location": "New York, NY",
    "isRegistered": true,
    "onboardingStatus": "COMPLETED",
    "lastLoginAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT /api/auth/profile
**Purpose**: Update user profile

**Headers**: `Authorization: Bearer <jwt_token>`

**Request Body**:
```json
{
  "name": "John Doe Updated",
  "organization": "Updated Corp Inc",
  "phoneNumber": "+1987654321",
  "website": "https://updatedcorp.com",
  "location": "San Francisco, CA"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "name": "John Doe Updated",
    "email": "john.doe@example.com",
    "partyType": "TDP",
    "organization": "Updated Corp Inc",
    "phoneNumber": "+1987654321",
    "website": "https://updatedcorp.com",
    "location": "San Francisco, CA"
  }
}
```

---

## Contract API Endpoints

### Contract Management

#### GET /api/contracts/user/:userId
**Purpose**: Get all contracts for a user

**Headers**: `Authorization: Bearer <jwt_token>`

**Query Parameters**:
- `status` (optional): Filter by contract status
- `limit` (optional): Number of contracts to return (default: 10)
- `offset` (optional): Number of contracts to skip (default: 0)

**Response**:
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
      "termsAndConditions": "Contract terms...",
      "tdpSignature": "signature_hash",
      "tdcSignature": "signature_hash",
      "ccrpSignature": "signature_hash",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "tdp": {
        "id": 1,
        "name": "Data Provider",
        "email": "tdp@example.com",
        "walletAddress": "0x1234567890abcdef..."
      },
      "tdc": {
        "id": 2,
        "name": "Data Consumer",
        "email": "tdc@example.com",
        "walletAddress": "0xabcdef1234567890..."
      },
      "ccrp": {
        "id": 3,
        "name": "Clean Room Provider",
        "email": "ccrp@example.com",
        "walletAddress": "0x7890abcdef123456..."
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

#### GET /api/contracts/:contractId
**Purpose**: Get specific contract details

**Headers**: `Authorization: Bearer <jwt_token>`

**Response**:
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
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "tdp": {
    "id": 1,
    "name": "Data Provider",
    "email": "tdp@example.com",
    "walletAddress": "0x1234567890abcdef..."
  },
  "tdc": {
    "id": 2,
    "name": "Data Consumer",
    "email": "tdc@example.com",
    "walletAddress": "0xabcdef1234567890..."
  },
  "ccrp": {
    "id": 3,
    "name": "Clean Room Provider",
    "email": "ccrp@example.com",
    "walletAddress": "0x7890abcdef123456..."
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

#### POST /api/contracts
**Purpose**: Create new contract (TDC only)

**Headers**: `Authorization: Bearer <jwt_token>`

**Request Body**:
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

**Response**:
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

#### POST /api/contracts/:contractId/sign
**Purpose**: Sign contract with DID signature

**Headers**: `Authorization: Bearer <jwt_token>`

**Request Body**:
```json
{
  "did": "did:web:example.com",
  "signature": "base64url_signature",
  "message": "Contract signing message"
}
```

**Response**:
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

#### PUT /api/contracts/:contractId/status
**Purpose**: Update contract status (CCRP only)

**Headers**: `Authorization: Bearer <jwt_token>`

**Request Body**:
```json
{
  "status": "COMPLETED",
  "reason": "Contract execution completed successfully"
}
```

**Response**:
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

---

## Signing API Endpoints

### Enterprise Signing Service

#### POST /api/signing/sign
**Purpose**: Sign a message with enterprise DID

**Headers**: `Authorization: Bearer <jwt_token>`

**Request Body**:
```json
{
  "message": "Message to sign",
  "did": "did:web:example.com"
}
```

**Response**:
```json
{
  "success": true,
  "signature": "base64url_signature",
  "did": "did:web:example.com",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET /api/signing/dids
**Purpose**: Get available enterprise DIDs

**Headers**: `Authorization: Bearer <jwt_token>`

**Response**:
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

#### GET /api/signing/public-key/:did
**Purpose**: Get public key for a specific DID

**Headers**: `Authorization: Bearer <jwt_token>`

**Response**:
```json
{
  "success": true,
  "did": "did:web:example.com",
  "publicKey": {
    "kty": "EC",
    "crv": "P-256",
    "x": "FFQw_IJcWPr8qZrwq48azt1hVM8JNp3nnJ0367TxUyQ=",
    "y": "AkPYsoJhbJNqIRGwnUHQN2D3cq4MPtzlVPx8BVuzTAo=",
    "alg": "ES256"
  }
}
```

#### POST /api/signing/validate-permission
**Purpose**: Validate if user can sign with a specific DID

**Headers**: `Authorization: Bearer <jwt_token>`

**Request Body**:
```json
{
  "did": "did:web:example.com"
}
```

**Response**:
```json
{
  "success": true,
  "hasPermission": true,
  "userId": 1,
  "did": "did:web:example.com"
}
```

#### POST /api/signing/test
**Purpose**: Test signing with a simple message

**Headers**: `Authorization: Bearer <jwt_token>`

**Request Body**:
```json
{
  "did": "did:web:example.com"
}
```

**Response**:
```json
{
  "success": true,
  "testMessage": "Test message for enterprise signing by user 1 at 2024-01-01T00:00:00.000Z",
  "signature": "base64url_signature",
  "did": "did:web:example.com",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Data Models

### User Model
```json
{
  "id": "integer",
  "name": "string",
  "email": "string",
  "password": "string (hashed)",
  "partyType": "enum (TDP, TDC, CCRP, AppAdmin)",
  "walletAddress": "string (optional)",
  "publicKey": "string (optional)",
  "did": "string (optional)",
  "didSource": "enum (SYSTEM_GENERATED, USER_PROVIDED)",
  "didVerified": "boolean",
  "didVerificationMethod": "string (optional)",
  "organization": "string (optional)",
  "phoneNumber": "string (optional)",
  "website": "string (optional)",
  "location": "string (optional)",
  "isActive": "boolean",
  "isRegistered": "boolean",
  "onboardingStatus": "enum (PENDING, IN_PROGRESS, COMPLETED)",
  "emailVerified": "boolean",
  "lastLoginAt": "datetime",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Contract Model
```json
{
  "contractId": "string",
  "tdpId": "integer",
  "tdcId": "integer",
  "ccrpId": "integer (optional)",
  "datasetId": "string",
  "modelId": "string",
  "price": "decimal",
  "duration": "integer",
  "status": "enum (DRAFT, PENDING_TDP_APPROVAL, PENDING_TDC_APPROVAL, PENDING_CCRP_APPROVAL, ACTIVE, COMPLETED, CANCELLED)",
  "termsAndConditions": "text",
  "tdpSignature": "string (optional)",
  "tdcSignature": "string (optional)",
  "ccrpSignature": "string (optional)",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Dataset Model
```json
{
  "datasetId": "string",
  "name": "string",
  "description": "text",
  "category": "enum (IMAGE_RECOGNITION, NLP, AUDIO_PROCESSING, etc.)",
  "price": "decimal",
  "ownerId": "integer",
  "isActive": "boolean",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

---

## Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## Rate Limiting

### Authentication Endpoints
- **Registration**: 5 requests per 15 minutes per IP
- **Login**: 10 requests per 15 minutes per IP
- **Password Reset**: 3 requests per hour per email

### Contract Endpoints
- **Contract Creation**: 20 requests per hour per user
- **Contract Signing**: 50 requests per hour per user
- **Contract Retrieval**: 100 requests per hour per user

### Signing Endpoints
- **Message Signing**: 100 requests per hour per user
- **DID Operations**: 50 requests per hour per user

### Rate Limit Response
```json
{
  "error": "Too many requests",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 900,
  "message": "Rate limit exceeded. Please try again later."
}
```

---

## Security Considerations

### Authentication
- JWT tokens expire after 24 hours
- Tokens are invalidated on password change
- Failed login attempts are rate-limited
- Account lockout after 5 failed attempts

### Authorization
- Role-based access control enforced
- Resource ownership validation
- DID signature verification required for sensitive operations

### Data Protection
- All sensitive data encrypted in transit (HTTPS)
- Passwords hashed using bcrypt
- Private keys stored securely (HSM in production)
- Audit logging for all security events

### Input Validation
- All input validated and sanitized
- SQL injection prevention
- XSS protection
- CSRF protection

---

## Testing

### Test Endpoints
- **Health Check**: `GET /api/health`
- **API Status**: `GET /api/status`
- **Test Signing**: `POST /api/signing/test`

### Test Data
```json
{
  "testUser": {
    "email": "test@example.com",
    "password": "TestPass123!",
    "partyType": "TDP"
  },
  "testContract": {
    "tdpId": 1,
    "datasetId": "TEST_DATASET_001",
    "modelId": "TEST_MODEL_001",
    "price": 100.00,
    "duration": 7,
    "termsAndConditions": "Test contract terms"
  }
}
```

---

## Conclusion

This API specification provides a comprehensive framework for secure contract management with enterprise-grade IAM integration. The implementation supports multiple authentication methods, role-based access control, and secure cryptographic operations.

### Key Features
- **Secure Authentication**: JWT and Keycloak integration
- **Role-Based Access**: Granular permissions for different user types
- **DID Integration**: Support for decentralized identity
- **Enterprise Signing**: Secure cryptographic operations
- **Audit Logging**: Complete audit trail for compliance
- **Rate Limiting**: Protection against abuse
- **Error Handling**: Comprehensive error responses

For production deployment, ensure all security controls are properly configured and regularly audited. 