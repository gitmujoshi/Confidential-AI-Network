# 🏗️ System Architecture

Complete technical architecture documentation for the Contract Management System. This guide consolidates all architecture and technical design information.

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Components](#architecture-components)
3. [SCITT CCF Integration Architecture](#scitt-ccf-integration-architecture)
4. [Authentication & Authorization](#authentication--authorization)
5. [Database Design](#database-design)
6. [API Architecture](#api-architecture)
7. [Frontend Architecture](#frontend-architecture)
8. [Blockchain Integration](#blockchain-integration)
9. [Secret Management](#secret-management)
10. [Differential Privacy Architecture](#differential-privacy-architecture)
11. [Security Architecture](#security-architecture)
12. [Deployment Architecture](#deployment-architecture)

## 🎯 System Overview

### **High-Level Architecture**
```
┌─────────────────────────────────────────────────────────────┐
│                Contract Management System                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Frontend      │  │   Backend       │  │   Keycloak      │  │
│  │   (React)       │◄─►│   (Node.js)     │◄─►│   (IAM)         │  │
│  │   Port: 3000    │  │   Port: 5001    │  │   Port: 8080    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Contract Router Service                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Ethereum        │  │ SCITT CCF       │  │ Migration       │  │
│  │ Service         │  │ Service         │  │ Orchestrator    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ PostgreSQL      │  │ SCITT CCF       │  │ Ethereum        │  │
│  │ (Primary)       │  │ Ledger          │  │ Blockchain      │  │
│  │ Port: 5432      │  │ Port: 8000      │  │ Port: 8545      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### **System Components**
- **Frontend**: React.js with Material-UI
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: Keycloak IAM
- **Blockchain**: Ethereum with Hardhat
- **SCITT CCF**: High-performance confidential computing ledger
- **Secret Management**: HashiCorp Vault
- **Cloud Providers**: AWS, Azure, GCP, OCI

## 🧩 Architecture Components

### **Frontend Layer**
```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/               # Page-level components
│   ├── services/            # API service layer
│   ├── contexts/            # React context providers
│   ├── utils/               # Utility functions
│   └── styles/              # CSS and styling
├── public/                  # Static assets
└── tests/                   # Frontend tests
```

**Key Features**:
- **Component-Based Architecture**: Modular, reusable components
- **State Management**: React Context for global state
- **Routing**: React Router for navigation
- **API Integration**: Axios for HTTP requests
- **UI Framework**: Material-UI for consistent design

### **Backend Layer**
```
backend/
├── routes/                  # API route handlers
├── services/                # Business logic layer
│   ├── scittCcfService.js  # SCITT CCF integration service
│   ├── contractRouterService.js  # Contract routing service
│   ├── systemHealthMonitor.js   # Health monitoring service
│   └── blockchainService.js     # Ethereum blockchain service
├── models/                  # Database models
│   ├── ScittClaim.js       # SCITT CCF claims model
│   ├── SystemHealthLog.js  # Health logging model
│   └── Contract.js         # Enhanced contract model
├── middleware/              # Express middleware
├── scripts/                 # Utility scripts
├── tests/                   # Backend tests
└── config/                  # Configuration files
```

**Key Features**:
- **RESTful API**: Standard HTTP endpoints
- **Service Layer**: Business logic separation
- **Database ORM**: Sequelize for database operations
- **Authentication**: JWT token validation
- **Validation**: Request/response validation
- **Hybrid Architecture**: Support for both blockchain and SCITT CCF

### **Database Layer**
```
Database Schema:
├── users                    # User accounts and profiles
├── contracts               # Contract management (enhanced with SCITT CCF)
├── datasets                # Dataset information
├── ai_models              # AI model metadata
├── ccrp_cloud_credentials # Cloud provider credentials
├── scitt_claims           # SCITT CCF claims storage
└── system_health_log      # System health monitoring
```

## 🔗 SCITT CCF Integration Architecture

### **What is SCITT CCF?**

SCITT CCF (Supply Chain Integrity Transparency and Trust) is Microsoft's high-performance ledger application built on Confidential Consortium Framework (CCF). It provides:

- **10-100x Performance**: Massive throughput improvement over Ethereum
- **Confidential Computing**: Hardware-level TEE (Trusted Execution Environment) support
- **Standards Compliance**: IETF SCITT working group standards
- **Enterprise Ready**: Production-grade infrastructure

### **SCITT CCF Architecture Components**

#### **1. Contract Router Service**
The central orchestrator that intelligently routes contract operations:

```
┌─────────────────────────────────────────────────────────────┐
│                    Contract Router Service                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Route Selection │  │ Fallback Logic  │  │ Health Check    │  │
│  │ Algorithm       │  │ & Recovery      │  │ Integration     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Service Integration                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Ethereum        │  │ SCITT CCF       │  │ Migration       │  │
│  │ Service         │  │ Service         │  │ Orchestrator    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Key Features**:
- **Intelligent Routing**: Automatically selects best system for each operation
- **Fallback Mechanisms**: Seamless fallback if primary system fails
- **Health Monitoring**: Real-time system health assessment
- **Migration Support**: Gradual migration from Ethereum to SCITT CCF

#### **2. SCITT CCF Service Layer**
Handles all interactions with the SCITT CCF Ledger:

```
┌─────────────────────────────────────────────────────────────┐
│                    SCITT CCF Service Layer                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Claim Builder   │  │ TEE Attestation │  │ Receipt Manager │  │
│  │ & Submitter     │  │ & Validation    │  │ & Storage       │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    SCITT CCF Integration                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ HTTP Client     │  │ Authentication  │  │ Error Handling  │  │
│  │ & API Calls     │  │ & Security      │  │ & Retry Logic   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Key Features**:
- **Claim Management**: Builds and submits SCITT CCF claims
- **TEE Integration**: Supports AMD SEV-SNP and virtual platforms
- **Receipt Handling**: Manages SCITT CCF receipts and verification
- **Local Storage**: Caches claims locally for fallback and auditing

#### **3. System Health Monitor**
Continuously monitors system health and performance:

```
┌─────────────────────────────────────────────────────────────┐
│                    System Health Monitor                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Health Checks   │  │ Performance     │  │ Alert System    │  │
│  │ & Monitoring    │  │ Metrics         │  │ & Notifications │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Data Collection                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Response Time   │  │ Uptime Tracking │  │ Error Rate      │  │
│  │ Monitoring      │  │ & Calculation   │  │ & Analysis      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Key Features**:
- **Real-time Monitoring**: Continuous health status tracking
- **Performance Metrics**: Response time, throughput, and error rate monitoring
- **Alert System**: Proactive notification of system issues
- **Historical Data**: Performance trend analysis and reporting

### **Migration Architecture**

#### **Hybrid Migration Strategy**
The system supports three migration modes:

```
┌─────────────────────────────────────────────────────────────┐
│                    Migration Modes                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ ETHEREUM_ONLY   │  │ HYBRID          │  │ SCITT_CCF_ONLY  │  │
│  │ Traditional     │  │ Both Systems    │  │ High Performance│  │
│  │ Blockchain      │  │ Simultaneously  │  │ Ledger Only     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Migration Modes**:

1. **ETHEREUM_ONLY**:
   - Traditional blockchain operation
   - No SCITT CCF integration
   - Legacy mode for troubleshooting

2. **HYBRID** (Recommended):
   - New contracts go to SCITT CCF
   - Existing contracts remain on Ethereum
   - Automatic fallback if SCITT CCF fails
   - Gradual migration path

3. **SCITT_CCF_ONLY**:
   - All contracts use SCITT CCF
   - No Ethereum fallback
   - Maximum performance
   - Requires SCITT CCF to be fully operational

#### **Migration Flow**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Contract        │───►│ Route Selection │───►│ Target System   │
│ Creation        │    │ Algorithm       │    │ (SCITT CCF or   │
│ Request         │    │                 │    │ Ethereum)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Health Check    │
                       │ & Validation    │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Execute         │
                       │ Operation       │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Fallback Logic  │
                       │ (if needed)     │
                       └─────────────────┘
```

### **SCITT CCF Data Flow**

#### **Contract Creation Flow**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Frontend        │───►│ Backend API     │───►│ Contract Router │
│ Contract Form   │    │ /api/contracts │    │ Service         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ SCITT CCF       │
                       │ Service         │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Build Claim     │
                       │ & Submit        │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ SCITT CCF       │
                       │ Ledger          │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Store Receipt   │
                       │ & Update DB     │
                       └─────────────────┘
```

#### **Contract Retrieval Flow**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Frontend        │───►│ Backend API     │───►│ Contract Router │
│ Contract List   │    │ /api/contracts │    │ Service         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Check Source    │
                       │ (SCITT CCF or   │
                       │  Ethereum)      │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Retrieve from   │
                       │ Appropriate     │
                       │ Source          │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Merge & Return  │
                       │ Unified Data    │
                       └─────────────────┘
```

### **Performance Architecture**

#### **Throughput Comparison**
```
┌─────────────────────────────────────────────────────────────┐
│                    Performance Comparison                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Ethereum        │  │ SCITT CCF       │  │ Improvement     │  │
│  │ Blockchain      │  │ Ledger          │  │ Factor          │  │
│  │ 15-30 TPS      │  │ 1,500-3,000 TPS│  │ 50-200x         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### **Latency Comparison**
```
┌─────────────────────────────────────────────────────────────┐
│                    Latency Comparison                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Ethereum        │  │ SCITT CCF       │  │ Improvement     │  │
│  │ Blockchain      │  │ Ledger          │  │ Factor          │  │
│  │ 12-15 seconds  │  │ 100-500ms       │  │ 24-150x         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### **Security Architecture**

#### **TEE (Trusted Execution Environment) Support**
```
┌─────────────────────────────────────────────────────────────┐
│                    TEE Architecture                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ AMD SEV-SNP     │  │ Virtual Platform│  │ Future TEE      │  │
│  │ Hardware TEE    │  │ Development     │  │ Support         │  │
│  │ Production      │  │ & Testing       │  │ (Intel SGX,     │  │
│  │ Ready           │  │ Environment     │  │ ARM CCA)        │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**TEE Features**:
- **Memory Encryption**: Hardware-level memory protection
- **Attestation**: Cryptographic proof of execution environment
- **Isolation**: Secure execution environment separation
- **Integrity**: Protection against tampering and attacks

#### **Confidential Computing Benefits**
- **Data Privacy**: Data remains encrypted during processing
- **Code Integrity**: Execution environment cannot be modified
- **Audit Trail**: Cryptographic proof of all operations
- **Compliance**: Meets regulatory requirements for data handling

## 🔐 Authentication & Authorization

### **Keycloak Integration**

#### **Realm Configuration**
- **Realm Name**: `contract-management`
- **Access Token Lifespan**: 5 minutes
- **SSO Session Idle**: 30 minutes
- **SSO Session Max**: 60 minutes
- **Direct Access Grants**: Enabled

#### **Client Configuration**
```json
{
  "frontend_client": {
    "clientId": "contract-management-frontend",
    "publicClient": true,
    "redirectUris": ["http://localhost:3000/*"],
    "webOrigins": ["http://localhost:3000"]
  },
  "backend_client": {
    "clientId": "contract-management-backend",
    "publicClient": false,
    "serviceAccountsEnabled": true
  }
}
```

#### **User Roles**
- **TDP**: Training Data Provider
- **TDC**: Training Data Consumer
- **CCRP**: Confidential Clean Room Provider
- **ADMIN**: System Administrator

### **Authentication Flow**
1. **User Login**: Frontend authenticates with Keycloak
2. **Token Generation**: Keycloak issues access and refresh tokens
3. **API Requests**: Backend validates tokens with Keycloak
4. **Role-Based Access**: System applies role-based permissions
5. **Token Refresh**: Automatic token refresh before expiration

### **Security Features**
- **JWT Tokens**: Secure token-based authentication
- **Role-Based Access**: Fine-grained permission control
- **Session Management**: Secure session handling
- **Token Blacklisting**: Support for token revocation
- **Audit Logging**: Comprehensive authentication logs

## 🗄️ Database Design

### **Core Tables**

#### **Users Table**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  partyType VARCHAR(50) NOT NULL,
  name VARCHAR(255),
  organization VARCHAR(255),
  depaId VARCHAR(255),
  iamUserId VARCHAR(255),
  iamUsername VARCHAR(255),
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **Contracts Table**
```sql
CREATE TABLE contracts (
  id SERIAL PRIMARY KEY,
  contractId VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  partyType VARCHAR(50) NOT NULL,
  datasetId INTEGER REFERENCES datasets(id),
  price DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'USD',
  startDate TIMESTAMP,
  endDate TIMESTAMP,
  depaId VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **Datasets Table**
```sql
CREATE TABLE datasets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(100),
  size VARCHAR(50),
  format VARCHAR(50),
  price DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'USD',
  provider VARCHAR(255),
  depaId VARCHAR(255),
  metadata JSONB,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **Cloud Credentials Table**
```sql
CREATE TABLE ccrp_cloud_credentials (
  id SERIAL PRIMARY KEY,
  ccrpId INTEGER REFERENCES users(id),
  cloudProvider VARCHAR(50) NOT NULL,
  projectId VARCHAR(255),
  compartmentId VARCHAR(255),
  secretName VARCHAR(255),
  secretManager VARCHAR(50),
  authMethod VARCHAR(50),
  isValid BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Relationships**
- **Users** → **Contracts** (One-to-Many)
- **Users** → **Datasets** (One-to-Many)
- **Users** → **Cloud Credentials** (One-to-Many)
- **Datasets** → **Contracts** (One-to-Many)

### **Indexes**
```sql
-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_party_type ON users(partyType);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_party_type ON contracts(partyType);
CREATE INDEX idx_datasets_type ON datasets(type);
CREATE INDEX idx_datasets_provider ON datasets(provider);
```

## 🔌 API Architecture

### **RESTful API Design**

#### **Base URL**
```
http://localhost:5001/api
```

#### **Authentication Endpoints**
- `POST /auth/login` - User authentication
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Token refresh
- `POST /auth/register` - User registration
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile

#### **Contract Endpoints**
- `GET /contracts` - List contracts
- `POST /contracts` - Create contract
- `GET /contracts/:id` - Get contract details
- `PUT /contracts/:id` - Update contract
- `DELETE /contracts/:id` - Delete contract

#### **Dataset Endpoints**
- `GET /datasets` - List datasets
- `POST /datasets` - Create dataset
- `GET /datasets/:id` - Get dataset details
- `PUT /datasets/:id` - Update dataset
- `DELETE /datasets/:id` - Delete dataset

#### **Cloud Credentials Endpoints**
- `GET /ccrp/cloud-credentials` - List credentials
- `POST /ccrp/cloud-credentials` - Add credentials
- `PUT /ccrp/cloud-credentials/:id` - Update credentials
- `DELETE /ccrp/cloud-credentials/:id` - Delete credentials
- `POST /ccrp/cloud-credentials/:id/validate` - Validate credentials

### **API Design Patterns**

#### **Response Format**
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

#### **Error Format**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "field": ["Error message"]
    }
  }
}
```

#### **Pagination**
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🎨 Frontend Architecture

### **Component Hierarchy**
```
App
├── Router
│   ├── Login
│   ├── Dashboard
│   │   ├── TDCDashboard
│   │   ├── TDPDashboard
│   │   ├── CCRPDashboard
│   │   └── AdminDashboard
│   ├── Contracts
│   ├── Datasets
│   ├── CloudCredentials
│   └── Profile
└── Context Providers
    ├── UserContext
    ├── AuthContext
    └── ThemeContext
```

### **State Management**
- **React Context**: Global state management
- **Local State**: Component-level state
- **Form State**: Controlled components
- **API State**: Loading, error, success states

### **Routing Strategy**
- **Protected Routes**: Role-based access control
- **Public Routes**: Login, registration
- **Dynamic Routes**: Contract details, dataset details
- **Nested Routes**: Dashboard with sub-navigation

## ⛓️ Blockchain Integration

### **Smart Contract Architecture**
```solidity
// ContractManager.sol
contract ContractManager {
    struct Contract {
        string contractId;
        address[] parties;
        string terms;
        uint256 price;
        bool isActive;
        uint256 createdAt;
    }
    
    mapping(string => Contract) public contracts;
    
    function createContract(
        string memory contractId,
        address[] memory parties,
        string memory terms,
        uint256 price
    ) public returns (bool) {
        // Contract creation logic
    }
    
    function getContract(string memory contractId) 
        public view returns (Contract memory) {
        return contracts[contractId];
    }
}
```

### **Blockchain Integration Points**
- **Contract Deployment**: Smart contract deployment
- **Contract Storage**: On-chain contract data
- **Event Logging**: Blockchain event tracking
- **Transaction Verification**: Payment verification

### **Integration Features**
- **Multi-Chain Support**: Ethereum, Polygon, etc.
- **Gas Optimization**: Efficient transaction handling
- **Event Listening**: Real-time blockchain events
- **Transaction Management**: Comprehensive transaction handling

## 🔐 Secret Management

### **Multi-Cloud Secret Management**

#### **Supported Secret Managers**
- **HashiCorp Vault**: Primary secret manager
- **AWS Secrets Manager**: AWS integration
- **Azure Key Vault**: Azure integration
- **Google Cloud Secret Manager**: GCP integration
- **OCI Vault**: Oracle Cloud integration

#### **Secret Management Architecture**
```
Application
    │
    ▼
Secret Manager Service
    │
    ├── HashiCorp Vault
    ├── AWS Secrets Manager
    ├── Azure Key Vault
    ├── GCP Secret Manager
    └── OCI Vault
```

#### **Secret Storage Strategy**
- **No Plain Text**: No secrets stored in database
- **Encrypted Storage**: All secrets encrypted at rest
- **Access Control**: Role-based secret access
- **Audit Trail**: Complete secret access logging
- **Rotation Support**: Automatic secret rotation

### **Cloud Provider Integration**

#### **AWS Integration**
```javascript
// AWS provider service
class AWSProvider {
  async validateCredentials(credentials) {
    // Validate AWS credentials
  }
  
  async createTrainingEnvironment(specs) {
    // Create AWS training environment
  }
  
  async estimateCosts(resources) {
    // Estimate AWS costs
  }
}
```

#### **Azure Integration**
```javascript
// Azure provider service
class AzureProvider {
  async validateCredentials(credentials) {
    // Validate Azure credentials
  }
  
  async createTrainingEnvironment(specs) {
    // Create Azure training environment
  }
  
  async estimateCosts(resources) {
    // Estimate Azure costs
  }
}
```

## 🔐 Differential Privacy Architecture

### **Overview**
The differential privacy system provides privacy-preserving data analysis with mathematical guarantees of privacy protection. It implements multiple noise mechanisms, budget tracking, and comprehensive audit logging.

### **High-Level DP Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   DP Service    │    │   DP Mechanisms │
│   DP Manager    │◄──►│   Layer         │◄──►│   (Laplace,     │
│   Component     │    │                 │    │    Gaussian)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Budget        │
                       │   Tracker       │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Database      │
                       │   (Privacy      │
                       │    Tables)      │
                       └─────────────────┘
```

### **Core Components**

#### **1. Differential Privacy Service**
```javascript
// backend/services/differentialPrivacyService.js
class DifferentialPrivacyService {
  constructor() {
    this.mechanisms = {
      laplace: new LaplaceMechanism(),
      gaussian: new GaussianMechanism(),
      exponential: new ExponentialMechanism(),
      geometric: new GeometricMechanism()
    };
    this.budgetTracker = new PrivacyBudgetTracker();
    this.sensitivityAnalyzer = new SensitivityAnalyzer();
  }
}
```

**Responsibilities:**
- Orchestrates DP operations
- Selects appropriate mechanisms
- Manages privacy budget
- Analyzes data sensitivity
- Provides audit logging

#### **2. Noise Mechanisms**

**Laplace Mechanism**
```javascript
// backend/services/mechanisms/laplaceMechanism.js
class LaplaceMechanism {
  addNoise(value, epsilon, sensitivity) {
    const scale = sensitivity / epsilon;
    const noise = this.sampleLaplace(scale);
    return value + noise;
  }
}
```

**Gaussian Mechanism**
```javascript
// backend/services/mechanisms/gaussianMechanism.js
class GaussianMechanism {
  addNoise(value, epsilon, delta, sensitivity) {
    const scale = this.calculateGaussianScale(epsilon, delta, sensitivity);
    const noise = this.sampleGaussian(scale);
    return value + noise;
  }
}
```

#### **3. Privacy Budget Management**
```javascript
// backend/services/privacyBudgetTracker.js
class PrivacyBudgetTracker {
  async checkBudget(contractId, requiredEpsilon, requiredDelta) {
    const budget = await this.getCurrentBudget(contractId);
    return {
      hasBudget: budget.remainingEpsilon >= requiredEpsilon && 
                 budget.remainingDelta >= requiredDelta,
      currentBudget: budget
    };
  }
}
```

**Budget States:**
- `ACTIVE`: Budget available for operations
- `WARNING`: Budget running low (< 20%)
- `EXHAUSTED`: Budget fully consumed
- `RESET`: Budget has been reset

#### **4. Sensitivity Analysis**
```javascript
// backend/services/sensitivityAnalyzer.js
class SensitivityAnalyzer {
  calculateSensitivity(queryType, data, parameters) {
    switch(queryType) {
      case 'COUNT':
        return 1; // Adding/removing one record changes count by 1
      case 'SUM':
        return Math.max(...data.map(Math.abs)); // Max absolute value
      case 'AVERAGE':
        return this.calculateAverageSensitivity(data);
      case 'GRADIENT':
        return this.calculateGradientSensitivity(data, parameters);
    }
  }
}
```

### **Database Schema**

#### **Privacy Budget Tables**
```sql
-- PrivacyBudgets table
CREATE TABLE "PrivacyBudgets" (
  id SERIAL PRIMARY KEY,
  contractId VARCHAR(255) NOT NULL REFERENCES contracts(contractId),
  initialEpsilon DECIMAL(10,6) NOT NULL DEFAULT 1.0,
  initialDelta DECIMAL(20,15) NOT NULL DEFAULT 0.00001,
  remainingEpsilon DECIMAL(10,6) NOT NULL,
  remainingDelta DECIMAL(20,15) NOT NULL,
  totalEpsilonConsumed DECIMAL(10,6) NOT NULL DEFAULT 0,
  totalDeltaConsumed DECIMAL(20,15) NOT NULL DEFAULT 0,
  budgetStatus ENUM('ACTIVE', 'WARNING', 'EXHAUSTED', 'RESET') DEFAULT 'ACTIVE',
  lastResetAt TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- PrivacyBudgetLogs table
CREATE TABLE "PrivacyBudgetLogs" (
  id SERIAL PRIMARY KEY,
  contractId VARCHAR(255) NOT NULL REFERENCES contracts(contractId),
  epsilonConsumed DECIMAL(10,6) NOT NULL,
  deltaConsumed DECIMAL(20,15) NOT NULL,
  operation VARCHAR(255) NOT NULL,
  operationId VARCHAR(255),
  userId INTEGER REFERENCES users(id),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSON,
  ipAddress VARCHAR(45),
  userAgent TEXT
);

-- PrivacyOperationsLogs table
CREATE TABLE "PrivacyOperationsLogs" (
  id SERIAL PRIMARY KEY,
  contractId VARCHAR(255) NOT NULL REFERENCES contracts(contractId),
  operationType VARCHAR(255) NOT NULL,
  epsilon DECIMAL(10,6) NOT NULL,
  delta DECIMAL(20,15) NOT NULL,
  mechanism VARCHAR(255) NOT NULL,
  sensitivity DECIMAL(15,6) NOT NULL,
  dataSize INTEGER,
  queryType VARCHAR(255),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  userId INTEGER REFERENCES users(id),
  result JSON,
  executionTime INTEGER,
  success BOOLEAN NOT NULL DEFAULT true,
  errorMessage TEXT,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  sessionId VARCHAR(255)
);
```

### **API Architecture**

#### **DP Endpoints Structure**
```
/api/dp/
├── GET  /mechanisms           # Available DP mechanisms
├── GET  /query-types          # Supported query types
├── POST /test                 # Test DP functionality
├── POST /apply                # Apply DP to data
├── GET  /budget/:contractId   # Privacy budget status
├── GET  /history/:contractId  # Operation history
└── GET  /analytics/:contractId # Privacy analytics
```

#### **Request/Response Flow**
```
1. Client Request → Authentication Middleware
2. Validation → DP Service
3. Budget Check → Privacy Budget Tracker
4. Sensitivity Analysis → Sensitivity Analyzer
5. Noise Addition → Selected Mechanism
6. Budget Update → Privacy Budget Tracker
7. Audit Logging → Privacy Operations Log
8. Response → Client
```

### **Privacy Mechanisms Implementation**

#### **Laplace Mechanism**
- **Use Case**: General-purpose noise addition
- **Parameters**: epsilon, sensitivity
- **Noise Distribution**: Laplace(0, sensitivity/epsilon)
- **Best For**: Counts, sums, gradients

#### **Gaussian Mechanism**
- **Use Case**: Better utility for continuous data
- **Parameters**: epsilon, delta, sensitivity
- **Noise Distribution**: Normal(0, σ²) where σ² = 2ln(1.25/δ) × (sensitivity/ε)²
- **Best For**: Averages, statistical measures

#### **Exponential Mechanism**
- **Use Case**: Discrete choice problems
- **Parameters**: epsilon, utility function
- **Best For**: Selection from discrete options

#### **Geometric Mechanism**
- **Use Case**: Integer count queries
- **Parameters**: epsilon
- **Best For**: Counting operations

### **Budget Management Strategy**

#### **Budget Allocation**
- **Initial Budget**: Epsilon = 1.0, Delta = 1e-5 per contract
- **Warning Threshold**: 20% remaining budget
- **Exhaustion Handling**: Graceful degradation or budget reset

#### **Budget Optimization**
- **Query Batching**: Combine multiple queries
- **Mechanism Selection**: Choose most efficient mechanism
- **Parameter Tuning**: Optimize epsilon/delta ratios

### **Security Considerations**

#### **Privacy Guarantees**
- **Mathematical Proofs**: All mechanisms provide proven privacy guarantees
- **Composition Theorems**: Multiple operations compose safely
- **Post-Processing Immunity**: Results remain private after additional processing

#### **Audit and Compliance**
- **Complete Logging**: All operations logged with metadata
- **Budget Tracking**: Real-time budget consumption monitoring
- **Compliance Reports**: Automated privacy compliance reporting

### **Performance Characteristics**

#### **Computational Complexity**
- **Laplace**: O(1) - Constant time noise generation
- **Gaussian**: O(1) - Constant time noise generation
- **Sensitivity Analysis**: O(n) - Linear in data size
- **Budget Management**: O(1) - Constant time database operations

#### **Scalability**
- **Horizontal Scaling**: Stateless service design
- **Database Optimization**: Indexed queries for budget operations
- **Caching**: Budget status caching for frequent checks

### **Integration Points**

#### **Training Service Integration**
```javascript
// backend/services/trainingService.js
async trainModelWithDP(trainingData, privacyParams) {
  const dpService = new DifferentialPrivacyService();
  
  // Apply DP to gradients
  const noisyGradients = await dpService.applyDifferentialPrivacy(
    trainingData.gradients,
    { type: 'GRADIENT' },
    privacyParams
  );
  
  // Continue training with noisy gradients
  return this.trainModel(noisyGradients);
}
```

#### **Contract Service Integration**
```javascript
// backend/services/contractService.js
async applyDPToContractData(contractId, data, query, privacyParams) {
  const dpService = new DifferentialPrivacyService();
  
  // Apply DP to contract-related data
  return await dpService.applyDifferentialPrivacy(
    data,
    query,
    { ...privacyParams, contractId }
  );
}
```

### **Monitoring and Analytics**

#### **Privacy Metrics Dashboard**
- **Budget Utilization**: Real-time budget consumption
- **Operation Success Rate**: Success/failure statistics
- **Performance Metrics**: Execution time analysis
- **Mechanism Usage**: Distribution of mechanism selection

#### **Alerting System**
- **Budget Warnings**: Low budget notifications
- **Performance Alerts**: Slow operation detection
- **Error Monitoring**: Failed operation tracking

### **Future Enhancements**

#### **Advanced Mechanisms**
- **Rényi Differential Privacy**: More flexible privacy definitions
- **Local Differential Privacy**: Client-side privacy
- **Federated Learning**: Distributed privacy-preserving training

#### **Automated Optimization**
- **Parameter Tuning**: ML-based epsilon/delta optimization
- **Mechanism Selection**: Automatic mechanism recommendation
- **Budget Planning**: Predictive budget allocation

## 🛡️ Security Architecture

### **Security Layers**

#### **Network Security**
- **HTTPS**: All communications encrypted
- **CORS**: Cross-origin resource sharing control
- **Rate Limiting**: API rate limiting
- **DDoS Protection**: Distributed denial-of-service protection

#### **Application Security**
- **Input Validation**: All inputs validated
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Cross-site scripting protection
- **CSRF Protection**: Cross-site request forgery protection

#### **Data Security**
- **Encryption at Rest**: Database encryption
- **Encryption in Transit**: TLS/SSL encryption
- **Data Masking**: Sensitive data masking
- **Audit Logging**: Comprehensive audit trails

### **Authentication Security**
- **Multi-Factor Authentication**: MFA support
- **Password Policies**: Strong password requirements
- **Session Management**: Secure session handling
- **Token Security**: JWT token security

### **Authorization Security**
- **Role-Based Access Control**: RBAC implementation
- **Permission Granularity**: Fine-grained permissions
- **Resource-Level Security**: Resource-specific access
- **Audit Logging**: Authorization audit trails

## 🚀 Deployment Architecture

### **Development Environment**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Keycloak      │
│   (Port 3000)   │◄──►│   (Port 5001)   │◄──►│   (Port 8080)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │   (Port 5432)   │
                       └─────────────────┘
```

### **Production Environment**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Application   │    │   Database      │
│   (Nginx)       │◄──►│   (Docker)      │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Keycloak      │
                       │   (IAM)         │
                       └─────────────────┘
```

### **Container Architecture**
```yaml
# docker-compose.production.yml
version: '3.8'
services:
  frontend:
    image: contract-management-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
  
  backend:
    image: contract-management-backend
    ports:
      - "5001:5001"
    environment:
      - NODE_ENV=production
    depends_on:
      - ***REMOVED-DB_PASSWORD***
      - ***REMOVED-KEYCLOAK_DB_PASSWORD***
  
  ***REMOVED-DB_PASSWORD***:
    image: ***REMOVED-DB_PASSWORD***:13
    environment:
      - POSTGRES_DB=contract_management
      - POSTGRES_USER=***REMOVED-DB_PASSWORD***
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - ***REMOVED-DB_PASSWORD***_data:/var/lib/***REMOVED-DB_PASSWORD***ql/data
  
  ***REMOVED-KEYCLOAK_DB_PASSWORD***:
    image: quay.io/***REMOVED-KEYCLOAK_DB_PASSWORD***/***REMOVED-KEYCLOAK_DB_PASSWORD***:latest
    ports:
      - "8080:8080"
    environment:
      - KEYCLOAK_ADMIN=admin
      - KEYCLOAK_ADMIN_PASSWORD=secure_password
    volumes:
      - ***REMOVED-KEYCLOAK_DB_PASSWORD***_data:/opt/***REMOVED-KEYCLOAK_DB_PASSWORD***/data

volumes:
  ***REMOVED-DB_PASSWORD***_data:
  ***REMOVED-KEYCLOAK_DB_PASSWORD***_data:
```

### **Scaling Strategy**
- **Horizontal Scaling**: Multiple application instances
- **Load Balancing**: Nginx load balancer
- **Database Scaling**: Read replicas
- **Caching**: Redis for session storage
- **CDN**: Static asset delivery

## 📊 Performance Architecture

### **Performance Optimization**
- **Database Indexing**: Optimized query performance
- **Caching Strategy**: Multi-level caching
- **CDN Integration**: Static asset delivery
- **API Optimization**: Efficient API design
- **Frontend Optimization**: Code splitting and lazy loading

### **Monitoring and Observability**
- **Application Monitoring**: Performance metrics
- **Database Monitoring**: Query performance
- **Infrastructure Monitoring**: System resources
- **Error Tracking**: Comprehensive error logging
- **User Analytics**: Usage analytics

## 📚 Related Documentation

- **[Quick Start](QUICK_START.md)** - Get started in 5 minutes
- **[Setup Guide](SETUP.md)** - Complete installation and configuration
- **[User Guide](USER_GUIDE.md)** - How to use the system
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Development workflows
- **[API Reference](API_REFERENCE.md)** - Technical API documentation
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

---

*This architecture guide consolidates information from multiple technical and design documents.* 