# 🔌 API Reference

Complete API documentation for the Contract Management System. This reference consolidates all API-related documentation.

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Confidential AI Network (CAN)](#confidential-ai-network-can)
3. [SCITT CCF Integration API](#-scitt-ccf-integration-api)
4. [Contract Management](#contract-management)
5. [Contract Signing](#-contract-signing)
6. [Dataset Management](#dataset-management)
7. [Cloud Credentials](#cloud-credentials)
8. [Blockchain Integration](#blockchain-integration)
9. [Differential Privacy](#differential-privacy)
10. [Error Handling](#error-handling)
11. [Rate Limiting](#rate-limiting)

## 🔐 Authentication

### **Base URL**
```
http://localhost:5001/api
```

### **Authentication Headers**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

## 🤝 Confidential AI Network (CAN)

CAN APIs are a **separate namespace** under `/api/can/*` for the CAN workflow (JCS + CCR + provenance).

### CAN auth model (dev/test)

CAN uses a **principal identity** separate from Keycloak portal users.

**MVP (dev/test)** uses an HTTP header:

```http
X-CAN-Principal-Id: did:can:dp:example
Content-Type: application/json
```

Notes:
- This header is **required** for CAN endpoints.
- In browsers, the backend must allow CORS preflight for `X-CAN-Principal-Id`.
- Target production design replaces this with certificate-based principal auth + short-lived tokens.

### JCS (Job Coordination Service) — `/api/can/jcs`

#### Create a job
```http
POST /can/jcs/jobs
```

**Body:**
```json
{
  "contractId": "RICARDIAN-...",
  "ccrProvider": "local"
}
```

**Response (shape):**
```json
{
  "success": true,
  "data": {
    "job": {
      "jobId": "uuid",
      "contractId": "RICARDIAN-...",
      "escrowState": "OPEN",
      "escrowDeadline": "2026-04-30T16:00:00.000Z",
      "ccrProvider": "local",
      "trainingJobId": null
    }
  }
}
```

#### Get job status
```http
GET /can/jcs/jobs/:jobId
```

#### Get job attestation bundle (MVP simulated)
```http
GET /can/jcs/jobs/:jobId/attestation
```

#### Signal key release (no key material)
```http
POST /can/jcs/jobs/:jobId/key-released
```

**Body:**
```json
{ "keyType": "DEK" }
```

Valid `keyType`: `DEK` or `MEK`.

#### Release job to CCRP scheduler
```http
POST /can/jcs/jobs/:jobId/release
```

#### SSE job events
```http
GET /can/jcs/jobs/:jobId/events
```

#### Training link (local CCRP)
```http
GET /can/jcs/jobs/:jobId/training
```

### CCR (key delivery namespace) — `/api/can/ccr`

MVP behavior: the endpoint exists to model the CCR side, but **rejects key material** to enforce “platform never sees keys”.

```http
POST /can/ccr/:ccrSessionId/keys
```

### Provenance — `/api/can/provenance`

#### Get hash-chained provenance events for a job
```http
GET /can/provenance/jobs/:jobId/events
```

### **Login**
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 50,
    "email": "user@example.com",
    "partyType": "TDC",
    "name": "User Name",
    "depaId": "DEPA123456"
  }
}
```

### **Logout**
```http
POST /auth/logout
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### **Refresh Token**
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **Register User**
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User",
  "partyType": "TDC",
  "organization": "Example Corp",
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 54,
    "email": "newuser@example.com",
    "partyType": "TDC",
    "name": "New User"
  }
}
```

## 👥 User Management

### **Get User Profile**
```http
GET /auth/profile
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 50,
    "email": "user@example.com",
    "partyType": "TDC",
    "name": "User Name",
    "organization": "Example Corp",
    "phoneNumber": "+1234567890",
    "website": "https://example.com",
    "location": "New York, NY",
    "depaId": "DEPA123456",
    "createdAt": "2025-08-03T21:52:36.235Z",
    "updatedAt": "2025-08-03T21:52:36.235Z"
  }
}
```

### **Update User Profile**
```http
PUT /auth/profile
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "organization": "Updated Corp",
  "phoneNumber": "+1234567890",
  "website": "https://updated.com",
  "location": "San Francisco, CA"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": 50,
    "name": "Updated Name",
    "organization": "Updated Corp"
  }
}
```

### **Change Password**
```http
PUT /auth/change-password
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### **Forgot Password**
```http
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### **Reset Password**
```http
POST /auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### **Email Verification**
```http
POST /auth/verify-email
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

### **Verify Email Token**
```http
GET /auth/verify-email/:token
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### **Onboarding Status**
```http
GET /auth/onboarding-status
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "onboardingStatus": {
    "isComplete": false,
    "stepsCompleted": ["email_verification", "profile_setup"],
    "nextStep": "wallet_connection",
    "progress": 60
  }
}
```

### **Complete Onboarding**
```http
POST /auth/complete-onboarding
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "walletAddress": "0x1234567890abcdef...",
  "didDocument": "did:example:1234567890abcdef"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding completed successfully"
}
```

### **Wallet Authentication**
```http
POST /auth/wallet
```

**Request Body:**
```json
{
  "walletAddress": "0x1234567890abcdef...",
  "signature": "0xabcdef1234567890...",
  "message": "Sign this message to authenticate"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 50,
    "email": "user@example.com",
    "partyType": "TDC",
    "walletAddress": "0x1234567890abcdef..."
  }
}
```

### **Get Nonce for Wallet**
```http
GET /auth/nonce/:walletAddress
```

**Response:**
```json
{
  "success": true,
  "nonce": "random_nonce_string",
  "message": "Sign this message to authenticate"
}
```

### **Email Verification**
```http
POST /auth/verify-email
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

### **Verify Email Token**
```http
GET /auth/verify-email/:token
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### **Onboarding Status**
```http
GET /auth/onboarding-status
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "onboardingStatus": {
    "isComplete": false,
    "stepsCompleted": ["email_verification", "profile_setup"],
    "nextStep": "wallet_connection",
    "progress": 60
  }
}
```

### **Complete Onboarding**
```http
POST /auth/complete-onboarding
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "walletAddress": "0x1234567890abcdef...",
  "didDocument": "did:example:1234567890abcdef"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding completed successfully"
}
```

### **Wallet Authentication**
```http
POST /auth/wallet
```

**Request Body:**
```json
{
  "walletAddress": "0x1234567890abcdef...",
  "signature": "0xabcdef1234567890...",
  "message": "Sign this message to authenticate"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 50,
    "email": "user@example.com",
    "partyType": "TDC",
    "walletAddress": "0x1234567890abcdef..."
  }
}
```

### **Get Nonce for Wallet**
```http
GET /auth/nonce/:walletAddress
```

**Response:**
```json
{
  "success": true,
  "nonce": "random_nonce_string",
  "message": "Sign this message to authenticate"
}
```

## 🔗 SCITT CCF Integration API

### **SCITT CCF Health & Status**
```http
GET /api/scitt-ccf/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-13T12:00:00.000Z",
  "scittCcf": {
    "isHealthy": true,
    "responseTime": 45,
    "lastCheck": "2025-08-13T12:00:00.000Z"
  }
}
```

```http
GET /api/scitt-ccf/metrics
```

**Response:**
```json
{
  "totalClaims": 150,
  "activeContracts": 45,
  "averageResponseTime": 67,
  "uptime": "99.9%",
  "lastUpdated": "2025-08-13T12:00:00.000Z"
}
```

### **SCITT CCF Contract Operations**
```http
POST /api/scitt-ccf/contracts
```

**Request Body:**
```json
{
  "name": "SCITT CCF Test Contract",
  "description": "Test contract created via SCITT CCF",
  "tdpId": 2,
  "tdcId": 5,
  "ccrpId": 7,
  "datasetId": 1,
  "price": 5000,
  "duration": 90,
  "terms": "Test terms and conditions"
}
```

**Response:**
```json
{
  "success": true,
  "source": "SCITT_CCF",
  "claimId": "CLAIM-2025-001",
  "receipt": "RECEIPT-2025-001",
  "contractId": "CONTRACT-2025-001",
  "message": "Contract created successfully in SCITT CCF"
}
```

```http
GET /api/scitt-ccf/contracts/{claimId}/status
```

**Response:**
```json
{
  "claimId": "CLAIM-2025-001",
  "status": "ACTIVE",
  "timestamp": "2025-08-13T12:00:00.000Z",
  "contractId": "CONTRACT-2025-001"
}
```

### **SCITT CCF Claims Management**
```http
POST /api/scitt-ccf/claims
```

**Request Body:**
```json
{
  "type": "contract_creation",
  "data": {
    "name": "Test Claim",
    "description": "Test claim data",
    "tdpId": 2,
    "tdcId": 5,
    "price": 3000
  }
}
```

**Response:**
```json
{
  "claimId": "CLAIM-2025-002",
  "status": "submitted",
  "timestamp": "2025-08-13T12:00:00.000Z"
}
```

### **SCITT CCF Migration Management**
```http
GET /api/scitt-ccf/migration/mode
```

**Response:**
```json
{
  "mode": "HYBRID",
  "description": "Using both SCITT CCF and Ethereum",
  "updatedAt": "2025-08-13T12:00:00.000Z"
}
```

```http
PUT /api/scitt-ccf/migration/mode
```

**Request Body:**
```json
{
  "mode": "SCITT_CCF_ONLY"
}
```

**Response:**
```json
{
  "mode": "SCITT_CCF_ONLY",
  "description": "Using only SCITT CCF Ledger",
  "updatedAt": "2025-08-13T12:00:00.000Z"
}
```

## 📄 Contract Management

### **List Contracts**
```http
GET /contracts
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (draft, pending, active, completed, cancelled, failed)
- `partyType`: Filter by party type (TDC, TDP, CCRP)

**Response:**
```json
{
  "success": true,
  "contracts": [
    {
      "id": 1,
      "contractId": "CONTRACT-2025-001",
      "title": "Dataset Purchase Agreement",
      "status": "active",
      "partyType": "TDC",
      "datasetName": "AI Training Dataset",
      "price": 1000.00,
      "createdAt": "2025-08-03T21:52:36.235Z",
      "updatedAt": "2025-08-03T21:52:36.235Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### **Get Contract Details**
```http
GET /contracts/:id
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "contract": {
    "id": 1,
    "contractId": "CONTRACT-2025-001",
    "title": "Dataset Purchase Agreement",
    "description": "Purchase agreement for AI training dataset",
    "status": "active",
    "partyType": "TDC",
    "datasetId": 1,
    "datasetName": "AI Training Dataset",
    "price": 1000.00,
    "currency": "USD",
    "startDate": "2025-08-03T00:00:00.000Z",
    "endDate": "2025-12-31T23:59:59.000Z",
    "terms": "Standard terms and conditions apply",
    "depaId": "DEPA123456",
    "createdAt": "2025-08-03T21:52:36.235Z",
    "updatedAt": "2025-08-03T21:52:36.235Z"
  }
}
```

### **Create Contract**
```http
POST /contracts
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "Dataset Purchase Agreement",
  "description": "Purchase agreement for AI training dataset",
  "datasetId": 1,
  "price": 1000.00,
  "currency": "USD",
  "startDate": "2025-08-03T00:00:00.000Z",
  "endDate": "2025-12-31T23:59:59.000Z",
  "terms": "Standard terms and conditions apply",
  "trainingEnvironment": {
    "provider": "AWS",
    "region": "us-east-1",
    "instanceType": "t3.medium",
    "storage": "100GB"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contract created successfully",
  "contract": {
    "id": 1,
    "contractId": "CONTRACT-2025-001",
    "title": "Dataset Purchase Agreement",
    "status": "pending"
  }
}
```

### **Update Contract**
```http
PUT /contracts/:id
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "Updated Contract Title",
  "description": "Updated description",
  "price": 1200.00,
  "terms": "Updated terms and conditions"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contract updated successfully",
  "contract": {
    "id": 1,
    "title": "Updated Contract Title",
    "price": 1200.00
  }
}
```

### **Delete Contract**
```http
DELETE /contracts/:id
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Contract deleted successfully"
}
```

## ✍️ Contract Signing

### **Get Signing Configuration**
```http
GET /signing/config
```

**Response:**
```json
{
  "success": true,
  "config": {
    "supportedAlgorithms": ["ECDSA-P256", "RSA-2048", "RSA-4096"],
    "defaultAlgorithm": "ECDSA-P256",
    "keyFormats": ["PEM", "JWK"]
  }
}
```

### **Get User's Signing Keys**
```http
GET /signing/keys
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "keys": [
    {
      "keyId": "key_1234567890",
      "algorithm": "ECDSA-P256",
      "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "status": "ACTIVE"
    }
  ]
}
```

### **Generate New Signing Key**
```http
POST /signing/keys/generate
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "algorithm": "ECDSA-P256",
  "keyName": "My Signing Key"
}
```

**Response:**
```json
{
  "success": true,
  "key": {
    "keyId": "key_1234567890",
    "algorithm": "ECDSA-P256",
    "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### **Sign Contract**
```http
POST /signing/sign
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "contractId": "CONTRACT-2025-001",
  "keyId": "key_1234567890",
  "contractHash": "sha256_hash_of_contract"
}
```

**Response:**
```json
{
  "success": true,
  "signature": {
    "signature": "base64_encoded_signature",
    "algorithm": "ECDSA-P256",
    "keyId": "key_1234567890",
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

### **Verify Signature**
```http
POST /signing/verify
```

**Request Body:**
```json
{
  "contractId": "CONTRACT-2025-001",
  "signature": "base64_encoded_signature",
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
  "contractHash": "sha256_hash_of_contract"
}
```

**Response:**
```json
{
  "success": true,
  "isValid": true,
  "verifiedAt": "2025-01-15T10:30:00.000Z"
}
```

### **Get Contract Signatures**
```http
GET /signing/contracts/:contractId/signatures
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "signatures": [
    {
      "signatureId": "sig_1234567890",
      "userId": 50,
      "keyId": "key_1234567890",
      "signature": "base64_encoded_signature",
      "algorithm": "ECDSA-P256",
      "signedAt": "2025-01-15T10:30:00.000Z",
      "status": "VALID"
    }
  ]
}
```

### **Enterprise Key Registration**
```http
POST /signing/enterprise/keys/register
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
  "algorithm": "ECDSA-P256",
  "provider": "azure",
  "keyName": "Enterprise Key",
  "metadata": {
    "keyVaultUrl": "https://myvault.vault.azure.net/",
    "keyName": "my-signing-key"
  }
}
```

**Response:**
```json
{
  "success": true,
  "key": {
    "keyId": "ent_key_1234567890",
    "algorithm": "ECDSA-P256",
    "provider": "azure",
    "status": "ACTIVE",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### **Enterprise Signing**
```http
POST /signing/enterprise/sign
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "contractId": "CONTRACT-2025-001",
  "keyId": "ent_key_1234567890",
  "contractHash": "sha256_hash_of_contract",
  "kmsConfig": {
    "provider": "azure",
    "keyVaultUrl": "https://myvault.vault.azure.net/",
    "keyName": "my-signing-key"
  }
}
```

**Response:**
```json
{
  "success": true,
  "signingRequest": {
    "requestId": "req_1234567890",
    "status": "PENDING",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### **KMS Configuration**
```http
POST /signing/enterprise/kms/test
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "provider": "azure",
  "credentials": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "tenantId": "your-tenant-id"
  },
  "keyVaultUrl": "https://myvault.vault.azure.net/"
}
```

**Response:**
```json
{
  "success": true,
  "connectionTest": {
    "isConnected": true,
    "responseTime": 150,
    "testedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

## ✍️ Contract Signing

### **Get Signing Configuration**
```http
GET /signing/config
```

**Response:**
```json
{
  "success": true,
  "config": {
    "supportedAlgorithms": ["ECDSA-P256", "RSA-2048", "RSA-4096"],
    "defaultAlgorithm": "ECDSA-P256",
    "keyFormats": ["PEM", "JWK"]
  }
}
```

### **Get User's Signing Keys**
```http
GET /signing/keys
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "keys": [
    {
      "keyId": "key_1234567890",
      "algorithm": "ECDSA-P256",
      "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "status": "ACTIVE"
    }
  ]
}
```

### **Generate New Signing Key**
```http
POST /signing/keys/generate
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "algorithm": "ECDSA-P256",
  "keyName": "My Signing Key"
}
```

**Response:**
```json
{
  "success": true,
  "key": {
    "keyId": "key_1234567890",
    "algorithm": "ECDSA-P256",
    "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### **Sign Contract**
```http
POST /signing/sign
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "contractId": "CONTRACT-2025-001",
  "keyId": "key_1234567890",
  "contractHash": "sha256_hash_of_contract"
}
```

**Response:**
```json
{
  "success": true,
  "signature": {
    "signature": "base64_encoded_signature",
    "algorithm": "ECDSA-P256",
    "keyId": "key_1234567890",
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

### **Verify Signature**
```http
POST /signing/verify
```

**Request Body:**
```json
{
  "contractId": "CONTRACT-2025-001",
  "signature": "base64_encoded_signature",
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
  "contractHash": "sha256_hash_of_contract"
}
```

**Response:**
```json
{
  "success": true,
  "isValid": true,
  "verifiedAt": "2025-01-15T10:30:00.000Z"
}
```

### **Get Contract Signatures**
```http
GET /signing/contracts/:contractId/signatures
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "signatures": [
    {
      "signatureId": "sig_1234567890",
      "userId": 50,
      "keyId": "key_1234567890",
      "signature": "base64_encoded_signature",
      "algorithm": "ECDSA-P256",
      "signedAt": "2025-01-15T10:30:00.000Z",
      "status": "VALID"
    }
  ]
}
```

### **Enterprise Key Registration**
```http
POST /signing/enterprise/keys/register
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
  "algorithm": "ECDSA-P256",
  "provider": "azure",
  "keyName": "Enterprise Key",
  "metadata": {
    "keyVaultUrl": "https://myvault.vault.azure.net/",
    "keyName": "my-signing-key"
  }
}
```

**Response:**
```json
{
  "success": true,
  "key": {
    "keyId": "ent_key_1234567890",
    "algorithm": "ECDSA-P256",
    "provider": "azure",
    "status": "ACTIVE",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### **Enterprise Signing**
```http
POST /signing/enterprise/sign
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "contractId": "CONTRACT-2025-001",
  "keyId": "ent_key_1234567890",
  "contractHash": "sha256_hash_of_contract",
  "kmsConfig": {
    "provider": "azure",
    "keyVaultUrl": "https://myvault.vault.azure.net/",
    "keyName": "my-signing-key"
  }
}
```

**Response:**
```json
{
  "success": true,
  "signingRequest": {
    "requestId": "req_1234567890",
    "status": "PENDING",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### **KMS Configuration**
```http
POST /signing/enterprise/kms/test
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "provider": "azure",
  "credentials": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "tenantId": "your-tenant-id"
  },
  "keyVaultUrl": "https://myvault.vault.azure.net/"
}
```

**Response:**
```json
{
  "success": true,
  "connectionTest": {
    "isConnected": true,
    "responseTime": 150,
    "testedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

## ✍️ Contract Signing

### **Get Signing Configuration**
```http
GET /signing/config
```

**Response:**
```json
{
  "success": true,
  "config": {
    "supportedAlgorithms": ["ECDSA-P256", "RSA-2048", "RSA-4096"],
    "defaultAlgorithm": "ECDSA-P256",
    "keyFormats": ["PEM", "JWK"]
  }
}
```

### **Get User's Signing Keys**
```http
GET /signing/keys
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "keys": [
    {
      "keyId": "key_1234567890",
      "algorithm": "ECDSA-P256",
      "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "status": "ACTIVE"
    }
  ]
}
```

### **Generate New Signing Key**
```http
POST /signing/keys/generate
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "algorithm": "ECDSA-P256",
  "keyName": "My Signing Key"
}
```

**Response:**
```json
{
  "success": true,
  "key": {
    "keyId": "key_1234567890",
    "algorithm": "ECDSA-P256",
    "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### **Sign Contract**
```http
POST /signing/sign
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "contractId": "CONTRACT-2025-001",
  "keyId": "key_1234567890",
  "contractHash": "sha256_hash_of_contract"
}
```

**Response:**
```json
{
  "success": true,
  "signature": {
    "signature": "base64_encoded_signature",
    "algorithm": "ECDSA-P256",
    "keyId": "key_1234567890",
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

### **Verify Signature**
```http
POST /signing/verify
```

**Request Body:**
```json
{
  "contractId": "CONTRACT-2025-001",
  "signature": "base64_encoded_signature",
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
  "contractHash": "sha256_hash_of_contract"
}
```

**Response:**
```json
{
  "success": true,
  "isValid": true,
  "verifiedAt": "2025-01-15T10:30:00.000Z"
}
```

### **Get Contract Signatures**
```http
GET /signing/contracts/:contractId/signatures
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "signatures": [
    {
      "signatureId": "sig_1234567890",
      "userId": 50,
      "keyId": "key_1234567890",
      "signature": "base64_encoded_signature",
      "algorithm": "ECDSA-P256",
      "signedAt": "2025-01-15T10:30:00.000Z",
      "status": "VALID"
    }
  ]
}
```

### **Enterprise Key Registration**
```http
POST /signing/enterprise/keys/register
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
  "algorithm": "ECDSA-P256",
  "provider": "azure",
  "keyName": "Enterprise Key",
  "metadata": {
    "keyVaultUrl": "https://myvault.vault.azure.net/",
    "keyName": "my-signing-key"
  }
}
```

**Response:**
```json
{
  "success": true,
  "key": {
    "keyId": "ent_key_1234567890",
    "algorithm": "ECDSA-P256",
    "provider": "azure",
    "status": "ACTIVE",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### **Enterprise Signing**
```http
POST /signing/enterprise/sign
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "contractId": "CONTRACT-2025-001",
  "keyId": "ent_key_1234567890",
  "contractHash": "sha256_hash_of_contract",
  "kmsConfig": {
    "provider": "azure",
    "keyVaultUrl": "https://myvault.vault.azure.net/",
    "keyName": "my-signing-key"
  }
}
```

**Response:**
```json
{
  "success": true,
  "signingRequest": {
    "requestId": "req_1234567890",
    "status": "PENDING",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### **KMS Configuration**
```http
POST /signing/enterprise/kms/test
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "provider": "azure",
  "credentials": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "tenantId": "your-tenant-id"
  },
  "keyVaultUrl": "https://myvault.vault.azure.net/"
}
```

**Response:**
```json
{
  "success": true,
  "connectionTest": {
    "isConnected": true,
    "responseTime": 150,
    "testedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

## 📊 Dataset Management

### **List Datasets**
```http
GET /datasets
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `type`: Filter by dataset type
- `provider`: Filter by provider
- `priceMin`: Minimum price
- `priceMax`: Maximum price

**Response:**
```json
{
  "success": true,
  "datasets": [
    {
      "id": 1,
      "name": "AI Training Dataset",
      "description": "Comprehensive dataset for AI model training",
      "type": "image_classification",
      "size": "2.5GB",
      "price": 1000.00,
      "currency": "USD",
      "provider": "TDP Provider",
      "depaId": "DEPA123456",
      "createdAt": "2025-08-03T21:52:36.235Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "pages": 2
  }
}
```

### **Get Dataset Details**
```http
GET /datasets/:id
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "dataset": {
    "id": 1,
    "name": "AI Training Dataset",
    "description": "Comprehensive dataset for AI model training",
    "type": "image_classification",
    "size": "2.5GB",
    "format": "CSV",
    "price": 1000.00,
    "currency": "USD",
    "provider": "TDP Provider",
    "depaId": "DEPA123456",
    "metadata": {
      "numSamples": 10000,
      "numFeatures": 784,
      "numClasses": 10
    },
    "licensing": "Commercial use allowed",
    "createdAt": "2025-08-03T21:52:36.235Z",
    "updatedAt": "2025-08-03T21:52:36.235Z"
  }
}
```

### **Create Dataset**
```http
POST /datasets
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "New AI Dataset",
  "description": "Dataset for machine learning",
  "type": "image_classification",
  "size": "1.5GB",
  "format": "CSV",
  "price": 500.00,
  "currency": "USD",
  "metadata": {
    "numSamples": 5000,
    "numFeatures": 784,
    "numClasses": 5
  },
  "licensing": "Commercial use allowed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Dataset created successfully",
  "dataset": {
    "id": 2,
    "name": "New AI Dataset",
    "status": "pending"
  }
}
```

### **Update Dataset**
```http
PUT /datasets/:id
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Updated Dataset Name",
  "description": "Updated description",
  "price": 750.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Dataset updated successfully",
  "dataset": {
    "id": 1,
    "name": "Updated Dataset Name",
    "price": 750.00
  }
}
```

### **Delete Dataset**
```http
DELETE /datasets/:id
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Dataset deleted successfully"
}
```

## ☁️ Cloud Credentials

### **List Cloud Credentials**
```http
GET /ccrp/cloud-credentials
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "credentials": [
    {
      "id": 1,
      "cloudProvider": "AWS",
      "projectId": "my-project",
      "secretName": "aws-credentials",
      "secretManager": "vault",
      "isValid": true,
      "createdAt": "2025-08-03T21:52:36.235Z"
    }
  ]
}
```

### **Add Cloud Credentials**
```http
POST /ccrp/cloud-credentials
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "cloudProvider": "AWS",
  "projectId": "my-project",
  "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
  "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "region": "us-east-1",
  "secretManager": "vault"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cloud credentials added successfully",
  "credential": {
    "id": 1,
    "cloudProvider": "AWS",
    "projectId": "my-project"
  }
}
```

### **Validate Cloud Credentials**
```http
POST /ccrp/cloud-credentials/:id/validate
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Credentials validated successfully",
  "validation": {
    "isValid": true,
    "permissions": ["s3:GetObject", "ec2:DescribeInstances"],
    "regions": ["us-east-1", "us-west-2"]
  }
}
```

### **Delete Cloud Credentials**
```http
DELETE /ccrp/cloud-credentials/:id
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Cloud credentials deleted successfully"
}
```

## ⛓️ Blockchain Integration

### **Get Contract on Blockchain**
```http
GET /blockchain/contracts/:contractId
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "contract": {
    "contractId": "CONTRACT-2025-001",
    "blockchainAddress": "0x1234567890abcdef...",
    "blockNumber": 12345,
    "transactionHash": "0xabcdef1234567890...",
    "status": "confirmed",
    "createdAt": "2025-08-03T21:52:36.235Z"
  }
}
```

### **Deploy Contract to Blockchain**
```http
POST /blockchain/contracts
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "contractId": "CONTRACT-2025-001",
  "title": "Dataset Purchase Agreement",
  "parties": ["0x1234...", "0x5678..."],
  "terms": "Standard terms and conditions"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contract deployed to blockchain",
  "transaction": {
    "hash": "0xabcdef1234567890...",
    "blockNumber": 12345,
    "gasUsed": 150000
  }
}
```

## 🔐 Differential Privacy

The differential privacy API provides comprehensive privacy-preserving data analysis capabilities with budget tracking and audit logging.

### **Base URL**
```
http://localhost:5001/api/dp
```

### **Authentication**
All endpoints require authentication via Bearer token:
```http
Authorization: Bearer <access_token>
```

### **Get Available Mechanisms**
```http
GET /dp/mechanisms
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "laplace",
      "description": "Laplace mechanism for continuous data",
      "bestFor": ["GRADIENT", "CONTINUOUS_VALUES", "REAL_NUMBERS"],
      "parameters": ["epsilon", "sensitivity"]
    },
    {
      "name": "gaussian",
      "description": "Gaussian mechanism for continuous data with better utility",
      "bestFor": ["AVERAGE", "CONTINUOUS_VALUES", "REAL_NUMBERS"],
      "parameters": ["epsilon", "delta", "sensitivity"]
    }
  ]
}
```

### **Get Supported Query Types**
```http
GET /dp/query-types
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "COUNT",
      "description": "Count queries (e.g., number of records)",
      "sensitivity": 1,
      "mechanism": "geometric"
    },
    {
      "name": "AVERAGE",
      "description": "Average queries (e.g., mean value)",
      "sensitivity": "data_dependent",
      "mechanism": "gaussian"
    }
  ]
}
```

### **Test Differential Privacy**
```http
POST /dp/test
```

**Request Body:**
```json
{
  "data": [1, 2, 3, 4, 5],
  "query": {
    "type": "AVERAGE"
  },
  "privacyParams": {
    "epsilon": 0.1,
    "delta": 1e-5,
    "mechanism": "laplace"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Differential privacy test completed successfully",
  "data": {
    "success": true,
    "result": [1.033, 1.976, 3.036, 3.988, 5.044],
    "privacyMetrics": {
      "mechanism": "laplace",
      "epsilon": 0.1,
      "delta": 0.00001,
      "sensitivity": 1
    }
  },
  "testInfo": {
    "contractId": "test-contract-1754953614346",
    "note": "This was a test operation - no actual budget was consumed"
  }
}
```

### **Apply Differential Privacy**
```http
POST /dp/apply
```

**Request Body:**
```json
{
  "data": [1, 2, 3, 4, 5],
  "query": {
    "type": "AVERAGE",
    "parameters": {
      "aggregation": "mean",
      "groupBy": "category"
    }
  },
  "privacyParams": {
    "contractId": "contract-123",
    "epsilon": 0.1,
    "delta": 1e-5,
    "mechanism": "laplace",
    "sensitivity": 1.0
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Differential privacy applied successfully",
  "data": {
    "result": [1.033, 1.976, 3.036, 3.988, 5.044],
    "privacyMetrics": {
      "mechanism": "laplace",
      "epsilon": 0.1,
      "delta": 0.00001,
      "sensitivity": 1.0,
      "noiseAdded": 0.033
    },
    "budgetConsumed": {
      "epsilon": 0.1,
      "delta": 1e-5,
      "remainingEpsilon": 0.9,
      "remainingDelta": 9e-5
    }
  }
}
```

### **Get Privacy Budget**
```http
GET /dp/budget/:contractId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "budget": {
      "id": 1,
      "contractId": "contract-123",
      "initialEpsilon": 1.0,
      "initialDelta": 0.00001,
      "remainingEpsilon": 0.9,
      "remainingDelta": 9e-5,
      "totalEpsilonConsumed": 0.1,
      "totalDeltaConsumed": 1e-5,
      "budgetStatus": "ACTIVE",
      "lastResetAt": "2025-08-12T01:00:00.000Z"
    },
    "utilization": {
      "epsilonUtilization": 0.1,
      "deltaUtilization": 0.1,
      "budgetHealth": "HEALTHY"
    }
  }
}
```

### **Get Privacy Operation History**
```http
GET /dp/history/:contractId
```

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 50)
- `offset` (optional): Number of records to skip (default: 0)
- `operationType` (optional): Filter by operation type
- `mechanism` (optional): Filter by mechanism
- `startDate` (optional): Filter from date
- `endDate` (optional): Filter to date

**Response:**
```json
{
  "success": true,
  "data": {
    "operations": [
      {
        "id": 1,
        "contractId": "contract-123",
        "operationType": "AVERAGE_QUERY",
        "epsilon": 0.1,
        "delta": 1e-5,
        "mechanism": "laplace",
        "sensitivity": 1.0,
        "dataSize": 5,
        "queryType": "AVERAGE",
        "timestamp": "2025-08-12T01:00:00.000Z",
        "success": true,
        "executionTime": 45
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### **Get Privacy Analytics**
```http
GET /dp/analytics/:contractId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalOperations": 15,
      "successfulOperations": 14,
      "failedOperations": 1,
      "totalEpsilonConsumed": 1.5,
      "totalDeltaConsumed": 1.5e-4
    },
    "mechanismUsage": {
      "laplace": 8,
      "gaussian": 5,
      "exponential": 2
    },
    "queryTypeDistribution": {
      "COUNT": 5,
      "AVERAGE": 6,
      "GRADIENT": 4
    },
    "performance": {
      "averageExecutionTime": 67,
      "fastestOperation": 23,
      "slowestOperation": 156
    },
    "budgetHealth": {
      "status": "HEALTHY",
      "recommendations": [
        "Consider reducing epsilon for COUNT queries",
        "Gaussian mechanism shows better utility for AVERAGE queries"
      ]
    }
  }
}
```

### **Privacy Budget Management**

#### **Budget Status Values**
- `ACTIVE`: Budget is available for operations
- `WARNING`: Budget is running low (less than 20% remaining)
- `EXHAUSTED`: Budget has been fully consumed
- `RESET`: Budget has been reset and is available again

#### **Privacy Parameters**

**Epsilon (ε)**
- Controls the privacy level
- Lower values = higher privacy, lower utility
- Typical range: 0.1 to 10.0
- Default: 1.0

**Delta (δ)**
- Probability of privacy failure
- Lower values = higher privacy
- Typical range: 1e-6 to 1e-3
- Default: 1e-5

**Sensitivity**
- Maximum change in output for any single record
- Automatically calculated for most query types
- Can be manually specified for custom queries

#### **Mechanism Selection Guide**

| Query Type | Recommended Mechanism | Reason |
|------------|----------------------|---------|
| COUNT | Geometric | Best for integer counts |
| SUM | Laplace | Good balance of privacy/utility |
| AVERAGE | Gaussian | Better utility for continuous data |
| GRADIENT | Laplace | Robust for ML training |
| HISTOGRAM | Laplace | Good for categorical data |
| PERCENTILE | Laplace | Stable for statistical measures |

### **Error Handling**

**Insufficient Budget:**
```json
{
  "success": false,
  "error": "Insufficient privacy budget",
  "details": {
    "requiredEpsilon": 0.2,
    "availableEpsilon": 0.1,
    "requiredDelta": 2e-5,
    "availableDelta": 1e-5
  }
}
```

**Invalid Parameters:**
```json
{
  "success": false,
  "error": "Invalid privacy parameters",
  "details": {
    "epsilon": "Must be between 0.1 and 10.0",
    "delta": "Must be between 1e-6 and 1e-3"
  }
}
```

**Query Not Supported:**
```json
{
  "success": false,
  "error": "Query type not supported",
  "supportedTypes": ["COUNT", "SUM", "AVERAGE", "GRADIENT", "HISTOGRAM", "PERCENTILE"]
}
```

### **Best Practices**

1. **Start with Conservative Parameters**
   - Begin with epsilon = 1.0, delta = 1e-5
   - Adjust based on utility requirements

2. **Monitor Budget Consumption**
   - Check budget status before operations
   - Use analytics to optimize parameter selection

3. **Choose Appropriate Mechanisms**
   - Use Laplace for general-purpose queries
   - Use Gaussian for averages when better utility is needed
   - Use Geometric for count queries

4. **Batch Operations**
   - Combine multiple queries when possible
   - Reduces overall privacy budget consumption

5. **Regular Budget Resets**
   - Plan for periodic budget resets
   - Consider seasonal or project-based resets

## ❌ Error Handling

### **Error Response Format**
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Invalid credentials",
    "details": "Username or password is incorrect"
  }
}
```

### **Common Error Codes**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTHENTICATION_FAILED` | 401 | Invalid credentials |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `INTERNAL_ERROR` | 500 | Server error |

### **Validation Errors**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Email is required"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

## 🚦 Rate Limiting

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### **Rate Limit Exceeded**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": "Rate limit exceeded. Try again in 60 seconds."
  }
}
```

### **Rate Limits by Endpoint**

| Endpoint | Limit | Window |
|----------|-------|--------|
| Authentication | 10 requests | 1 minute |
| API endpoints | 100 requests | 1 minute |
| File uploads | 5 requests | 1 minute |
| Blockchain | 20 requests | 1 minute |

## 📚 Related Documentation

- **[Quick Start](QUICK_START.md)** - Get started in 5 minutes
- **[Setup Guide](SETUP.md)** - Complete installation and configuration
- **[User Guide](USER_GUIDE.md)** - How to use the system
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Development workflows
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

---

*This API reference consolidates information from multiple API documentation files.* 