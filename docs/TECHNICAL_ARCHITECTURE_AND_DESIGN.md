# Technical Architecture & Design

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Components](#architecture-components)
3. [Data Models](#data-models)
4. [API Design](#api-design)
5. [Security Architecture](#security-architecture)
6. [DID Integration](#did-integration)
7. [Blockchain Integration](#blockchain-integration)
8. [Merkle Tree Provenance](#merkle-tree-provenance)
9. [Multi-Cloud TEE Provisioning](#multi-cloud-tee-provisioning)
10. [AI Model Management & TEE Integration](#ai-model-management--tee-integration)
11. [Environment Marketplace](#environment-marketplace)
12. [CCRP Monitoring & Management](#ccrp-monitoring--management)
13. [Deployment Architecture](#deployment-architecture)
14. [Performance & Scalability](#performance--scalability)

## System Overview

The Contract Management System is a blockchain-based platform for secure data sharing between Training Data Providers (TDP), Training Data Consumers (TDC), and Confidential Clean Room Providers (CCRP). The system features advanced DID (Decentralized Identifier) support, IAM integration, and enterprise-grade security.

### Core Components
- **Backend API**: Node.js/Express with comprehensive endpoints
- **Frontend**: React application with modern UI/UX
- **Database**: PostgreSQL with full data model
- **Authentication**: Keycloak IAM integration with JWT tokens
- **Blockchain**: Smart contracts with flexible integration modes
- **DID Support**: Multiple DID methods with enterprise integration
- **Merkle Tree Provenance**: Cryptographic data lineage tracking
- **Multi-Cloud TEE**: Trusted execution environments across cloud providers
- **AI Model Management**: Secure model upload, encryption, and processing
- **Environment Marketplace**: Training environment discovery and provisioning
- **SCITT CCF Integration**: Supply Chain Integrity Transparency and Trust

## Architecture Components

### Backend Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Keycloak      │
                       │   (IAM)         │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Blockchain    │
                       │   (Smart Contracts) │
                       └─────────────────┘
```

### Service Layer Architecture
- **Authentication Service**: Keycloak integration
- **DID Service**: DID creation, verification, and management
- **Contract Service**: Ricardian contract management
- **Blockchain Service**: Smart contract integration
- **Email Service**: Notification and verification
- **Audit Service**: Comprehensive logging
- **Provenance Tracking Service**: Merkle tree-based data lineage
- **TEE Provisioning Service**: Multi-cloud trusted execution environments
- **AI Model Service**: Secure model management and processing
- **Environment Marketplace Service**: Training environment discovery
- **TEE Model Decryption Service**: Secure model decryption in TEE
- **Multi-Cloud TEE Service**: Cross-cloud TEE orchestration

## Data Models

### User Model
```javascript
{
  id: UUID,
  name: String,
  email: String,
  partyType: ENUM('TDP', 'TDC', 'CCRP'),
  walletAddress: String (optional),
  publicKey: String,
  did: String,
  didVerified: Boolean,
  isActive: Boolean,
  isRegistered: Boolean,
  emailVerified: Boolean,
  organization: String,
  phoneNumber: String,
  website: String,
  location: String,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Contract Model
```javascript
{
  id: UUID,
  tdpId: UUID (User),
  tdcId: UUID (User),
  ccrpId: UUID (User),
  status: ENUM('PENDING_CCRP_APPROVAL', 'ACTIVE', 'COMPLETED', 'TERMINATED'),
  datasetId: String,
  modelId: String,
  ricardianContract: JSON,
  signatures: JSON,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Dataset Model
```javascript
{
  id: UUID,
  tdpId: UUID (User),
  name: String,
  description: String,
  metadata: JSON,
  accessLevel: ENUM('PUBLIC', 'PRIVATE', 'RESTRICTED'),
  isActive: Boolean,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### AI Model Model
```javascript
{
  id: UUID,
  ownerId: UUID (User),
  name: String,
  description: String,
  version: String,
  modelType: String,
  architecture: String,
  framework: String,
  parameters: String,
  inputSize: String,
  outputClasses: String,
  license: String,
  tags: Array,
  filePath: String,
  fileName: String,
  fileSize: Integer,
  encryptionConfig: JSON,
  teeConfig: JSON,
  status: ENUM('UPLOADED', 'ENCRYPTED', 'DEPLOYED', 'TRAINING', 'COMPLETED'),
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Provenance Node Model
```javascript
{
  id: UUID,
  nodeId: String (unique),
  nodeType: ENUM('DATA', 'CODE', 'MODEL', 'EXECUTION', 'CONTRACT'),
  dataHash: String,
  parentHash: String,
  metadata: JSON,
  createdAt: DateTime
}
```

### Training Environment Model
```javascript
{
  id: UUID,
  contractId: UUID (Contract),
  name: String,
  description: String,
  provider: ENUM('AWS', 'Azure', 'GCP', 'OCI', 'Local'),
  region: String,
  instanceType: String,
  status: ENUM('PENDING', 'PROVISIONING', 'ACTIVE', 'TERMINATED', 'ERROR'),
  teeEnabled: Boolean,
  specifications: JSON,
  cost: Decimal,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Merkle Tree Model
```javascript
{
  id: UUID,
  sessionId: String (unique),
  rootHash: String,
  treeData: JSON,
  nodeCount: Integer,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

## API Design

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Password reset
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/verify-email` - Email verification

### Contract Endpoints
- `POST /api/contracts` - Create contract
- `GET /api/contracts` - List contracts
- `GET /api/contracts/:id` - Get contract details
- `PUT /api/contracts/:id/sign` - Sign contract
- `PUT /api/contracts/:id/approve` - Approve contract

### DID Endpoints
- `POST /api/did/create` - Create DID
- `GET /api/did/:did` - Get DID details
- `POST /api/did/verify` - Verify DID
- `PUT /api/did/:did/update` - Update DID

### User Management Endpoints
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### AI Model Management Endpoints
- `POST /api/ai-models/upload` - Upload AI model (TDC)
- `GET /api/ai-models` - List AI models
- `GET /api/ai-models/:id` - Get model details
- `PUT /api/ai-models/:id` - Update model metadata
- `DELETE /api/ai-models/:id` - Delete model

### Provenance Tracking Endpoints
- `POST /api/provenance/initialize` - Initialize provenance tracking
- `POST /api/provenance/nodes` - Create provenance node
- `POST /api/provenance/trees/:sessionId/nodes` - Add node to Merkle tree
- `POST /api/provenance/nodes/:nodeId/verify` - Verify provenance node
- `POST /api/provenance/chains/:sessionId/verify` - Verify provenance chain
- `GET /api/provenance/reports/:sessionId` - Get provenance report

### TEE Model Decryption Endpoints
- `POST /api/tee/decrypt-model` - Request model decryption in TEE

### Multi-Cloud TEE Endpoints
- `POST /api/multi-cloud-tee/provision` - Provision TEE environment
- `GET /api/multi-cloud-tee/providers` - Get available TEE providers
- `GET /api/multi-cloud-tee/environments` - List user TEE environments
- `GET /api/multi-cloud-tee/environments/:id` - Get TEE environment details
- `DELETE /api/multi-cloud-tee/environments/:id` - Terminate TEE environment
- `POST /api/multi-cloud-tee/cost-estimate` - Get cost estimation

### Environment Marketplace Endpoints
- `GET /api/marketplace/environments` - Browse available environments
- `GET /api/marketplace/environments/:id` - Get environment details
- `POST /api/marketplace/environments/:id/request` - Request environment access

### Infrastructure Management Endpoints
- `GET /api/infrastructure/environments` - List all training environments
- `GET /api/infrastructure/environments/stats` - Get environment statistics
- `GET /api/infrastructure/environments/search` - Search environments
- `GET /api/infrastructure/environments/provider/:provider` - Get environments by provider
- `GET /api/infrastructure/environments/:id/monitor` - Get environment monitoring data

## Security Architecture

### Authentication Flow
1. **User Login**: Email/password → Keycloak validation
2. **Token Generation**: JWT token with user claims
3. **Token Validation**: Middleware validates on each request
4. **Role-based Access**: PartyType determines permissions

### Security Features
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **CORS Protection**: Cross-origin request protection
- **Rate Limiting**: API rate limiting
- **Audit Logging**: Comprehensive security logging

### IAM Integration
- **Keycloak Realm**: Custom realm configuration
- **User Roles**: TDP, TDC, CCRP role management
- **Client Configuration**: Secure client setup
- **Token Management**: Automatic token refresh

## DID Integration

### Supported DID Methods
- **did:web**: Web-based DIDs
- **did:key**: Key-based DIDs
- **did:github**: GitHub-based DIDs

### DID Operations
- **Creation**: Generate new DIDs with keys
- **Verification**: Verify DID authenticity
- **Resolution**: Resolve DID to document
- **Update**: Update DID document

### Enterprise DID Support
- **Multiple Providers**: Support for multiple DID providers
- **Key Management**: Secure key storage and rotation
- **Verification**: Automated DID verification
- **Integration**: Seamless integration with contracts

## Blockchain Integration

### Smart Contract Architecture
```solidity
contract ContractManager {
    struct Contract {
        address tdp;
        address tdc;
        address ccrp;
        string datasetId;
        string modelId;
        ContractStatus status;
        uint256 createdAt;
    }
    
    mapping(bytes32 => Contract) public contracts;
    mapping(address => bytes32[]) public userContracts;
}
```

### Integration Modes
- **Full Integration**: Complete blockchain integration
- **Hybrid Mode**: Database + blockchain
- **Simulation Mode**: Blockchain simulation for testing

### Contract Lifecycle
1. **Creation**: TDC creates contract
2. **Approval**: CCRP approves contract
3. **Execution**: Contract becomes active
4. **Completion**: Contract completed
5. **Termination**: Contract terminated

## Merkle Tree Provenance

### Architecture Overview
The Merkle Tree Provenance system provides cryptographic verification of data lineage throughout the AI training pipeline.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Data Ingestion  │    │ Provenance Node │    │ Merkle Tree     │
│                 │───►│ Creation        │───►│ Construction    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                         │
                              ▼                         ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Digital         │    │ Verification    │
                       │ Signature       │    │ & Audit         │
                       └─────────────────┘    └─────────────────┘
```

### Components
- **ProvenanceTrackingService**: Core service for managing provenance nodes and Merkle trees
- **Provenance Nodes**: Individual data points representing dataset transformations
- **Merkle Trees**: Cryptographic structures for efficient verification
- **Digital Signatures**: Cryptographic proof of data authenticity
- **Timestamping**: Immutable time records for audit trails

### Features
- **Data Lineage Tracking**: Complete audit trail from source to model
- **Cryptographic Verification**: Tamper-proof evidence of data integrity
- **Cross-Cloud Verification**: Multi-provider verification support
- **Automated Timestamping**: Blockchain-based timestamping service
- **Verification Reports**: Comprehensive provenance analysis

## Multi-Cloud TEE Provisioning

### Architecture Overview
Multi-cloud Trusted Execution Environment (TEE) provisioning enables secure computation across different cloud providers.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ TEE Request     │    │ Provider        │    │ TEE Instance    │
│                 │───►│ Selection       │───►│ Provisioning    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ AWS Nitro       │    │ Azure SGX       │    │ GCP Confidential│
│ Enclaves        │    │ Enclaves        │    │ VMs             │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Supported Providers
- **AWS**: Nitro Enclaves with EC2 instances
- **Azure**: SGX enclaves and Confidential VMs
- **GCP**: Confidential Computing with AMD SEV
- **OCI**: Confidential Computing instances
- **Local**: Development and testing environments

### Features
- **Multi-Provider Support**: Seamless switching between cloud providers
- **Automated Provisioning**: Infrastructure-as-Code deployment
- **Cost Optimization**: Intelligent provider selection based on cost
- **Security Attestation**: Cryptographic proof of TEE integrity
- **Environment Monitoring**: Real-time resource and security monitoring

## AI Model Management & TEE Integration

### Architecture Overview
Secure AI model lifecycle management with TEE integration for confidential computing.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Model Upload    │    │ Encryption &    │    │ TEE Deployment  │
│ (TDC)           │───►│ Key Management  │───►│ & Training      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Model Metadata  │    │ TEE Attestation │    │ Secure Model    │
│ Management      │    │ & Verification  │    │ Execution       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Components
- **TDC Model Upload Interface**: User-friendly model upload workflow
- **AI Model Service**: Backend model management and metadata storage
- **TEE Model Decryption Service**: Secure model decryption within TEE
- **Encryption Configuration**: Advanced encryption settings and key management
- **TEE Configuration**: TEE-specific settings and attestation requirements

### Features
- **Secure Model Upload**: Encrypted model storage with metadata management
- **TEE Integration**: Seamless deployment to trusted execution environments
- **Key Management**: Advanced encryption key management and rotation
- **Attestation Verification**: Cryptographic proof of TEE integrity
- **Model Lifecycle Management**: Complete model versioning and deployment tracking

## Environment Marketplace

### Architecture Overview
Decentralized marketplace for discovering and accessing training environments across multiple providers.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Environment     │    │ Marketplace     │    │ Access Request  │
│ Discovery       │───►│ Filtering &     │───►│ & Approval      │
└─────────────────┘    │ Selection       │    └─────────────────┘
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │ Environment     │
                       │ Provisioning    │
                       └─────────────────┘
```

### Features
- **Environment Discovery**: Browse available training environments
- **Provider Comparison**: Side-by-side comparison of different providers
- **Cost Analysis**: Real-time cost estimation and optimization
- **Capability Matching**: Automatic matching of requirements to capabilities
- **Access Management**: Secure environment access request and approval workflow

## CCRP Monitoring & Management

### Architecture Overview
Comprehensive monitoring and management dashboard for Certified Clean Room Providers (CCRP).

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Environment     │    │ Real-time       │    │ Alert &         │
│ Monitoring      │───►│ Metrics         │───►│ Notification    │
└─────────────────┘    │ Collection      │    │ System          │
                       └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │ CCRP Dashboard  │
                       │ & Analytics     │
                       └─────────────────┘
```

### Components
- **CCRP Environment Monitoring Component**: Real-time environment status and metrics
- **Environment Monitoring Service**: Backend monitoring data collection and processing
- **Alert System**: Automated alerting for critical events and thresholds
- **Analytics Dashboard**: Comprehensive reporting and trend analysis

### Features
- **Real-time Monitoring**: Live environment status, resource utilization, and performance metrics
- **Resource Management**: CPU, memory, disk, and network monitoring
- **Security Monitoring**: TEE attestation status and security event tracking
- **Cost Tracking**: Real-time cost monitoring and budget management
- **Compliance Reporting**: Automated compliance and audit report generation

## Deployment Architecture

### Local Development
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Port 3000)   │◄──►│   (Port 5001)   │◄──►│   (Port 5432)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Keycloak      │
                       │   (Port 8080)   │
                       └─────────────────┘
```

### Production Deployment
- **Container Orchestration**: Kubernetes deployment
- **Load Balancing**: Nginx ingress controller
- **Database**: Managed PostgreSQL service
- **Monitoring**: Prometheus + Grafana
- **Logging**: Centralized logging system

### Cloud Deployment
- **OCI**: Oracle Cloud Infrastructure
- **Terraform**: Infrastructure as Code
- **Container Registry**: OCI Container Registry
- **Load Balancer**: OCI Load Balancer
- **Database**: OCI Autonomous Database

## Performance & Scalability

### Performance Optimizations
- **Database Indexing**: Optimized database queries
- **Caching**: Redis for session management
- **Connection Pooling**: Database connection optimization
- **Compression**: Gzip compression for API responses

### Scalability Features
- **Horizontal Scaling**: Multiple backend instances
- **Load Balancing**: Traffic distribution
- **Database Sharding**: Data distribution
- **CDN Integration**: Static content delivery

### Monitoring & Observability
- **Health Checks**: Application health monitoring
- **Metrics Collection**: Performance metrics
- **Error Tracking**: Comprehensive error logging
- **Alerting**: Automated alerting system

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **ORM**: Sequelize
- **Authentication**: Keycloak
- **Testing**: Jest, Mocha, Supertest
- **Cryptography**: Node.js crypto, merkletreejs
- **File Upload**: Multer
- **Utilities**: uuid, lodash

### Frontend
- **Framework**: React 18+
- **State Management**: Context API, React Query
- **Routing**: React Router
- **UI Library**: Material-UI (MUI), Custom components
- **Build Tool**: Create React App
- **Testing**: React Testing Library, Jest
- **Data Fetching**: React Query, Axios

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: Centralized logging
- **Cloud Providers**: AWS, Azure, GCP, OCI
- **TEE Technologies**: AWS Nitro Enclaves, Azure SGX, GCP Confidential Computing, OCI Confidential Computing
- **Key Management**: Azure Key Vault, AWS KMS, GCP Secret Manager

---

*This document provides a comprehensive technical overview of the Contract Management System architecture and design decisions.* 