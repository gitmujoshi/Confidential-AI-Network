# System Architecture Diagram
## Secure Contract Management System

## System Overview

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
    F --> J
    J --> K
    K --> L
    L --> V
    K --> Q
    K --> R
    K --> S
    K --> T
    V --> W
```

## Data Flow Architecture

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

## User Roles and Permissions

```mermaid
graph TD
    subgraph "User Roles"
        TDP[TDP - Training Data Provider<br/>Dataset Owner]
        TDC[TDC - Training Data Consumer<br/>Contract Initiator]
        CCRP[CCRP - Confidential Clean Room Provider<br/>Compliance Checker]
    end
    
    subgraph "TDP Permissions"
        TDP1[Create Datasets]
        TDP2[Manage Own Datasets]
        TDP3[Initiate Contracts]
        TDP4[Auto-sign Contracts]
        TDP5[View Contract History]
    end
    
    subgraph "TDC Permissions"
        TDC1[Browse Datasets]
        TDC2[Select CCRP]
        TDC3[Create Contracts]
        TDC4[Sign Contracts]
        TDC5[Access Purchased Data]
    end
    
    subgraph "CCRP Permissions"
        CCRP1[Review Contracts]
        CCRP2[Validate Compliance]
        CCRP3[Sign Contracts]
        CCRP4[Provide Oversight]
        CCRP5[Maintain Audit Trail]
    end
    
    TDP --> TDP1
    TDP --> TDP2
    TDP --> TDP3
    TDP --> TDP4
    TDP --> TDP5
    
    TDC --> TDC1
    TDC --> TDC2
    TDC --> TDC3
    TDC --> TDC4
    TDC --> TDC5
    
    CCRP --> CCRP1
    CCRP --> CCRP2
    CCRP --> CCRP3
    CCRP --> CCRP4
    CCRP --> CCRP5
```

## Security Architecture

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

## Contract Workflow

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

## Database Schema

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

## API Endpoints

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

## Deployment Architecture

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

## Technology Stack

```mermaid
graph TB
    subgraph "Frontend"
        F1[React 18]
        F2[React Router]
        F3[Material-UI]
        F4[React Query]
        F5[Ethers.js]
        F6[Axios]
    end
    
    subgraph "Backend"
        B1[Node.js]
        B2[Express.js]
        B3[Sequelize ORM]
        B4[JWT Authentication]
        B5[Helmet Security]
        B6[CORS]
    end
    
    subgraph "Database"
        DB1[PostgreSQL]
        DB2[Sequelize]
        DB3[Database Migrations]
    end
    
    subgraph "Blockchain"
        BC1[Hardhat]
        BC2[Solidity]
        BC3[Ethers.js]
        BC4[Web3.js]
    end
    
    subgraph "Development Tools"
        DT1[Git]
        DT2[Docker]
        DT3[Jest Testing]
        DT4[ESLint]
        DT5[Prettier]
    end
    
    F1 --> F2
    F2 --> F3
    F3 --> F4
    F4 --> F5
    F5 --> F6
    
    B1 --> B2
    B2 --> B3
    B3 --> B4
    B4 --> B5
    B5 --> B6
    
    DB1 --> DB2
    DB2 --> DB3
    
    BC1 --> BC2
    BC2 --> BC3
    BC3 --> BC4
    
    DT1 --> DT2
    DT2 --> DT3
    DT3 --> DT4
    DT4 --> DT5
``` 