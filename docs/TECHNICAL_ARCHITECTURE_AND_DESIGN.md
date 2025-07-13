# Technical Architecture & Design

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Components](#architecture-components)
3. [Data Models](#data-models)
4. [API Design](#api-design)
5. [Security Architecture](#security-architecture)
6. [DID Integration](#did-integration)
7. [Blockchain Integration](#blockchain-integration)
8. [Deployment Architecture](#deployment-architecture)
9. [Performance & Scalability](#performance--scalability)

## System Overview

The Contract Management System is a blockchain-based platform for secure data sharing between Training Data Providers (TDP), Training Data Consumers (TDC), and Confidential Clean Room Providers (CCRP). The system features advanced DID (Decentralized Identifier) support, IAM integration, and enterprise-grade security.

### Core Components
- **Backend API**: Node.js/Express with comprehensive endpoints
- **Frontend**: React application with modern UI/UX
- **Database**: PostgreSQL with full data model
- **Authentication**: Keycloak IAM integration with JWT tokens
- **Blockchain**: Smart contracts with flexible integration modes
- **DID Support**: Multiple DID methods with enterprise integration

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
- **Testing**: Jest

### Frontend
- **Framework**: React 18+
- **State Management**: Context API
- **Routing**: React Router
- **UI Library**: Custom components
- **Build Tool**: Create React App

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: Centralized logging

---

*This document provides a comprehensive technical overview of the Contract Management System architecture and design decisions.* 