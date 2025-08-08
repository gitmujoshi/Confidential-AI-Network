# 🏗️ System Architecture

Complete technical architecture documentation for the Contract Management System. This guide consolidates all architecture and technical design information.

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Components](#architecture-components)
3. [Authentication & Authorization](#authentication--authorization)
4. [Database Design](#database-design)
5. [API Architecture](#api-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Blockchain Integration](#blockchain-integration)
8. [Secret Management](#secret-management)
9. [Security Architecture](#security-architecture)
10. [Deployment Architecture](#deployment-architecture)

## 🎯 System Overview

### **High-Level Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Keycloak      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (IAM)         │
│   Port: 3000    │    │   Port: 5001    │    │   Port: 8080    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │   Port: 5432    │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Blockchain    │
                       │   (Ethereum)    │
                       └─────────────────┘
```

### **System Components**
- **Frontend**: React.js with Material-UI
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: Keycloak IAM
- **Blockchain**: Ethereum with Hardhat
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
├── models/                  # Database models
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

### **Database Layer**
```
Database Schema:
├── users                    # User accounts and profiles
├── contracts               # Contract management
├── datasets                # Dataset information
├── ai_models              # AI model metadata
├── ccrp_cloud_credentials # Cloud provider credentials
├── audit_logs             # System audit trail
└── blockchain_contracts   # Blockchain contract data
```

**Key Features**:
- **Relational Design**: Normalized database schema
- **Data Integrity**: Foreign key constraints
- **Audit Trail**: Comprehensive logging
- **Performance**: Optimized indexes
- **Scalability**: Horizontal scaling support

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