# Contract Signing Technical Reference

## 🎯 Overview

This document provides technical details for developers, system administrators, and technical stakeholders implementing or maintaining the contract signing feature with SCITT CCF integration.

## 🏗️ Architecture

### **System Components**

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Contract Signing UI] --> B[Key Management UI]
        A --> C[Signature Verification UI]
    end
    
    subgraph "API Layer"
        D[Signing Service API] --> E[Key Management API]
        D --> F[SCITT CCF API]
    end
    
    subgraph "Service Layer"
        G[Key Management Service] --> H[Crypto Service]
        I[SCITT CCF Service] --> J[Claim Management]
    end
    
    subgraph "Storage Layer"
        K[Local Key Storage<br/>AES-256-GCM] --> L[Browser Storage]
        M[Database] --> N[SCITT Claims Table]
        M --> O[User Keys Table]
        M --> P[Signing Events Table]
    end
    
    subgraph "SCITT CCF Layer"
        Q[CCF Ledger] --> R[Immutable Claims]
        Q --> S[Provenance Tracking]
    end
    
    A --> D
    D --> G
    D --> I
    G --> K
    I --> Q
    G --> M
    I --> M
```

### **Key Technologies**
- **Frontend**: React 18, Material-UI, WebCrypto API
- **Backend**: Node.js, Express.js, Sequelize ORM
- **Database**: PostgreSQL with SCITT CCF integration
- **Cryptography**: WebCrypto API, AES-256-GCM, PBKDF2
- **SCITT CCF**: Existing service for immutable claims

## 🔧 API Reference

### **Key Management Endpoints**

#### **GET /api/signing/keys**
Get all signing keys for the authenticated user.

**Response:**
```json
{
  "success": true,
  "keys": [
    {
      "id": 1,
      "keyId": "KEY_123456",
      "keyType": "ECDSA-P256",
      "keyStatus": "active",
      "createdAt": "2024-01-01T00:00:00Z",
      "lastUsedAt": "2024-01-01T12:00:00Z"
    }
  ]
}
```

#### **POST /api/signing/keys/generate**
Generate a new signing key.

**Request:**
```json
{
  "keyType": "ECDSA-P256"
}
```

**Response:**
```json
{
  "success": true,
  "key": {
    "id": 1,
    "keyId": "KEY_123456",
    "keyType": "ECDSA-P256",
    "keyStatus": "active",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### **POST /api/signing/keys/import**
Import an existing signing key.

**Request:**
```json
{
  "keyData": {
    "keyId": "IMPORTED_KEY_123",
    "keyType": "ECDSA-P256",
    "publicKey": "-----BEGIN PUBLIC KEY-----...",
    "privateKey": "-----BEGIN PRIVATE KEY-----..."
  },
  "keyType": "ECDSA-P256"
}
```

#### **DELETE /api/signing/keys/:keyId**
Delete a signing key.

**Response:**
```json
{
  "success": true,
  "message": "Key deleted successfully"
}
```

### **Contract Signing Endpoints**

#### **POST /api/signing/sign**
Sign a contract with the specified key.

**Request:**
```json
{
  "contractId": 123,
  "keyId": 456,
  "signatureData": {
    "contractHash": "sha256hash"
  }
}
```

**Response:**
```json
{
  "success": true,
  "signature": {
    "scittClaimId": "CLAIM_123456",
    "signature": "signature_data",
    "algorithm": "ECDSA-P256",
    "contractHash": "sha256hash",
    "scittReceipt": "receipt_data"
  }
}
```

#### **POST /api/signing/verify**
Verify a signature using SCITT CCF claim.

**Request:**
```json
{
  "scittClaimId": "CLAIM_123456",
  "contractId": "CONTRACT_123"
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "verification": {
    "cryptographicValid": true,
    "scittValid": true,
    "overallValid": true,
    "scittReceipt": "receipt_data"
  }
}
```

## 🗄️ Database Schema

### **SCITT Claims Table**
```sql
CREATE TABLE scitt_claims (
  id SERIAL PRIMARY KEY,
  claim_id VARCHAR(255) UNIQUE NOT NULL,
  contract_id VARCHAR(255) NOT NULL,
  claim_type VARCHAR(100) NOT NULL,
  claim_data JSONB NOT NULL,
  receipt TEXT,
  status VARCHAR(50) DEFAULT 'PENDING',
  provenance_tree_id VARCHAR(255),
  provenance_root VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **User Keys Table**
```sql
CREATE TABLE user_keys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  key_id VARCHAR(100) NOT NULL UNIQUE,
  key_type VARCHAR(50) NOT NULL,
  public_key TEXT NOT NULL,
  key_status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP
);
```

### **Signing Events Table**
```sql
CREATE TABLE signing_events (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES contracts(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔐 Security Implementation

### **Key Management Security**

#### **Key Generation**
```javascript
// Supported algorithms
const algorithms = ['ECDSA-P256', 'RSA-2048', 'RSA-4096'];

// Key generation with WebCrypto API
const keyPair = await crypto.subtle.generateKey(
  {
    name: 'ECDSA',
    namedCurve: 'P-256'
  },
  true,
  ['sign', 'verify']
);
```

#### **Key Encryption**
```javascript
// AES-256-GCM encryption
const encryptedKey = await crypto.subtle.encrypt(
  {
    name: 'AES-GCM',
    iv: iv,
    tagLength: 128
  },
  encryptionKey,
  privateKey
);
```

#### **Key Derivation**
```javascript
// PBKDF2 key derivation
const derivedKey = await crypto.subtle.deriveKey(
  {
    name: 'PBKDF2',
    salt: salt,
    iterations: 100000,
    hash: 'SHA-256'
  },
  passwordKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);
```

### **Signature Generation**

#### **Signature Creation**
```javascript
// Generate signature with WebCrypto API
const signature = await crypto.subtle.sign(
  {
    name: 'ECDSA',
    hash: 'SHA-256'
  },
  privateKey,
  contractData
);
```

#### **Signature Verification**
```javascript
// Verify signature
const isValid = await crypto.subtle.verify(
  {
    name: 'ECDSA',
    hash: 'SHA-256'
  },
  publicKey,
  signature,
  contractData
);
```

## 🔄 SCITT CCF Integration

### **Claim Submission**

#### **Signature Claim Structure**
```javascript
const signatureClaim = {
  type: 'contract_signature',
  data: {
    contractId: 'CONTRACT_123',
    signer: 'USER_DEPA_ID',
    signerRole: 'TDC',
    signature: signatureData,
    algorithm: 'ECDSA-P256',
    timestamp: Date.now(),
    contractHash: 'sha256hash',
    metadata: {
      system: 'Contract Management System',
      version: '1.0.0',
      teeProvider: 'virtual'
    }
  }
};
```

#### **Claim Submission Process**
```javascript
// Submit claim to SCITT CCF
const result = await scittCcfService.submitClaim(signatureClaim);

// Store claim in database
await ScittClaim.create({
  claimId: result.claimId,
  contractId: contractId,
  claimType: 'contract_signature',
  claimData: signatureClaim.data,
  receipt: result.receipt,
  status: 'SUBMITTED',
  provenanceTreeId: `TREE_${contractId}`,
  provenanceRoot: generateHash(contractId)
});
```

### **Claim Verification**

#### **Verification Process**
```javascript
// Retrieve claim from SCITT CCF
const claim = await scittCcfService.getClaim(claimId);

// Verify cryptographic signature
const cryptoValid = await verifySignature(
  claim.claimData.signature,
  publicKey,
  contractHash
);

// Verify SCITT CCF proof
const scittValid = await scittCcfService.verifyClaim(claimId);

// Return comprehensive result
return {
  cryptographicValid: cryptoValid,
  scittValid: scittValid,
  overallValid: cryptoValid && scittValid
};
```

## 🧪 Testing

### **Test Structure**

#### **Unit Tests**
- **Location**: `backend/tests/unit/`
- **Coverage**: 90%+ for key management service
- **Focus**: Individual functions and methods
- **Tools**: Jest, WebCrypto API mocks

#### **Integration Tests**
- **Location**: `backend/tests/integration/`
- **Coverage**: 85%+ for signing API
- **Focus**: API endpoints and service interactions
- **Tools**: Supertest, Jest

#### **SCITT CCF Tests**
- **Location**: `backend/tests/integration/scittCcfSigning.test.js`
- **Coverage**: 80%+ for SCITT CCF integration
- **Focus**: Claim submission and verification
- **Tools**: Jest, Mock SCITT CCF service

### **Running Tests**

#### **All Tests**
```bash
npm run test:signing
```

#### **Specific Test Categories**
```bash
npm run test:signing:unit          # Unit tests only
npm run test:signing:integration   # Integration tests only
npm run test:signing:scitt         # SCITT CCF tests only
```

#### **With Coverage**
```bash
npm run test:signing:coverage
```

### **Test Data Setup**

#### **Test Data Creation**
```javascript
// Create test users, contracts, and keys
const testData = await SigningTestDataSetup.setupAll();

// Clean up after tests
await SigningTestDataSetup.cleanup();
```

## 🚀 Deployment

### **Environment Variables**

#### **Required Variables**
```bash
# Database Configuration
DATABASE_URL=***REMOVED-DB_PASSWORD***ql://user:password@localhost:5432/contract_management

# SCITT CCF Configuration
CCF_NODE_URL=http://localhost:8000
CCF_API_KEY=your-api-key
CCF_CLAIM_TYPE=contract_signature
CCF_PROVENANCE_TREE_ID=contract-signatures

# Security Configuration
JWT_SECRET=your-jwt-secret
KEY_ENCRYPTION_ALGORITHM=AES-256-GCM
KEY_DERIVATION_ITERATIONS=100000
```

### **Dependencies**

#### **Backend Dependencies**
```json
{
  "crypto": "^1.0.1",
  "jsonwebtoken": "^9.0.0",
  "sequelize": "^6.35.2",
  "axios": "^1.11.0"
}
```

#### **Frontend Dependencies**
```json
{
  "@mui/material": "^5.11.0",
  "react": "^18.0.0",
  "axios": "^1.3.0"
}
```

### **Production Deployment**

#### **Database Migration**
```bash
# Run database migrations
npm run migrate

# Verify SCITT CCF integration
npm run test:signing:scitt
```

#### **Service Configuration**
```bash
# Configure SCITT CCF service
export CCF_NODE_URL=https://your-ccf-node.com
export CCF_API_KEY=your-production-api-key

# Start services
npm run start
```

## 📊 Monitoring

### **Key Metrics**

#### **Performance Metrics**
- Signature generation time: < 1 second
- Key access time: < 1 second
- SCITT CCF claim submission: < 5 seconds
- Signature verification: < 1 second

#### **Security Metrics**
- Key access attempts
- Signature generation failures
- SCITT CCF service availability
- Authentication failures

#### **Business Metrics**
- Signatures per day/week/month
- Key generation and usage
- Contract signing completion rate
- User adoption metrics

### **Logging**

#### **Audit Logs**
```javascript
// Signing event logging
await SigningEvent.create({
  contractId: contract.id,
  userId: user.id,
  eventType: 'contract_signed',
  eventData: {
    scittClaimId: claimId,
    keyId: keyId,
    contractHash: contractHash
  },
  ipAddress: req.ip,
  userAgent: req.get('User-Agent')
});
```

## 🔧 Troubleshooting

### **Common Issues**

#### **SCITT CCF Service Unavailable**
- **Symptom**: Signature submission fails
- **Cause**: SCITT CCF service down or unreachable
- **Solution**: Check service status and network connectivity
- **Prevention**: Implement service health checks

#### **Key Access Failures**
- **Symptom**: Cannot unlock keys for signing
- **Cause**: Incorrect password or corrupted key
- **Solution**: Verify password or restore from backup
- **Prevention**: Regular key backups and validation

#### **Database Connection Issues**
- **Symptom**: API calls fail with database errors
- **Cause**: Database connection lost or timeout
- **Solution**: Check database status and connection pool
- **Prevention**: Implement connection pooling and retry logic

### **Debugging Tools**

#### **Test Validation**
```bash
# Validate test setup
node backend/tests/validate-setup.js

# Run specific test categories
npm run test:signing:unit
npm run test:signing:integration
```

#### **Log Analysis**
```bash
# Check application logs
tail -f logs/application.log

# Check error logs
grep ERROR logs/application.log
```

## 📚 Additional Resources

### **Detailed Documentation**
- **Implementation Plan**: `CONTRACT_SIGNING_IMPLEMENTATION_PLAN.md`
- **Strategy Document**: `CONTRACT_SIGNING_STRATEGY.md`
- **Architecture Guide**: `contract-signing-architecture.md`
- **SCITT CCF Integration**: `CONTRACT_SIGNING_SCITT_INTEGRATION.md`

### **API Documentation**
- **Complete API Reference**: Available in `/api/docs`
- **Postman Collection**: Available for testing
- **OpenAPI Specification**: Available for integration

### **Security Documentation**
- **Security Guide**: Detailed security implementation
- **Compliance Guide**: Legal and regulatory compliance
- **Audit Reports**: Security audit results

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-XX  
**For User Guide**: See CONTRACT_SIGNING_USER_GUIDE.md  
**For Overview**: See CONTRACT_SIGNING_OVERVIEW.md
