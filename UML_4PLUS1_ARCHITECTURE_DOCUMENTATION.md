# UML 4+1 View Architecture Documentation
## Contract Management System

**Document Version:** 1.0  
**Date:** December 2024  
**Author:** Contract Management System Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Use Case View (+1)](#use-case-view-1)
3. [Logical View](#logical-view)
4. [Development View](#development-view)
5. [Process View](#process-view)
6. [Physical View](#physical-view)
7. [Stakeholder Mapping](#stakeholder-mapping)
8. [Implementation Guidelines](#implementation-guidelines)

---

## 1. Executive Summary

### 1.1 Overview
This document provides a comprehensive UML 4+1 View Architecture for the Contract Management System, covering all aspects from user interactions to deployment infrastructure. The system supports enterprise registration, DID-based identity management, cryptographic contract signing, and multi-party contract execution.

### 1.2 Key Components
- **Frontend**: React-based user interface with role-based dashboards
- **Backend**: Node.js/Express API with microservices architecture
- **Identity Management**: Keycloak IAM integration
- **Blockchain**: Ethereum-based contract recording
- **Database**: PostgreSQL with Redis caching
- **Security**: HSM/KMS integration for cryptographic operations

### 1.3 Target Users
- **TDP (Training Data Provider)**: Dataset and model management
- **TDC (Training Data Consumer)**: Contract creation and management
- **CCRP (Confidential Clean Room Provider)**: Compliance and resource monitoring
- **AppAdmin**: System administration and oversight

---

## 2. Use Case View (+1)

### 2.1 Actors
- **TDP (Training Data Provider)**
- **TDC (Training Data Consumer)**
- **CCRP (Confidential Clean Room Provider)**
- **AppAdmin**
- **Keycloak IAM**
- **Blockchain**
- **External Auditors**

### 2.2 Major Use Cases
- Register/Onboard as Enterprise
- Login/Authenticate
- Manage Profile & DIDs
- Create/Manage Datasets
- Create/Manage AI Models
- Create Contract
- Sign Contract (multi-party)
- Verify Contract
- Monitor Resource Usage (CCRP)
- Notification & Audit Trail
- Administer System

### 2.3 Use Case Diagram

```mermaid
graph TD
    %% Actors (stick figures in UML)
    TDP((TDP))
    TDC((TDC))
    CCRP((CCRP))
    AppAdmin((AppAdmin))
    
    %% Use Cases (ovals in UML)
    UC1[Register/Onboard]
    UC2[Manage Datasets]
    UC3[Manage Models]
    UC4[Create Contract]
    UC5[Sign Contract]
    UC6[Verify Contract]
    UC7[Authenticate]
    UC8[Administer System]
    UC9[Monitor Usage]
    UC10[Generate Notifications]
    UC11[Create Audit Trail]
    UC12[Record on Blockchain]
    
    %% System Boundary
    subgraph System["Contract Management System"]
        UC1
        UC2
        UC3
        UC4
        UC5
        UC6
        UC7
        UC8
        UC9
        UC10
        UC11
        UC12
    end
    
    %% Actor to Use Case Associations
    TDP --> UC1
    TDC --> UC1
    CCRP --> UC1
    TDP --> UC2
    TDP --> UC3
    TDC --> UC4
    TDP --> UC5
    TDC --> UC5
    CCRP --> UC5
    TDP --> UC6
    TDC --> UC6
    CCRP --> UC6
    TDP --> UC7
    TDC --> UC7
    CCRP --> UC7
    AppAdmin --> UC7
    AppAdmin --> UC8
    CCRP --> UC9
    
    %% Include/Extend Relationships
    UC4 -.->|include| UC7
    UC5 -.->|include| UC7
    UC5 -.->|extend| UC10
    UC5 -.->|extend| UC11
    UC5 -.->|extend| UC12
    UC9 -.->|extend| UC11
```

### 2.4 Key Scenarios

#### Scenario 1: Enterprise Registration
1. User accesses registration portal
2. Selects enterprise type (TDP/TDC/CCRP)
3. Provides organization details and domain
4. System generates DID:web identifier
5. Creates Keycloak user account
6. Sends verification email
7. User completes profile setup

#### Scenario 2: Contract Creation and Signing
1. TDC creates contract with dataset and AI model requirements
2. System notifies TDP and CCRP
3. TDP reviews and signs contract (DID-based)
4. TDC signs contract (wallet-based)
5. CCRP reviews compliance and signs contract (DID-based)
6. Contract is recorded on blockchain
7. All parties receive notifications

---

## 3. Logical View

### 3.1 Main Components
- **Frontend (React)**
- **Backend (Node.js/Express)**
  - Auth Service
  - User Service
  - DID Service
  - Dataset Service
  - Model Service
  - Contract Service
  - Signing Service
  - Notification Service
  - Audit Service
  - Admin Service
- **Keycloak IAM**
- **Blockchain Service**
- **Database (PostgreSQL)**
- **Monitoring/Logging**

### 3.2 Component Diagram

```mermaid
classDiagram
    class Frontend {
      +User Interface
      +API Calls
      +Dashboards
    }
    
    %% Backend Services arranged vertically
    class AuthService
    class UserService
    class DIDService
    class DatasetService
    class ModelService
    class ContractService
    class SigningService
    class NotificationService
    class AuditService
    class AdminService
    
    %% External Services
    class KeycloakIAM
    class BlockchainService
    class Database
    class MonitoringService

    %% Frontend connections to services
    Frontend --> AuthService
    Frontend --> UserService
    Frontend --> DIDService
    Frontend --> DatasetService
    Frontend --> ModelService
    Frontend --> ContractService
    Frontend --> NotificationService
    Frontend --> AuditService
    Frontend --> AdminService

    %% Service dependencies arranged vertically
    AuthService --> KeycloakIAM
    UserService --> Database
    DIDService --> Database
    DatasetService --> Database
    ModelService --> Database
    ContractService --> Database
    ContractService --> BlockchainService
    SigningService --> DIDService
    SigningService --> BlockchainService
    NotificationService --> Database
    AuditService --> Database
    AdminService --> Database
    MonitoringService --> Database
```

---

## 4. Development View

### 4.1 Code/Module Structure

#### Frontend Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── dashboards/
│   │   ├── forms/
│   │   ├── modals/
│   │   └── common/
│   ├── pages/
│   │   ├── dashboards/
│   │   ├── contracts/
│   │   ├── datasets/
│   │   └── admin/
│   ├── services/
│   │   ├── api.js
│   │   └── tokenManager.js
│   └── utils/
│       └── es256sign.js
├── public/
└── package.json
```

#### Backend Structure
```
backend/
├── routes/
│   ├── auth.js
│   ├── contracts.js
│   ├── datasets.js
│   ├── ai-models.js
│   ├── ccrp.js
│   ├── tdp.js
│   ├── tdc.js
│   └── admin.js
├── models/
│   ├── User.js
│   ├── Contract.js
│   ├── Dataset.js
│   ├── AIModel.js
│   ├── Notification.js
│   └── AuditLog.js
├── services/
│   ├── authService.js
│   ├── didService.js
│   ├── blockchainService.js
│   ├── auditService.js
│   ├── notificationService.js
│   └── signingService.js
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
└── scripts/
    ├── migrations/
    └── test-data/
```

### 4.2 Module Structure Diagram

```mermaid
graph TD
    subgraph Frontend
      F1[components]
      F2[pages]
      F3[services]
      F4[utils]
    end
    subgraph Backend
      B1[routes]
      B2[models]
      B3[services]
      B4[middleware]
      B5[scripts]
    end
    F1 --> F2
    F2 --> F3
    F3 --> F4
    B1 --> B2
    B2 --> B3
    B3 --> B4
    B4 --> B5
    F3 -- API --> B1
```

---

## 5. Process View

### 5.1 Key Processes & Interactions

#### User Registration/Onboarding
- `frontend/src/pages/UserRegistration.js`
- `backend/routes/auth.js`

#### Authentication (JWT, Keycloak)
- `backend/middleware/auth.js`
- `backend/services/***REMOVED-KEYCLOAK_DB_PASSWORD***Service.js`

#### Contract Creation & Multi-Party Signing
- `frontend/src/pages/Contracts.js`
- `backend/routes/contracts.js`
- `backend/services/signingService.js`

#### DID Resolution & Verification
- `backend/services/didService.js`

#### Blockchain Transaction
- `backend/services/blockchainService.js`

#### Notification Dispatch
- `backend/services/notificationService.js`

#### Audit Logging
- `backend/services/auditService.js`

#### Resource Monitoring (CCRP)
- `frontend/src/pages/dashboards/CCRPDashboard.js`
- `backend/routes/ccrp.js`

### 5.2 Contract Signing Process - Phased Sequence Diagrams

#### 5.2.1 Phase 1: Contract Creation by TDC

```mermaid
sequenceDiagram
    participant TDC as TDC User
    participant FE as Frontend
    participant BE as Backend
    participant KC as Keycloak
    participant DB as Database
    participant NS as Notification Service
    participant AUD as Audit Service

    TDC->>FE: Login & Navigate to Contract Creation
    FE->>BE: GET /api/auth/profile
    BE->>KC: Verify JWT Token
    KC-->>BE: User Info
    BE-->>FE: User Profile
    FE-->>TDC: Show Contract Creation Form
    
    TDC->>FE: Fill Contract Details (TDP, Dataset, AI Models, Security)
    FE->>BE: POST /api/contracts
    BE->>DB: Validate & Store Contract
    DB-->>BE: Contract Created
    BE->>NS: Create Notification for TDP
    BE->>NS: Create Notification for CCRP
    BE->>AUD: Log Contract Creation
    BE-->>FE: Contract Created Successfully
    FE-->>TDC: Show Contract Details
```

#### 5.2.2 Phase 2: TDP Signs Contract (DID-based)

```mermaid
sequenceDiagram
    participant TDP as TDP User
    participant FE as Frontend
    participant BE as Backend
    participant KC as Keycloak
    participant DB as Database
    participant BC as Blockchain
    participant DID as DID Service
    participant NS as Notification Service
    participant AUD as Audit Service

    TDP->>FE: Login & View Notifications
    FE->>BE: GET /api/notifications
    BE->>DB: Fetch User Notifications
    DB-->>BE: New Contract Notification
    BE-->>FE: Notification List
    FE-->>TDP: Show New Contract Notification
    
    TDP->>FE: Navigate to Contract Details
    FE->>BE: GET /api/contracts/:contractId
    BE->>DB: Fetch Contract with Associations
    DB-->>BE: Contract Data
    BE-->>FE: Contract Details
    FE-->>TDP: Show Contract & Signing Options
    
    TDP->>FE: Choose DID-based Signing
    FE->>FE: Generate Signing Message
    Note over FE: "Sign contract CONTRACT-123 as TDP at 2024-01-01T00:00:00.000Z"
    FE->>FE: ES256Signer.signMessage(message, privateJwk)
    FE->>FE: Create Signature (base64url)
    FE->>BE: POST /api/contracts/:contractId/sign
    Note over FE,BE: {signature: "base64url", message: "Sign contract...", did: "did:web:company.com:user:tdp", signatureType: "ES256"}
    
    BE->>KC: Verify JWT Token
    KC-->>BE: User Valid
    BE->>DID: Verify DID Signature
    DID->>DID: Resolve DID Document
    DID->>DID: Extract Public Key
    DID->>DID: Verify ES256 Signature
    DID-->>BE: Signature Valid
    
    BE->>DB: Record Signature
    BE->>BC: Record on Blockchain
    BC-->>BE: Transaction Hash
    BE->>DB: Update Contract Status
    BE->>NS: Create Notification for TDC
    BE->>NS: Create Notification for CCRP
    BE->>AUD: Log TDP Signature
    BE-->>FE: Signature Recorded Successfully
    FE-->>TDP: Show Success Message
```

#### 5.2.3 Phase 3: TDC Signs Contract (Wallet-based)

```mermaid
sequenceDiagram
    participant TDC as TDC User
    participant FE as Frontend
    participant BE as Backend
    participant KC as Keycloak
    participant DB as Database
    participant BC as Blockchain
    participant NS as Notification Service
    participant AUD as Audit Service

    TDC->>FE: Login & View Updated Contract
    FE->>BE: GET /api/contracts/:contractId
    BE->>DB: Fetch Updated Contract
    DB-->>BE: Contract with TDP Signature
    BE-->>FE: Contract with Signing Progress
    FE-->>TDC: Show Contract (TDP Signed)
    
    TDC->>FE: Choose Wallet-based Signing
    FE->>FE: MetaMask Integration
    FE->>FE: Sign Transaction with Wallet
    FE->>BE: POST /api/contracts/:contractId/sign
    Note over FE,BE: {signedTransaction: "0x...", userWalletAddress: "0x...", signatureType: "WALLET"}
    
    BE->>KC: Verify JWT Token
    KC-->>BE: User Valid
    BE->>BC: Broadcast Signed Transaction
    BC-->>BE: Transaction Confirmed
    BE->>DB: Record TDC Signature
    BE->>DB: Update Contract Status
    BE->>NS: Create Notification for TDP
    BE->>NS: Create Notification for CCRP
    BE->>AUD: Log TDC Signature
    BE-->>FE: Signature Recorded Successfully
    FE-->>TDC: Show Success Message
```

#### 5.2.4 Phase 4: CCRP Signs Contract (DID-based)

```mermaid
sequenceDiagram
    participant CCRP as CCRP User
    participant FE as Frontend
    participant BE as Backend
    participant KC as Keycloak
    participant DB as Database
    participant BC as Blockchain
    participant DID as DID Service
    participant NS as Notification Service
    participant AUD as Audit Service

    CCRP->>FE: Login & View Contract
    FE->>BE: GET /api/contracts/:contractId
    BE->>DB: Fetch Contract with All Signatures
    DB-->>BE: Contract (TDP & TDC Signed)
    BE-->>FE: Contract Ready for CCRP
    FE-->>CCRP: Show Contract (Ready for CCRP)
    
    CCRP->>FE: Choose DID-based Signing
    FE->>FE: Generate Signing Message
    FE->>FE: ES256Signer.signMessage(message, privateJwk)
    FE->>BE: POST /api/contracts/:contractId/sign
    Note over FE,BE: {signature: "base64url", message: "Sign contract...", did: "did:web:ccrp.com:user:ccrp", signatureType: "ES256"}
    
    BE->>KC: Verify JWT Token
    KC-->>BE: User Valid
    BE->>DID: Verify DID Signature
    DID-->>BE: Signature Valid
    
    BE->>DB: Record CCRP Signature
    BE->>BC: Record Final Signature
    BC-->>BE: Transaction Hash
    BE->>DB: Update Contract Status to "SIGNED"
    BE->>NS: Create Final Notifications
    BE->>AUD: Log CCRP Signature
    BE->>AUD: Log Contract Completion
    BE-->>FE: Contract Fully Signed
    FE-->>CCRP: Show Success Message
```

#### 5.2.5 Phase 5: Contract Execution

```mermaid
sequenceDiagram
    participant BE as Backend
    participant BC as Blockchain
    participant NS as Notification Service
    participant AUD as Audit Service
    participant DB as Database

    BE->>BC: Trigger Contract Execution
    BC-->>BE: Execution Started
    BE->>NS: Notify All Parties of Execution
    BE->>AUD: Log Contract Execution
    BE->>DB: Update Contract Status to "EXECUTING"
```

### 5.3 Contract Signing Activity Diagram (Swim Lanes)

```mermaid
graph TB
    subgraph TDC_Lane["TDC Lane"]
        TDC_Start([Start])
        TDC_Login[Login to System]
        TDC_Create[Create Contract]
        TDC_Fill[Fill Contract Details]
        TDC_Submit[Submit Contract]
        TDC_Wait[Wait for Signatures]
        TDC_Sign[Sign with Wallet]
        TDC_Complete[Contract Complete]
    end
    
    subgraph TDP_Lane["TDP Lane"]
        TDP_Start([Start])
        TDP_Login[Login to System]
        TDP_Notify[Receive Notification]
        TDP_Review[Review Contract]
        TDP_Sign[Sign with DID]
        TDP_Complete[Signature Complete]
    end
    
    subgraph CCRP_Lane["CCRP Lane"]
        CCRP_Start([Start])
        CCRP_Login[Login to System]
        CCRP_Notify[Receive Notification]
        CCRP_Review[Review Contract]
        CCRP_Compliance[Check Compliance]
        CCRP_Sign[Sign with DID]
        CCRP_Complete[Signature Complete]
    end
    
    subgraph System_Lane["System Lane"]
        SYS_Validate[Validate Contract]
        SYS_Notify[Send Notifications]
        SYS_Record[Record Signatures]
        SYS_Blockchain[Update Blockchain]
        SYS_Execute[Execute Contract]
        SYS_Audit[Log All Actions]
    end
    
    %% Flow connections
    TDC_Start --> TDC_Login
    TDC_Login --> TDC_Create
    TDC_Create --> TDC_Fill
    TDC_Fill --> TDC_Submit
    TDC_Submit --> SYS_Validate
    SYS_Validate --> SYS_Notify
    SYS_Notify --> TDP_Notify
    SYS_Notify --> CCRP_Notify
    
    TDP_Start --> TDP_Login
    TDP_Login --> TDP_Notify
    TDP_Notify --> TDP_Review
    TDP_Review --> TDP_Sign
    TDP_Sign --> SYS_Record
    SYS_Record --> SYS_Blockchain
    SYS_Record --> SYS_Audit
    SYS_Record --> TDP_Complete
    
    CCRP_Start --> CCRP_Login
    CCRP_Login --> CCRP_Notify
    CCRP_Notify --> CCRP_Review
    CCRP_Review --> CCRP_Compliance
    CCRP_Compliance --> CCRP_Sign
    CCRP_Sign --> SYS_Record
    SYS_Record --> CCRP_Complete
    
    TDP_Complete --> TDC_Wait
    CCRP_Complete --> TDC_Wait
    TDC_Wait --> TDC_Sign
    TDC_Sign --> SYS_Record
    SYS_Record --> TDC_Complete
    TDC_Complete --> SYS_Execute
    SYS_Execute --> SYS_Audit
```

### 5.4 Contract State Diagram

```mermaid
stateDiagram-v2
    [*] --> Draft : TDC Creates Contract
    
    Draft --> PendingTDP : Contract Submitted
    Draft --> Draft : Edit Contract
    
    PendingTDP --> PendingTDC : TDP Signs
    PendingTDP --> PendingTDP : TDP Reviews
    PendingTDP --> Rejected : TDP Rejects
    
    PendingTDC --> PendingCCRP : TDC Signs
    PendingTDC --> PendingTDC : TDC Reviews
    PendingTDC --> Rejected : TDC Rejects
    
    PendingCCRP --> Signed : CCRP Signs
    PendingCCRP --> PendingCCRP : CCRP Reviews
    PendingCCRP --> Rejected : CCRP Rejects
    
    Signed --> Executing : System Triggers Execution
    Signed --> Completed : Manual Completion
    
    Executing --> Completed : Execution Finished
    Executing --> Failed : Execution Failed
    
    Rejected --> Draft : TDC Resubmits
    Failed --> Draft : TDC Resubmits
    
    Completed --> [*]
    Rejected --> [*]
    
    note right of Draft
        Contract created by TDC
        Awaiting TDP signature
    end note
    
    note right of PendingTDP
        TDP reviewing contract
        Can sign or reject
    end note
    
    note right of PendingTDC
        TDC reviewing contract
        Can sign or reject
    end note
    
    note right of PendingCCRP
        CCRP reviewing contract
        Can sign or reject
    end note
    
    note right of Signed
        All parties signed
        Ready for execution
    end note
    
    note right of Executing
        Contract being executed
        Training environment active
    end note
    
    note right of Completed
        Contract fulfilled
        All obligations met
    end note
```

---

## 6. Physical View

### 6.1 Deployment/Infrastructure

#### 6.1.1 High-Level Architecture Overview

```mermaid
graph TB
    subgraph "Internet"
        Users[End Users]
        CDN[Cloud CDN]
    end
    
    subgraph "Cloud Infrastructure"
        subgraph "Application Layer"
            Frontend[Frontend Containers]
            Backend[Backend Containers]
            API_GW[API Gateway]
        end
        
        subgraph "Data Layer"
            Database[(PostgreSQL)]
            Cache[(Redis)]
            Storage[Object Storage]
        end
        
        subgraph "Security Layer"
            IAM[Keycloak IAM]
            Security[WAF + VPN]
        end
        
        subgraph "External Services"
            Blockchain[Ethereum Node]
            Monitoring[Monitoring Stack]
        end
    end
    
    Users --> CDN
    CDN --> Frontend
    Frontend --> API_GW
    API_GW --> Backend
    Backend --> Database
    Backend --> Cache
    Backend --> IAM
    Backend --> Blockchain
    Backend --> Monitoring
```

#### 6.1.2 Application Layer Detail

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[NGINX Load Balancer]
    end
    
    subgraph "Frontend Tier"
        FE1[Frontend Container 1]
        FE2[Frontend Container 2]
        FE3[Frontend Container 3]
    end
    
    subgraph "Backend Tier"
        BE1[Backend Container 1]
        BE2[Backend Container 2]
        BE3[Backend Container 3]
        BE4[Backend Container 4]
    end
    
    subgraph "API Gateway"
        API_GW[API Gateway]
    end
    
    LB --> FE1
    LB --> FE2
    LB --> FE3
    
    FE1 --> API_GW
    FE2 --> API_GW
    FE3 --> API_GW
    
    API_GW --> BE1
    API_GW --> BE2
    API_GW --> BE3
    API_GW --> BE4
```

#### 6.1.3 Data Layer Architecture

```mermaid
graph TB
    subgraph "Backend Containers"
        BE1[Backend 1]
        BE2[Backend 2]
        BE3[Backend 3]
        BE4[Backend 4]
    end
    
    subgraph "Database Cluster"
        DB_MASTER[(PostgreSQL Master)]
        DB_REPLICA1[(PostgreSQL Replica 1)]
        DB_REPLICA2[(PostgreSQL Replica 2)]
    end
    
    subgraph "Cache Layer"
        Redis1[(Redis Primary)]
        Redis2[(Redis Replica)]
    end
    
    subgraph "Storage Layer"
        S3[Object Storage]
        Backup[Backup Storage]
    end
    
    BE1 --> DB_MASTER
    BE2 --> DB_MASTER
    BE3 --> DB_MASTER
    BE4 --> DB_MASTER
    
    DB_MASTER --> DB_REPLICA1
    DB_MASTER --> DB_REPLICA2
    
    BE1 --> Redis1
    BE2 --> Redis1
    BE3 --> Redis1
    BE4 --> Redis1
    
    Redis1 --> Redis2
    
    BE1 --> S3
    BE2 --> S3
    BE3 --> S3
    BE4 --> S3
    
    DB_MASTER --> Backup
    S3 --> Backup
```

#### 6.1.4 Security & Identity Layer

```mermaid
graph TB
    subgraph "Backend Containers"
        BE1[Backend 1]
        BE2[Backend 2]
        BE3[Backend 3]
        BE4[Backend 4]
    end
    
    subgraph "Identity Management"
        KC1[Keycloak Container 1]
        KC2[Keycloak Container 2]
        KC_DB[(Keycloak Database)]
    end
    
    subgraph "Security Services"
        WAF[Web Application Firewall]
        VPN[VPN Gateway]
        HSM[Hardware Security Module]
        KMS[Key Management Service]
    end
    
    BE1 --> KC1
    BE2 --> KC2
    BE3 --> KC1
    BE4 --> KC2
    
    KC1 --> KC_DB
    KC2 --> KC_DB
    
    BE1 --> HSM
    BE2 --> HSM
    BE3 --> HSM
    BE4 --> HSM
    
    BE1 --> KMS
    BE2 --> KMS
    BE3 --> KMS
    BE4 --> KMS
    
    WAF --> BE1
    WAF --> BE2
    WAF --> BE3
    WAF --> BE4
    
    VPN --> HSM
    VPN --> KMS
```

#### 6.1.5 Monitoring & External Services

```mermaid
graph TB
    subgraph "Backend Containers"
        BE1[Backend 1]
        BE2[Backend 2]
        BE3[Backend 3]
        BE4[Backend 4]
    end
    
    subgraph "Monitoring Stack"
        Prometheus[Prometheus]
        Grafana[Grafana]
        AlertManager[Alert Manager]
        ELK[ELK Stack]
    end
    
    subgraph "Blockchain Services"
        ETH_NODE[Ethereum Node]
        BC_MONITOR[Blockchain Monitor]
    end
    
    subgraph "External Services"
        Email[Email Service]
        SMS[SMS Service]
        Audit[External Audit]
    end
    
    BE1 --> Prometheus
    BE2 --> Prometheus
    BE3 --> Prometheus
    BE4 --> Prometheus
    
    Prometheus --> Grafana
    Prometheus --> AlertManager
    
    BE1 --> ELK
    BE2 --> ELK
    BE3 --> ELK
    BE4 --> ELK
    
    BE1 --> ETH_NODE
    BE2 --> ETH_NODE
    BE3 --> ETH_NODE
    BE4 --> ETH_NODE
    
    ETH_NODE --> BC_MONITOR
    
    BE1 --> Email
    BE2 --> Email
    BE3 --> Email
    BE4 --> Email
    
    BE1 --> SMS
    BE2 --> SMS
    BE3 --> SMS
    BE4 --> SMS
    
    BE1 --> Audit
    BE2 --> Audit
    BE3 --> Audit
    BE4 --> Audit
```

### 6.2 Deployment Configuration

#### Container Orchestration (Kubernetes)
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: contract-management-backend
spec:
  replicas: 4
  selector:
    matchLabels:
      app: contract-management-backend
  template:
    metadata:
      labels:
        app: contract-management-backend
    spec:
      containers:
      - name: backend
        image: contract-management:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        - name: KEYCLOAK_URL
          valueFrom:
            secretKeyRef:
              name: ***REMOVED-KEYCLOAK_DB_PASSWORD***-secret
              key: url
        - name: HSM_URL
          valueFrom:
            secretKeyRef:
              name: hsm-secret
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### Service Configuration
```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: contract-management-backend-service
spec:
  selector:
    app: contract-management-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

#### Ingress Configuration
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: contract-management-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - api.contractmanagement.com
    secretName: tls-secret
  rules:
  - host: api.contractmanagement.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: contract-management-backend-service
            port:
              number: 80
```

---

## 7. Full Class Diagram

### 7.1 Complete Class Structure with Relationships

```mermaid
classDiagram
    %% Frontend Classes
    class ReactApp {
        +render()
        +handleNavigation()
        +manageState()
    }
    
    class UserDashboard {
        +displayUserInfo()
        +showNotifications()
        +navigateToFeatures()
    }
    
    class ContractForm {
        +createContract()
        +validateForm()
        +submitContract()
    }
    
    class SigningModal {
        +showSigningOptions()
        +handleDIDSigning()
        +handleWalletSigning()
        +verifySignature()
    }
    
    class APIService {
        +get(endpoint)
        +post(endpoint, data)
        +put(endpoint, data)
        +delete(endpoint)
        +setAuthToken(token)
    }
    
    class TokenManager {
        +storeToken(token)
        +getToken()
        +refreshToken()
        +clearToken()
    }
    
    class ES256Signer {
        +signMessage(message, privateJwk)
        +verifySignature(message, signature, publicJwk)
        +importPrivateKey(jwk)
    }
    
    %% Backend Models
    class User {
        +id: UUID
        +name: String
        +email: String
        +partyType: String
        +did: String
        +walletAddress: String
        +publicKey: String
        +organization: String
        +isActive: Boolean
        +registrationDate: Date
        +onboardingStatus: String
        +profileCompleted: Boolean
        +emailVerified: Boolean
        +iamUserId: String
        +cloudProviders: Array
        +description: String
        +create()
        +update()
        +delete()
        +findByEmail()
        +findByDID()
    }
    
    class Contract {
        +contractId: String
        +tdpId: UUID
        +tdcId: UUID
        +ccrpId: UUID
        +datasetId: UUID
        +status: String
        +trainingParams: JSON
        +securityRequirements: JSON
        +aiModelIds: Array
        +ccrpCloudProvider: String
        +createdAt: Date
        +updatedAt: Date
        +create()
        +update()
        +delete()
        +findByContractId()
        +findByUser()
        +updateStatus()
    }
    
    class Dataset {
        +id: UUID
        +name: String
        +description: String
        +category: String
        +price: Decimal
        +ownerId: UUID
        +isActive: Boolean
        +metadata: JSON
        +create()
        +update()
        +delete()
        +findByOwner()
        +findByCategory()
    }
    
    class AIModel {
        +id: UUID
        +modelId: String
        +name: String
        +description: String
        +type: String
        +architecture: String
        +framework: String
        +parameters: JSON
        +privacyTechnique: String
        +validationMetrics: JSON
        +maxEpochs: Integer
        +batchSize: Integer
        +learningRate: Decimal
        +isActive: Boolean
        +create()
        +update()
        +delete()
        +findByType()
        +findByFramework()
    }
    
    class Notification {
        +id: UUID
        +userId: UUID
        +type: String
        +title: String
        +message: String
        +isRead: Boolean
        +metadata: JSON
        +createdAt: Date
        +create()
        +markAsRead()
        +findByUser()
        +findUnread()
    }
    
    class AuditLog {
        +id: UUID
        +userId: UUID
        +action: String
        +resource: String
        +details: JSON
        +ipAddress: String
        +userAgent: String
        +timestamp: Date
        +create()
        +findByUser()
        +findByAction()
        +findByDateRange()
    }
    
    %% Backend Services
    class AuthService {
        +registerUser(userData)
        +loginUser(credentials)
        +verifyToken(token)
        +refreshToken(refreshToken)
        +logoutUser(userId)
        +resetPassword(email)
        +changePassword(userId, oldPassword, newPassword)
    }
    
    class DIDService {
        +createSystemDID(walletAddress, network)
        +resolveDID(did)
        +verifySignature(did, message, signature)
        +extractPublicKey(didDocument)
        +validateEnterpriseDID(did)
        +checkDIDAvailability(did)
    }
    
    class ContractService {
        +createContract(contractData)
        +getContract(contractId)
        +updateContract(contractId, updates)
        +deleteContract(contractId)
        +getUserContracts(userId)
        +getAllContracts(filters)
        +signContract(contractId, signatureData)
        +verifyContractSignatures(contractId)
    }
    
    class SigningService {
        +signMessage(message, did, userId)
        +verifyDIDSignature(did, message, signature)
        +recordSignature(contractId, userId, did, signature)
        +updateContractStatus(contract, userPartyType)
        +logSigningOperation(operationData)
    }
    
    class BlockchainService {
        +isConnected()
        +getContract(contractId)
        +deployContract(contractData)
        +signContract(contractId, privateKey)
        +verifyTransaction(transactionHash)
        +broadcastSignedTransaction(signedTransaction)
    }
    
    class NotificationService {
        +createNotification(notificationData)
        +sendEmailNotification(userId, emailData)
        +sendPushNotification(userId, pushData)
        +markNotificationAsRead(notificationId)
        +getUserNotifications(userId)
        +deleteNotification(notificationId)
    }
    
    class AuditService {
        +logEvent(eventData)
        +logUserAction(userId, action, resource, details)
        +logSystemEvent(event, details)
        +getAuditLogs(filters)
        +exportAuditLogs(dateRange)
        +generateAuditReport(reportParams)
    }
    
    class KeycloakService {
        +createUser(userData)
        +updateUser(userId, userData)
        +deleteUser(userId)
        +getUser(userId)
        +sendEmailVerification(userId)
        +resetPassword(userId)
        +assignRole(userId, role)
    }
    
    %% Relationships
    ReactApp --> UserDashboard
    ReactApp --> ContractForm
    ReactApp --> SigningModal
    ReactApp --> APIService
    ReactApp --> TokenManager
    ReactApp --> ES256Signer
    
    UserDashboard --> APIService
    ContractForm --> APIService
    SigningModal --> ES256Signer
    SigningModal --> APIService
    
    %% Backend Relationships
    User ||--o{ Contract : "creates"
    User ||--o{ Dataset : "owns"
    User ||--o{ AIModel : "owns"
    User ||--o{ Notification : "receives"
    User ||--o{ AuditLog : "generates"
    
    Contract ||--o{ Dataset : "references"
    Contract ||--o{ AIModel : "references"
    Contract ||--o{ Notification : "triggers"
    
    %% Service Relationships
    AuthService --> User
    AuthService --> KeycloakService
    ContractService --> Contract
    ContractService --> User
    ContractService --> Dataset
    ContractService --> AIModel
    ContractService --> SigningService
    ContractService --> BlockchainService
    ContractService --> NotificationService
    
    SigningService --> DIDService
    SigningService --> BlockchainService
    SigningService --> AuditService
    
    NotificationService --> Notification
    NotificationService --> User
    
    AuditService --> AuditLog
    AuditService --> User
    
    DIDService --> User
    BlockchainService --> Contract
```

---

## 8. Stakeholder Mapping

| View           | Stakeholders                | Main Concerns/Artifacts                | Mapped Files/Dirs                        |
|----------------|----------------------------|----------------------------------------|------------------------------------------|
| Use Case (+1)  | All                        | Scenarios, sequence diagrams           | `frontend/src/pages/`, `backend/routes/` |
| Logical        | Designers, Users           | Class, component diagrams              | `frontend/src/`, `backend/services/`     |
| Development    | Developers, DevOps         | Code structure, modules, packages      | `frontend/`, `backend/`                  |
| Process        | Integrators, Testers       | Sequence/activity diagrams, flows      | `backend/services/`, `backend/routes/`   |
| Physical       | Sysadmins, DevOps, Security| Deployment, network, infra diagrams    | Docker, k8s, cloud infra                 |

---

## 9. Implementation Guidelines

### 9.1 Development Workflow
1. **Design Phase**: Use Logical and Development views to plan features
2. **Implementation Phase**: Follow Process view for integration points
3. **Testing Phase**: Use Use Case view to validate scenarios
4. **Deployment Phase**: Follow Physical view for infrastructure setup

### 9.2 Code Organization
- **Frontend**: Component-based architecture with service layer
- **Backend**: Route → Service → Model pattern
- **Database**: Sequelize ORM with migrations
- **Security**: JWT + Keycloak integration
- **Blockchain**: Ethereum integration with fallback

### 9.3 Security Considerations
- **Authentication**: Multi-factor authentication via Keycloak
- **Authorization**: Role-based access control
- **Cryptography**: ES256 signing with HSM/KMS
- **Audit**: Comprehensive logging and monitoring
- **Compliance**: DPDP, GDPR, enterprise security standards

### 9.4 Scalability Strategy
- **Horizontal Scaling**: Multiple backend containers
- **Database**: Master-slave replication
- **Caching**: Redis for session and data caching
- **CDN**: Static asset delivery
- **Load Balancing**: Kubernetes ingress controller

---

## 10. Conclusion

This UML 4+1 View Architecture provides a comprehensive framework for understanding, developing, and maintaining the Contract Management System. Each view serves specific stakeholders and concerns:

- **Use Case View**: Validates requirements and user scenarios
- **Logical View**: Guides system design and component relationships
- **Development View**: Organizes code structure and modules
- **Process View**: Ensures proper integration and workflows
- **Physical View**: Plans deployment and infrastructure

The architecture supports enterprise-grade security, scalability, and compliance while maintaining clear separation of concerns and modular design principles.

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Next Review:** March 2025 