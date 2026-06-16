# Contract Signing Architecture Diagram

## System Architecture with SCITT CCF Integration

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Contract Signing UI] --> B[Key Management UI]
        A --> C[Signature Verification UI]
        B --> D[Key Generator]
        B --> E[Key Importer/Exporter]
        C --> F[Signature Display]
    end
    
    subgraph "API Layer"
        G[Signing Service API] --> H[Key Management API]
        G --> I[Verification API]
        H --> J[Key Storage API]
        I --> K[SCITT CCF API]
    end
    
    subgraph "Service Layer"
        L[Signing Service] --> M[Key Management Service]
        L --> N[Crypto Service]
        L --> O[SCITT CCF Service]
        M --> P[Key Storage Service]
        N --> Q[Signature Generation]
        N --> R[Signature Verification]
        O --> S[Claim Submission]
        O --> T[Claim Verification]
    end
    
    subgraph "Storage Layer"
        U[Local Key Storage] --> V[Browser Storage<br/>AES-256-GCM Encrypted]
        U --> W[Hardware Security Module<br/>Future Enhancement]
        X[Database] --> Y[SCITT Claims Table]
        X --> Z[Signing Events Table]
        X --> AA[User Keys Table]
    end
    
    subgraph "SCITT CCF Layer"
        BB[SCITT CCF Ledger] --> CC[Immutable Claims]
        BB --> DD[Provenance Tracking]
        BB --> EE[Receipt Verification]
        FF[CCF Node] --> BB
    end
    
    subgraph "Security Layer"
        GG[Authentication] --> HH[Authorization]
        GG --> II[Audit Logging]
        JJ[Encryption] --> KK[Key Derivation<br/>PBKDF2]
        JJ --> LL[Secure Communication<br/>TLS 1.3]
    end
    
    A --> G
    B --> H
    C --> I
    G --> L
    H --> M
    I --> N
    L --> X
    M --> U
    N --> BB
    O --> BB
    L --> GG
    M --> JJ
```

## Signing Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Signing UI
    participant API as Signing API
    participant KS as Key Service
    participant CS as Crypto Service
    participant DB as Database
    participant SC as SCITT CCF Service
    participant CCF as CCF Ledger
    
    U->>UI: Initiate Contract Signing
    UI->>API: Request Signing Interface
    API->>UI: Return Contract Details
    UI->>U: Display Contract for Review
    U->>UI: Confirm Signing Intent
    UI->>KS: Request Private Key Access
    KS->>U: Prompt for Key Unlock
    U->>KS: Provide Key Unlock Credentials
    KS->>UI: Return Private Key
    UI->>CS: Generate Signature
    CS->>UI: Return Signature
    UI->>API: Submit Signature
    API->>CS: Create Signature Claim
    CS->>API: Return Claim Data
    API->>SC: Submit Signature Claim
    SC->>CCF: Store Immutable Claim
    CCF->>SC: Return Receipt
    SC->>API: Return Claim Receipt
    API->>DB: Store Signature Record
    API->>UI: Return Success Confirmation
    UI->>U: Display Success Message
```

## Key Management Flow

```mermaid
graph TD
    A[User Requests Key Access] --> B{Key Exists?}
    B -->|No| C[Generate New Key]
    B -->|Yes| D{Key Locked?}
    D -->|Yes| E[Prompt for Unlock]
    D -->|No| F[Return Key]
    C --> G[Encrypt Key]
    G --> H[Store Encrypted Key]
    H --> F
    E --> I{Valid Credentials?}
    I -->|Yes| F
    I -->|No| J[Access Denied]
    F --> K[Log Key Access]
    K --> L[Return Key to User]
```

## Security Architecture

```mermaid
graph TB
    subgraph "Authentication Layer"
        A[User Login] --> B[Multi-Factor Auth]
        B --> C[Session Management]
    end
    
    subgraph "Authorization Layer"
        D[Role-Based Access] --> E[Permission Checks]
        E --> F[Resource Access Control]
    end
    
    subgraph "Encryption Layer"
        G[Key Encryption] --> H[AES-256-GCM]
        I[Data Encryption] --> J[TLS 1.3]
        K[Key Derivation] --> L[PBKDF2]
    end
    
    subgraph "Audit Layer"
        M[Access Logging] --> N[Security Events]
        O[Signature Logging] --> P[Audit Trail]
        Q[Compliance Reporting] --> R[Legal Documentation]
    end
    
    A --> D
    D --> G
    G --> M
    M --> Q
```

## Database Schema

```mermaid
erDiagram
    CONTRACTS ||--o{ SCITT_CLAIMS : "has"
    USERS ||--o{ SCITT_CLAIMS : "signs"
    USERS ||--o{ USER_KEYS : "owns"
    SCITT_CLAIMS ||--o{ SIGNING_EVENTS : "generates"
    
    CONTRACTS {
        int id PK
        string contract_id
        string status
        json contract_data
        timestamp created_at
        timestamp updated_at
    }
    
    SCITT_CLAIMS {
        int id PK
        string claim_id UK
        string contract_id
        string claim_type
        json claim_data
        text receipt
        string status
        string provenance_tree_id
        string provenance_root
        timestamp created_at
        timestamp updated_at
    }
    
    USERS {
        int id PK
        string email
        string name
        string party_type
        string depa_id
        boolean is_active
    }
    
    USER_KEYS {
        int id PK
        int user_id FK
        string key_id UK
        string key_type
        text public_key
        string key_status
        timestamp created_at
        timestamp last_used_at
    }
    
    SIGNING_EVENTS {
        int id PK
        int contract_id FK
        int user_id FK
        string event_type
        json event_data
        string ip_address
        string user_agent
        timestamp created_at
    }
```

## Technology Stack

```mermaid
graph LR
    subgraph "Frontend"
        A[React 18] --> B[Material-UI]
        A --> C[Web Crypto API]
        A --> D[React Router]
    end
    
    subgraph "Backend"
        E[Node.js] --> F[Express.js]
        E --> G[Sequelize ORM]
        E --> H[SCITT CCF Service]
        E --> I[Axios HTTP Client]
    end
    
    subgraph "Database"
        J[PostgreSQL] --> K[SCITT Claims Table]
        J --> L[User Keys Table]
        J --> M[Audit Tables]
    end
    
    subgraph "SCITT CCF"
        N[CCF Ledger] --> O[Immutable Claims]
        N --> P[Provenance Tracking]
        Q[CCF Node] --> N
    end
    
    subgraph "Security"
        R[WebCrypto API] --> S[Cryptographic Functions]
        T[JWT] --> U[Token Management]
        V[Helmet.js] --> W[Security Headers]
    end
    
    A --> E
    E --> J
    E --> N
    E --> R
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Load Balancer"
        A[Nginx] --> B[SSL Termination]
    end
    
    subgraph "Application Layer"
        C[Frontend Container] --> D[React App]
        E[Backend Container] --> F[Node.js API]
    end
    
    subgraph "Database Layer"
        G[PostgreSQL Primary] --> H[Read Replicas]
        I[Redis Cache] --> J[Session Storage]
    end
    
    subgraph "SCITT CCF Layer"
        K[CCF Node] --> L[Immutable Ledger]
        M[CCF Backup] --> N[High Availability]
    end
    
    subgraph "Monitoring"
        O[Prometheus] --> P[Grafana]
        Q[ELK Stack] --> R[Log Analysis]
    end
    
    A --> C
    A --> E
    E --> G
    E --> I
    E --> K
    E --> O
    E --> Q
```

## Security Considerations

```mermaid
graph TD
    A[Security Threats] --> B[Key Compromise]
    A --> C[Man-in-the-Middle]
    A --> D[Replay Attacks]
    A --> E[Insider Threats]
    
    B --> F[Hardware Security Modules]
    B --> G[Key Rotation]
    B --> H[Multi-Factor Authentication]
    
    C --> I[TLS 1.3]
    C --> J[Certificate Pinning]
    C --> K[Secure Headers]
    
    D --> L[Nonce Generation]
    D --> M[Timestamp Validation]
    D --> N[Signature Verification]
    
    E --> O[Role-Based Access]
    E --> P[Audit Logging]
    E --> Q[Principle of Least Privilege]
    
    F --> R[Security Controls]
    G --> R
    H --> R
    I --> R
    J --> R
    K --> R
    L --> R
    M --> R
    N --> R
    O --> R
    P --> R
    Q --> R
```

This architecture provides a comprehensive, secure, and scalable solution for contract signing that meets enterprise requirements while maintaining user experience and legal compliance.
