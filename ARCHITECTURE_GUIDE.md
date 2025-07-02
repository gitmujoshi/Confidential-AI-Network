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
- **Secure Private Key Management**: Client-side signing with private keys never transmitted
- **Blockchain Immutability**: All contracts stored on Ethereum-compatible blockchain
- **Multi-Party Workflow**: Sequential signing process with role-based permissions
- **User Onboarding**: Multi-step registration with email verification
- **Real-time Notifications**: Email and in-app notifications for contract events
- **Comprehensive Audit Trail**: Complete history of all contract actions
- **Profile Management**: Enhanced user profiles with organization details

## 🏛️ System Architecture

### High-Level Architecture
```mermaid
graph TB
    subgraph "Frontend Layer (React)"
        A[Dashboard] --> B[Contracts]
        B --> C[Datasets]
        C --> D[Users]
        D --> E[Notifications]
        
        subgraph "Client Services"
            F[API Service]
            G[Ethers.js]
            H[React Query]
            I[State Management]
            ONB[Onboarding UI]
        end
    end
    
    subgraph "Backend Layer (Node.js/Express)"
        J[API Routes]
        K[Business Logic]
        L[Blockchain Service]
        
        subgraph "Services"
            M[Contract Service]
            N[Dataset Service]
            O[User Service]
            P[Notification Service]
            IAM[Keycloak Service]
        end
    end
    
    subgraph "IAM Layer (Keycloak)"
        KC[Keycloak Server]
        AUTH[Authentication]
        RBAC[Role-Based Access]
        EMAIL[Email Verification]
        
        subgraph "IAM Database"
            IAM_DB[Keycloak PostgreSQL]
        end
    end
    
    subgraph "Data Layer (PostgreSQL)"
        Q[Users Table]
        R[Contracts Table]
        S[Datasets Table]
        T[Notifications Table]
        U[Metadata Table]
    end
    
    subgraph "Blockchain Layer (Hardhat/Ethereum)"
        V[Smart Contracts]
        W[Network Layer]
        
        subgraph "ContractManager.sol"
            X[Contract State]
            Y[Party Management]
            Z[Signing Logic]
            AA[Access Control]
        end
    end
    
    A --> F
    ONB --> IAM
    F --> J
    J --> K
    K --> L
    K --> IAM
    IAM --> KC
    KC --> AUTH
    KC --> RBAC
    KC --> EMAIL
    KC --> IAM_DB
    L --> V
    K --> Q
    K --> R
    K --> S
    K --> T
    V --> W
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

### Complete Data Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant D as Database
    participant BC as Blockchain
    
    U->>F: 1. Connect Wallet
    F->>B: 2. Authenticate User
    B->>D: 3. Query User Data
    D-->>B: 4. Return User Info
    B-->>F: 5. User Authenticated
    
    U->>F: 6. Create Contract
    F->>B: 7. Submit Contract Data
    B->>D: 8. Store Contract
    B->>BC: 9. Deploy Smart Contract
    BC-->>B: 10. Contract Address
    B->>D: 11. Update Contract ID
    B-->>F: 12. Contract Created
    
    U->>F: 13. Sign Contract
    F->>F: 14. Sign with Wallet
    F->>B: 15. Send Signed Transaction
    B->>BC: 16. Broadcast Transaction
    BC-->>B: 17. Transaction Receipt
    B->>D: 18. Update Contract Status
    B-->>F: 19. Contract Signed
    F-->>U: 20. Success Notification
```

### User Authentication Flow
```mermaid
sequenceDiagram
    participant U as User
    participant W as Wallet
    participant C as UserContext
    participant A as API
    participant B as Blockchain
    
    U->>W: Connect MetaMask
    W->>C: Wallet Connected
    C->>A: Get User by Wallet
    A->>B: Verify Address
    B->>A: Address Valid
    A->>C: User Data
    C->>U: Role-Based UI
```

## 🔐 Security Architecture

### Multi-Layer Security Model
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
