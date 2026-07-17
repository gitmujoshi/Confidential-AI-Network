# Contract Management System - Technical Overview

## Table of Contents
1. [System Overview](#system-overview)
2. [Key Integrations](#key-integrations)
3. [Data Model](#data-model)
4. [Core Flows](#core-flows)
5. [Sequence & Flow Diagrams](#sequence--flow-diagrams)
6. [Environment & Configuration](#environment--configuration)
7. [Security Considerations](#security-considerations)
8. [Extensibility & Best Practices](#extensibility--best-practices)
9. [API Reference](#api-reference)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [References & Further Reading](#references--further-reading)

---

## System Overview

The Contract Management System is a full-stack application for managing Ricardian contracts with blockchain integration, AI model linkage, and enterprise-grade authentication. The system supports three main roles:

- **TDP (Training Data Provider)**: Provides datasets and AI models for training
- **TDC (Training Data Consumer)**: Consumes datasets and AI models for training
- **CCRP (Confidential Clean Room Provider)**: Sets up runtime environments for data analytics and AI model training

### Architecture Components

```mermaid
graph TB
    subgraph "Frontend (React)"
        UI[User Interface]
        Auth[Authentication]
        ContractMgmt[Contract Management]
    end
    
    subgraph "Backend (Node.js/Express)"
        API[API Layer]
        AuthService[Authentication Service]
        ContractService[Contract Service]
        BlockchainService[Blockchain Service]
        SigningService[Signing Service]
        RicardianService[Ricardian Contract Service]
    end
    
    subgraph "External Services"
        Keycloak[Keycloak IAM]
        Blockchain[Local Blockchain]
        Database[(PostgreSQL)]
    end
    
    UI --> API
    API --> AuthService
    API --> ContractService
    API --> SigningService
    ContractService --> RicardianService
    RicardianService --> BlockchainService
    BlockchainService --> Blockchain
    AuthService --> Keycloak
    API --> Database
```

---

## Key Integrations

### 1. Keycloak (Authentication/Authorization)

**Purpose**: Centralized Identity and Access Management (IAM)

**Configuration**:
- **URL**: Configured in `backend/config.env`
- **Realm**: Custom realm for the application
- **Client**: Web application client with JWT tokens
- **Roles**: TDP, TDC, CCRP, AppAdmin

**Integration Points**:
- User registration and login
- JWT token validation for all API requests
- Role-based access control (RBAC)
- Session management

**Key Files**:
- `backend/services/keycloakService.js`
- `backend/middleware/auth.js`
- `backend/config.env` (Keycloak configuration)

### 2. Blockchain Integration

**Purpose**: Smart contract deployment and management

**Technology Stack**:
- **Local Blockchain**: Hardhat/Ganache for development
- **Smart Contracts**: Solidity contracts for contract management
- **Web3**: Ethereum interaction library

**Configuration**:
```env
BLOCKCHAIN_URL=http://127.0.0.1:8545
BLOCKCHAIN_DEPLOYER_PRIVATE_KEY=0x...
CONTRACT_ADDRESS=0x...
BLOCKCHAIN_ENABLED=true
```

**Key Files**:
- `blockchain/contracts/ContractManager.sol`
- `backend/services/blockchainService.js`
- `backend/config.env` (Blockchain configuration)

### 3. Ricardian Contract Service

**Purpose**: Legal document generation and cryptographic signing

**Features**:
- Legal document generation from contract data
- Cryptographic signing with DIDs
- Document hash creation
- Smart contract deployment integration

**Key Files**:
- `backend/services/ricardianContractService.js`
- `backend/services/signingService.js`

### 4. AI Model Management

**Purpose**: Independent AI model entities linked to contracts

**Features**:
- AI models as separate entities
- Linking to contracts via IDs
- Model metadata management
- No deletion on contract creation

**Key Files**:
- `backend/models/AIModel.js` (if implemented)
- `backend/routes/contracts.js` (AI model linking logic)

### 5. DID Management

**Purpose**: Decentralized Identifier management for cryptographic signing

**Features**:
- DID assignment to each party (TDP, TDC, CCRP)
- Cryptographic signing and verification
- Enterprise DID management
- Public key management

**Key Files**:
- `backend/services/signingService.js`
- `backend/services/didService.js`

---

## Data Model

### Main Entities

#### User Entity
```javascript
{
  id: UUID,
  name: String,
  email: String,
  partyType: ENUM('TDP', 'TDC', 'CCRP', 'AppAdmin'),
  walletAddress: String,
  did: String,
  didSource: String,
  didVerified: Boolean,
  organization: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Contract Entity
```javascript
{
  id: UUID,
  contractId: String,
  blockchainContractId: String,
  legalDocumentHash: String,
  ricardianSignature: String,
  smartContractAddress: String,
  status: ENUM('DRAFT', 'PENDING_TDP_APPROVAL', 'PENDING_CCRP_APPROVAL', 'ACTIVE', 'COMPLETED', 'EXPIRED'),
  price: Decimal,
  duration: Integer,
  termsAndConditions: Text,
  legalDocument: JSON,
  tdpSigned: Boolean,
  ccrpSigned: Boolean,
  tdpSignedAt: Date,
  ccrpSignedAt: Date,
  tdpId: UUID (FK),
  tdcId: UUID (FK),
  ccrpId: UUID (FK),
  datasetId: UUID (FK),
  aiModelIds: Array[String],
  createdAt: Date,
  updatedAt: Date
}
```

#### Dataset Entity
```javascript
{
  id: UUID,
  datasetId: String,
  name: String,
  description: Text,
  category: ENUM('Natural Language Processing', 'Computer Vision', 'Audio', 'Tabular', 'Multimodal'),
  size: String,
  recordCount: Integer,
  price: Decimal,
  license: String,
  tags: Array[String],
  metadata: JSON,
  isPublic: Boolean,
  isActive: Boolean,
  ownerId: UUID (FK),
  createdAt: Date,
  updatedAt: Date
}
```

### Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ CONTRACT : "TDP/TDC/CCRP"
    USER ||--o{ DATASET : "owns"
    USER ||--o{ AIMODEL : "owns"
    CONTRACT }o--|| DATASET : "uses"
    CONTRACT }o--o{ AIMODEL : "linked to"
    CONTRACT ||--o{ NOTIFICATION : "triggers"
    USER ||--o{ NOTIFICATION : "receives"
    
    USER {
        uuid id PK
        string name
        string email
        enum partyType
        string walletAddress
        string did
        boolean isActive
        timestamp createdAt
        timestamp updatedAt
    }
    
    CONTRACT {
        uuid id PK
        string contractId
        string blockchainContractId
        string legalDocumentHash
        string ricardianSignature
        string smartContractAddress
        enum status
        decimal price
        integer duration
        text termsAndConditions
        json legalDocument
        boolean tdpSigned
        boolean ccrpSigned
        timestamp tdpSignedAt
        timestamp ccrpSignedAt
        uuid tdpId FK
        uuid tdcId FK
        uuid ccrpId FK
        uuid datasetId FK
        array aiModelIds
        timestamp createdAt
        timestamp updatedAt
    }
    
    DATASET {
        uuid id PK
        string datasetId
        string name
        text description
        enum category
        string size
        integer recordCount
        decimal price
        string license
        array tags
        json metadata
        boolean isPublic
        boolean isActive
        uuid ownerId FK
        timestamp createdAt
        timestamp updatedAt
    }
```

---

## Core Flows

### 1. User Registration & Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Keycloak
    participant Database

    User->>Frontend: Register/Login
    Frontend->>Keycloak: Auth request
    Keycloak-->>Frontend: JWT token
    Frontend->>Backend: API request (with JWT)
    Backend->>Keycloak: Validate token
    Keycloak-->>Backend: Token valid/invalid
    Backend->>Database: Store/Update user
    Backend-->>Frontend: Response
```

### 2. Ricardian Contract Creation & Signing Flow

```mermaid
sequenceDiagram
    participant TDP
    participant Frontend
    participant Backend
    participant Blockchain
    participant CCRP
    participant Database

    TDP->>Frontend: Create contract (select dataset, AI model, CCRP)
    Frontend->>Backend: POST /contracts (with JWT)
    Backend->>Blockchain: Deploy smart contract
    Blockchain-->>Backend: Contract address, tx hash
    Backend->>Database: Save contract, status=PENDING_TDP_APPROVAL
    TDP->>Frontend: Sign contract
    Frontend->>Backend: POST /sign (with JWT, DID)
    Backend->>Crypto: Sign legal doc hash
    Backend->>Database: Update contract, status=PENDING_CCRP_APPROVAL
    CCRP->>Frontend: Sign contract
    Frontend->>Backend: POST /sign (with JWT, DID)
    Backend->>Crypto: Sign legal doc hash
    Backend->>Database: Update contract, status=ACTIVE
```

### 3. Blockchain Deployment Flow

```mermaid
sequenceDiagram
    participant Backend
    participant Blockchain
    participant Database

    Backend->>Blockchain: Deploy contract (using deployer private key)
    Blockchain-->>Backend: Contract address, tx hash
    Backend->>Database: Save contract address, tx hash
```

### 4. AI Model Linking Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: Select AI models for contract
    Frontend->>Backend: POST /contracts (with aiModelIds)
    Backend->>Database: Link AI models to contract
    Backend-->>Frontend: Contract created with AI models
```

---

## Sequence & Flow Diagrams

### Contract Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> PENDING_TDP_APPROVAL: Created
    PENDING_TDP_APPROVAL --> PENDING_CCRP_APPROVAL: TDP signs
    PENDING_CCRP_APPROVAL --> ACTIVE: CCRP signs
    ACTIVE --> COMPLETED: Contract fulfilled
    ACTIVE --> EXPIRED: Time limit reached
    COMPLETED --> [*]
    EXPIRED --> [*]
```

### Authentication Flow

```mermaid
flowchart TD
    A[User Login] --> B{Valid Credentials?}
    B -->|Yes| C[Keycloak Issues JWT]
    B -->|No| D[Return Error]
    C --> E[Frontend Stores Token]
    E --> F[API Request with JWT]
    F --> G{Token Valid?}
    G -->|Yes| H[Process Request]
    G -->|No| I[Return 401/403]
    H --> J[Return Response]
```

### Contract Signing Flow

```mermaid
flowchart TD
    A[User Requests Signing] --> B{User Authorized?}
    B -->|Yes| C[Get User DID]
    B -->|No| D[Return 403]
    C --> E[Generate Legal Document]
    E --> F[Create Document Hash]
    F --> G[Sign with Private Key]
    G --> H[Update Contract Status]
    H --> I[Return Success]
```

---

## Environment & Configuration

### Backend Configuration (`backend/config.env`)

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/contract_management

# Keycloak Configuration
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=contract-management
KEYCLOAK_CLIENT_ID=contract-management-client
KEYCLOAK_CLIENT_SECRET=your-client-secret

# Blockchain Configuration
BLOCKCHAIN_URL=http://127.0.0.1:8545
BLOCKCHAIN_DEPLOYER_PRIVATE_KEY=0x...
CONTRACT_ADDRESS=0x...
BLOCKCHAIN_ENABLED=true

# Email Configuration
EMAIL_SERVICE=disabled
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=<email-app-password>

# JWT Configuration
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h
```

### Frontend Configuration (`frontend/src/config.js`)

```javascript
const config = {
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api',
  keycloakUrl: process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080',
  keycloakRealm: process.env.REACT_APP_KEYCLOAK_REALM || 'contract-management',
  keycloakClientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'contract-management-client'
};

export default config;
```

### Blockchain Configuration (`blockchain/hardhat.config.js`)

```javascript
module.exports = {
  solidity: "0.8.19",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};
```

---

## Security Considerations

### Authentication & Authorization

1. **JWT Token Validation**: All API endpoints require valid JWT tokens
2. **Role-Based Access Control**: Different permissions for TDP, TDC, CCRP, AppAdmin
3. **Token Expiration**: Configurable token expiration times
4. **Secure Token Storage**: Tokens stored securely in frontend

### Cryptographic Security

1. **Private Key Management**: Private keys never exposed to frontend
2. **DID Signing**: Cryptographic signing with enterprise DIDs
3. **Document Hashing**: Legal documents hashed before signing
4. **Audit Logging**: All signing operations logged for audit

### Data Security

1. **Input Validation**: All user inputs validated and sanitized
2. **SQL Injection Prevention**: Parameterized queries used
3. **XSS Prevention**: Content Security Policy implemented
4. **CORS Configuration**: Proper CORS settings for cross-origin requests

### Blockchain Security

1. **Private Key Security**: Deployer private key stored securely
2. **Transaction Signing**: All blockchain transactions properly signed
3. **Contract Verification**: Smart contracts verified on deployment
4. **Gas Optimization**: Efficient gas usage for transactions

---

## Extensibility & Best Practices

### Adding New Roles

1. **Update Keycloak**: Add new role in Keycloak realm
2. **Update Backend**: Add role to `partyType` enum in User model
3. **Update Frontend**: Add role-specific UI components
4. **Update Authorization**: Add role checks in middleware

### Adding New Contract Types

1. **Extend Contract Model**: Add new fields to Contract entity
2. **Update Ricardian Service**: Modify document generation logic
3. **Update Smart Contracts**: Add new contract types in Solidity
4. **Update Frontend**: Add contract type selection UI

### Adding New Blockchains

1. **Abstract Blockchain Service**: Make blockchain service pluggable
2. **Add New Provider**: Implement new blockchain provider
3. **Update Configuration**: Add blockchain-specific config
4. **Update Deployment**: Add deployment scripts for new blockchain

### Adding New AI Model Types

1. **Extend AI Model Schema**: Add new model type fields
2. **Update Linking Logic**: Modify contract-AI model linking
3. **Update UI**: Add model type selection components
4. **Update Validation**: Add model type validation

### Code Organization Best Practices

1. **Service Layer**: Business logic in services, not routes
2. **Middleware**: Authentication and validation in middleware
3. **Error Handling**: Centralized error handling and logging
4. **Configuration**: Environment-based configuration
5. **Testing**: Unit and integration tests for all components

---

## API Reference

### Authentication Endpoints

#### POST `/api/auth/login`
**Purpose**: User login with Keycloak
**Request Body**:
```json
{
  "username": "user@example.com",
  "password": "password"
}
```
**Response**:
```json
{
  "success": true,
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "name": "User Name",
    "email": "user@example.com",
    "partyType": "TDP"
  }
}
```

#### POST `/api/auth/register`
**Purpose**: User registration
**Request Body**:
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password",
  "partyType": "TDP",
  "organization": "Organization Name"
}
```

### Contract Endpoints

#### POST `/api/contracts`
**Purpose**: Create new Ricardian contract
**Request Body**:
```json
{
  "tdcId": "uuid",
  "ccrpId": "uuid",
  "datasetId": "uuid",
  "aiModelIds": ["model-id-1", "model-id-2"],
  "price": "0.1",
  "duration": 30,
  "termsAndConditions": "Contract terms..."
}
```

#### GET `/api/contracts`
**Purpose**: Get user's contracts
**Query Parameters**:
- `status`: Contract status filter
- `page`: Page number
- `limit`: Items per page

#### POST `/api/contracts/:id/sign`
**Purpose**: Sign contract with DID
**Request Body**:
```json
{
  "did": "did:web:example.com",
  "message": "Contract signing message"
}
```

### Dataset Endpoints

#### GET `/api/datasets`
**Purpose**: Get available datasets
**Query Parameters**:
- `category`: Dataset category filter
- `isPublic`: Public datasets only
- `page`: Page number
- `limit`: Items per page

#### POST `/api/datasets`
**Purpose**: Create new dataset (TDP only)
**Request Body**:
```json
{
  "name": "Dataset Name",
  "description": "Dataset description",
  "category": "Natural Language Processing",
  "price": "0.05",
  "license": "MIT",
  "tags": ["nlp", "text"],
  "metadata": {}
}
```

### Signing Endpoints

#### POST `/api/signing/sign`
**Purpose**: Sign message with DID
**Request Body**:
```json
{
  "message": "Message to sign",
  "did": "did:web:example.com"
}
```

#### GET `/api/signing/dids`
**Purpose**: Get available DIDs for user

#### POST `/api/signing/validate-permission`
**Purpose**: Validate user permission for DID
**Request Body**:
```json
{
  "did": "did:web:example.com"
}
```

---

## Troubleshooting Guide

### Common Issues

#### 1. Authentication Issues

**Problem**: Token validation fails with 404
**Solution**: 
- Check Keycloak server is running
- Verify Keycloak configuration in `config.env`
- Check JWT token expiration
- Verify client secret is correct

**Problem**: User not authorized to sign with DID
**Solution**:
- Check if DID is in enterprise keys
- Verify user has permission for the DID
- Check signing service configuration

#### 2. Blockchain Issues

**Problem**: Blockchain connection failed
**Solution**:
- Start local blockchain node: `cd blockchain && npm run node`
- Check blockchain URL in configuration
- Verify deployer private key is set

**Problem**: Smart contract deployment fails
**Solution**:
- Check deployer private key format
- Verify contract address is correct
- Check gas limits and network configuration

#### 3. Database Issues

**Problem**: Database connection failed
**Solution**:
- Check PostgreSQL server is running
- Verify database URL in configuration
- Check database user permissions
- Run database migrations if needed

#### 4. Signing Issues

**Problem**: Enterprise signing failed with decoder error
**Solution**:
- Check private key format in signing service
- Verify JWK to PEM conversion
- Use valid EC private key for demo/testing

### Debug Commands

```bash
# Check backend health
curl http://localhost:5001/health

# Check blockchain connection
curl http://localhost:8545

# Check Keycloak status
curl http://localhost:8080/health

# View backend logs
tail -f backend/logs/app.log

# Test blockchain deployment
cd blockchain && npm run deploy

# Test signing service
cd backend && node -e "const SigningService = require('./services/signingService'); const service = new SigningService(); console.log(service.getAvailableDIDs());"
```

### Log Analysis

**Backend Logs**: Check for authentication, blockchain, and signing errors
**Frontend Logs**: Check for API call failures and token issues
**Blockchain Logs**: Check for deployment and transaction errors
**Keycloak Logs**: Check for authentication and authorization issues

---

## References & Further Reading

### Official Documentation

- [Keycloak Documentation](https://www.keycloak.org/docs/latest/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs/)
- [Web3.js Documentation](https://web3js.org/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [Sequelize Documentation](https://sequelize.org/)

### Standards & Specifications

- [Ricardian Contracts](https://en.wikipedia.org/wiki/Ricardian_contract)
- [DID Specification](https://www.w3.org/TR/did-core/)
- [JWT Specification](https://tools.ietf.org/html/rfc7519)
- [EIP-712 Signing](https://eips.ethereum.org/EIPS/eip-712)
- [OpenID Connect](https://openid.net/connect/)

### Security References

- [Node.js Crypto](https://nodejs.org/api/crypto.html)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [Web3 Security Best Practices](https://consensys.net/blog/developers/web3-security-best-practices/)

### Development Tools

- [Postman](https://www.postman.com/) - API testing
- [MetaMask](https://metamask.io/) - Blockchain wallet
- [Remix IDE](https://remix.ethereum.org/) - Smart contract development
- [Keycloak Admin Console](http://localhost:8080/admin) - IAM management

### Community Resources

- [Ethereum Stack Exchange](https://ethereum.stackexchange.com/)
- [Keycloak Community](https://keycloak.discourse.group/)
- [OpenZeppelin Forum](https://forum.openzeppelin.com/)

---

## Version History

- **v1.0.0** - Initial release with basic contract management
- **v1.1.0** - Added blockchain integration
- **v1.2.0** - Added AI model linking
- **v1.3.0** - Enhanced DID signing capabilities
- **v1.4.0** - Improved security and error handling

---

**Note**: This document should be updated as the system evolves. For the latest information, check the in-code documentation and the `README.md` files in each major directory. 