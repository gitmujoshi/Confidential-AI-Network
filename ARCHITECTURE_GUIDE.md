# Architecture Guide

## Contract Management System

Complete technical architecture and design documentation for the Contract Management System.

## 🏗️ System Overview

The Contract Management System is a blockchain-based platform that enables secure, transparent, and legally binding contract creation and management between three parties:
- **TDP (Training Data Provider)**: Dataset owners who provide data
- **TDC (Training Data Consumer)**: Organizations that purchase and use data
- **CCRP (Confidential Clean Room Provider)**: Independent reviewers who validate contracts

### Key Features
- **Enterprise IAM Integration**: Keycloak-based identity and access management
- **DID Support**: Decentralized Identifiers for self-sovereign identity
- **Secure Private Key Management**: Client-side signing with private keys never transmitted
- **Blockchain Immutability**: All contracts stored on Ethereum-compatible blockchain
- **Multi-Party Workflow**: Sequential signing process with role-based permissions
- **User Onboarding**: Multi-step registration with email verification
- **Real-time Notifications**: Email and in-app notifications for contract events
- **Comprehensive Audit Trail**: Complete history of all contract actions
- **Profile Management**: Enhanced user profiles with organization details

## 🏛️ System Architecture

## 🏗️ System Architecture Overview

The Contract Management System follows a **layered architecture** with clear separation of concerns. Here's the high-level overview:

### System Layers
```mermaid
graph TB
    subgraph "Presentation Layer"
        FE[Frontend React App]
    end
    
    subgraph "Application Layer"
        BE[Backend API Services]
    end
    
    subgraph "Identity Layer"
        IAM[Keycloak IAM]
        DID[DID Management]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL Database)]
        BC[(Blockchain Network)]
    end
    
    FE --> BE
    BE --> IAM
    BE --> DID
    BE --> DB
    BE --> BC
    
    style FE fill:#e3f2fd
    style BE fill:#f3e5f5
    style IAM fill:#ffebee
    style DID fill:#fff3e0
    style DB fill:#e8f5e8
    style BC fill:#fff8e1
```

## 📱 Frontend Architecture

### React Application Structure
```mermaid
graph TB
    subgraph "User Interface Components"
        A[Dashboard] --> B[Contracts]
        B --> C[Datasets]
        C --> D[Users]
        D --> E[Notifications]
        A --> F[Onboarding]
    end
    
    subgraph "Client Services"
        G[API Service]
        H[Ethers.js]
        I[React Query]
        J[State Management]
    end
    
    subgraph "Authentication"
        K[Wallet Connection]
        L[IAM Integration]
        M[Role Management]
    end
    
    A --> G
    G --> H
    G --> I
    G --> J
    K --> L
    L --> M
    
    style A fill:#e3f2fd
    style G fill:#f3e5f5
    style K fill:#ffebee
```

## 🔧 Backend Architecture

### API Services Structure
```mermaid
graph TB
    subgraph "API Gateway"
        API[Express Router]
    end
    
    subgraph "Business Logic Services"
        CS[Contract Service]
        DS[Dataset Service]
        US[User Service]
        NS[Notification Service]
        IAM_S[Keycloak Service]
    end
    
    subgraph "External Integrations"
        BC_S[Blockchain Service]
        DID_S[DID Service]
    end
    
    API --> CS
    API --> DS
    API --> US
    API --> NS
    API --> IAM_S
    CS --> BC_S
    US --> DID_S
    
    style API fill:#f3e5f5
    style CS fill:#e8f5e8
    style BC_S fill:#fff3e0
```

## 🔐 Identity & Access Management

### IAM Architecture
```mermaid
graph TB
    subgraph "Keycloak IAM"
        KC[Keycloak Server]
        AUTH[Authentication]
        RBAC[Role-Based Access]
        EMAIL[Email Verification]
    end
    
    subgraph "DID Management"
        DID[DID Registry]
        DID_RES[DID Resolution]
        DID_VER[DID Verification]
        DID_DOC[DID Documents]
    end
    
    subgraph "IAM Database"
        IAM_DB[(Keycloak PostgreSQL)]
    end
    
    KC --> AUTH
    KC --> RBAC
    KC --> EMAIL
    KC --> IAM_DB
    
    DID --> DID_RES
    DID --> DID_VER
    DID --> DID_DOC
    
    style KC fill:#ffebee
    style DID fill:#fff3e0
    style IAM_DB fill:#e8f5e8
```

## 💾 Data Architecture

### Database Schema
```mermaid
graph TB
    subgraph "Core Entities"
        U[Users Table]
        C[Contracts Table]
        D[Datasets Table]
        N[Notifications Table]
    end
    
    subgraph "IAM Integration"
        UI[IAM User Fields]
        UI2[Onboarding Status]
        UI3[Profile Data]
    end
    
    subgraph "DID Support"
        UD[DID Field]
        UPK[Public Key Field]
    end
    
    U --> UI
    U --> UI2
    U --> UI3
    U --> UD
    U --> UPK
    
    U --> C
    U --> D
    U --> N
    
    style U fill:#e8f5e8
    style UI fill:#ffebee
    style UD fill:#fff3e0
```

## ⛓️ Blockchain Architecture

### Smart Contract Structure
```mermaid
graph TB
    subgraph "ContractManager.sol"
        CM[Contract Manager]
        CS[Contract State]
        PM[Party Management]
        SL[Signing Logic]
        AC[Access Control]
    end
    
    subgraph "Blockchain Network"
        BC[Hardhat Node]
        TX[Transactions]
        EV[Events]
    end
    
    CM --> CS
    CM --> PM
    CM --> SL
    CM --> AC
    
    CM --> BC
    BC --> TX
    BC --> EV
    
    style CM fill:#fff3e0
    style BC fill:#fff8e1
```

### Technology Stack
```mermaid
graph TB
    subgraph "Frontend Layer"
        subgraph "UI Framework"
            F1[React 18]
            F2[React Router]
            F3[Material-UI]
        end
        
        subgraph "State & Data"
            F4[React Query]
            F5[Ethers.js]
            F6[Axios]
        end
    end
    
    subgraph "Backend Layer"
        subgraph "Runtime & Framework"
            B1[Node.js]
            B2[Express.js]
        end
        
        subgraph "Data & Security"
            B3[Sequelize ORM]
            B4[Keycloak IAM]
            B5[JWT Authentication]
            B6[Helmet Security]
            B7[CORS]
        end
    end
    
    subgraph "Database Layer"
        subgraph "Storage"
            DB1[PostgreSQL]
        end
        
        subgraph "ORM & Migrations"
            DB2[Sequelize]
            DB3[Database Migrations]
        end
    end
    
    subgraph "Blockchain Layer"
        subgraph "Development"
            BC1[Hardhat]
            BC2[Solidity]
        end
        
        subgraph "Web3 Libraries"
            BC3[Ethers.js]
            BC4[Web3.js]
        end
    end
    
    subgraph "Development Tools"
        subgraph "Version Control"
            DT1[Git]
        end
        
        subgraph "Containerization"
            DT2[Docker]
        end
        
        subgraph "Testing & Quality"
            DT3[Jest Testing]
            DT4[ESLint]
            DT5[Prettier]
        end
    end
    
    %% Frontend connections
    F1 --> F2
    F2 --> F3
    F3 --> F4
    F4 --> F5
    F5 --> F6
    
    %% Backend connections
    B1 --> B2
    B2 --> B3
    B3 --> B4
    B4 --> B5
    B5 --> B6
    B6 --> B7
    
    %% Database connections
    DB1 --> DB2
    DB2 --> DB3
    
    %% Blockchain connections
    BC1 --> BC2
    BC2 --> BC3
    BC3 --> BC4
    
    %% Development tools connections
    DT1 --> DT2
    DT2 --> DT3
    DT3 --> DT4
    DT4 --> DT5
    
    %% Cross-layer connections
    F5 --> BC3
    B3 --> DB2
    B2 --> BC1
```

## 🔄 Data Flow Architecture

### User Registration Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant IAM as Keycloak
    participant DID as DID Registry
    participant DB as Database
    
    U->>F: Connect Wallet
    F->>B: Register User
    B->>IAM: Create IAM User
    IAM->>B: User Created
    B->>DID: Create DID
    DID->>B: DID Created
    B->>DB: Store User Data
    DB->>B: User Stored
    B->>F: Registration Complete
    F->>U: Success
```

### Contract Creation Flow
```mermaid
sequenceDiagram
    participant TDC as TDC User
    participant F as Frontend
    participant B as Backend
    participant IAM as Keycloak
    participant BC as Blockchain
    participant DB as Database
    
    TDC->>F: Create Contract
    F->>B: Contract Request
    B->>IAM: Verify JWT Token
    IAM->>B: Token Valid
    B->>BC: Deploy Contract
    BC->>B: Contract Deployed
    B->>DB: Store Contract Data
    DB->>B: Contract Stored
    B->>F: Contract Created
    F->>TDC: Success
```

### Contract Signing Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DID as DID Registry
    participant BC as Blockchain
    participant DB as Database
    
    U->>F: Sign Contract
    F->>B: Sign Request
    B->>DID: Verify DID
    DID->>B: DID Verified
    B->>BC: Submit Signature
    BC->>B: Signature Confirmed
    B->>DB: Update Contract Status
    DB->>B: Status Updated
    B->>F: Contract Signed
    F->>U: Success
```

### Component Interaction Overview
```mermaid
graph TB
    subgraph "User Interface"
        UI[React Components]
        WC[Wallet Connection]
        RB[Role-Based UI]
    end
    
    subgraph "Application Services"
        API[API Gateway]
        AUTH[Authentication]
        BL[Business Logic]
    end
    
    subgraph "External Systems"
        IAM[Keycloak IAM]
        DID[DID Registry]
        BC[Blockchain]
        DB[Database]
    end
    
    UI --> API
    WC --> AUTH
    RB --> BL
    
    API --> AUTH
    API --> BL
    
    AUTH --> IAM
    BL --> DID
    BL --> BC
    BL --> DB
    
    style UI fill:#e3f2fd
    style API fill:#f3e5f5
    style IAM fill:#ffebee
    style DID fill:#fff3e0
    style BC fill:#fff8e1
    style DB fill:#e8f5e8
```

## 🎯 Architecture Summary

### Key Design Principles
- **Separation of Concerns**: Each layer has a specific responsibility
- **Modularity**: Components can be developed and tested independently
- **Scalability**: Services can be scaled horizontally
- **Security**: Multi-layer security with IAM and DID integration
- **Interoperability**: Standards-based integration (OAuth2, OpenID Connect, DID)

### Technology Stack by Layer
```mermaid
graph TB
    subgraph "Frontend Layer"
        F1[React 18]
        F2[Material-UI]
        F3[Ethers.js]
        F4[React Query]
    end
    
    subgraph "Backend Layer"
        B1[Node.js]
        B2[Express.js]
        B3[Sequelize ORM]
        B4[JWT Authentication]
    end
    
    subgraph "Identity Layer"
        I1[Keycloak IAM]
        I2[OAuth2/OpenID Connect]
        I3[DID Registry]
        I4[DID Resolution]
    end
    
    subgraph "Data Layer"
        D1[PostgreSQL]
        D2[Keycloak Database]
        D3[Blockchain Storage]
    end
    
    subgraph "Blockchain Layer"
        BC1[Hardhat]
        BC2[Solidity]
        BC3[Ethereum Network]
    end
    
    F1 --> B1
    B1 --> I1
    B1 --> I3
    B1 --> D1
    B1 --> BC1
    
    style F1 fill:#e3f2fd
    style B1 fill:#f3e5f5
    style I1 fill:#ffebee
    style D1 fill:#e8f5e8
    style BC1 fill:#fff8e1
```

## 🔐 Security Architecture
```mermaid
graph TB
    subgraph "Security Layers"
        subgraph "Client-Side Security"
            CS1[Private Keys Never Transmitted]
            CS2[Cryptographic Operations in Browser]
            CS3[Memory Cleared After Signing]
            CS4[Input Validation & Sanitization]
            CS5[HTTPS Encryption]
        end
        
        subgraph "Network Security"
            NS1[HTTPS/TLS Encryption]
            NS2[Rate Limiting]
            NS3[CORS Configuration]
            NS4[Request Validation]
            NS5[DDoS Protection]
        end
        
        subgraph "Application Security"
            AS1[Authentication & Authorization]
            AS2[Input Validation]
            AS3[SQL Injection Prevention]
            AS4[XSS Protection]
            AS5[CSRF Protection]
        end
        
        subgraph "Blockchain Security"
            BS1[Smart Contract Auditing]
            BS2[Access Control Modifiers]
            BS3[Reentrancy Protection]
            BS4[Integer Overflow Protection]
            BS5[Event Logging]
        end
    end
    
    CS1 --> NS1
    NS1 --> AS1
    AS1 --> BS1
```

### Secure Signing Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant BC as Blockchain
    
    U->>F: 1. Enter Private Key
    F->>F: 2. Create Transaction
    F->>F: 3. Sign Locally with Ethers
    F->>B: 4. Send Signed Transaction
    B->>BC: 5. Validate & Broadcast
    BC->>BC: 6. Mine Block
    BC-->>B: 7. Return Receipt
    B-->>F: 8. Update UI with Status
    F-->>U: 9. Show Success Message
```

## 📊 Database Schema

### Entity Relationship Diagram
```mermaid
erDiagram
    USERS {
        int id PK
        string wallet_address UK
        text public_key
        enum party_type
        string name
        string email UK
        text description
        boolean is_registered
        datetime registration_date
        boolean is_active
        datetime created_at
        datetime updated_at
    }
    
    DATASETS {
        int id PK
        string name
        text description
        string category
        decimal price
        int owner_id FK
        boolean is_public
        datetime created_at
        datetime updated_at
    }
    
    CONTRACTS {
        int id PK
        string blockchain_id
        string status
        decimal price
        int tdp_id FK
        int tdc_id FK
        int ccrp_id FK
        int dataset_id FK
        json signing_status
        datetime created_at
        datetime updated_at
    }
    
    NOTIFICATIONS {
        int id PK
        enum type
        string title
        text message
        boolean is_read
        json metadata
        int user_id FK
        datetime created_at
        datetime updated_at
    }
    
    USERS ||--o{ DATASETS : "owns"
    USERS ||--o{ CONTRACTS : "tdp_contracts"
    USERS ||--o{ CONTRACTS : "tdc_contracts"
    USERS ||--o{ CONTRACTS : "ccrp_contracts"
    USERS ||--o{ NOTIFICATIONS : "receives"
    DATASETS ||--o{ CONTRACTS : "included_in"
```

## 🔗 API Endpoints

### RESTful API Structure
```mermaid
graph LR
    subgraph "Authentication"
        A1[POST /api/auth/register]
        A2[POST /api/auth/login]
        A3[GET /api/auth/profile]
    end
    
    subgraph "Contracts"
        C1[GET /api/contracts]
        C2[POST /api/contracts]
        C3[GET /api/contracts/:id]
        C4[POST /api/contracts/:id/sign]
        C5[PUT /api/contracts/:id]
    end
    
    subgraph "Datasets"
        D1[GET /api/datasets]
        D2[POST /api/datasets]
        D3[GET /api/datasets/:id]
        D4[PUT /api/datasets/:id]
        D5[DELETE /api/datasets/:id]
    end
    
    subgraph "Users"
        U1[GET /api/users]
        U2[GET /api/users/:id]
        U3[PUT /api/users/:id]
        U4[POST /api/users/register-party]
    end
    
    subgraph "Notifications"
        N1[GET /api/notifications]
        N2[PUT /api/notifications/:id/read]
        N3[GET /api/notifications/unread-count]
    end
    
    subgraph "Blockchain"
        B1[GET /api/blockchain/status]
        B2[POST /api/blockchain/register-party]
        B3[GET /api/blockchain/contract/:id]
    end
```

## ⚡ Smart Contract Architecture

### ContractManager.sol Structure
```mermaid
graph TB
    subgraph "Smart Contract Components"
        subgraph "Contract State"
            CS1[contractId]
            CS2[parties]
            CS3[terms]
            CS4[status]
            CS5[price]
        end
        
        subgraph "Party Management"
            PM1[registerParty]
            PM2[isRegistered]
            PM3[partyTypes]
            PM4[permissions]
            PM5[roles]
        end
        
        subgraph "Signing Logic"
            SL1[signContract]
            SL2[complete]
            SL3[cancel]
            SL4[signatures]
            SL5[timestamps]
        end
        
        subgraph "Access Control"
            AC1[onlyOwner]
            AC2[onlyParty]
            AC3[onlyContract]
            AC4[modifiers]
            AC5[validations]
        end
    end
    
    CS1 --> PM1
    CS2 --> SL1
    CS3 --> AC1
    CS4 --> SL2
    CS5 --> PM2
```

### Contract Workflow States
```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> PendingTDP: TDC Creates Contract
    PendingTDP --> PendingCCRP: TDP Auto-signs
    PendingCCRP --> PendingTDC: CCRP Signs
    PendingTDC --> Active: TDC Signs
    Active --> Completed: Contract Executed
    Active --> Cancelled: Any Party Cancels
    Completed --> [*]
    Cancelled --> [*]
    
    note right of Draft
        Contract created by TDC
        with dataset and CCRP selected
    end note
    
    note right of PendingTDP
        TDP automatically signs
        when contract is created
    end note
    
    note right of PendingCCRP
        CCRP reviews and signs
        for compliance validation
    end note
    
    note right of PendingTDC
        TDC finalizes contract
        by signing
    end note
    
    note right of Active
        All parties signed
        Contract is legally binding
    end note
```

## 🚀 Deployment Architecture

### Development Environment
```mermaid
graph TB
    subgraph "Development Environment"
        subgraph "Local Development"
            LD1[Hardhat Node<br/>localhost:8545]
            LD2[Backend Server<br/>localhost:5001]
            LD3[Frontend App<br/>localhost:3000]
            LD4[PostgreSQL<br/>localhost:5432]
        end
    end
    
    subgraph "Production Environment"
        subgraph "Frontend"
            PF1[React Build]
            PF2[Static Files]
            PF3[CDN]
        end
        
        subgraph "Backend"
            PB1[Node.js App]
            PB2[Load Balancer]
            PB3[API Gateway]
        end
        
        subgraph "Database"
            PD1[PostgreSQL Primary]
            PD2[PostgreSQL Replica]
            PD3[Backup Storage]
        end
        
        subgraph "Blockchain"
            PBC1[Ethereum Network]
            PBC2[Smart Contracts]
            PBC3[Transaction Monitoring]
        end
    end
    
    LD1 --> LD2
    LD2 --> LD3
    LD2 --> LD4
    
    PF1 --> PF2
    PF2 --> PF3
    PB1 --> PB2
    PB2 --> PB3
    PB1 --> PD1
    PD1 --> PD2
    PD2 --> PD3
    PB1 --> PBC1
    PBC1 --> PBC2
    PBC2 --> PBC3
```

## 🔧 Implementation Details

### Frontend Architecture

#### Component Structure
```
frontend/src/
├── components/
│   ├── Layout.js              # Main layout with navigation
│   ├── WalletSwitcher.js      # Wallet switching dialog
│   └── MetaMaskGuide.js       # MetaMask setup guide
├── contexts/
│   └── UserContext.js         # User authentication and state
├── pages/
│   ├── Dashboard.js           # Role-based dashboard
│   ├── Contracts.js           # Contract management
│   ├── CreateContract.js      # Contract creation (TDC only)
│   ├── Datasets.js            # Dataset browsing
│   ├── Users.js               # User management
│   └── Notifications.js       # Notification center
└── services/
    └── api.js                 # API client with authentication
```

#### State Management
- **React Context**: User authentication and wallet state
- **React Query**: Server state management and caching
- **Local State**: Form state and UI interactions

### Backend Architecture

#### Service Layer
```
backend/
├── routes/
│   ├── contracts.js           # Contract CRUD operations
│   ├── datasets.js            # Dataset management
│   ├── users.js               # User registration and management
│   └── notifications.js       # Notification system
├── services/
│   ├── blockchainService.js   # Smart contract interactions
│   └── notificationService.js # Email and in-app notifications
├── models/
│   ├── User.js                # User model with role-based fields
│   ├── Contract.js            # Contract model with relationships
│   ├── Dataset.js             # Dataset model
│   └── Notification.js        # Notification model
└── middleware/
    ├── auth.js                # JWT authentication
    └── validation.js          # Request validation
```

#### Database Design
- **Sequelize ORM**: Database abstraction and migrations
- **PostgreSQL**: Primary database with ACID compliance
- **Indexes**: Optimized for wallet address and role queries
- **Relationships**: Foreign key constraints for data integrity

### Blockchain Integration

#### Smart Contract Design
```solidity
// Key features of ContractManager.sol
contract ContractManager {
    // Party registration
    mapping(address => bool) public isRegistered;
    mapping(address => PartyType) public partyTypes;
    
    // Contract management
    mapping(uint256 => Contract) public contracts;
    mapping(uint256 => mapping(address => bool)) public signatures;
    
    // Events for frontend updates
    event ContractCreated(uint256 contractId, address tdc, address tdp);
    event ContractSigned(uint256 contractId, address signer);
    event ContractCompleted(uint256 contractId);
}
```

#### Transaction Flow
1. **Contract Creation**: TDC creates contract, TDP auto-signs
2. **CCRP Review**: CCRP reviews and signs (if selected)
3. **TDC Finalization**: TDC signs to complete contract
4. **State Updates**: Contract status updated on blockchain
5. **Event Emission**: Frontend notified of state changes

## 🔍 Performance Considerations

### Frontend Optimization
- **Code Splitting**: Lazy loading of components
- **React Query**: Intelligent caching and background updates
- **Material-UI**: Optimized component library
- **Bundle Analysis**: Webpack bundle optimization

### Backend Optimization
- **Database Indexing**: Optimized queries for wallet lookups
- **Connection Pooling**: Efficient database connections
- **Caching**: Redis for frequently accessed data
- **Rate Limiting**: API protection against abuse

### Blockchain Optimization
- **Gas Optimization**: Efficient smart contract design
- **Batch Operations**: Grouped transactions where possible
- **Event Filtering**: Efficient event listening
- **Nonce Management**: Proper transaction ordering

## 🔒 Security Considerations

### Smart Contract Security
- **Access Control**: Role-based modifiers
- **Reentrancy Protection**: Secure state management
- **Integer Overflow**: Safe math operations
- **Event Logging**: Complete audit trail

### Application Security
- **Input Validation**: Comprehensive data validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content security policies
- **CSRF Protection**: Token-based protection

### Network Security
- **HTTPS/TLS**: Encrypted communications
- **CORS Configuration**: Controlled cross-origin access
- **Rate Limiting**: Protection against abuse
- **DDoS Protection**: Infrastructure-level protection

## 📈 Scalability Considerations

### Horizontal Scaling
- **Load Balancing**: Multiple backend instances
- **Database Sharding**: Partitioned data storage
- **CDN**: Static asset distribution
- **Microservices**: Service decomposition

### Vertical Scaling
- **Resource Optimization**: Efficient resource usage
- **Caching Strategies**: Multi-level caching
- **Database Optimization**: Query optimization
- **Blockchain Scaling**: Layer 2 solutions

## 🧪 Testing Strategy

### Unit Testing
- **Frontend**: Component and hook testing
- **Backend**: Service and route testing
- **Smart Contracts**: Contract function testing

### Integration Testing
- **API Testing**: End-to-end API testing
- **Blockchain Integration**: Smart contract integration
- **Database Testing**: Data persistence testing

### End-to-End Testing
- **User Workflows**: Complete user journey testing
- **Role-Based Testing**: Role-specific functionality
- **Cross-Browser Testing**: Browser compatibility

## 📚 Additional Resources

- **Setup Guide**: See [Setup Guide](./SETUP_GUIDE.md) for installation
- **User Guide**: See [User Guide](./USER_GUIDE.md) for usage
- **Wallet Guide**: See [Wallet Guide](./WALLET_GUIDE.md) for MetaMask setup
- **Test Wallets**: See [Test Wallets](./TEST_WALLETS.md) for development accounts

## 🆘 Support

For technical questions:
1. **Review this guide** for architectural details
2. **Check the codebase** for implementation specifics
3. **Create an issue** on GitHub for bugs
4. **Start a discussion** for architectural questions
