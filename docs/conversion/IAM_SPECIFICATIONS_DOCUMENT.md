# Identity and Access Management (IAM) Specifications
## Contract Management System

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Author:** Contract Management System Team  
**Classification:** Internal Technical Specification

---

## Executive Summary

This document provides comprehensive specifications for the Identity and Access Management (IAM) framework implemented in the Contract Management System. The system supports multiple authentication methods, role-based access control, decentralized identity (DID) integration, and enterprise-grade security controls.

### Key Features
- **Multi-Method Authentication**: JWT tokens, Keycloak integration, and DID-based authentication
- **Role-Based Access Control**: TDP, TDC, CCRP, and Admin roles with granular permissions
- **Enterprise Signing Service**: Secure cryptographic signing with private key management
- **DID Integration**: Support for did:web and did:ethr with verification
- **Audit Logging**: Comprehensive audit trails for all security events

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Authentication Methods](#authentication-methods)
3. [User Registration](#user-registration)
4. [Password Management](#password-management)
5. [Authorization Framework](#authorization-framework)
6. [DID Integration](#did-integration)
7. [Enterprise Signing Service](#enterprise-signing-service)
8. [Security Controls](#security-controls)
9. [Audit and Compliance](#audit-and-compliance)
10. [Implementation Details](#implementation-details)
11. [API Specifications](#api-specifications)
12. [Deployment Considerations](#deployment-considerations)

---

## System Architecture

### High-Level IAM Architecture

The Contract Management System implements a layered IAM architecture that provides secure authentication, authorization, and audit capabilities.

#### Architecture Components

**Frontend Layer**
- User Interface (React.js)
- Authentication Context
- Token Management

**API Gateway**
- Authentication Middleware
- Rate Limiting
- CORS Policy
- Request Validation

**Authentication Services**
- JWT Service
- Keycloak Service
- DID Service
- Enterprise Signing Service

**Authorization Layer**
- Role-Based Access Control (RBAC)
- Permission Service
- Audit Service

**Data Layer**
- User Database (PostgreSQL)
- Audit Database
- Secure Key Store

#### Data Flow

1. **Authentication Request**: User submits credentials
2. **Token Generation**: System generates JWT or validates with Keycloak
3. **Authorization Check**: RBAC validates user permissions
4. **Resource Access**: User accesses authorized resources
5. **Audit Logging**: All actions are logged for compliance

---

## Authentication Methods

### 1. JWT Token Authentication

**Implementation Location**: `backend/middleware/auth.js`

**Features**:
- Stateless authentication using JSON Web Tokens
- Configurable expiration times
- Fallback authentication when Keycloak is unavailable
- Token validation with signature verification

**Token Structure**:
```json
{
  "id": "user_id",
  "name": "User Name",
  "email": "user@example.com",
  "partyType": "TDP|TDC|CCRP|ADMIN",
  "iat": "issued_at_timestamp",
  "exp": "expiration_timestamp"
}
```

**Configuration Parameters**:
```env
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
```

### 2. Keycloak Integration

**Implementation Location**: `backend/services/keycloakService.js`

**Features**:
- Enterprise SSO integration
- User federation
- Centralized user management
- Token introspection
- Single Sign-On (SSO)

**Configuration Parameters**:
```env
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=contract-management
KEYCLOAK_CLIENT_ID=contract-management-frontend
KEYCLOAK_CLIENT_SECRET=your_client_secret_here
```

### 3. DID-Based Authentication

**Implementation Location**: `backend/services/didService.js`

**Supported DID Methods**:
- `did:web`: Web-hosted DID documents
- `did:ethr`: Ethereum-based DIDs
- `did:key`: Simple key-based DIDs

**Verification Process**:
1. Resolve DID document from the specified method
2. Extract verification methods
3. Verify cryptographic signatures
4. Validate DID ownership

---

## User Registration

### Registration Process Overview

The Contract Management System implements a comprehensive user registration process that supports multiple registration methods and includes email verification for enhanced security.

### Registration Methods

#### 1. Standard Email Registration

**Process Flow**:
1. **User Input**: User provides email, password, name, and party type
2. **Validation**: Server validates input data and checks for existing users
3. **Password Hashing**: Password is securely hashed using bcrypt
4. **User Creation**: User account is created in the database
5. **Email Verification**: Verification email is sent to user's email address
6. **Account Activation**: User clicks verification link to activate account

**Implementation Location**: `backend/routes/auth.js`

**Required Fields**:
```json
{
  "name": "User Full Name",
  "email": "user@example.com",
  "password": "secure_password_123",
  "partyType": "TDP|TDC|CCRP|ADMIN",
  "organization": "Company Name (Optional)",
  "phoneNumber": "+1234567890 (Optional)",
  "website": "https://company.com (Optional)"
}
```

#### 2. DID-Based Registration

**Process Flow**:
1. **DID Input**: User provides DID identifier
2. **DID Resolution**: System resolves DID document
3. **Verification**: DID ownership is verified through cryptographic proof
4. **Account Creation**: User account is created with DID association
5. **Profile Completion**: User completes additional profile information

**Supported DID Methods**:
- `did:web`: Web-hosted DID documents
- `did:ethr`: Ethereum-based DIDs
- `did:key`: Simple key-based DIDs

### Email Verification System

**Implementation Location**: `backend/services/emailService.js`

**Features**:
- Secure token generation for verification links
- Configurable token expiration (default: 24 hours)
- Email template system for professional communication
- Verification status tracking in user database

**Email Verification Process**:
1. **Token Generation**: Secure random token is generated
2. **Email Sending**: Verification email with token link is sent
3. **Link Validation**: User clicks link to verify email
4. **Account Activation**: User account is marked as verified
5. **Login Access**: User can now log in to the system

**Verification Token Structure**:
```json
{
  "userId": "user_id",
  "token": "random_verification_token",
  "expiresAt": "2024-01-01T24:00:00.000Z",
  "type": "EMAIL_VERIFICATION"
}
```

### Registration Validation Rules

#### Input Validation
- **Email**: Must be valid email format and unique in system
- **Password**: Minimum 8 characters, must include uppercase, lowercase, number
- **Name**: Required field, minimum 2 characters
- **Party Type**: Must be one of: TDP, TDC, CCRP, ADMIN
- **Organization**: Optional field for business users

#### Security Measures
- **Password Strength**: Enforced minimum complexity requirements
- **Rate Limiting**: Registration attempts are rate-limited
- **Email Verification**: Required for account activation
- **DID Verification**: Cryptographic proof required for DID registration

### Registration API Endpoints

#### POST /api/auth/register
**Purpose**: User registration

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "partyType": "TDP",
  "organization": "DataCorp Inc",
  "phoneNumber": "+1234567890",
  "website": "https://datacorp.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification.",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "partyType": "TDP",
    "isActive": false,
    "emailVerified": false
  }
}
```

#### POST /api/auth/verify-email
**Purpose**: Email verification

**Request Body**:
```json
{
  "token": "verification_token_from_email"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Email verified successfully. You can now log in.",
  "user": {
    "id": 1,
    "emailVerified": true,
    "isActive": true
  }
}
```

---

## Password Management

### Forgot Password Process

The system implements a secure forgot password process that allows users to reset their passwords through email verification.

#### Process Flow

1. **Password Reset Request**: User enters email address
2. **Email Validation**: System verifies email exists in database
3. **Token Generation**: Secure reset token is generated with expiration
4. **Email Sending**: Reset email with secure link is sent
5. **Link Validation**: User clicks link to access reset form
6. **Password Update**: User enters new password
7. **Token Invalidation**: Reset token is invalidated after use

#### Security Features

- **Secure Token Generation**: Cryptographically secure random tokens
- **Token Expiration**: Tokens expire after 1 hour for security
- **Single Use**: Tokens can only be used once
- **Rate Limiting**: Prevents abuse of reset functionality
- **Audit Logging**: All reset attempts are logged

### Password Reset Implementation

**Implementation Location**: `backend/routes/auth.js`

**Token Structure**:
```json
{
  "userId": "user_id",
  "token": "secure_reset_token",
  "expiresAt": "2024-01-01T01:00:00.000Z",
  "type": "PASSWORD_RESET",
  "used": false
}
```

**Database Schema**:
```sql
ALTER TABLE users ADD COLUMN passwordResetToken VARCHAR(255);
ALTER TABLE users ADD COLUMN passwordResetExpires TIMESTAMP;
```

### Password Reset API Endpoints

#### POST /api/auth/forgot-password
**Purpose**: Initiate password reset process

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password reset email sent. Please check your inbox."
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
  "message": "Password reset successfully. You can now log in with your new password."
}
```

#### GET /api/auth/verify-reset-token
**Purpose**: Verify reset token validity

**Request Body**:
```json
{
  "token": "reset_token_to_verify"
}
```

**Response**:
```json
{
  "success": true,
  "valid": true,
  "message": "Token is valid"
}
```

### Password Security Requirements

#### Password Policy
- **Minimum Length**: 8 characters
- **Complexity**: Must include uppercase, lowercase, number, and special character
- **History**: Cannot reuse last 3 passwords
- **Expiration**: Passwords expire after 90 days (configurable)
- **Lockout**: Account locked after 5 failed attempts

#### Password Validation Rules
```javascript
const passwordValidation = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfo: true
};
```

### Account Security Features

#### Account Lockout
- **Failed Login Attempts**: Account locked after 5 failed attempts
- **Lockout Duration**: 30 minutes (configurable)
- **Admin Override**: Administrators can unlock accounts
- **Audit Logging**: All lockout events are logged

#### Session Management
- **Token Expiration**: JWT tokens expire after 24 hours
- **Refresh Tokens**: Automatic token refresh mechanism
- **Concurrent Sessions**: Configurable limit on concurrent sessions
- **Session Invalidation**: All sessions invalidated on password change

### Password Management API Endpoints

#### POST /api/auth/change-password
**Purpose**: Change password for authenticated user

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

#### POST /api/auth/unlock-account
**Purpose**: Unlock account (Admin only)

**Request Body**:
```json
{
  "userId": 1,
  "reason": "User requested unlock"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Account unlocked successfully"
}
```

### Email Templates

#### Password Reset Email Template
```html
<!DOCTYPE html>
<html>
<head>
    <title>Password Reset Request</title>
</head>
<body>
    <h2>Password Reset Request</h2>
    <p>Hello {{name}},</p>
    <p>You have requested to reset your password for the Contract Management System.</p>
    <p>Click the link below to reset your password:</p>
    <a href="{{resetLink}}">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this reset, please ignore this email.</p>
    <p>Best regards,<br>Contract Management Team</p>
</body>
</html>
```

#### Email Verification Template
```html
<!DOCTYPE html>
<html>
<head>
    <title>Email Verification</title>
</head>
<body>
    <h2>Verify Your Email Address</h2>
    <p>Hello {{name}},</p>
    <p>Welcome to the Contract Management System!</p>
    <p>Please click the link below to verify your email address:</p>
    <a href="{{verificationLink}}">Verify Email</a>
    <p>This link will expire in 24 hours.</p>
    <p>Best regards,<br>Contract Management Team</p>
</body>
</html>
```

---

## Authorization Framework

### Role-Based Access Control (RBAC)

The system implements a comprehensive RBAC framework with four primary roles:

#### 1. Training Data Provider (TDP)

**Primary Responsibilities**:
- Create and manage datasets
- Sign contracts as TDP party
- View own contracts and datasets
- Update profile and DID information

**Permissions**:
- ✅ Create datasets
- ✅ Browse own datasets
- ✅ Sign contracts as TDP
- ✅ View own contracts
- ✅ Update profile
- ✅ Manage DID information

**Data Access Scope**: Own datasets and contracts only

#### 2. Training Data Consumer (TDC)

**Primary Responsibilities**:
- Browse available datasets
- Create contracts
- Sign contracts as TDC party
- View own contracts

**Permissions**:
- ✅ Browse public datasets
- ✅ Create contracts
- ✅ Sign contracts as TDC
- ✅ View own contracts
- ✅ Update profile

**Data Access Scope**: Public datasets and own contracts

#### 3. Confidential Clean Room Provider (CCRP)

**Primary Responsibilities**:
- Manage clean room environments
- Complete contracts
- Cancel contracts
- View contract execution status

**Permissions**:
- ✅ Manage clean room environments
- ✅ Complete contracts
- ✅ Cancel contracts
- ✅ View contract execution status
- ✅ Access contract data

**Data Access Scope**: Contract execution data and clean room configurations

#### 4. System Administrator (ADMIN)

**Primary Responsibilities**:
- Manage all users
- View system audit logs
- Configure enterprise settings
- Manage DID domains
- Access all data

**Permissions**:
- ✅ Manage all users
- ✅ View system audit logs
- ✅ Configure enterprise settings
- ✅ Manage DID domains
- ✅ Access all data
- ✅ System administration

**Data Access Scope**: Full system access

### Permission Matrix

| Action | TDP | TDC | CCRP | ADMIN |
|--------|-----|-----|------|-------|
| Create Dataset | ✅ | ❌ | ❌ | ✅ |
| Browse Datasets | ✅ | ✅ | ❌ | ✅ |
| Create Contract | ❌ | ✅ | ❌ | ✅ |
| Sign Contract | ✅ | ✅ | ❌ | ✅ |
| Complete Contract | ❌ | ❌ | ✅ | ✅ |
| Cancel Contract | ❌ | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ✅ |
| View Audit Logs | ❌ | ❌ | ❌ | ✅ |
| Configure System | ❌ | ❌ | ❌ | ✅ |
| Manage DIDs | ❌ | ❌ | ❌ | ✅ |

---

## DID Integration

### DID Resolution and Verification

**Implementation Location**: `backend/services/didService.js`

**Supported DID Methods**:

#### did:web
- **Resolution**: HTTP GET to `https://domain/.well-known/did.json`
- **Verification**: JsonWebKey2020 with ES256 signatures
- **Example**: `did:web:gitmujoshi.github.io`

#### did:ethr
- **Resolution**: Ethereum blockchain lookup
- **Verification**: ECDSA signatures with Ethereum addresses
- **Example**: `did:ethr:0x1234567890abcdef...`

#### did:key
- **Resolution**: Direct key derivation
- **Verification**: Direct cryptographic verification
- **Example**: `did:key:z6Mk...`

### DID Document Structure

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/jws-2020/v1"
  ],
  "id": "did:web:gitmujoshi.github.io",
  "assertionMethod": [
    {
      "id": "did:web:gitmujoshi.github.io#120c453f6d39fe0b8dfecceba8b0e7992f9bc650c2bf4001d2e448907b140877",
      "type": "JsonWebKey2020",
      "controller": "did:web:gitmujoshi.github.io",
      "publicKeyJwk": {
        "kty": "EC",
        "crv": "P-256",
        "x": "FFQw_IJcWPr8qZrwq48azt1hVM8JNp3nnJ0367TxUyQ=",
        "y": "AkPYsoJhbJNqIRGwnUHQN2D3cq4MPtzlVPx8BVuzTAo=",
        "kid": "120c453f6d39fe0b8dfecceba8b0e7992f9bc650c2bf4001d2e448907b140877",
        "alg": "ES256"
      }
    }
  ]
}
```

---

## Enterprise Signing Service

### Architecture Overview

**Implementation Location**: `backend/services/signingService.js`

**Key Features**:
- Secure private key management
- ES256 cryptographic signing
- Audit logging for all signing operations
- Multi-DID support
- Permission-based access control

### Signing Process Flow

1. **Frontend Request**: User initiates contract signing
2. **Authentication**: API Gateway validates user authentication
3. **Permission Validation**: Signing service checks user authorization
4. **Key Retrieval**: Secure retrieval of private key
5. **Message Signing**: ES256 cryptographic signing
6. **Audit Logging**: Complete audit trail creation
7. **Response**: Return signature to frontend
8. **Contract Submission**: Frontend submits signed contract
9. **DID Verification**: Backend verifies DID document
10. **Status Update**: Contract status updated

### Security Controls

#### Private Key Management
- **Storage**: Secure key store (HSM/KMS in production)
- **Access**: Role-based permissions required
- **Rotation**: Configurable key rotation policies
- **Backup**: Secure backup and recovery procedures

#### Signing Operations
- **Algorithm**: ES256 (ECDSA with P-256 curve)
- **Format**: Base64URL encoded signatures
- **Validation**: Cryptographic verification against DID documents
- **Audit**: Complete audit trail for all operations

---

## Security Controls

### Authentication Security

#### JWT Security
- **Secret Management**: Environment-based secrets
- **Token Expiration**: Configurable expiration times
- **Signature Verification**: HMAC-SHA256 signatures
- **Token Refresh**: Automatic token refresh mechanism

#### Rate Limiting
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
```

#### CORS Policy
```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
```

### Authorization Security

#### Role Validation
- **Middleware**: `authenticateToken` middleware
- **Permission Checks**: Granular permission validation
- **Resource Access**: Role-based resource access control
- **Session Management**: Secure session handling

#### DID Security
- **Document Validation**: Cryptographic verification
- **Ownership Proof**: Signature-based ownership verification
- **Revocation**: DID document revocation support
- **Expiration**: DID document expiration handling

---

## Audit and Compliance

### Audit Logging

**Implementation Location**: `backend/services/auditService.js`

**Audited Events**:
- User authentication and authorization
- Contract signing operations
- DID verification attempts
- Permission changes
- System configuration changes
- Data access events

**Audit Log Structure**:
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "userId": "user_id",
  "action": "CONTRACT_SIGNED",
  "resource": "contract_id",
  "details": {
    "did": "did:web:example.com",
    "signature": "signature_hash",
    "partyType": "TDP"
  },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "sessionId": "session_id"
}
```

### Compliance Features

#### GDPR Compliance
- **Data Minimization**: Only necessary data collection
- **Right to Erasure**: User data deletion capabilities
- **Consent Management**: Explicit consent tracking
- **Data Portability**: Export capabilities

#### SOX Compliance
- **Access Controls**: Segregation of duties
- **Audit Trails**: Complete audit logging
- **Change Management**: Controlled system changes
- **Risk Assessment**: Regular security assessments

---

## Implementation Details

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  partyType ENUM('TDP', 'TDC', 'CCRP', 'ADMIN') NOT NULL,
  walletAddress VARCHAR(255),
  publicKey TEXT,
  did VARCHAR(255),
  didSource ENUM('SYSTEM_GENERATED', 'USER_PROVIDED'),
  didVerified BOOLEAN DEFAULT FALSE,
  didVerificationMethod VARCHAR(100),
  isActive BOOLEAN DEFAULT TRUE,
  isRegistered BOOLEAN DEFAULT FALSE,
  registrationDate TIMESTAMP,
  lastLoginAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  userId INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(255),
  details JSONB,
  ipAddress INET,
  userAgent TEXT,
  sessionId VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Middleware Implementation

#### Authentication Middleware
```javascript
const authenticateToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
```

#### Authorization Middleware
```javascript
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.partyType)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
```

---

## API Specifications

### Authentication Endpoints

#### POST /api/auth/login
**Purpose**: User authentication

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
  "token": "jwt_token",
  "user": {
    "id": 1,
    "name": "User Name",
    "email": "user@example.com",
    "partyType": "TDP"
  }
}
```

### Registration Endpoints

#### POST /api/auth/register
**Purpose**: User registration

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "partyType": "TDP",
  "organization": "DataCorp Inc",
  "phoneNumber": "+1234567890",
  "website": "https://datacorp.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification.",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "partyType": "TDP",
    "isActive": false,
    "emailVerified": false
  }
}
```

#### POST /api/auth/verify-email
**Purpose**: Email verification

**Request Body**:
```json
{
  "token": "verification_token_from_email"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Email verified successfully. You can now log in.",
  "user": {
    "id": 1,
    "emailVerified": true,
    "isActive": true
  }
}
```

### Password Management Endpoints

#### POST /api/auth/forgot-password
**Purpose**: Initiate password reset process

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password reset email sent. Please check your inbox."
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
  "message": "Password reset successfully. You can now log in with your new password."
}
```

#### POST /api/auth/change-password
**Purpose**: Change password for authenticated user

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

#### GET /api/auth/verify-reset-token
**Purpose**: Verify reset token validity

**Request Body**:
```json
{
  "token": "reset_token_to_verify"
}
```

**Response**:
```json
{
  "success": true,
  "valid": true,
  "message": "Token is valid"
}
```

#### POST /api/auth/unlock-account
**Purpose**: Unlock account (Admin only)

**Request Body**:
```json
{
  "userId": 1,
  "reason": "User requested unlock"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Account unlocked successfully"
}
```

### DID Endpoints

#### POST /api/did/verify
**Purpose**: Verify DID ownership

**Request Body**:
```json
{
  "did": "did:web:example.com",
  "signature": "base64url_signature",
  "message": "message_to_verify"
}
```

#### GET /api/did/resolve/{did}
**Purpose**: Resolve DID document

**Response**:
```json
{
  "did": "did:web:example.com",
  "document": {
    "@context": ["https://www.w3.org/ns/did/v1"],
    "id": "did:web:example.com",
    "verificationMethod": [...]
  }
}
```

### Signing Endpoints

#### POST /api/signing/sign
**Purpose**: Enterprise signing service

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

**Response**:
```json
{
  "success": true,
  "dids": [
    {
      "did": "did:web:example.com",
      "publicKey": {...},
      "available": true
    }
  ]
}
```

---

## Deployment Considerations

### Production Security

#### Environment Variables
```env
# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Keycloak
KEYCLOAK_URL=https://keycloak.company.com
KEYCLOAK_REALM=contract-management
KEYCLOAK_CLIENT_ID=contract-management-frontend
KEYCLOAK_CLIENT_SECRET=your_client_secret_here

# Security
CORS_ORIGIN=https://app.company.com
SESSION_SECRET=your-super-secret-session-key-here

# Enterprise Signing
ENTERPRISE_PRIVATE_KEYS=path/to/secure/key/store
SIGNING_AUDIT_LOG=path/to/audit/logs
```

#### Key Management
- **HSM Integration**: Hardware Security Module for private keys
- **Key Rotation**: Automated key rotation procedures
- **Backup Security**: Encrypted backup procedures
- **Access Controls**: Multi-factor authentication for key access

#### Network Security
- **HTTPS**: TLS 1.3 encryption
- **WAF**: Web Application Firewall
- **DDoS Protection**: Distributed Denial of Service protection
- **VPN Access**: Secure network access

### Monitoring and Alerting

#### Security Monitoring
- **Authentication Failures**: Alert on multiple failed attempts
- **Unusual Access Patterns**: Machine learning-based anomaly detection
- **DID Verification Failures**: Monitor for potential attacks
- **Signing Operation Anomalies**: Alert on unusual signing patterns

#### Performance Monitoring
- **Response Times**: API performance monitoring
- **Error Rates**: Error rate tracking
- **Resource Usage**: Memory and CPU monitoring
- **Database Performance**: Query performance monitoring

### Disaster Recovery

#### Backup Strategy
- **Database Backups**: Daily automated backups
- **Configuration Backups**: System configuration backups
- **Key Backups**: Secure key backup procedures
- **Audit Log Backups**: Audit trail preservation

#### Recovery Procedures
- **Service Recovery**: Automated service restart procedures
- **Data Recovery**: Database recovery procedures
- **Key Recovery**: Secure key recovery processes
- **Audit Recovery**: Audit log recovery procedures

---

## Conclusion

This IAM specification provides a comprehensive framework for secure identity and access management in the Contract Management System. The implementation supports enterprise-grade security requirements while maintaining flexibility for different deployment scenarios.

### System Design Principles

The system is designed to be:
- **Secure**: Multi-layered security controls
- **Scalable**: Support for enterprise deployments
- **Compliant**: Built-in audit and compliance features
- **Flexible**: Support for multiple authentication methods
- **Maintainable**: Clear separation of concerns and modular design

### Production Deployment Checklist

For production deployment, ensure:
- [ ] All security controls are properly configured
- [ ] Regular security audits are scheduled
- [ ] Key management procedures are established
- [ ] Monitoring and alerting are configured
- [ ] Disaster recovery procedures are tested
- [ ] Compliance requirements are met
- [ ] Performance benchmarks are established
- [ ] Documentation is complete and up-to-date

---

**Document End** 